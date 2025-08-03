import { useContext } from 'react';
import { createContext } from 'react';

// Tema Context'i
export const ThemeContext = createContext();

// Tema Hook'u
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 