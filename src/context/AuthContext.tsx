/**
 * Authentication Context for Pokemon TCG Log Visualizer
 * Manages authentication state using AWS Cognito via AWS Amplify
 */

import { createContext, useReducer, useCallback, useEffect, type ReactNode } from 'react'
import { Amplify } from 'aws-amplify'
import { signUp as amplifySignUp, confirmSignUp as amplifyConfirmSignUp, signIn as amplifySignIn, signOut as amplifySignOut, fetchAuthSession, getCurrentUser as amplifyGetCurrentUser } from 'aws-amplify/auth'

// ---------------------------------------------------------------------------
// Amplify configuration
// ---------------------------------------------------------------------------

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
    },
  },
})

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AuthState {
  isAuthenticated: boolean
  user: {
    userId: string
    email: string
  } | null
  tokens: {
    idToken: string
    accessToken: string
    refreshToken: string
  } | null
  isLoading: boolean
  error: string | null
  needsConfirmation: boolean
  confirmationEmail: string | null
}

export interface AuthContextValue {
  state: AuthState
  signUp: (email: string, password: string) => Promise<void>
  confirmSignUp: (email: string, code: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getCurrentUser: () => Promise<{ userId: string; email: string } | null>
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: { userId: string; email: string }; tokens: { idToken: string; accessToken: string; refreshToken: string } } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'SIGN_OUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SIGN_UP_NEEDS_CONFIRMATION'; payload: string }
  | { type: 'CONFIRMATION_SUCCESS' }

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  isLoading: false,
  error: null,
  needsConfirmation: false,
  confirmationEmail: null,
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null }

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        error: null,
      }

    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        tokens: null,
        error: action.payload,
      }

    case 'SIGN_OUT':
      return { ...initialState }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'SIGN_UP_NEEDS_CONFIRMATION':
      return { ...state, isLoading: false, error: null, needsConfirmation: true, confirmationEmail: action.payload }

    case 'CONFIRMATION_SUCCESS':
      return { ...state, isLoading: false, error: null, needsConfirmation: false, confirmationEmail: null }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Restore session on mount
  useEffect(() => {
    getCurrentUser().catch(() => {
      // No active session – stay unauthenticated
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Sign up a new user with email and password.
   * On success the user is NOT yet authenticated – they must sign in separately
   * (and verify their email if the User Pool requires it).
   */
  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' })
    try {
      await amplifySignUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      })
      dispatch({ type: 'SIGN_UP_NEEDS_CONFIRMATION', payload: email })
    } catch (err: unknown) {
      const name = (err as { name?: string }).name ?? ''
      let message: string
      if (name === 'UsernameExistsException') {
        message = 'An account with this email already exists.'
      } else if (name === 'InvalidPasswordException') {
        message = 'Password must be at least 8 characters with uppercase, lowercase, and numbers.'
      } else if (name === 'InvalidParameterException') {
        message = 'Please enter a valid email address.'
      } else if (
        name === 'NetworkError' ||
        (err instanceof Error && err.message.toLowerCase().includes('network'))
      ) {
        message = 'Unable to connect. Please check your internet connection.'
      } else {
        message = 'Sign up failed. Please try again.'
      }
      dispatch({ type: 'AUTH_ERROR', payload: message })
    }
  }, [])

  /**
   * Confirm a new user's sign-up with the verification code sent to their email.
   */
  const confirmSignUp = useCallback(async (email: string, code: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' })
    try {
      await amplifyConfirmSignUp({ username: email, confirmationCode: code })
      dispatch({ type: 'CONFIRMATION_SUCCESS' })
    } catch (err: unknown) {
      const name = (err as { name?: string }).name ?? ''
      let message: string
      if (name === 'CodeMismatchException') {
        message = 'Invalid verification code. Please try again.'
      } else if (name === 'ExpiredCodeException') {
        message = 'Verification code has expired. Please sign up again.'
      } else if (
        name === 'NetworkError' ||
        (err instanceof Error && err.message.toLowerCase().includes('network'))
      ) {
        message = 'Unable to connect. Please check your internet connection.'
      } else {
        message = 'Verification failed. Please try again.'
      }
      dispatch({ type: 'AUTH_ERROR', payload: message })
    }
  }, [])

  /**
   * Sign in an existing user with email and password.
   * Authenticates via Cognito, fetches the session tokens, and updates AuthState.
   */
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' })
    try {
      await amplifySignIn({ username: email, password })

      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString() ?? ''
      const accessToken = session.tokens?.accessToken?.toString() ?? ''

      const userId = (session.tokens?.idToken?.payload?.sub as string) ?? ''
      const userEmail = (session.tokens?.idToken?.payload?.email as string) ?? email

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: { userId, email: userEmail },
          tokens: { idToken, accessToken, refreshToken: '' },
        },
      })
    } catch (err: unknown) {
      const name = (err as { name?: string }).name ?? ''
      let message: string
      if (name === 'NotAuthorizedException' || name === 'UserNotFoundException') {
        message = 'Invalid email or password. Please try again.'
      } else if (name === 'UserNotConfirmedException') {
        message = 'Please verify your email address before signing in.'
      } else if (name === 'PasswordResetRequiredException') {
        message = 'You need to reset your password. Please check your email.'
      } else if (
        name === 'NetworkError' ||
        (err instanceof Error && err.message.toLowerCase().includes('network'))
      ) {
        message = 'Unable to connect. Please check your internet connection.'
      } else {
        message = 'Sign in failed. Please try again.'
      }
      dispatch({ type: 'AUTH_ERROR', payload: message })
    }
  }, [])

  /**
   * Sign out the current user.
   * Calls Amplify signOut to end the Cognito session and clear stored tokens,
   * then resets AuthState to unauthenticated regardless of whether the remote
   * call succeeded (sign out should always succeed from the user's perspective).
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await amplifySignOut()
    } catch (err) {
      // Log but don't surface – local state is cleared either way
      console.error('signOut error:', err)
    } finally {
      dispatch({ type: 'SIGN_OUT' })
    }
  }, [])

  /**
   * Retrieve the currently authenticated user from the active session.
   * Restores session on app load; silently signs out if no valid session exists.
   * Amplify automatically refreshes tokens if they are expired but a valid
   * refresh token is present. If the refresh token is also expired (or there is
   * no session at all), amplifyGetCurrentUser() throws and we dispatch SIGN_OUT
   * so the user is prompted to log in again.
   */
  const getCurrentUser = useCallback(async (): Promise<{ userId: string; email: string } | null> => {
    dispatch({ type: 'AUTH_START' })
    try {
      const { userId, signInDetails } = await amplifyGetCurrentUser()

      // fetchAuthSession auto-refreshes tokens when the access/id token is
      // expired but the refresh token is still valid.
      const session = await fetchAuthSession()

      const idToken = session.tokens?.idToken?.toString() ?? ''
      const accessToken = session.tokens?.accessToken?.toString() ?? ''

      const email =
        signInDetails?.loginId ??
        (session.tokens?.idToken?.payload?.email as string | undefined) ??
        ''

      const user = { userId, email }

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user,
          tokens: { idToken, accessToken, refreshToken: '' },
        },
      })

      return user
    } catch {
      // No active session or tokens are fully expired – silently sign out.
      dispatch({ type: 'SIGN_OUT' })
      return null
    }
  }, [])

  const value: AuthContextValue = {
    state,
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    getCurrentUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
