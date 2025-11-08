// ResQYou Design System
// Following 60:30:10 color rule and consistent typography

/**
 * COLOR THEORY FOR VAWC SOS TRACKING
 *
 * Primary (60%) - Teal: Trust, safety, calmness, healing
 * Secondary (30%) - Light neutrals: Clean, accessible, professional
 * Accent (10%) - Strategic colors: Emergency (red), warnings (yellow), success (green)
 */

export const DesignSystem = {
  // ============================================
  // COLORS - 60:30:10 RULE
  // ============================================
  colors: {
    // PRIMARY (60%) - Dominant color for main UI elements
    primary: {
      main: '#14b8a6',        // Teal - Trust & Safety
      dark: '#0d9488',        // Darker teal for hover/active states
      light: '#5eead4',       // Light teal for highlights
      background: '#f0fdfa',  // Very light teal for backgrounds
    },

    // SECONDARY (30%) - Supporting colors for surfaces and text
    secondary: {
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray300: '#d1d5db',
      gray400: '#9ca3af',
      gray500: '#6b7280',
      gray600: '#4b5563',
      gray700: '#374151',
      gray800: '#1f2937',
      gray900: '#111827',
    },

    // ACCENT (10%) - Strategic use for important actions
    accent: {
      emergency: '#ef4444',   // Red - Emergency/Danger (SOS button)
      warning: '#fbbf24',     // Yellow - Warnings/Caution
      success: '#10b981',     // Green - Success states
      info: '#3b82f6',        // Blue - Informational
    },

    // SEMANTIC COLORS - Consistent meaning across app
    semantic: {
      error: '#ef4444',
      success: '#10b981',
      warning: '#fbbf24',
      info: '#14b8a6',
    },

    // TEXT COLORS - High contrast for accessibility
    text: {
      primary: '#1f2937',     // Main text - WCAG AAA compliant
      secondary: '#6b7280',   // Secondary text - WCAG AA compliant
      tertiary: '#9ca3af',    // Tertiary text - Less emphasis
      inverse: '#ffffff',     // Text on dark backgrounds
      disabled: '#d1d5db',    // Disabled state
    },

    // BACKGROUND COLORS
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      teal: '#f0fdfa',        // Teal-tinted background
      dark: '#0f172a',        // Dark mode primary
      darkSecondary: '#1e293b', // Dark mode secondary
    },

    // BORDER COLORS
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
      dark: '#9ca3af',
      focus: '#14b8a6',       // Focus state for inputs
    },

    // OVERLAY COLORS
    overlay: {
      light: 'rgba(0, 0, 0, 0.1)',
      medium: 'rgba(0, 0, 0, 0.3)',
      dark: 'rgba(0, 0, 0, 0.6)',
    },
  },

  // ============================================
  // TYPOGRAPHY - Consistent Hierarchy
  // ============================================
  typography: {
    // FONT FAMILIES - Using system fonts for performance
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },

    // FONT SIZES - Clear hierarchy
    fontSize: {
      xs: 11,    // Small labels, captions
      sm: 13,    // Secondary text, descriptions
      base: 15,  // Body text, inputs
      lg: 17,    // Emphasized text, button text
      xl: 20,    // Section titles, headers
      '2xl': 24, // Page titles
      '3xl': 28, // Large headings
      '4xl': 32, // Hero text
    },

    // FONT WEIGHTS - Semantic naming
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    // LINE HEIGHTS - Consistent readability
    lineHeight: {
      tight: 1.2,   // Headings
      normal: 1.5,  // Body text
      relaxed: 1.75, // Longer paragraphs
    },

    // LETTER SPACING
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },

  // ============================================
  // SPACING - 8px grid system
  // ============================================
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
  },

  // ============================================
  // BORDER RADIUS - Consistent roundness
  // ============================================
  borderRadius: {
    none: 0,
    sm: 8,
    base: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },

  // ============================================
  // SHADOWS - Depth system
  // ============================================
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 4,
    },
  },

  // ============================================
  // ICON SIZES - Consistent sizing
  // ============================================
  iconSize: {
    xs: 16,
    sm: 20,
    base: 24,
    md: 28,
    lg: 32,
    xl: 40,
    '2xl': 48,
  },

  // ============================================
  // BUTTON STYLES - Consistent interactive elements
  // ============================================
  buttons: {
    // PRIMARY BUTTON - Main actions (SOS, Submit)
    primary: {
      backgroundColor: '#14b8a6',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      fontSize: 17,
      fontWeight: '700',
      color: '#ffffff',
    },

    // SECONDARY BUTTON - Alternative actions
    secondary: {
      backgroundColor: '#f0fdfa',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: '#14b8a6',
      fontSize: 17,
      fontWeight: '700',
      color: '#14b8a6',
    },

    // DANGER BUTTON - Destructive actions (SOS, Delete)
    danger: {
      backgroundColor: '#ef4444',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      fontSize: 17,
      fontWeight: '700',
      color: '#ffffff',
    },

    // GHOST BUTTON - Minimal emphasis
    ghost: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      fontSize: 15,
      fontWeight: '600',
      color: '#14b8a6',
    },

    // ICON BUTTON - Icon-only buttons
    icon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
  },

  // ============================================
  // INPUT STYLES - Consistent form elements
  // ============================================
  inputs: {
    default: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: '#e5e7eb',
      backgroundColor: '#ffffff',
      fontSize: 16,
      color: '#1f2937',
    },
    focused: {
      borderColor: '#14b8a6',
      backgroundColor: '#f0fdfa',
    },
    error: {
      borderColor: '#ef4444',
      backgroundColor: '#fef2f2',
    },
  },

  // ============================================
  // CARD STYLES - Consistent containers
  // ============================================
  cards: {
    default: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    elevated: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 3,
    },
  },

  // ============================================
  // ANIMATION DURATIONS
  // ============================================
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
};

export default DesignSystem;
