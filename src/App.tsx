/**
 * Main Application Component
 * Handles view switching between input and results views
 * Provides view toggle for Timeline/Statistics in results view
 *
 * Requirements: 6.5, 6.6
 */

import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/useApp'
import {
  Header,
  LogInputForm,
  TimelineView,
  StatisticsView,
  ErrorBoundary,
  LoadingSpinner,
} from './components'
import './App.css'

type ResultsTab = 'timeline' | 'statistics'

/**
 * Inner App component that uses the context
 */
function AppContent() {
  const { state, submitLog, clearLog, setView } = useApp()
  const [activeTab, setActiveTab] = useState<ResultsTab>('timeline')

  const handleSubmit = async (logText: string) => {
    await submitLog(logText)
  }

  const handleClear = () => {
    clearLog()
  }

  const handleBackToInput = () => {
    setView('input')
  }

  return (
    <div className="app">
      <Header
        currentView={state.view}
        onNavigateToInput={handleBackToInput}
        showBackButton={state.view === 'results'}
      />

      <main className="app-main">
        {state.view === 'input' && (
          <div className="input-view">
            <LogInputForm
              onSubmit={handleSubmit}
              onClear={handleClear}
              isLoading={state.isLoading}
              initialValue={state.rawLog}
            />
            {state.error && (
              <div className="error-banner" role="alert">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{state.error}</span>
              </div>
            )}
          </div>
        )}

        {state.view === 'results' && state.matchData && (
          <div className="results-view">
            <div className="view-toggle">
              <button
                className={`toggle-btn ${activeTab === 'timeline' ? 'toggle-btn--active' : ''}`}
                onClick={() => setActiveTab('timeline')}
                aria-pressed={activeTab === 'timeline'}
              >
                Timeline
              </button>
              <button
                className={`toggle-btn ${activeTab === 'statistics' ? 'toggle-btn--active' : ''}`}
                onClick={() => setActiveTab('statistics')}
                aria-pressed={activeTab === 'statistics'}
              >
                Statistics
              </button>
            </div>

            {activeTab === 'timeline' && (
              <TimelineView
                matchData={state.matchData}
                sprites={state.sprites}
              />
            )}

            {activeTab === 'statistics' && (
              <StatisticsView
                matchData={state.matchData}
                sprites={state.sprites}
              />
            )}
          </div>
        )}

        {state.isLoading && (
          <LoadingSpinner
            size="large"
            message="Analyzing your match..."
            overlay
          />
        )}
      </main>
    </div>
  )
}

/**
 * Main App component wrapped with AppProvider and ErrorBoundary
 */
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App
