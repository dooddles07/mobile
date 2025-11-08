import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

// Define the color scheme type
export type ColorScheme = {
  background: string;
  backgroundSecondary: string;
  card: string;
  cardHighlight: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  danger: string;
  success: string;
  warning: string;
  border: string;
  borderLight: string;
  input: string;
  inputBorder: string;
  placeholder: string;
  shadow: string;
};

// Theme context type
export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ColorScheme;
}

// Light theme colors
const lightColors: ColorScheme = {
  background: '#f0f9ff',
  backgroundSecondary: '#e0f2fe',
  card: 'rgba(255, 255, 255, 0.95)',
  cardHighlight: 'rgba(20, 184, 166, 0.05)',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  primary: '#14b8a6',
  primaryDark: '#0d9488',
  primaryLight: '#5eead4',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f97316',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  input: 'rgba(255, 255, 255, 0.95)',
  inputBorder: 'rgba(255, 255, 255, 0.95)',
  placeholder: '#9ca3af',
  shadow: '#14b8a6',
};

// Dark theme colors
const darkColors: ColorScheme = {
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  card: 'rgba(30, 41, 59, 0.95)',
  cardHighlight: 'rgba(20, 184, 166, 0.15)',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  primary: '#14b8a6',
  primaryDark: '#0d9488',
  primaryLight: '#5eead4',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f97316',
  border: '#334155',
  borderLight: '#475569',
  input: 'rgba(30, 41, 59, 0.95)',
  inputBorder: '#334155',
  placeholder: '#64748b',
  shadow: '#000',
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async (): Promise<void> => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const toggleTheme = async (): Promise<void> => {
    try {
      const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const colors: ColorScheme = theme === 'light' ? lightColors : darkColors;

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
