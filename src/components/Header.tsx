/**
 * Header Component
 * App title and navigation for Pokemon TCG Log Visualizer
 *
 * Requirements: 6.1, 6.5
 */

import './Header.css'

export interface HeaderProps {
  currentView?: 'input' | 'results'
  onNavigateToInput?: () => void
  showBackButton?: boolean
}

export function Header({
  currentView = 'input',
  onNavigateToInput,
  showBackButton = false,
}: HeaderProps) {
  return (
    <header className="app-header">
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
          <span className="title-icon">⚡</span>
          Pokemon TCG Log Visualizer
        </h1>
        <p className="app-subtitle">
          Analyze and visualize your Pokemon TCG Live matches
        </p>
      </div>
    </header>
  )
}

export default Header
