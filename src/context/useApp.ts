/**
 * Custom hook to use the App context
 */

import { useContext } from 'react'
import { AppContext, type AppContextValue } from './AppContext'

/**
 * Custom hook to use the App context
 * Throws if used outside of AppProvider
 */
export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
