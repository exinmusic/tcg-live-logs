# Implementation Plan: Retro Pixel Restyling

## Overview

Transform the Pokemon TCG Log Visualizer into a C64-inspired retro/pixel-art aesthetic by layering changes from the CSS foundation up through components, then adding new utility components. All changes are purely visual — no business logic or data flow is modified.

## Tasks

- [ ] 1. Foundation layer — fonts and CSS custom properties
  - [x] 1.1 Add Google Fonts link tags to index.html
    - Add `<link>` preconnect and stylesheet tags for "Press Start 2P" and "VT323" in `<head>`
    - _Requirements: 18.1, 18.4_

  - [ ]* 1.2 Write unit test: font link tags present in document head
    - Verify both font `<link>` tags exist in `index.html`
    - Verify `font-display: swap` is configured
    - _Requirements: 18.1, 18.4_

  - [x] 1.3 Rewrite src/styles/global.css with retro CSS custom properties
    - Replace all existing color variables with dark mode retro palette (`:root`)
    - Add `.light-theme` overrides for light mode palette
    - Set all `--radius-*` variables to `0px`
    - Add shared variables: `--font-heading`, `--font-body`, font-size scale, `--retro-border`, `--retro-shadow`
    - Add `.retro-panel` utility class (3px solid border, 4px 4px 0px box-shadow, 0px border-radius)
    - Add `.pixel-btn` utility class (heading font, uppercase, 3px border, 4px shadow, hover/active transforms)
    - Add CRT overlay rule: `.crt-enabled #root::after` with scanline gradient, `pointer-events: none`
    - Add responsive breakpoints scaling pixel font sizes below 768px and reducing shadows below 480px
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 8.1, 8.2, 17.1, 17.2, 18.2, 18.3_

  - [ ]* 1.4 Write property test for theme variable resolution (Property 1)
    - **Property 1: Theme variable resolution**
    - **Validates: Requirements 1.4, 7.1, 7.2**

  - [ ]* 1.5 Write property test for font fallback stacks (Property 5)
    - **Property 5: Font fallback stacks**
    - **Validates: Requirements 18.2, 18.3**

  - [x] 1.6 Update src/index.css base styles
    - Update button and link base styles to use retro variables
    - Override any remaining border-radius on inputs, textareas, scrollbar thumbs to 0px
    - _Requirements: 6.2, 6.3_

- [ ] 2. Theme state — AppContext extension
  - [x] 2.1 Extend AppContext.tsx with theme and CRT state
    - Add `theme: 'dark' | 'light'` and `crtEnabled: boolean` to `AppState`
    - Add `TOGGLE_THEME`, `SET_THEME`, `TOGGLE_CRT`, `SET_CRT` action types to the reducer
    - On `TOGGLE_THEME`: flip theme, add/remove `.light-theme` class on `document.documentElement`, persist to `localStorage` key `'retro-theme'`
    - On `TOGGLE_CRT`: flip `crtEnabled`, add/remove `.crt-enabled` class on `document.documentElement`, persist to `localStorage` key `'retro-crt'`
    - Read initial values from `localStorage` on mount (default: `'dark'`, `false`); wrap in `try/catch` for private browsing safety
    - _Requirements: 7.1, 7.2, 7.4, 8.3, 8.4_

  - [ ]* 2.2 Write property test for theme persistence round-trip (Property 2)
    - **Property 2: Theme persistence round-trip**
    - **Validates: Requirements 7.4**

  - [ ]* 2.3 Write unit test: dark and light mode specific color values
    - Verify dark mode resolves `--bg-primary` to `#352879`
    - Verify light mode resolves `--bg-primary` to `#e0e0e0`
    - _Requirements: 1.1, 1.2_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Header component — toggle buttons and retro styling
  - [x] 4.1 Update Header.tsx with theme and CRT toggle buttons
    - Add `theme`, `crtEnabled`, `onToggleTheme`, `onToggleCrt` to `HeaderProps`
    - Render a `☀/🌙` theme toggle `Pixel_Button` and a `CRT` toggle `Pixel_Button` in the header-content area
    - Wire buttons to dispatch `TOGGLE_THEME` and `TOGGLE_CRT` from `AppContext`
    - _Requirements: 7.1, 7.3, 8.3, 8.5_

  - [x] 4.2 Update Header.css with ridge border and retro button styling
    - Replace current bottom border with `4px ridge` border
    - Set `border-radius: 0px`
    - Style toggle buttons using `.pixel-btn` pattern
    - _Requirements: 5.1, 5.3_

  - [ ]* 4.3 Write unit test: Header ridge border presence
    - Verify the header element has a ridge border style
    - _Requirements: 5.1_

- [ ] 5. App-level wiring and CRT overlay
  - [x] 5.1 Update App.tsx to wire theme context and CRT class
    - Pass `theme`, `crtEnabled`, `onToggleTheme`, `onToggleCrt` from context down to `Header`
    - Ensure `#root` element is present for the CRT `::after` pseudo-element to attach to
    - _Requirements: 8.3, 8.4_

  - [x] 5.2 Update App.css for retro view toggle and error banner
    - Apply `.pixel-btn` styling to view toggle buttons
    - Apply `.retro-panel` styling to error banner
    - _Requirements: 4.6, 3.5_

  - [ ]* 5.3 Write property test for CRT overlay toggle (Property 12)
    - **Property 12: CRT overlay toggle**
    - **Validates: Requirements 8.3, 8.4**

- [ ] 6. Component CSS — retro panel and typography pass
  - [x] 6.1 Update TurnCard.css
    - Apply retro panel: 3px solid border, 4px 4px 0px box-shadow, 0px border-radius
    - Preserve 4px solid left border accent for player differentiation
    - _Requirements: 3.1, 3.2, 3.3, 14.1, 14.2_

  - [ ]* 6.2 Write property test for Retro Panel styling consistency (Property 6)
    - **Property 6: Retro Panel styling consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

  - [x] 6.3 Update EventItem.css
    - Set `border-radius: 0px` and solid (non-transparent) background colors
    - Apply heading font to type badges with 0px border-radius
    - _Requirements: 14.3, 14.4_

  - [ ]* 6.4 Write property test for EventItem solid backgrounds (Property 17)
    - **Property 17: EventItem solid backgrounds**
    - **Validates: Requirements 14.3**

  - [x] 6.5 Update TimelineView.css
    - Apply body font (`VT323`) to event detail text
    - Apply retro borders to containers
    - _Requirements: 14.5_

  - [x] 6.6 Update StatisticsView.css
    - Replace gradient bar fills with solid retro colors
    - Set `border-radius: 0px` on bar containers and fills
    - _Requirements: 15.1, 15.2_

  - [ ]* 6.7 Write property test for Statistics bars solid colors (Property 18)
    - **Property 18: Statistics bars use solid colors**
    - **Validates: Requirements 15.1**

  - [x] 6.8 Update PlayerStatsCard.css
    - Apply `.retro-panel` styling (3px border, 4px shadow, 0px radius)
    - _Requirements: 15.3_

  - [x] 6.9 Update DeckAnalysisView.css and DeckCardDisplay.css
    - Apply `.retro-panel` styling to both
    - _Requirements: 15.4_

  - [x] 6.10 Update DeckCategorySection.tsx (if CSS-in-markup needed) and its CSS
    - Apply heading font with dashed underline to section headers
    - _Requirements: 15.5, 3.4_

  - [ ]* 6.11 Write property test for Panel label dashed underline (Property 7)
    - **Property 7: Panel label dashed underline**
    - **Validates: Requirements 3.4**

  - [x] 6.12 Update LogInputForm.css
    - Apply body font to textarea, 3px solid border, 0px border-radius, retro panel background
    - On focus: change border-color to accent color, no box-shadow glow
    - Apply heading font with dashed underline to form labels
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ]* 6.13 Write property test for Textarea focus border styling (Property 16)
    - **Property 16: Textarea focus border styling**
    - **Validates: Requirements 13.3**

  - [x] 6.14 Update ErrorBoundary.css
    - Apply `.retro-panel` styling to the content box
    - _Requirements: 3.5_

  - [x] 6.15 Update PokemonSprite.css
    - Set `border-radius: 0px`, solid 2px border
    - Replace shimmer gradient loading state with pixel blink animation (`@keyframes blink-cursor`)
    - Apply solid dashed border to placeholder state
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ]* 6.16 Write unit test: PokemonSprite pixel blink loading animation
    - Verify loading state uses blink animation class, not shimmer gradient
    - _Requirements: 16.2_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Typography property tests
  - [ ]* 8.1 Write property test for Heading font application (Property 3)
    - **Property 3: Heading font application**
    - **Validates: Requirements 2.4, 4.1**

  - [ ]* 8.2 Write property test for Body font application (Property 4)
    - **Property 4: Body font application**
    - **Validates: Requirements 2.5**

  - [ ]* 8.3 Write property test for Global zero border-radius (Property 11)
    - **Property 11: Global zero border-radius**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 8.4 Write property test for Pixel Button base styling (Property 8)
    - **Property 8: Pixel Button base styling**
    - **Validates: Requirements 4.2, 4.3, 4.6**

  - [ ]* 8.5 Write property test for Button hover effect (Property 9)
    - **Property 9: Button hover effect**
    - **Validates: Requirements 4.4**

  - [ ]* 8.6 Write property test for Button active effect (Property 10)
    - **Property 10: Button active effect**
    - **Validates: Requirements 4.5**

  - [ ]* 8.7 Write property test for Responsive font scaling (Property 19)
    - **Property 19: Responsive font scaling below 768px**
    - **Validates: Requirements 17.1**

  - [ ]* 8.8 Write property test for Responsive shadow/border reduction (Property 20)
    - **Property 20: Responsive shadow/border reduction below 480px**
    - **Validates: Requirements 17.2**

- [ ] 9. LoadingSpinner redesign
  - [x] 9.1 Rewrite LoadingSpinner.css with pixel block animation
    - Replace circular spinner keyframes with `@keyframes blink-cursor` (0%/100% opacity 1, 50% opacity 0)
    - Add `.pixel-loader` flex container and `.pixel-loader__block` (12×12px squares, staggered animation-delay)
    - Use `var(--color-primary)` for block color
    - Apply body font to loading message text
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 9.2 Update LoadingSpinner.tsx markup
    - Replace circular spinner JSX with three `.pixel-loader__block` divs inside a `.pixel-loader` container
    - _Requirements: 9.1_

  - [ ]* 9.3 Write unit test: LoadingSpinner renders pixel blocks not circular spinner
    - Verify `.pixel-loader` and `.pixel-loader__block` elements are rendered
    - Verify no circular spinner class is present
    - _Requirements: 9.1_

- [ ] 10. New utility components
  - [x] 10.1 Create StatusIndicator.tsx and StatusIndicator.css
    - `StatusIndicatorProps`: `active?: boolean`, `size?: 'small' | 'medium'`
    - Render a square `<div>` (equal width/height, `border-radius: 0px`)
    - Green (`#00ff00`) color; CSS keyframe pulse animation when `active=true`, static when `active=false`
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 10.2 Write property test for Status indicator square shape (Property 13)
    - **Property 13: Status indicator square shape**
    - **Validates: Requirements 10.1**

  - [ ]* 10.3 Write property test for Status indicator idle state (Property 14)
    - **Property 14: Status indicator idle state**
    - **Validates: Requirements 10.3**

  - [ ]* 10.4 Write unit test: StatusIndicator renders with green color
    - Verify the rendered element uses `#00ff00` color
    - _Requirements: 10.2_

  - [x] 10.5 Create ToastNotification.tsx and ToastNotification.css
    - `ToastNotificationProps`: `message: string`, `type?: 'info' | 'success' | 'error'`, `duration?: number`, `onDismiss: () => void`
    - Fixed position (bottom-right), retro panel styling (3px border, 4px shadow, 0px radius)
    - Heading font for message text; auto-dismiss via `setTimeout` after `duration` ms (skip if `duration <= 0`)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 10.6 Write property test for Toast auto-dismiss timing (Property 15)
    - **Property 15: Toast auto-dismiss timing**
    - **Validates: Requirements 11.4**

  - [x] 10.7 Create ModalOverlay.tsx and ModalOverlay.css
    - `ModalOverlayProps`: `isOpen: boolean`, `title: string`, `children: React.ReactNode`, `onClose: () => void`
    - Dark semi-transparent backdrop; centered retro-panel dialog (3px border, 4px shadow, 0px radius)
    - Title uses heading font, body uses body font
    - Close on Escape key or backdrop click; trap focus within modal; lock body scroll when open
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 10.8 Write unit test: Modal overlay backdrop rendering
    - Verify backdrop and dialog elements render when `isOpen=true`
    - Verify modal is not rendered when `isOpen=false`
    - _Requirements: 12.1_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check; unit tests use Vitest + React Testing Library
- Test files: `src/components/__tests__/retro-styling.property.test.tsx` and `src/components/__tests__/retro-styling.unit.test.tsx`
- Each property test must include a comment: `// Feature: retro-pixel-restyling, Property N: [Title]`
