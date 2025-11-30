// ResQYou App Design System - Colors
// Emergency Tracking color palette for VAWC SOS system

export const Colors = {
  // Primary Colors - Emergency Red Theme
  primary: {
    red: '#dc2626',       // Main emergency red (primary brand color)
    redDark: '#b91c1c',   // Darker red for hover/active states
    redLight: '#fca5a5',  // Light red for highlights/backgrounds
  },

  // Secondary Colors - Action Orange
  secondary: {
    orange: '#f97316',    // Action orange (buttons, CTAs)
    orangeDark: '#ea580c', // Darker orange for hover states
    orangeLight: '#fed7aa', // Light orange for highlights
  },

  // Alert Colors
  alert: {
    emergency: '#dc2626', // Emergency/Critical alerts
    warning: '#fbbf24',   // Warning/Caution
    success: '#10b981',   // Success states
    info: '#3b82f6',      // Informational
  },

  // Neutral Colors
  neutral: {
    white: '#ffffff',
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
    black: '#000000',
  },

  // Gradients - Emergency theme
  gradients: {
    background: ['#fef2f2', '#fee2e2', '#fecaca'], // Light red gradient
    primary: ['#dc2626', '#b91c1c'],                // Emergency red gradient
    action: ['#f97316', '#ea580c'],                 // Orange action gradient
  },

  // Semantic Colors
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },

  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },

  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
};

export default Colors;
