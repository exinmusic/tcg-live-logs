/**
 * ToastNotification Component
 * Retro-styled toast notification with auto-dismiss
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import React, { useEffect } from 'react'
import './ToastNotification.css'

export interface ToastNotificationProps {
  message: string
  type?: 'info' | 'success' | 'error'
  duration?: number
  onDismiss: () => void
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onDismiss
}) => {
  useEffect(() => {
    // Skip auto-dismiss if duration is 0 or negative
    if (duration <= 0) {
      return
    }

    const timer = setTimeout(() => {
      onDismiss()
    }, duration)

    return () => {
      clearTimeout(timer)
    }
  }, [duration, onDismiss])

  return (
    <div
      className={`toast-notification toast-notification--${type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-notification__message">{message}</div>
      <button
        className="toast-notification__close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}

export default ToastNotification
