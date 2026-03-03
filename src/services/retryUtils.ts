/**
 * Retry utility with exponential backoff for transient failures.
 *
 * - Retries on 5xx status codes and network errors (TypeError)
 * - Does NOT retry 4xx errors (client errors)
 * - Exponential backoff with jitter: ~1s, ~2s, ~4s
 * - Max 3 retries (up to 4 total attempts)
 *
 * @see Requirements 6.1, 6.2, 6.3
 */

export interface RetryOptions {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelayMs?: number
  /** Called before each retry with the attempt number (1-based) and delay */
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void
}

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_BASE_DELAY_MS = 1000

/**
 * Returns true if the error is a network-level failure (e.g. fetch TypeError).
 */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError
}

/**
 * Returns true if the HTTP status code is retryable (5xx).
 */
function isRetryableStatus(status: number): boolean {
  return status >= 500
}

/**
 * Compute delay with exponential backoff and jitter.
 * delay = baseDelay * 2^(attempt-1) + random jitter up to half the base delay
 */
function computeDelay(attempt: number, baseDelayMs: number): number {
  const exponential = baseDelayMs * Math.pow(2, attempt - 1)
  const jitter = Math.random() * (baseDelayMs / 2)
  return exponential + jitter
}

/**
 * Sleep for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wraps `fetch()` with retry logic using exponential backoff.
 *
 * Retries on:
 * - Network errors (TypeError from fetch)
 * - 5xx HTTP status codes
 *
 * Does NOT retry:
 * - 4xx HTTP status codes (client errors)
 * - Successful responses (2xx/3xx)
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions,
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
  const onRetry = options?.onRetry

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, init)

      // Successful or client error — return immediately, no retry
      if (response.ok || !isRetryableStatus(response.status)) {
        return response
      }

      // 5xx — retryable
      if (attempt < maxRetries) {
        const delay = computeDelay(attempt + 1, baseDelayMs)
        onRetry?.(attempt + 1, delay, response)
        await sleep(delay)
        continue
      }

      // Exhausted retries on 5xx
      return response
    } catch (error) {
      lastError = error

      // Only retry network errors
      if (!isNetworkError(error) || attempt >= maxRetries) {
        throw error
      }

      const delay = computeDelay(attempt + 1, baseDelayMs)
      onRetry?.(attempt + 1, delay, error)
      await sleep(delay)
    }
  }

  // Should not reach here, but just in case
  throw lastError
}
