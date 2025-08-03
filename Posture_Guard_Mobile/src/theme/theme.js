import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4F46E5',
    primaryContainer: '#3730A3',
    secondary: '#10B981',
    secondaryContainer: '#059669',
    surface: '#1a1a1a',
    surfaceVariant: '#2d2d2d',
    background: '#0f0f0f',
    error: '#EF4444',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#ffffff',
    onBackground: '#ffffff',
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4F46E5',
    primaryContainer: '#E0E7FF',
    secondary: '#10B981',
    secondaryContainer: '#D1FAE5',
    surface: '#ffffff',
    surfaceVariant: '#f3f4f6',
    background: '#f9fafb',
    error: '#EF4444',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#000000',
    onBackground: '#000000',
  },
};

export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#e5e5e5',
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    marginTop: 4,
  },
};

// Dinamik tema stilleri
export const getCommonStyles = (isDarkMode) => ({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0f0f0f' : '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.25 : 0.1,
    shadowRadius: 3.84,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDarkMode ? '#ffffff' : '#000000',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#ffffff' : '#000000',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: isDarkMode ? '#e5e5e5' : '#374151',
    lineHeight: 24,
  },
  input: {
    backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
    borderRadius: 8,
    padding: 12,
    color: isDarkMode ? '#ffffff' : '#000000',
    fontSize: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#404040' : '#d1d5db',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    marginTop: 4,
  },
});
