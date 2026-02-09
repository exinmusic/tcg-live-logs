/**
 * Application State Context for Pokemon TCG Log Visualizer
 * Manages state transitions: input → loading → results/error
 * Provides actions: submitLog, clearLog, fetchSprites
 */

import { createContext, useReducer, useCallback, type ReactNode } from 'react'
import type { AppState, MatchData, PokemonSprite } from '../types'
import { parseLog } from '../parser'
import { fetchSprites as fetchSpritesFromApi, type SpriteResult } from '../api/pokeApiService'

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

  const value: AppContextValue = {
    state,
    submitLog,
    clearLog,
    fetchSprites,
    setView,
    setRawLog,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/**
 * Export the context for testing purposes
 */
export { AppContext }
