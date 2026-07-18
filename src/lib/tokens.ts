/**
 * Kreathief Design Tokens
 * Single source of truth for all visual values.
 * Every hardcoded value in the codebase should reference these tokens.
 */

// ── Surface Scale ──────────────────────────────────────────────
// 10 levels from pure black to white. Usage is hierarchical:
// workspace → panel → card → hover → active

export const surface = {
  0: '#000000', // App background
  1: '#080808', // Primary workspace
  2: '#0D0D0D', // Panels
  3: '#111111', // Cards
  4: '#171717', // Elevated cards
  5: '#1E1E1E', // Hover
  6: '#242424', // Active
  7: '#2C2C2C', // Strong active
  8: '#363636', // High contrast
  9: '#FFFFFF', // Inverted
} as const;

// ── Content Tokens ─────────────────────────────────────────────
// Text hierarchy. Never use opacity for text — always explicit tokens.

export const content = {
  primary: '#FFFFFF',
  secondary: '#A3A3A3',
  tertiary: '#737373',
  muted: '#525252',
  disabled: '#3A3A3A',
  inverse: '#000000',
} as const;

// ── Border Tokens ──────────────────────────────────────────────
// Borders should be almost invisible. "Softly contained, not boxed in."

export const border = {
  subtle: '#161616',
  default: '#242424',
  strong: '#3A3A3A',
  focus: '#FFFFFF',
} as const;

// ── Semantic Feedback ──────────────────────────────────────────
// Color carries meaning, never decoration.
// Used only for: validation, system state, warnings, errors, notifications.

export const semantic = {
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// ── Spacing Scale ──────────────────────────────────────────────
// 4px base unit. Every value must be a multiple of 4.

export const space = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
} as const;

// ── Radius Scale ───────────────────────────────────────────────

export const radius = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

// ── Elevation System ───────────────────────────────────────────
// Exactly 3 shadow levels. No more.

export const shadows = {
  subtle: '0 1px 2px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(255,255,255,0.06)',
  raised: '0 4px 16px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)',
  floating: '0 16px 48px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.10)',
} as const;

// ── Motion Tokens ──────────────────────────────────────────────

export const motion = {
  instant: '100ms',
  fast: '150ms',
  standard: '200ms',
  slow: '300ms',
  expressive: '500ms',
} as const;

export const easing = {
  standard: 'cubic-bezier(.2,.8,.2,1)',
  out: 'cubic-bezier(.16,1,.3,1)',
  in: 'cubic-bezier(.7,0,.84,0)',
  linear: 'linear',
} as const;

// ── Canvas-Specific Tokens ─────────────────────────────────────
// These tokens are used by the canvas renderer and UI chrome.
// They are NOT used in regular UI components.

export const canvas = {
  // Background
  background: {
    dark: surface[2],    // #0D0D0D
    light: surface[9],   // #FFFFFF
  },

  // Grid
  grid: {
    line: border.subtle,  // #161616
    lineMinor: border.subtle,
    lineMajor: border.default,
  },

  // Rulers
  ruler: {
    background: surface[1],  // #080808
    text: content.tertiary,  // #737373
    tick: border.default,    // #242424
  },

  // Selection
  selection: {
    outline: content.primary,    // #FFFFFF — selection border
    handle: content.primary,     // #FFFFFF — resize handles
    handleFill: surface[9],      // #FFFFFF — handle fill
    handleStroke: border.focus,  // #FFFFFF — handle border
  },

  // Guides (alignment snapping)
  guides: {
    horizontal: content.primary,  // #FFFFFF — horizontal guides
    vertical: content.primary,    // #FFFFFF — vertical guides
    flash: content.primary,       // #FFFFFF — snap flash
  },

  // Pen tool
  pen: {
    stroke: content.primary,      // #FFFFFF — path stroke
    point: content.primary,       // #FFFFFF — anchor points
    pointFirst: surface[3],       // #111111 — first point (distinct)
    handle: content.tertiary,     // #737373 — bezier handles
    handleLine: content.muted,    // #525252 — handle lines
    closeIndicator: content.primary, // #FFFFFF — close path indicator
  },

  // Labels
  label: {
    text: content.muted,          // #525252 — dimension labels
    background: surface[3],       // #111111 — label background
  },

  // Marquee selection
  marquee: {
    fill: content.muted,          // #525252 — selection rectangle fill
    stroke: content.primary,      // #FFFFFF — selection rectangle border
  },

  // Distance measurement
  distance: {
    line: content.muted,          // #525252 — measurement line
    label: content.primary,       // #FFFFFF — measurement text
    background: surface[3],       // #111111 — label background
  },

  // Shape creation preview
  preview: {
    fill: content.muted,          // #525252 — creation preview fill
    stroke: content.primary,      // #FFFFFF — creation preview border
    label: content.tertiary,      // #737373 — size label
  },

  // Image placeholder
  image: {
    background: surface[3],       // #111111 — placeholder background
    text: content.muted,          // #525252 — placeholder text
  },

  // Frame
  frame: {
    background: surface[9],       // #FFFFFF — frame background
    label: content.muted,         // #525252 — frame name
  },

  // Export background
  export: {
    background: surface[9],       // #FFFFFF — export background
  },
} as const;

// ── Typography Scale ───────────────────────────────────────────
// Minimum readable text: 11px. Operating range: 12-14px.

export const typography = {
  display: { size: '48px', lineHeight: '56px', weight: 600 },
  h1: { size: '32px', lineHeight: '40px', weight: 600 },
  h2: { size: '24px', lineHeight: '32px', weight: 600 },
  h3: { size: '20px', lineHeight: '28px', weight: 600 },
  h4: { size: '16px', lineHeight: '24px', weight: 600 },
  bodyLg: { size: '16px', lineHeight: '24px', weight: 400 },
  body: { size: '14px', lineHeight: '20px', weight: 400 },
  bodySm: { size: '13px', lineHeight: '20px', weight: 400 },
  label: { size: '12px', lineHeight: '16px', weight: 500 },
  micro: { size: '11px', lineHeight: '16px', weight: 500 },
} as const;

// ── Z-Index Architecture ───────────────────────────────────────
// Global layering model. Never use z-[999999].

export const zIndex = {
  canvas: 0,
  workspace: 10,
  floatingToolbar: 20,
  dropdown: 30,
  popover: 40,
  commandPalette: 50,
  dialog: 60,
  notification: 70,
  aiOverlay: 80,
  emergency: 90,
} as const;

// ── Combined Token Export ──────────────────────────────────────

export const tokens = {
  surface,
  content,
  border,
  semantic,
  space,
  radius,
  shadows,
  motion,
  easing,
  canvas,
  typography,
  zIndex,
} as const;

export default tokens;
