/**
 * ErrorBoundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 *
 * Requirements: 6.3, 6.4
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging (in production, send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <span className="error-boundary-icon">⚠️</span>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-message">
              We encountered an unexpected error. Please try again.
            </p>
            <button
              className="error-boundary-button"
              onClick={this.handleReset}
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
