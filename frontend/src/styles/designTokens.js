/**
 * Design Tokens - Centralized Design System for Nitish Furniture
 * This file contains all design tokens for consistent styling across the website
 */

// ===========================================
// COLOR PALETTE
// ===========================================
export const colors = {
  // Primary Brand Color - Luxury Wood Tone
  primary: {
    DEFAULT: '#A86A2C',
    hover: '#8C5322',
    light: '#C48A4C',
    dark: '#7A5018',
  },
  
  // Text Colors
  text: {
    dark: '#1E1E1E',
    secondary: '#555555',
    light: '#888888',
    muted: '#AAAAAA',
  },
  
  // Background Colors
  background: {
    DEFAULT: '#FFFFFF',
    soft: '#F7F5F2',
    alt: '#F5F3F0',
    dark: '#1A1A1A',
  },
  
  // Accent Colors
  accent: {
    success: '#2E7D32',
    error: '#D32F2F',
    warning: '#F57C00',
    info: '#1976D2',
  },
  
  // Neutral Colors
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Border Colors
  border: {
    light: '#E5E5E5',
    DEFAULT: '#D4D4D4',
    dark: '#A3A3A3',
  },
  
  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    DEFAULT: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.2)',
  },
};

// ===========================================
// TYPOGRAPHY
// ===========================================
export const typography = {
  // Font Families
  fontFamily: {
    heading: ['Playfair Display', 'serif'],
    body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    geometric: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
  },
  
  // Font Sizes (rem values for scalability)
  fontSize: {
    // Desktop / Mobile
    'display': { desktop: '3rem', mobile: '2.125rem', lineHeight: '1.2' },     // 48px / 34px
    'h1':      { desktop: '2.25rem', mobile: '2.125rem', lineHeight: '1.2' },  // 36px / 34px
    'h2':      { desktop: '1.5rem', mobile: '1.625rem', lineHeight: '1.3' },   // 24px / 26px
    'h3':      { desktop: '1.25rem', mobile: '1.25rem', lineHeight: '1.3' },     // 20px / 20px
    'body-lg': { desktop: '1.125rem', mobile: '1.125rem', lineHeight: '1.6' },  // 18px
    'body':    { desktop: '1rem', mobile: '1rem', lineHeight: '1.6' },          // 16px
    'small':   { desktop: '0.875rem', mobile: '0.875rem', lineHeight: '1.5' },  // 14px
    'xs':      { desktop: '0.75rem', mobile: '0.75rem', lineHeight: '1.5' },     // 12px
  },
  
  // Font Weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.025em',
    button: '0.05em',
  },
};

// ===========================================
// SPACING (8px Grid System)
// ===========================================
export const spacing = {
  // Base unit: 8px - using string keys
  '0': '0',
  '1': '0.25rem',   // 4px
  '2': '0.5rem',    // 8px
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '5': '1.25rem',   // 20px
  '6': '1.5rem',    // 24px
  '7': '1.75rem',   // 28px
  '8': '2rem',      // 32px
  '10': '2.5rem',   // 40px
  '12': '3rem',     // 48px
  '14': '3.5rem',   // 56px
  '16': '4rem',     // 64px
  '20': '5rem',     // 80px
  '24': '6rem',     // 96px
  
  // Semantic spacing
  section: {
    desktop: '5rem',     // 80px
    mobile: '3rem',      // 48px
  },
  container: '2rem',       // 32px
  card: '1.5rem',         // 24px
  component: '1rem',      // 16px
};

// ===========================================
// BORDER RADIUS
// ===========================================
export const borderRadius = {
  none: '0',
  sm: '0.25rem',     // 4px
  DEFAULT: '0.5rem',  // 8px
  md: '0.625rem',    // 10px - Buttons
  lg: '0.75rem',     // 12px
  xl: '1rem',        // 16px - Cards
  2xl: '1.25rem',    // 20px
  3xl: '1.5rem',     // 24px
  full: '9999px',
};

// ===========================================
// SHADOWS
// ===========================================
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 4px 10px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  card: '0 4px 20px rgba(0, 0, 0, 0.05)',
  cardHover: '0 8px 30px rgba(0, 0, 0, 0.12)',
  button: '0 4px 14px rgba(168, 106, 44, 0.25)',
  buttonHover: '0 8px 25px rgba(168, 106, 44, 0.35)',
};

// ===========================================
// BREAKPOINTS
// ===========================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ===========================================
// CONTAINER MAX WIDTHS
// ===========================================
export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',     // Standard container
  '2xl': '1536px',
  full: '100%',
};

// ===========================================
// TRANSITIONS
// ===========================================
export const transitions = {
  fast: '150ms ease',
  DEFAULT: '300ms ease',
  slow: '500ms ease',
  spring: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// ===========================================
// Z-INDEX SCALE
// ===========================================
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// ===========================================
// EXPORT AS CSS VARIABLES
// ===========================================
export const cssVariables = `
  /* Color Variables */
  --color-primary: ${colors.primary.DEFAULT};
  --color-primary-hover: ${colors.primary.hover};
  --color-primary-light: ${colors.primary.light};
  --color-primary-dark: ${colors.primary.dark};
  
  --color-text-dark: ${colors.text.dark};
  --color-text-secondary: ${colors.text.secondary};
  --color-text-light: ${colors.text.light};
  --color-text-muted: ${colors.text.muted};
  
  --color-bg: ${colors.background.DEFAULT};
  --color-bg-soft: ${colors.background.soft};
  --color-bg-alt: ${colors.background.alt};
  --color-bg-dark: ${colors.background.dark};
  
  --color-accent-success: ${colors.accent.success};
  --color-accent-error: ${colors.accent.error};
  --color-accent-warning: ${colors.accent.warning};
  --color-accent-info: ${colors.accent.info};
  
  /* Spacing Variables */
  --spacing-xs: ${spacing[1]};
  --spacing-sm: ${spacing[2]};
  --spacing-md: ${spacing[4]};
  --spacing-lg: ${spacing[6]};
  --spacing-xl: ${spacing[8]};
  --spacing-2xl: ${spacing[12]};
  --spacing-3xl: ${spacing[16]};
  --spacing-section-desktop: ${spacing.section.desktop};
  --spacing-section-mobile: ${spacing.section.mobile};
  
  /* Border Radius Variables */
  --radius-sm: ${borderRadius.sm};
  --radius: ${borderRadius.DEFAULT};
  --radius-md: ${borderRadius.md};
  --radius-lg: ${borderRadius.lg};
  --radius-xl: ${borderRadius.xl};
  --radius-full: ${borderRadius.full};
  
  /* Shadow Variables */
  --shadow-sm: ${shadows.sm};
  --shadow: ${shadows.DEFAULT};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-xl: ${shadows.xl};
  --shadow-card: ${shadows.card};
  --shadow-card-hover: ${shadows.cardHover};
  --shadow-button: ${shadows.button};
  --shadow-button-hover: ${shadows.buttonHover};
  
  /* Typography Variables */
  --font-heading: ${typography.fontFamily.heading.join(', ')};
  --font-body: ${typography.fontFamily.body.join(', ')};
  
  /* Transition Variables */
  --transition-fast: ${transitions.fast};
  --transition: ${transitions.DEFAULT};
  --transition-slow: ${transitions.slow};
  
  /* Container Variable */
  --container-xl: ${containers.xl};
`;

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  containers,
  transitions,
  zIndex,
  cssVariables,
};
