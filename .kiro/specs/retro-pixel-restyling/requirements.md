# Requirements Document

## Introduction

Restyle the Pokemon TCG Log Visualizer with a retro/pixel-art aesthetic inspired by C64-era computing. The restyling replaces the current modern UI theme with chunky pixel fonts, solid borders, box shadows, sharp corners, and a dual light/dark color scheme rooted in classic 8-bit computer palettes. The visual overhaul spans all existing components (Header, LogInputForm, TimelineView, TurnCard, EventItem, DeckAnalysisView, DeckCardDisplay, DeckCategorySection, PlayerStatsCard, StatisticsView, LoadingSpinner, ErrorBoundary, PokemonSprite) and the global style foundation.

## Glossary

- **Theme_System**: The CSS custom properties and theme toggling mechanism that controls the visual appearance of the application across light and dark modes.
- **Retro_Panel**: A styled container element using solid borders (3px), pixel box-shadows (4px 4px 0px), and zero border-radius to evoke a retro computing window.
- **Pixel_Button**: A button styled with pixel font ("Press Start 2P"), uppercase text, solid 3px borders, 4px box-shadow, and active-state inset/translate effects.
- **CRT_Overlay**: An optional fullscreen pseudo-element that renders horizontal scanline lines over the page content to simulate a CRT monitor effect.
- **Heading_Font**: The "Press Start 2P" Google Font used for headings, labels, and button text.
- **Body_Font**: The "VT323" Google Font used for body text, form inputs, and general content.
- **Status_Indicator**: A small dot element with a pulsing green animation used to convey active/live status.
- **Toast_Notification**: A temporary message overlay styled with pixel font and retro borders to communicate feedback to the user.
- **Modal_Overlay**: A dark backdrop with a centered bordered box used for dialogs and confirmations.
- **Ridge_Border**: A 4px ridge-style CSS border used on the Header and footer elements.

## Requirements

### Requirement 1: Retro Color Scheme via CSS Custom Properties

**User Story:** As a user, I want the application to use a C64-inspired retro color palette, so that the interface feels like a classic 8-bit computer.

#### Acceptance Criteria

1. THE Theme_System SHALL define dark mode CSS custom properties including a deep blue background (#352879), teal panel color (#6abfc6), and purple accent color (#887ecb).
2. THE Theme_System SHALL define light mode CSS custom properties including a light gray background (#e0e0e0), white panel color (#f5f5f5), and gray accent color (#d0d0d0).
3. THE Theme_System SHALL replace all existing color variables in the global stylesheet with the retro palette equivalents.
4. WHEN a component references a theme color variable, THE Theme_System SHALL resolve the variable to the correct retro palette value for the active mode.

### Requirement 2: Pixel Typography

**User Story:** As a user, I want the application to use pixel-style fonts, so that all text reinforces the retro computing aesthetic.

#### Acceptance Criteria

1. THE Theme_System SHALL load the "Press Start 2P" Google Font and assign it as the Heading_Font for all headings, labels, and button text.
2. THE Theme_System SHALL load the "VT323" Google Font and assign it as the Body_Font for body text, form inputs, and general content.
3. THE Theme_System SHALL define font-size custom properties scaled appropriately for pixel fonts (smaller base sizes to account for the larger visual weight of "Press Start 2P").
4. WHEN a heading element (h1 through h6) is rendered, THE Theme_System SHALL apply the Heading_Font.
5. WHEN body text or input content is rendered, THE Theme_System SHALL apply the Body_Font.

### Requirement 3: Retro Panel Styling

**User Story:** As a user, I want content panels to look like retro computer windows, so that the layout feels authentically 8-bit.

#### Acceptance Criteria

1. THE Retro_Panel SHALL use a 3px solid border using the current theme's border color.
2. THE Retro_Panel SHALL use a 4px 4px 0px box-shadow using the current theme's shadow color.
3. THE Retro_Panel SHALL use 0px border-radius on all corners.
4. WHEN a panel contains a label or section title, THE Retro_Panel SHALL render a dashed underline beneath the label text.
5. THE Theme_System SHALL apply Retro_Panel styling to all card and container components: TurnCard, PlayerStatsCard, DeckCardDisplay, DeckCategorySection, ErrorBoundary content box, and the LogInputForm container.

### Requirement 4: Retro Button Styling

**User Story:** As a user, I want buttons to have a chunky pixel-art look with tactile press feedback, so that interactions feel retro.

#### Acceptance Criteria

1. THE Pixel_Button SHALL use the Heading_Font ("Press Start 2P") with uppercase text-transform.
2. THE Pixel_Button SHALL use a 3px solid border and a 4px 4px 0px box-shadow.
3. THE Pixel_Button SHALL use 0px border-radius.
4. WHEN a user hovers over a Pixel_Button, THE Pixel_Button SHALL translate upward by 2px and increase the box-shadow offset to 6px.
5. WHEN a user presses (active state) a Pixel_Button, THE Pixel_Button SHALL translate downward by 2px, reduce the box-shadow to 0px, and apply an inset border effect.
6. THE Theme_System SHALL apply Pixel_Button styling to all interactive button elements across the application including the back button, view toggle buttons, form submit buttons, and error retry buttons.

### Requirement 5: Header and Footer Ridge Borders

**User Story:** As a user, I want the header and footer to have distinctive retro borders, so that they frame the content like a classic computer interface.

#### Acceptance Criteria

1. THE Header component SHALL use a 4px ridge border on its bottom edge instead of the current 1px solid border.
2. WHEN a footer element is present, THE footer SHALL use a 4px ridge border on its top edge.
3. THE Header component SHALL use 0px border-radius.

### Requirement 6: Zero Border-Radius Globally

**User Story:** As a user, I want all UI elements to have sharp pixel corners, so that the entire interface maintains a consistent retro look.

#### Acceptance Criteria

1. THE Theme_System SHALL set all border-radius custom properties to 0px.
2. WHEN any component renders a bordered or rounded element, THE element SHALL display with sharp 0px-radius corners.
3. THE Theme_System SHALL override border-radius on form inputs, textareas, badges, bar fills, and scrollbar thumbs to 0px.

### Requirement 7: Theme Toggle (Light/Dark Mode)

**User Story:** As a user, I want to switch between a dark retro theme and a light retro theme, so that I can choose the mode that suits my preference.

#### Acceptance Criteria

1. THE Theme_System SHALL support toggling between dark mode and light mode via a user-accessible control.
2. WHEN the user activates the theme toggle, THE Theme_System SHALL switch all CSS custom properties to the alternate mode's retro palette values.
3. THE theme toggle control SHALL be styled as a Pixel_Button and placed in the Header component.
4. THE Theme_System SHALL persist the user's theme preference across page reloads using local storage.

### Requirement 8: CRT Scanline Overlay

**User Story:** As a user, I want an optional CRT scanline effect, so that I can enhance the retro monitor feel when desired.

#### Acceptance Criteria

1. THE CRT_Overlay SHALL render semi-transparent horizontal lines across the entire viewport using a repeating CSS gradient or background pattern.
2. THE CRT_Overlay SHALL not intercept pointer events (pointer-events: none).
3. THE CRT_Overlay SHALL be togglable via a user-accessible control.
4. WHEN the CRT_Overlay is disabled, THE application SHALL render without the scanline effect.
5. THE CRT_Overlay toggle control SHALL be accessible from the Header or a settings area.

### Requirement 9: Retro Loading Spinner

**User Story:** As a user, I want the loading indicator to match the retro aesthetic, so that even wait states feel on-theme.

#### Acceptance Criteria

1. THE LoadingSpinner component SHALL replace the circular spinner with a pixel-art styled loading animation (e.g., blinking block cursor, pixel progress bar, or animated pixel dots).
2. THE LoadingSpinner message text SHALL use the Body_Font ("VT323").
3. THE LoadingSpinner overlay background SHALL use the retro dark mode background color with appropriate opacity.

### Requirement 10: Retro Status Indicator

**User Story:** As a user, I want a pulsing retro status dot, so that I can see at a glance when the application is active or processing.

#### Acceptance Criteria

1. THE Status_Indicator SHALL render as a small square (not circle) dot to maintain the pixel aesthetic.
2. THE Status_Indicator SHALL use a pulsing green (#00ff00) animation with a CSS keyframe cycle.
3. WHEN the application is in an idle state, THE Status_Indicator SHALL display a static green dot without pulsing.

### Requirement 11: Retro Toast Notifications

**User Story:** As a user, I want feedback messages to appear as retro-styled toast notifications, so that alerts match the overall theme.

#### Acceptance Criteria

1. THE Toast_Notification SHALL use the Heading_Font ("Press Start 2P") for its message text.
2. THE Toast_Notification SHALL use a 3px solid border and 4px 4px 0px box-shadow consistent with Retro_Panel styling.
3. THE Toast_Notification SHALL use 0px border-radius.
4. THE Toast_Notification SHALL appear at a fixed position (top-right or bottom-right) and auto-dismiss after a configurable duration.

### Requirement 12: Retro Modal Overlay

**User Story:** As a user, I want modal dialogs to look like retro computer dialog boxes, so that overlays are visually consistent with the theme.

#### Acceptance Criteria

1. THE Modal_Overlay SHALL render a dark semi-transparent backdrop over the page content.
2. THE Modal_Overlay dialog box SHALL use a 3px solid border and 4px 4px 0px box-shadow consistent with Retro_Panel styling.
3. THE Modal_Overlay dialog box SHALL use 0px border-radius.
4. THE Modal_Overlay title text SHALL use the Heading_Font.
5. THE Modal_Overlay body text SHALL use the Body_Font.

### Requirement 13: Retro Form Input Styling

**User Story:** As a user, I want form fields to match the retro aesthetic, so that the log input area feels like a classic terminal.

#### Acceptance Criteria

1. THE LogInputForm textarea SHALL use the Body_Font ("VT323") with a monospace fallback.
2. THE LogInputForm textarea SHALL use a 3px solid border, 0px border-radius, and the retro panel background color.
3. WHEN the textarea receives focus, THE LogInputForm SHALL highlight the border with the retro accent color without using a box-shadow glow (use a solid color change only).
4. THE form labels SHALL use the Heading_Font ("Press Start 2P") with a dashed underline.

### Requirement 14: Retro Timeline and Event Styling

**User Story:** As a user, I want the game timeline and event items to use retro styling, so that the log visualization matches the pixel-art theme.

#### Acceptance Criteria

1. THE TurnCard component SHALL use Retro_Panel styling (3px solid border, 4px box-shadow, 0px border-radius) instead of the current rounded card style.
2. THE TurnCard left border accent SHALL remain as a 4px solid colored bar for player differentiation.
3. THE EventItem component SHALL use 0px border-radius and solid background colors instead of semi-transparent backgrounds.
4. THE EventItem type badges SHALL use the Heading_Font at a reduced size with 0px border-radius.
5. THE TimelineView component SHALL use the Body_Font for event detail text.

### Requirement 15: Retro Statistics and Deck Views

**User Story:** As a user, I want the statistics comparison and deck analysis views to use retro styling, so that data presentation is visually consistent.

#### Acceptance Criteria

1. THE StatisticsView comparison bars SHALL use solid retro colors without CSS gradients.
2. THE StatisticsView bar containers SHALL use 0px border-radius and solid borders.
3. THE PlayerStatsCard component SHALL use Retro_Panel styling.
4. THE DeckAnalysisView and DeckCardDisplay components SHALL use Retro_Panel styling.
5. THE DeckCategorySection headers SHALL use the Heading_Font with dashed underlines.

### Requirement 16: Retro PokemonSprite Styling

**User Story:** As a user, I want Pokemon sprite containers to match the pixel-art theme, so that card images feel integrated with the retro design.

#### Acceptance Criteria

1. THE PokemonSprite component SHALL use 0px border-radius and a solid 2px border.
2. THE PokemonSprite loading state SHALL use a blinking pixel animation instead of the current shimmer gradient.
3. THE PokemonSprite placeholder state SHALL use a solid dashed border without border-radius.

### Requirement 17: Responsive Retro Design

**User Story:** As a user, I want the retro styling to work well on all screen sizes, so that the pixel-art aesthetic is maintained on mobile and desktop.

#### Acceptance Criteria

1. WHILE the viewport width is less than 768px, THE Theme_System SHALL scale pixel font sizes down proportionally to remain readable on smaller screens.
2. WHILE the viewport width is less than 480px, THE Theme_System SHALL reduce box-shadow offsets and border widths to maintain visual clarity at small sizes.
3. THE retro styling SHALL preserve all existing responsive layout breakpoints and flex/grid behaviors.

### Requirement 18: Font Loading and Fallback

**User Story:** As a user, I want the retro fonts to load reliably with graceful fallbacks, so that the page is usable even before custom fonts are available.

#### Acceptance Criteria

1. THE application SHALL load "Press Start 2P" and "VT323" fonts via Google Fonts link tags in the HTML head or via CSS @import.
2. IF the "Press Start 2P" font fails to load, THEN THE Theme_System SHALL fall back to "Courier New", monospace.
3. IF the "VT323" font fails to load, THEN THE Theme_System SHALL fall back to "Courier New", monospace.
4. THE application SHALL use font-display: swap to prevent invisible text during font loading.
