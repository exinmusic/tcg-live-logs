# Implementation Plan: Deck Reconstruction

## Overview

This plan implements the deck reconstruction feature in incremental steps, building from core types and services to the final UI integration. Each task builds on previous work, with property tests validating correctness at each stage.

## Tasks

- [x] 1. Set up types and core interfaces
  - [x] 1.1 Create deck reconstruction types in `src/types/deck.ts`
    - Define ConfidenceLevel, CardCategory, TrainerSubcategory, EnergySubcategory types
    - Define DeckCard, ReconstructedDeck, PlayerDecks interfaces
    - Define CardData, CardFetchState interfaces
    - _Requirements: 2.3, 2.4, 3.1, 3.2, 3.4, 6.1_
  
  - [x] 1.2 Export new types from `src/types/index.ts`
    - Add exports for all deck reconstruction types
    - _Requirements: 2.3, 3.1_

- [x] 2. Implement DeckReconstructor service
  - [x] 2.1 Create `src/services/deckReconstructor.ts` with card extraction logic
    - Implement extractCardsFromEvents function to process GameEvent array
    - Extract Pokemon from play_pokemon and evolve events
    - Extract Trainers from play_trainer events with category
    - Extract Energy from attach_energy events
    - Extract revealed cards from draw events with cardNames
    - Track card counts per player using Map
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 2.1, 2.2_
  
  - [ ]* 2.2 Write property test for card extraction completeness
    - **Property 1: Card Extraction Completeness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**
  
  - [x] 2.3 Implement card categorization logic
    - Create isBasicEnergy function using regex pattern
    - Create categorizeCard function to assign category and subcategory
    - Use existing trainerCategories.ts for trainer classification
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ]* 2.4 Write property test for card categorization
    - **Property 4: Card Categorization Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.4**
  
  - [x] 2.5 Implement evolution line tracking and sorting
    - Build evolution relationships from evolve events
    - Assign evolutionStage and evolvesFrom to Pokemon cards
    - Implement sortByEvolutionLine function
    - _Requirements: 3.3_
  
  - [ ]* 2.6 Write property test for evolution sorting
    - **Property 5: Pokemon Evolution Sorting**
    - **Validates: Requirements 3.3**
  
  - [x] 2.7 Implement reconstructDecks main function
    - Combine extraction, categorization, and sorting
    - Build ReconstructedDeck for each player
    - Calculate totalCardsObserved
    - Handle errors gracefully, continue on malformed events
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 7.4_
  
  - [ ]* 2.8 Write property test for error resilience
    - **Property 11: Error Resilience**
    - **Validates: Requirements 7.2, 7.4**

- [x] 3. Checkpoint - Ensure DeckReconstructor tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement CardFetcher service
  - [x] 4.1 Install pokemon-tcg-sdk-typescript package
    - Run npm install pokemon-tcg-sdk-typescript
    - _Requirements: 4.2_
  
  - [x] 4.2 Create `src/api/cardFetcher.ts` with API integration
    - Implement fetchCard function using Card.where() from SDK
    - Handle empty results by returning placeholder CardData
    - Select most recent card version by setReleaseDate
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 4.3 Write property test for card version selection
    - **Property 6: Card Version Selection**
    - **Validates: Requirements 4.3**
  
  - [x] 4.4 Implement caching layer
    - Create in-memory cache Map<string, CardData>
    - Check cache before API call
    - Store results in cache after fetch
    - _Requirements: 4.5_
  
  - [ ]* 4.5 Write property test for cache consistency
    - **Property 7: Cache Consistency**
    - **Validates: Requirements 4.5**
  
  - [x] 4.6 Implement rate limiting and request queuing
    - Create request queue for batch fetches
    - Implement delay between requests (2 seconds for 30/min limit)
    - Track request count and timing
    - _Requirements: 4.6, 7.3_
  
  - [x] 4.7 Implement fetchCards batch function
    - Accept array of card names
    - Use queue and cache for efficient fetching
    - Return Map<string, CardData>
    - _Requirements: 4.1_

- [x] 5. Checkpoint - Ensure CardFetcher tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement display utilities
  - [x] 6.1 Create `src/utils/deckDisplayUtils.ts` with formatting functions
    - Implement formatCardCount function for "Card Name x N" or "at least N" format
    - Implement getConfidenceClassName function for CSS class assignment
    - _Requirements: 2.3, 2.4, 6.3_
  
  - [ ]* 6.2 Write property test for display format
    - **Property 3: Display Format Correctness**
    - **Validates: Requirements 2.3, 2.4**
  
  - [x] 6.3 Implement summary calculation function
    - Calculate total cards per category
    - Calculate overall total cards observed
    - _Requirements: 5.4_
  
  - [ ]* 6.4 Write property test for summary calculation
    - **Property 9: Summary Calculation Correctness**
    - **Validates: Requirements 5.4**

- [x] 7. Implement UI components
  - [x] 7.1 Create `src/components/DeckCardDisplay.tsx` component
    - Display card image (or placeholder if loading/error)
    - Show card name and count using formatCardCount
    - Apply confidence-based CSS classes
    - Implement hover state for enlarged image
    - _Requirements: 5.3, 5.5, 5.6, 6.3_
  
  - [ ]* 7.2 Write property test for card display completeness
    - **Property 8: Card Display Completeness**
    - **Validates: Requirements 5.3**
  
  - [x] 7.3 Create `src/components/DeckCardDisplay.css` styles
    - Style card container with image and text
    - Add hover effect for enlarged view
    - Add distinct styles for confirmed vs inferred confidence
    - Add loading and placeholder styles
    - _Requirements: 5.5, 5.6, 6.3_
  
  - [x] 7.4 Create `src/components/DeckCategorySection.tsx` component
    - Display section header with category name
    - Render grid of DeckCardDisplay components
    - Show category card count
    - _Requirements: 3.1, 3.2_
  
  - [x] 7.5 Create `src/components/PlayerDeckCard.tsx` component
    - Display player name header
    - Render Pokemon section with evolution sorting
    - Render Trainer sections (Supporters, Items, Tools, Stadiums)
    - Render Energy sections (Basic, Special)
    - Show total cards observed summary
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.4_
  
  - [x] 7.6 Create `src/components/DeckAnalysisView.tsx` main view component
    - Display header with title and disclaimer
    - Render two PlayerDeckCard components side by side
    - Handle loading state for card images
    - Display error banner if API unavailable
    - _Requirements: 5.1, 5.2, 6.4, 7.1_
  
  - [x] 7.7 Create `src/components/DeckAnalysisView.css` styles
    - Two-column layout matching StatisticsView
    - Category section styling
    - Error banner styling
    - Responsive design for smaller screens
    - _Requirements: 5.2_
  
  - [x] 7.8 Export new components from `src/components/index.ts`
    - Add exports for DeckCardDisplay, DeckCategorySection, PlayerDeckCard, DeckAnalysisView
    - _Requirements: 5.1_

- [x] 8. Integrate with application
  - [x] 8.1 Update AppContext to include deck reconstruction state
    - Add deckAnalysis state with playerDecks, cardData, errors
    - Add reconstructDecks action
    - Add fetchCardImages action
    - _Requirements: 5.1_
  
  - [x] 8.2 Update App.tsx to add Deck Analysis tab
    - Add 'deck-analysis' to ResultsTab type
    - Add third toggle button for Deck Analysis
    - Render DeckAnalysisView when tab is active
    - Trigger deck reconstruction when switching to tab
    - _Requirements: 5.1_
  
  - [x] 8.3 Update App.css with tab styling for three tabs
    - Adjust toggle button widths for three buttons
    - _Requirements: 5.1_

- [x] 9. Implement confidence assignment
  - [x] 9.1 Update DeckReconstructor to assign confidence levels
    - Mark cards from play/evolve/attach events as 'confirmed'
    - Mark cards from draw events as 'confirmed'
    - _Requirements: 6.1_
  
  - [ ]* 9.2 Write property test for confidence assignment
    - **Property 10: Confidence Assignment and Display**
    - **Validates: Requirements 6.1, 6.3**

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use fast-check library for TypeScript
- Each property test must run minimum 100 iterations
- The pokemon-tcg-sdk-typescript package handles API communication
- Rate limiting assumes no API key (30 requests/minute); can be adjusted if key is provided
