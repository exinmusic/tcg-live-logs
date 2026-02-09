# Requirements Document

## Introduction

The Pokemon TCG Log Visualizer is a client-side React application that parses game logs from Pokemon TCG Live and presents them as an interactive, visual match summary. Users paste raw text logs into the application, which then extracts game events, calculates statistics, and displays a comprehensive match visualization complete with Pokemon sprites fetched from PokeAPI.

## Glossary

- **Log_Parser**: The component responsible for parsing raw Pokemon TCG Live log text into structured game data
- **Game_Event**: A discrete action that occurred during the match (draw, attack, knockout, etc.)
- **Match_Data**: The complete structured representation of a parsed game log
- **Timeline_View**: The visual component displaying game events in chronological order
- **Statistics_Dashboard**: The component displaying aggregated match statistics for both players
- **Player**: A participant in the Pokemon TCG match, identified by username
- **Turn**: A complete set of actions taken by one player before ending their turn
- **Knockout**: When a Pokemon's HP reaches zero and it is removed from play
- **Prize_Card**: A card taken from the prize pile when a player knocks out an opponent's Pokemon
- **Trainer_Card**: A category of cards including Supporters, Items, Tools, and Stadiums
- **PokeAPI_Service**: The service responsible for fetching Pokemon sprite images from the PokeAPI

## Requirements

### Requirement 1: Log Input

**User Story:** As a user, I want to paste my Pokemon TCG Live game log into the application, so that I can visualize and analyze my match.

#### Acceptance Criteria

1. WHEN the application loads, THE Log_Input_Component SHALL display a text area for pasting game logs
2. WHEN a user pastes text into the input area, THE Log_Input_Component SHALL accept the full log content without truncation
3. WHEN a user clicks the "Analyze" button with valid log content, THE Log_Parser SHALL process the log and display results
4. WHEN a user clicks the "Analyze" button with empty input, THE Log_Input_Component SHALL display an error message indicating log content is required
5. WHEN a user wants to analyze a new log, THE Log_Input_Component SHALL provide a "Clear" button to reset the application state

### Requirement 2: Log Parsing

**User Story:** As a user, I want the application to parse my game log accurately, so that I can see structured data about my match.

#### Acceptance Criteria

1. WHEN a valid log is submitted, THE Log_Parser SHALL extract both player usernames from the setup phase
2. WHEN a valid log is submitted, THE Log_Parser SHALL identify the coin flip winner and their choice (first/second)
3. WHEN a valid log is submitted, THE Log_Parser SHALL parse all turn-by-turn actions into Game_Event objects
4. WHEN a valid log is submitted, THE Log_Parser SHALL extract all Pokemon names mentioned in the log
5. WHEN a valid log is submitted, THE Log_Parser SHALL identify all attacks with their damage values and breakdowns
6. WHEN a valid log is submitted, THE Log_Parser SHALL track all knockouts and which player caused them
7. WHEN a valid log is submitted, THE Log_Parser SHALL identify the match winner and win condition
8. WHEN a valid log is submitted, THE Log_Parser SHALL categorize trainer cards as Supporters, Items, Tools, or Stadiums based on usage patterns
9. IF the log format is invalid or corrupted, THEN THE Log_Parser SHALL return a descriptive error message
10. FOR ALL valid Match_Data objects, parsing the log then serializing back to a summary format then parsing again SHALL produce equivalent statistical totals (round-trip consistency for statistics)

### Requirement 3: Match Timeline

**User Story:** As a user, I want to see a visual timeline of the match, so that I can understand the flow of the game.

#### Acceptance Criteria

1. WHEN match data is available, THE Timeline_View SHALL display events in chronological order by turn
2. WHEN displaying events, THE Timeline_View SHALL visually distinguish between the two players using different colors
3. WHEN displaying events, THE Timeline_View SHALL highlight significant events (knockouts, big attacks over 100 damage)
4. WHEN a user clicks on a timeline event, THE Timeline_View SHALL expand to show event details
5. WHEN displaying attack events, THE Timeline_View SHALL show the attacking Pokemon, target Pokemon, and damage dealt
6. WHEN displaying knockout events, THE Timeline_View SHALL show which Pokemon was knocked out and prize cards taken

### Requirement 4: Statistics Dashboard

**User Story:** As a user, I want to see aggregated statistics for both players, so that I can compare performance.

#### Acceptance Criteria

1. WHEN match data is available, THE Statistics_Dashboard SHALL display total damage dealt by each player
2. WHEN match data is available, THE Statistics_Dashboard SHALL display total cards drawn by each player
3. WHEN match data is available, THE Statistics_Dashboard SHALL display trainer cards played, grouped by category (Supporters, Items, Tools, Stadiums)
4. WHEN match data is available, THE Statistics_Dashboard SHALL display Pokemon knocked out by each player
5. WHEN match data is available, THE Statistics_Dashboard SHALL display prize cards taken by each player
6. WHEN match data is available, THE Statistics_Dashboard SHALL display coin flip results (heads/tails counts) for each player
7. WHEN match data is available, THE Statistics_Dashboard SHALL display the total number of turns in the match
8. WHEN displaying statistics, THE Statistics_Dashboard SHALL present both players side-by-side for easy comparison

### Requirement 5: Pokemon Sprites

**User Story:** As a user, I want to see Pokemon sprites for the Pokemon mentioned in my match, so that the visualization is more engaging.

#### Acceptance Criteria

1. WHEN match data is available, THE PokeAPI_Service SHALL fetch sprite images for all unique Pokemon in the match
2. WHEN fetching sprites, THE PokeAPI_Service SHALL use the Pokemon name to query the PokeAPI endpoint
3. WHEN a Pokemon sprite is successfully fetched, THE Application SHALL display it alongside the Pokemon name in the timeline and statistics
4. IF a Pokemon sprite cannot be fetched (network error or Pokemon not found), THEN THE Application SHALL display a placeholder image and continue functioning
5. WHEN fetching sprites, THE PokeAPI_Service SHALL cache fetched sprites to avoid redundant API calls for the same Pokemon
6. WHEN Pokemon names contain special characters or suffixes (ex, mega, etc.), THE PokeAPI_Service SHALL normalize the name for API lookup

### Requirement 6: User Interface

**User Story:** As a user, I want a clean and responsive interface, so that I can use the application on any device.

#### Acceptance Criteria

1. THE Application SHALL use a modern, clean visual design with consistent styling
2. THE Application SHALL be responsive and usable on desktop, tablet, and mobile screen sizes
3. WHEN the application is processing a log, THE Application SHALL display a loading indicator
4. WHEN an error occurs, THE Application SHALL display user-friendly error messages
5. THE Application SHALL provide clear navigation between the input view and results view
6. WHEN displaying the results, THE Application SHALL allow users to toggle between Timeline and Statistics views

### Requirement 7: Data Accuracy

**User Story:** As a user, I want the parsed data to accurately reflect my game log, so that I can trust the statistics and timeline.

#### Acceptance Criteria

1. THE Log_Parser SHALL correctly count all damage dealt, matching the sum of individual attack damages in the log
2. THE Log_Parser SHALL correctly count all cards drawn, including opening hands, mulligans, and in-game draws
3. THE Log_Parser SHALL correctly identify all knockouts and attribute them to the correct player
4. THE Log_Parser SHALL correctly track prize cards taken, matching knockout counts
5. THE Log_Parser SHALL correctly identify the winner based on the win condition stated in the log
