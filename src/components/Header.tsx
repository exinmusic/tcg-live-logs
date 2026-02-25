/**
 * Header Component
 * App title and navigation for Pokemon TCG Log Visualizer
 *
 * Requirements: 6.1, 6.5
 */

import { Lightbulb, Moon } from 'pixelarticons/react'
import './Header.css'

export interface HeaderProps {
  currentView?: 'input' | 'results'
  onNavigateToInput?: () => void
  showBackButton?: boolean
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export function Header({
  currentView = 'input',
  onNavigateToInput,
  showBackButton = false,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="app-header">
      <button
        className="pixel-btn theme-toggle"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Lightbulb width={20} height={20} /> : <Moon width={20} height={20} />}
      </button>
      <div className="header-content">
        {showBackButton && currentView === 'results' && (
          <button
            className="back-button"
            onClick={onNavigateToInput}
            aria-label="Back to log input"
          >
            ← Back
          </button>
        )}
        <h1 className="app-title">
          Pokemon LIVE Analysis
        </h1>
        <p className="app-subtitle">
          Analyze and visualize your Pokemon TCG Live matches
        </p>
      </div>
    </header>
  )
}

export default Header
