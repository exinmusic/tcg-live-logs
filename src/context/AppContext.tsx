/**
 * Application State Context for Pokemon TCG Log Visualizer
 * Manages state transitions: input → loading → results/error
 * Provides actions: submitLog, clearLog, fetchSprites
 */

import { createContext, useReducer, useCallback, type ReactNode } from 'react'
import type { AppState, MatchData, PokemonSprite, PlayerDecks, CardData } from '../types'
import { parseLog } from '../parser'
import { fetchSprites as fetchSpritesFromApi, type SpriteResult } from '../api/pokeApiService'
import { reconstructDecks } from '../services/deckReconstructor'
import { fetchCards } from '../api/cardFetcher'

/**
 * Action types for state transitions
 */
type AppAction =
  | { type: 'SET_RAW_LOG'; payload: string }
  | { type: 'SUBMIT_LOG_START' }
  | { type: 'SUBMIT_LOG_SUCCESS'; payload: MatchData }
  | { type: 'SUBMIT_LOG_ERROR'; payload: string }
  | { type: 'CLEAR_LOG' }
  | { type: 'FETCH_SPRITES_START' }
  | { type: 'FETCH_SPRITES_SUCCESS'; payload: Map<string, PokemonSprite> }
  | { type: 'FETCH_SPRITES_ERROR'; payload: string }
  | { type: 'SET_VIEW'; payload: 'input' | 'results' }
  | { type: 'RECONSTRUCT_DECKS_START' }
  | { type: 'RECONSTRUCT_DECKS_SUCCESS'; payload: PlayerDecks }
  | { type: 'RECONSTRUCT_DECKS_ERROR'; payload: string }
  | { type: 'FETCH_CARD_IMAGES_START'; payload: string[] }
  | { type: 'FETCH_CARD_IMAGE_SUCCESS'; payload: { cardName: string; cardData: CardData } }
  | { type: 'FETCH_CARD_IMAGES_SUCCESS'; payload: Map<string, CardData> }
  | { type: 'FETCH_CARD_IMAGES_ERROR'; payload: { cardName: string; error: string } }

/**
 * Context value interface with state and actions
 */
export interface AppContextValue {
  state: AppState
  submitLog: (logText: string) => Promise<void>
  clearLog: () => void
  fetchSprites: (pokemonNames: string[]) => Promise<void>
  setView: (view: 'input' | 'results') => void
  setRawLog: (log: string) => void
  reconstructDecks: (matchData: MatchData) => void
  fetchCardImages: (cardNames: string[]) => Promise<void>
}

/**
 * Initial application state
 */
const initialState: AppState = {
  view: 'input',
  rawLog: '',
  matchData: null,
  sprites: new Map(),
  isLoading: false,
  error: null,
  deckAnalysis: {
    playerDecks: null,
    cardData: new Map(),
    errors: [],
  },
}

/**
 * State reducer for handling all state transitions
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_RAW_LOG':
      return {
        ...state,
        rawLog: action.payload,
        error: null,
      }

    case 'SUBMIT_LOG_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case 'SUBMIT_LOG_SUCCESS':
      return {
        ...state,
        isLoading: false,
        matchData: action.payload,
        view: 'results',
        error: null,
      }

    case 'SUBMIT_LOG_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        matchData: null,
      }

    case 'CLEAR_LOG':
      return {
        ...initialState,
      }

    case 'FETCH_SPRITES_START':
      return {
        ...state,
        isLoading: true,
      }

    case 'FETCH_SPRITES_SUCCESS':
      return {
        ...state,
        isLoading: false,
        sprites: action.payload,
      }

    case 'FETCH_SPRITES_ERROR':
      // Sprite fetch errors are non-fatal, just log and continue
      return {
        ...state,
        isLoading: false,
      }

    case 'SET_VIEW':
      return {
        ...state,
        view: action.payload,
      }

    case 'RECONSTRUCT_DECKS_START':
      return {
        ...state,
        isLoading: true,
        deckAnalysis: {
          ...state.deckAnalysis,
          errors: [],
        },
      }

    case 'RECONSTRUCT_DECKS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        deckAnalysis: {
          ...state.deckAnalysis,
          playerDecks: action.payload,
        },
      }

    case 'RECONSTRUCT_DECKS_ERROR':
      return {
        ...state,
        isLoading: false,
        deckAnalysis: {
          ...state.deckAnalysis,
          errors: [...state.deckAnalysis.errors, action.payload],
        },
      }

    case 'FETCH_CARD_IMAGES_START': {
      // Mark cards as loading
      const loadingCardData = new Map(state.deckAnalysis.cardData)
      action.payload.forEach((cardName) => {
        if (!loadingCardData.has(cardName)) {
          loadingCardData.set(cardName, {
            data: null,
            isLoading: true,
            error: null,
          })
        }
      })
      return {
        ...state,
        deckAnalysis: {
          ...state.deckAnalysis,
          cardData: loadingCardData,
        },
      }
    }

    case 'FETCH_CARD_IMAGE_SUCCESS': {
      // Update single card data as it loads
      const updatedCardData = new Map(state.deckAnalysis.cardData)
      updatedCardData.set(action.payload.cardName, {
        data: action.payload.cardData,
        isLoading: false,
        error: null,
      })
      return {
        ...state,
        deckAnalysis: {
          ...state.deckAnalysis,
          cardData: updatedCardData,
        },
      }
    }

    case 'FETCH_CARD_IMAGES_SUCCESS': {
      // Update card data with fetched results
      const updatedCardData = new Map(state.deckAnalysis.cardData)
      action.payload.forEach((cardData, cardName) => {
        updatedCardData.set(cardName, {
          data: cardData,
          isLoading: false,
          error: null,
        })
      })
      return {
        ...state,
        deckAnalysis: {
          ...state.deckAnalysis,
          cardData: updatedCardData,
        },
      }
    }

    case 'FETCH_CARD_IMAGES_ERROR': {
      // Mark specific card as errored
      const errorCardData = new Map(state.deckAnalysis.cardData)
      errorCardData.set(action.payload.cardName, {
        data: null,
        isLoading: false,
        error: action.payload.error,
      })
      return {
        ...state,
        deckAnalysis: {
          ...state.deckAnalysis,
          cardData: errorCardData,
          errors: [...state.deckAnalysis.errors, action.payload.error],
        },
      }
    }

    default:
      return state
  }
}

/**
 * Create the context with undefined default (will be provided by Provider)
 */
const AppContext = createContext<AppContextValue | undefined>(undefined)

/**
 * Provider props
 */
interface AppProviderProps {
  children: ReactNode
}

/**
 * Convert SpriteResult to PokemonSprite format
 */
function convertToPokemonSprite(result: SpriteResult): PokemonSprite {
  return {
    name: result.name,
    spriteUrl: result.isPlaceholder ? null : result.spriteUrl,
    isLoading: false,
    error: result.isPlaceholder ? 'Sprite not found' : null,
  }
}

/**
 * Application State Provider component
 */
export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  /**
   * Submit a log for parsing
   * Transitions: input → loading → results/error
   */
  const submitLog = useCallback(async (logText: string) => {
    dispatch({ type: 'SET_RAW_LOG', payload: logText })
    dispatch({ type: 'SUBMIT_LOG_START' })

    try {
      const result = parseLog(logText)

      if (result.success) {
        dispatch({ type: 'SUBMIT_LOG_SUCCESS', payload: result.data })

        // Automatically fetch sprites for Pokemon in the match
        if (result.data.pokemonInMatch.length > 0) {
          dispatch({ type: 'FETCH_SPRITES_START' })
          try {
            const spriteResults = await fetchSpritesFromApi(result.data.pokemonInMatch)
            const sprites = new Map<string, PokemonSprite>()
            spriteResults.forEach((result, name) => {
              sprites.set(name, convertToPokemonSprite(result))
            })
            dispatch({ type: 'FETCH_SPRITES_SUCCESS', payload: sprites })
          } catch {
            dispatch({ type: 'FETCH_SPRITES_ERROR', payload: 'Failed to fetch sprites' })
          }
        }
      } else {
        dispatch({ type: 'SUBMIT_LOG_ERROR', payload: result.error })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      dispatch({ type: 'SUBMIT_LOG_ERROR', payload: errorMessage })
    }
  }, [])

  /**
   * Clear the current log and reset to initial state
   */
  const clearLog = useCallback(() => {
    dispatch({ type: 'CLEAR_LOG' })
  }, [])

  /**
   * Fetch sprites for a list of Pokemon names
   */
  const fetchSprites = useCallback(async (pokemonNames: string[]) => {
    if (pokemonNames.length === 0) return

    dispatch({ type: 'FETCH_SPRITES_START' })

    try {
      const spriteResults = await fetchSpritesFromApi(pokemonNames)
      const sprites = new Map<string, PokemonSprite>()
      spriteResults.forEach((result, name) => {
        sprites.set(name, convertToPokemonSprite(result))
      })
      dispatch({ type: 'FETCH_SPRITES_SUCCESS', payload: sprites })
    } catch {
      dispatch({ type: 'FETCH_SPRITES_ERROR', payload: 'Failed to fetch sprites' })
    }
  }, [])

  /**
   * Set the current view (input or results)
   */
  const setView = useCallback((view: 'input' | 'results') => {
    dispatch({ type: 'SET_VIEW', payload: view })
  }, [])

  /**
   * Set the raw log text (for controlled input)
   */
  const setRawLog = useCallback((log: string) => {
    dispatch({ type: 'SET_RAW_LOG', payload: log })
  }, [])

  /**
   * Reconstruct decks from match data
   */
  const reconstructDecksAction = useCallback((matchData: MatchData) => {
    dispatch({ type: 'RECONSTRUCT_DECKS_START' })

    try {
      const playerDecks = reconstructDecks(matchData)
      dispatch({ type: 'RECONSTRUCT_DECKS_SUCCESS', payload: playerDecks })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reconstruct decks'
      dispatch({ type: 'RECONSTRUCT_DECKS_ERROR', payload: errorMessage })
    }
  }, [])

  /**
   * Fetch card images for deck analysis
   */
  const fetchCardImages = useCallback(async (cardNames: string[]) => {
    if (cardNames.length === 0) return

    dispatch({ type: 'FETCH_CARD_IMAGES_START', payload: cardNames })

    try {
      // Fetch cards with callback for progressive updates
      await fetchCards(cardNames, (cardName, cardData) => {
        // Dispatch individual card success as it loads
        dispatch({
          type: 'FETCH_CARD_IMAGE_SUCCESS',
          payload: { cardName, cardData },
        })
      })
      
      // Final success action (optional, for completion tracking)
      // The individual updates have already been dispatched
    } catch (error) {
      console.error('[AppContext] Error fetching cards:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch card images'
      // For batch errors, we'll just log a general error
      dispatch({
        type: 'FETCH_CARD_IMAGES_ERROR',
        payload: { cardName: 'batch', error: errorMessage },
      })
    }
  }, [])

  const value: AppContextValue = {
    state,
    submitLog,
    clearLog,
    fetchSprites,
    setView,
    setRawLog,
    reconstructDecks: reconstructDecksAction,
    fetchCardImages,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/**
 * Export the context for testing purposes
 */
export { AppContext }
