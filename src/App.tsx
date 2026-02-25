/**
 * Main Application Component
 * Handles view switching between input and results views
 * Provides view toggle for Timeline/Statistics in results view
 *
 * Requirements: 6.5, 6.6
 */

import { useState, useEffect } from 'react'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/useApp'
import {
  Header,
  LogInputForm,
  TimelineView,
  StatisticsView,
  DeckAnalysisView,
  ErrorBoundary,
  LoadingSpinner,
} from './components'
import './App.css'

type ResultsTab = 'timeline' | 'statistics' | 'deck-analysis'

/**
 * Inner App component that uses the context
 */
function AppContent() {
  const { state, submitLog, clearLog, setView, reconstructDecks, fetchCardImages, toggleTheme } = useApp()
  const [activeTab, setActiveTab] = useState<ResultsTab>('timeline')

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
