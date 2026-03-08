/**
 * AuthUI Component
 * Provides login and signup forms with toggle, validation, loading states,
 * and error display. Connects to AuthContext via useAuth hook.
 *
 * Requirements: 1.2, 1.3, 1.5, 6.1, 6.4, 6.5
 */

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useAuth } from '../context/useAuth'
import './AuthUI.css'

export interface AuthUIProps {
  onAuthSuccess?: () => void
}

type Mode = 'login' | 'signup'

interface FormFields {
  email: string
  password: string
  confirmPassword: string
}

interface FieldErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

function validateLogin(fields: FormFields): FieldErrors {
  const errors: FieldErrors = {}
  if (!fields.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!fields.password) {
    errors.password = 'Password is required.'
  }
  return errors
}

function validateSignup(fields: FormFields): FieldErrors {
  const errors = validateLogin(fields)
  if (!fields.password) {
    // already set above
  } else if (fields.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  if (!fields.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}

export function AuthUI({ onAuthSuccess }: AuthUIProps) {
  const { state, signIn, signUp, confirmSignUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [fields, setFields] = useState<FormFields>({ email: '', password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [confirmationCode, setConfirmationCode] = useState('')

  // Don't render when already authenticated — prevents password manager
  // from detecting a filled form during the unmount transition
  if (state.isAuthenticated) return null

  const handleFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    // Clear the specific field error on change
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode)
    setFieldErrors({})
    setFields({ email: '', password: '', confirmPassword: '' })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const errors = mode === 'login' ? validateLogin(fields) : validateSignup(fields)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})

    if (mode === 'login') {
      await signIn(fields.email, fields.password)
      // Clear fields immediately so password managers don't see filled
      // inputs during the re-render/unmount transition
      setFields({ email: '', password: '', confirmPassword: '' })
      onAuthSuccess?.()
    } else {
      await signUp(fields.email, fields.password)
      // Don't call onAuthSuccess — user needs to confirm their email first
    }
  }

  const handleConfirmSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!confirmationCode.trim()) return
    await confirmSignUp(state.confirmationEmail!, confirmationCode)
    // After confirmation, switch to login so they can sign in
  }

  const isLoading = state.isLoading

  // ── Confirmation code view ──────────────────────────────────────────────
  if (state.needsConfirmation) {
    return (
      <div className="auth-ui">
        {state.error && (
          <div className="auth-banner-error" role="alert">
            {state.error}
          </div>
        )}

        <div className="auth-confirmation-info">
          We sent a verification code to <span className="auth-confirmation-email">{state.confirmationEmail}</span>. Enter it below to confirm your account.
        </div>

        <form className="auth-form" onSubmit={handleConfirmSubmit} noValidate>
          <div className="auth-form-group">
            <label htmlFor="auth-confirmation-code" className="auth-label">
              Verification Code
            </label>
            <input
              id="auth-confirmation-code"
              name="confirmationCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="auth-input"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              disabled={isLoading}
              placeholder="Enter 6-digit code"
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading || !confirmationCode.trim()}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      </div>
    )
  }

  // ── Login / Sign-up view ────────────────────────────────────────────────
  return (
    <div className="auth-ui">
      {/* Banner error for network/service errors from AuthContext */}
      {state.error && (
        <div className="auth-banner-error" role="alert">
          {state.error}
        </div>
      )}

      {/* Mode toggle */}
      <div className="auth-mode-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          className={`auth-mode-btn${mode === 'login' ? ' auth-mode-btn--active' : ''}`}
          onClick={() => handleModeSwitch('login')}
          disabled={isLoading}
        >
          Log In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          className={`auth-mode-btn${mode === 'signup' ? ' auth-mode-btn--active' : ''}`}
          onClick={() => handleModeSwitch('signup')}
          disabled={isLoading}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="auth-form-group">
          <label htmlFor="auth-email" className="auth-label">
            Email
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            className={`auth-input${fieldErrors.email ? ' auth-input--error' : ''}`}
            value={fields.email}
            onChange={handleFieldChange}
            disabled={isLoading}
            aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
          />
          {fieldErrors.email && (
            <span id="auth-email-error" className="auth-field-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="auth-form-group">
          <label htmlFor="auth-password" className="auth-label">
            Password
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className={`auth-input${fieldErrors.password ? ' auth-input--error' : ''}`}
            value={fields.password}
            onChange={handleFieldChange}
            disabled={isLoading}
            aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined}
            aria-invalid={fieldErrors.password ? 'true' : 'false'}
          />
          {fieldErrors.password && (
            <span id="auth-password-error" className="auth-field-error" role="alert">
              {fieldErrors.password}
            </span>
          )}
        </div>

        {/* Confirm Password (signup only) */}
        {mode === 'signup' && (
          <div className="auth-form-group">
            <label htmlFor="auth-confirm-password" className="auth-label">
              Confirm Password
            </label>
            <input
              id="auth-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={`auth-input${fieldErrors.confirmPassword ? ' auth-input--error' : ''}`}
              value={fields.confirmPassword}
              onChange={handleFieldChange}
              disabled={isLoading}
              aria-describedby={fieldErrors.confirmPassword ? 'auth-confirm-password-error' : undefined}
              aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
            />
            {fieldErrors.confirmPassword && (
              <span id="auth-confirm-password-error" className="auth-field-error" role="alert">
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="auth-submit-btn"
          disabled={isLoading}
        >
          {isLoading
            ? mode === 'login' ? 'Signing in...' : 'Signing up...'
            : mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </form>
    </div>
  )
}

export default AuthUI
