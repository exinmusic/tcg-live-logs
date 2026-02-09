# Requirements Document

## Introduction

This feature adds a "Deck Analysis" view to the Pokemon TCG Log Visualizer that reconstructs each player's deck from the game log. Since not all cards may be played or revealed during a match, the reconstruction will be partial but provides valuable insight into the decks used. The feature integrates with the Pokemon TCG SDK to fetch and display official card images, making it easy to study opponent strategies or revisit memorable matches.

## Glossary

- **Deck_Reconstructor**: The service responsible for extracting card information from parsed game events and building deck lists
- **Card_Fetcher**: The service that retrieves card data and images from the Pokemon TCG API
- **Deck_Card**: A card entry in a reconstructed deck, including name, count, category, and confidence level
- **Card_Category**: Classification of cards as Pokemon, Trainer (Supporter/Item/Tool/Stadium), or Energy
- **Confidence_Level**: Indicator of how certain we are about a card's presence (confirmed = seen in log, inferred = deduced from game mechanics)
- **Deck_Analysis_View**: The UI component displaying reconstructed deck lists for both players

## Requirements

### Requirement 1: Card Extraction from Game Log

**User Story:** As a user, I want the system to identify all cards played or revealed during a match, so that I can see what cards each player used.

#### Acceptance Criteria

1. WHEN a game log is parsed, THE Deck_Reconstructor SHALL extract all Pokemon cards played to the Active Spot or Bench by each player
2. WHEN a game log is parsed, THE Deck_Reconstructor SHALL extract all Trainer cards played by each player, categorized as Supporter, Item, Tool, or Stadium
3. WHEN a game log is parsed, THE Deck_Reconstructor SHALL extract all Energy cards attached by each player
4. WHEN a card is drawn and its name is revealed in the log, THE Deck_Reconstructor SHALL include that card in the player's deck list
5. WHEN a card is discarded and its name is revealed in the log, THE Deck_Reconstructor SHALL include that card in the player's deck list
6. WHEN a Pokemon evolves, THE Deck_Reconstructor SHALL record both the base Pokemon and the evolution as separate deck entries

### Requirement 2: Card Count Tracking

**User Story:** As a user, I want to see how many copies of each card were observed, so that I can understand the deck composition.

#### Acceptance Criteria

1. WHEN multiple instances of the same card are observed, THE Deck_Reconstructor SHALL aggregate them and display the total count
2. WHEN a card appears in multiple events, THE Deck_Reconstructor SHALL count each unique instance only once based on game context
3. THE Deck_Reconstructor SHALL display the observed count for each card in the format "Card Name x N"
4. WHEN the exact count cannot be determined, THE Deck_Reconstructor SHALL display a minimum count indicator (e.g., "at least 2")

### Requirement 3: Card Categorization

**User Story:** As a user, I want cards organized by category, so that I can quickly understand the deck structure.

#### Acceptance Criteria

1. THE Deck_Analysis_View SHALL group cards into three main categories: Pokemon, Trainers, and Energy
2. THE Deck_Analysis_View SHALL further subdivide Trainer cards into Supporters, Items, Tools, and Stadiums
3. WHEN displaying Pokemon cards, THE Deck_Analysis_View SHALL sort them by evolution line where determinable
4. WHEN displaying Energy cards, THE Deck_Analysis_View SHALL distinguish between Basic Energy and Special Energy

### Requirement 4: Pokemon TCG API Integration

**User Story:** As a user, I want to see official card images, so that I can visually identify and appreciate the cards used.

#### Acceptance Criteria

1. WHEN a deck is reconstructed, THE Card_Fetcher SHALL query the Pokemon TCG API to retrieve card images for each unique card
2. WHEN querying the API, THE Card_Fetcher SHALL search by card name using the pokemon-tcg-sdk-typescript library
3. WHEN multiple card versions exist for the same name, THE Card_Fetcher SHALL select the most recent printing by default
4. IF the API returns no results for a card name, THEN THE Card_Fetcher SHALL display a placeholder image with the card name
5. THE Card_Fetcher SHALL implement caching to avoid redundant API calls for the same card within a session
6. THE Card_Fetcher SHALL respect API rate limits by queuing requests and implementing appropriate delays

### Requirement 5: Deck Analysis View UI

**User Story:** As a user, I want a dedicated view to analyze reconstructed decks, so that I can study the match in detail.

#### Acceptance Criteria

1. THE Deck_Analysis_View SHALL be accessible as a third tab alongside Timeline and Statistics views
2. THE Deck_Analysis_View SHALL display both players' reconstructed decks side by side
3. WHEN displaying a card, THE Deck_Analysis_View SHALL show the card image, name, and observed count
4. THE Deck_Analysis_View SHALL provide a summary showing total cards observed per category for each player
5. WHEN a card image is loading, THE Deck_Analysis_View SHALL display a loading placeholder
6. WHEN hovering over a card, THE Deck_Analysis_View SHALL display an enlarged version of the card image

### Requirement 6: Confidence Indication

**User Story:** As a user, I want to know which cards are confirmed versus inferred, so that I understand the reliability of the reconstruction.

#### Acceptance Criteria

1. WHEN a card was directly played or revealed in the log, THE Deck_Analysis_View SHALL mark it as "confirmed"
2. WHEN a card's presence is deduced from game mechanics, THE Deck_Analysis_View SHALL mark it as "inferred"
3. THE Deck_Analysis_View SHALL visually distinguish confirmed cards from inferred cards using distinct styling
4. THE Deck_Analysis_View SHALL display a disclaimer explaining that the deck reconstruction is partial and based on observed gameplay

### Requirement 7: Error Handling

**User Story:** As a user, I want the feature to handle errors gracefully, so that I can still use the application when issues occur.

#### Acceptance Criteria

1. IF the Pokemon TCG API is unavailable, THEN THE Deck_Analysis_View SHALL display deck lists with card names only and show an error message
2. IF a specific card image fails to load, THEN THE Deck_Analysis_View SHALL display a fallback placeholder for that card without affecting other cards
3. IF the API rate limit is exceeded, THEN THE Card_Fetcher SHALL queue remaining requests and display a message indicating images are loading
4. WHEN an error occurs during deck reconstruction, THE Deck_Reconstructor SHALL log the error and continue processing remaining cards
