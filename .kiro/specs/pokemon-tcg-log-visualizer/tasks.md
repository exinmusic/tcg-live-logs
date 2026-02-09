# Implementation Plan: Pokemon TCG Log Visualizer

## Overview

This implementation plan breaks down the Pokemon TCG Log Visualizer into incremental coding tasks. Each task builds on previous work, ensuring no orphaned code. The approach prioritizes core parsing logic first, then builds out the UI components, and finally integrates PokeAPI for sprites.

## Tasks

- [x] 1. Project Setup and Core Types
  - [x] 1.1 Initialize React project with TypeScript and configure build tools
    - Create React app with Vite and TypeScript
    - Install dependencies: fast-check for property testing, vitest for unit tests
    - Configure ESLint and Prettier
    - _Requirements: 6.1, 6.2_
  
  - [x] 1.2 Define core TypeScript interfaces and types
    - Create `src/types/index.ts` with all interfaces from design (GameEvent, MatchData, PlayerStatistics, etc.)
    - Create `src/types/events.ts` with EventType and EventDetails types
    - _Requirements: 2.3, 2.4_

- [x] 2. Log Parser Implementation
  - [x] 2.1 Implement regex patterns and parser utilities
    - Create `src/parser/patterns.ts` with all regex patterns from design
    - Create `src/parser/utils.ts` with helper functions for line matching
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 2.2 Implement setup phase parser
    - Create `src/parser/setupParser.ts` to parse coin flip, player names, opening hands, mulligans
    - Extract player usernames and determine who goes first
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.3 Implement turn and event parser
    - Create `src/parser/eventParser.ts` to parse individual game actions
    - Handle all event types: draw, play_pokemon, evolve, attach_energy, play_trainer, use_ability, attack, knockout, prize_taken, switch
    - _Requirements: 2.3, 2.4, 2.5, 2.6_
  
  - [x] 2.4 Implement trainer card categorization
    - Create `src/parser/trainerCategories.ts` with known trainer mappings
    - Implement inference logic for unknown trainers based on usage patterns
    - _Requirements: 2.8_
  
  - [x] 2.5 Implement main parser orchestrator
    - Create `src/parser/index.ts` that combines setup and event parsers
    - Implement error handling for invalid logs
    - Return complete MatchData or error result
    - _Requirements: 2.7, 2.9_
  
  - [ ]* 2.6 Write property tests for parser
    - **Property 5: Attack Damage Summation Invariant**
    - **Property 8: Invalid Log Error Handling**
    - **Validates: Requirements 2.5, 2.9, 7.1**
  
  - [ ]* 2.7 Write unit tests for parser
    - Test parsing of sample_log.txt
    - Test edge cases: empty input, malformed lines
    - _Requirements: 2.9_

- [x] 3. Statistics Calculation
  - [x] 3.1 Implement statistics calculator
    - Create `src/statistics/calculator.ts` to compute PlayerStatistics from events
    - Calculate: totalDamageDealt, totalCardsDrawn, trainersPlayed, pokemonKnockedOut, prizeCardsTaken, coinFlips
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 3.2 Write property tests for statistics
    - **Property 6: Knockout Attribution Correctness**
    - **Property 7: Prize Cards Match Knockouts**
    - **Validates: Requirements 2.6, 7.3, 7.4**

- [x] 4. Checkpoint - Parser Complete
  - Ensure all parser tests pass, ask the user if questions arise.

- [x] 5. PokeAPI Service
  - [x] 5.1 Implement Pokemon name normalization
    - Create `src/api/normalization.ts` with normalizePokemonName function
    - Handle suffixes: ex, mega, gx, v, vmax, vstar
    - Remove special characters, convert to lowercase
    - _Requirements: 5.6_
  
  - [x] 5.2 Implement sprite fetching service with caching
    - Create `src/api/pokeApiService.ts` with fetchSprite function
    - Implement in-memory cache to prevent duplicate API calls
    - Handle errors gracefully with placeholder fallback
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 5.3 Write property tests for PokeAPI service
    - **Property 9: Pokemon Name Normalization**
    - **Property 10: Sprite Cache Prevents Duplicate Fetches**
    - **Validates: Requirements 5.5, 5.6**

- [x] 6. Application State Management
  - [x] 6.1 Implement application state context
    - Create `src/context/AppContext.tsx` with AppState interface
    - Implement state transitions: input → loading → results/error
    - Provide actions: submitLog, clearLog, fetchSprites
    - _Requirements: 1.3, 1.5, 6.3_

- [x] 7. UI Components - Input Layer
  - [x] 7.1 Implement LogInputForm component
    - Create `src/components/LogInputForm.tsx`
    - Text area for log input, Analyze button, Clear button
    - Validation for empty input
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 7.2 Implement Header component
    - Create `src/components/Header.tsx`
    - App title and navigation
    - _Requirements: 6.1, 6.5_

- [x] 8. UI Components - Results Layer
  - [x] 8.1 Implement TimelineView component
    - Create `src/components/TimelineView.tsx`
    - Display turns in chronological order
    - Player color coding
    - _Requirements: 3.1, 3.2_
  
  - [x] 8.2 Implement TurnCard and EventItem components
    - Create `src/components/TurnCard.tsx` with expandable turn details
    - Create `src/components/EventItem.tsx` for individual events
    - Highlight significant events (knockouts, big attacks)
    - _Requirements: 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 8.3 Write property tests for timeline
    - **Property 11: Timeline Event Ordering**
    - **Property 12: Significant Event Identification**
    - **Validates: Requirements 3.1, 3.3**
  
  - [x] 8.4 Implement StatisticsView component
    - Create `src/components/StatisticsView.tsx`
    - Side-by-side player comparison
    - Display all statistics categories
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [x] 8.5 Implement PlayerStatsCard component
    - Create `src/components/PlayerStatsCard.tsx`
    - Display individual player statistics with trainer card breakdown
    - _Requirements: 4.3_
  
  - [ ]* 8.6 Write property tests for statistics display
    - **Property 13: Statistics Calculation Completeness**
    - **Property 14: Trainer Card Categorization**
    - **Validates: Requirements 4.1-4.7, 2.8**

- [x] 9. UI Components - Sprites
  - [x] 9.1 Implement PokemonSprite component
    - Create `src/components/PokemonSprite.tsx`
    - Display sprite image or placeholder
    - Handle loading and error states
    - _Requirements: 5.3, 5.4_

- [x] 10. Checkpoint - Components Complete
  - Ensure all component tests pass, ask the user if questions arise.

- [x] 11. Main Application Assembly
  - [x] 11.1 Implement App component and routing
    - Create `src/App.tsx` with view switching (input/results)
    - Wire up AppContext provider
    - Implement view toggle for Timeline/Statistics
    - _Requirements: 6.5, 6.6_
  
  - [x] 11.2 Implement error boundary and loading states
    - Create `src/components/ErrorBoundary.tsx`
    - Create `src/components/LoadingSpinner.tsx`
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 11.3 Write property tests for error handling
    - **Property 15: Error State Display**
    - **Validates: Requirements 5.4, 6.4**

- [x] 12. Styling and Responsiveness
  - [x] 12.1 Implement global styles and theme
    - Create `src/styles/global.css` with CSS variables for theming
    - Implement responsive breakpoints for mobile/tablet/desktop
    - _Requirements: 6.1, 6.2_
  
  - [x] 12.2 Style all components
    - Add component-specific styles using CSS modules or styled-components
    - Ensure consistent visual design
    - _Requirements: 6.1_

- [x] 13. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property-based tests use fast-check with minimum 100 iterations
- Each property test references its design document property number
- The sample_log.txt file should be used for integration testing
