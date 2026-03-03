/**
 * Error categorization utility for the Pokemon TCG Log Visualizer.
 *
 * Distinguishes between authentication, authorization, validation, network,
 * and system errors. Maps HTTP status codes and Cognito error names to
 * user-friendly messages.
 *
 * @see Requirements 6.4 – distinguish error types in error messages
 */

// ---------------------------------------------------------------------------
// Error categories
// ---------------------------------------------------------------------------

export const ErrorCategory = {
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  SYSTEM: 'SYSTEM',
} as const

export type ErrorCategory = (typeof ErrorCategory)[keyof typeof ErrorCategory]

// ---------------------------------------------------------------------------
// AppError
// ---------------------------------------------------------------------------

export class AppError extends Error {
  readonly category: ErrorCategory
  readonly statusCode: number | undefined
  readonly isRetryable: boolean

  constructor(
    message: string,
    category: ErrorCategory,
    statusCode?: number,
    isRetryable = false,
  ) {
    super(message)
    this.name = 'AppError'
    this.category = category
    this.statusCode = statusCode
    this.isRetryable = isRetryable
  }
}

// ---------------------------------------------------------------------------
// User-friendly messages per category
// ---------------------------------------------------------------------------

const categoryMessages: Record<ErrorCategory, string> = {
  [ErrorCategory.AUTHENTICATION]: 'Your session has expired. Please log in again.',
  [ErrorCategory.AUTHORIZATION]: "You don't have permission to access this resource.",
  [ErrorCategory.VALIDATION]: 'The request was invalid. Please check your input.',
  [ErrorCategory.NETWORK]: 'Unable to connect. Please check your internet connection.',
  [ErrorCategory.SYSTEM]: 'Service temporarily unavailable. Please try again.',
}

export function getErrorMessage(errorOrCategory: AppError | ErrorCategory): string {
  if (errorOrCategory instanceof AppError) {
    return errorOrCategory.message
  }
  return categoryMessages[errorOrCategory]
}

// ---------------------------------------------------------------------------
// HTTP status → AppError
// ---------------------------------------------------------------------------

export function fromHttpStatus(status: number, fallbackMessage?: string): AppError {
  if (status === 400) {
    return new AppError(
      fallbackMessage ?? getErrorMessage(ErrorCategory.VALIDATION),
      ErrorCategory.VALIDATION,
      status,
      false,
    )
  }
  if (status === 401) {
    return new AppError(
      getErrorMessage(ErrorCategory.AUTHENTICATION),
      ErrorCategory.AUTHENTICATION,
      status,
      false,
    )
  }
  if (status === 403) {
    return new AppError(
      getErrorMessage(ErrorCategory.AUTHORIZATION),
      ErrorCategory.AUTHORIZATION,
      status,
      false,
    )
  }
  if (status === 404) {
    return new AppError(
      fallbackMessage ?? 'The requested resource was not found.',
      ErrorCategory.VALIDATION,
      status,
      false,
    )
  }
  if (status >= 500) {
    return new AppError(
      getErrorMessage(ErrorCategory.SYSTEM),
      ErrorCategory.SYSTEM,
      status,
      true,
    )
  }
  return new AppError(
    fallbackMessage ?? `Request failed with status ${status}`,
    ErrorCategory.SYSTEM,
    status,
    false,
  )
}

// ---------------------------------------------------------------------------
// Cognito error name → AppError
// ---------------------------------------------------------------------------

const cognitoErrorMap: Record<string, { category: ErrorCategory; message: string }> = {
  NotAuthorizedException: {
    category: ErrorCategory.AUTHENTICATION,
    message: 'Invalid email or password. Please try again.',
  },
  UserNotFoundException: {
    category: ErrorCategory.AUTHENTICATION,
    message: 'Invalid email or password. Please try again.',
  },
  UsernameExistsException: {
    category: ErrorCategory.VALIDATION,
    message: 'An account with this email already exists.',
  },
  InvalidPasswordException: {
    category: ErrorCategory.VALIDATION,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers.',
  },
  InvalidParameterException: {
    category: ErrorCategory.VALIDATION,
    message: 'Please enter a valid email address.',
  },
  UserNotConfirmedException: {
    category: ErrorCategory.AUTHENTICATION,
    message: 'Please verify your email address before signing in.',
  },
  PasswordResetRequiredException: {
    category: ErrorCategory.AUTHENTICATION,
    message: 'You need to reset your password. Please check your email.',
  },
  NetworkError: {
    category: ErrorCategory.NETWORK,
    message: getErrorMessage(ErrorCategory.NETWORK),
  },
}

export function fromCognitoError(error: unknown): AppError {
  const name = (error as { name?: string }).name ?? ''

  const mapped = cognitoErrorMap[name]
  if (mapped) {
    return new AppError(mapped.message, mapped.category)
  }

  // Fallback: check for network-related message
  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return new AppError(
      getErrorMessage(ErrorCategory.NETWORK),
      ErrorCategory.NETWORK,
      undefined,
      true,
    )
  }

  return new AppError(
    'An unexpected error occurred. Please try again.',
    ErrorCategory.SYSTEM,
    undefined,
    true,
  )
}

// ---------------------------------------------------------------------------
// Generic error → AppError
// ---------------------------------------------------------------------------

export function categorizeError(error: unknown): AppError {
  // Already an AppError – pass through
  if (error instanceof AppError) return error

  // A fetch Response-like object with a numeric status
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    return fromHttpStatus((error as { status: number }).status)
  }

  // A Cognito-style error with a name property
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof (error as { name: unknown }).name === 'string' &&
    cognitoErrorMap[(error as { name: string }).name]
  ) {
    return fromCognitoError(error)
  }

  // Network / TypeError from fetch
  if (error instanceof TypeError) {
    return new AppError(
      getErrorMessage(ErrorCategory.NETWORK),
      ErrorCategory.NETWORK,
      undefined,
      true,
    )
  }

  // Plain Error
  if (error instanceof Error) {
    return new AppError(error.message, ErrorCategory.SYSTEM, undefined, true)
  }

  return new AppError(
    'An unexpected error occurred. Please try again.',
    ErrorCategory.SYSTEM,
    undefined,
    true,
  )
}
