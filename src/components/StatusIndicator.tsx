/**
 * StatusIndicator Component
 * Retro-styled status indicator with pulsing animation
 * Requirements: 10.1, 10.2, 10.3
 */

import React from 'react'
import './StatusIndicator.css'

export interface StatusIndicatorProps {
  active?: boolean
  size?: 'small' | 'medium'
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  active = false,
  size = 'medium'
}) => {
  return (
    <div
      className={`status-indicator status-indicator--${size} ${
        active ? 'status-indicator--active' : ''
      }`}
      role="status"
      aria-label={active ? 'Active' : 'Inactive'}
    />
  )
}

export default StatusIndicator
