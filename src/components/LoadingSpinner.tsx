/**
 * LoadingSpinner Component
 * Displays a loading indicator while the application is processing
 *
 * Requirements: 6.3
 */

import './LoadingSpinner.css'

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  overlay?: boolean
}

export function LoadingSpinner({
  size = 'medium',
  message,
  overlay = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className={`loading-spinner-container loading-spinner-container--${size}`}>
      <div className="pixel-loader" role="status" aria-label="Loading">
        <div className="pixel-loader__block"></div>
        <div className="pixel-loader__block"></div>
        <div className="pixel-loader__block"></div>
        <span className="spinner-sr-only">Loading...</span>
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  )

  if (overlay) {
    return (
      <div className="loading-spinner-overlay" aria-busy="true">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner
