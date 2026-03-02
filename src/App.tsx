/**
 * Main Application Component
 * Handles view switching between input and results views
 * Provides view toggle for Timeline/Statistics in results view
 *
 * Requirements: 1.9, 6.5, 6.6
 */

import { useState, useEffect, useRef } from 'react'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { useApp } from './context/useApp'
import { useAuth } from './context/useAuth'
import {
  Header,
  LogInputForm,
  TimelineView,
  StatisticsView,
  DeckAnalysisView,
  ErrorBoundary,
  LoadingSpinner,
  ToastNotification,
  AuthUI,
} from './components'
import { PixelIcon } from './components/PixelIcon'
import './App.css'

type ResultsTab = 'timeline' | 'statistics' | 'deck-analysis'

/**
 * Inner App component that uses the context
 */
function AppContent() {
  const { state, submitLog, clearLog, setView, reconstructDecks, fetchCardImages, toggleTheme } = useApp()
  const { state: authState } = useAuth()
  const [activeTab, setActiveTab] = useState<ResultsTab>('timeline')
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Track previous auth state to detect transitions to authenticated
  const prevIsAuthenticated = useRef(authState.isAuthenticated)
  useEffect(() => {
    if (!prevIsAuthenticated.current && authState.isAuthenticated) {
      setSuccessToast('You are now signed in!')
    }
    prevIsAuthenticated.current = authState.isAuthenticated
  }, [authState.isAuthenticated])

  // Trigger deck reconstruction when switching to deck-analysis tab
  useEffect(() => {
    if (activeTab === 'deck-analysis' && state.matchData && !state.deckAnalysis.playerDecks) {
      reconstructDecks(state.matchData)
    }

    // Fetch card images after decks are reconstructed
    if (activeTab === 'deck-analysis' && state.deckAnalysis.playerDecks) {
      const cardNames = new Set<string>()
      Object.values(state.deckAnalysis.playerDecks).forEach((deck) => {
        deck.pokemon.forEach((card) => cardNames.add(card.name))
        deck.trainers.supporters.forEach((card) => cardNames.add(card.name))
        deck.trainers.items.forEach((card) => cardNames.add(card.name))
        deck.trainers.tools.forEach((card) => cardNames.add(card.name))
        deck.trainers.stadiums.forEach((card) => cardNames.add(card.name))
        deck.energy.basic.forEach((card) => cardNames.add(card.name))
        deck.energy.special.forEach((card) => cardNames.add(card.name))
      })

      // Fetch card images
      if (cardNames.size > 0) {
        fetchCardImages(Array.from(cardNames))
      }
    }
  }, [activeTab, state.matchData, state.deckAnalysis.playerDecks, reconstructDecks, fetchCardImages])

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
        theme={state.theme}
        onToggleTheme={toggleTheme}
      />

      <main className="app-main">
        {state.view === 'input' && (
          <div className="input-view">
            {/* Show AuthUI when not authenticated so users can sign in/up */}
            {!authState.isAuthenticated && (
              <AuthUI />
            )}

            <LogInputForm
              onSubmit={handleSubmit}
              onClear={handleClear}
              isLoading={state.isLoading}
              initialValue={state.rawLog}
            />

            {state.error && (
              <div className="error-banner" role="alert">
                <span className="error-icon">
                  <PixelIcon type="warning" size={20} />
                </span>
                <span className="error-text">{state.error}</span>
              </div>
            )}

            {/* Show past games placeholder when authenticated (real component added in task 9) */}
            {authState.isAuthenticated && (
              <div className="past-games-placeholder" aria-label="Past games section">
                <p>Past games list coming soon</p>
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
              <button
                className={`toggle-btn ${activeTab === 'deck-analysis' ? 'toggle-btn--active' : ''}`}
                onClick={() => setActiveTab('deck-analysis')}
                aria-pressed={activeTab === 'deck-analysis'}
              >
                Deck Analysis
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

            {activeTab === 'deck-analysis' && (
              <DeckAnalysisView
                matchData={state.matchData}
                playerDecks={state.deckAnalysis.playerDecks}
                cardData={state.deckAnalysis.cardData}
                errors={state.deckAnalysis.errors}
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

      {/* Success toast on sign-in / sign-up */}
      {successToast && (
        <ToastNotification
          message={successToast}
          type="success"
          duration={3000}
          onDismiss={() => setSuccessToast(null)}
        />
      )}
    </div>
  )
}

/**
 * Main App component wrapped with AuthProvider, AppProvider and ErrorBoundary
 */
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
