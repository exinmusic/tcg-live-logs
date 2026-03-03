/**
 * UnauthenticatedMessage Component
 * Displays a message encouraging unauthenticated users to create an account.
 * Only rendered when the user is NOT authenticated.
 *
 * Requirements: 7.2
 */

import { useAuth } from '../context/useAuth'
import './UnauthenticatedMessage.css'

export function UnauthenticatedMessage() {
  const { state: authState } = useAuth()

  // Hide when authenticated
  if (authState.isAuthenticated) return null

  return (
    <div className="unauth-message" role="complementary" aria-label="Account benefits">
      <p className="unauth-message__heading">Create a free account to unlock more features</p>
      <ul className="unauth-message__benefits">
        <li>Save your game logs for future reference</li>
        <li>Access your match history from any device</li>
      </ul>
      <p className="unauth-message__hint">
        Sign up above to get started — analyzing logs works without an account too.
      </p>
    </div>
  )
}

export default UnauthenticatedMessage
