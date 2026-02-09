/**
 * LogInputForm Component
 * Provides a text area for pasting Pokemon TCG Live game logs
 * with Analyze and Clear buttons.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { useState, type FormEvent, type ChangeEvent } from 'react'
import './LogInputForm.css'

export interface LogInputFormProps {
  onSubmit: (logText: string) => void
  onClear?: () => void
  isLoading: boolean
  initialValue?: string
}

export function LogInputForm({
  onSubmit,
  onClear,
  isLoading,
  initialValue = '',
}: LogInputFormProps) {
  const [logText, setLogText] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setLogText(e.target.value)
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    // Validate for empty input (Requirement 1.4)
    if (!logText.trim()) {
      setError('Please paste a game log to analyze')
      return
    }

    setError(null)
    onSubmit(logText)
  }

  const handleClear = () => {
    setLogText('')
    setError(null)
    onClear?.()
  }

  return (
    <form className="log-input-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="log-input" className="form-label">
          Paste your Pokemon TCG Live game log
        </label>
        <textarea
          id="log-input"
          className={`log-textarea ${error ? 'log-textarea--error' : ''}`}
          value={logText}
          onChange={handleTextChange}
          placeholder="Paste your game log here..."
          disabled={isLoading}
          rows={15}
          aria-describedby={error ? 'log-input-error' : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />
        {error && (
          <p id="log-input-error" className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="button-group">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClear}
          disabled={isLoading}
        >
          Clear
        </button>
      </div>
    </form>
  )
}

export default LogInputForm
