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
  theme: 'dark' | 'light'
  crtEnabled: boolean
  onToggleTheme: () => void
  onToggleCrt: () => void
}

export function Header({
  currentView = 'input',
  onNavigateToInput,
  showBackButton = false,
  theme,
  crtEnabled,
  onToggleTheme,
  onToggleCrt,
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
        <div className="header-controls">
          <button
            className="pixel-btn theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <button
            className={`pixel-btn crt-toggle ${crtEnabled ? 'active' : ''}`}
            onClick={onToggleCrt}
            aria-label={`${crtEnabled ? 'Disable' : 'Enable'} CRT effect`}
            title={`${crtEnabled ? 'Disable' : 'Enable'} CRT scanline overlay`}
          >
            CRT
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
