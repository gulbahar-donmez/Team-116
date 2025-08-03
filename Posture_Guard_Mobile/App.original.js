import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

import CalibrationScreen from './src/screens/CalibrationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UploadScreen from './src/screens/UploadScreen';

// Services
import AuthService from './src/services/AuthService';

// Theme
import { darkTheme, lightTheme } from './src/theme/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Ana Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';

          } else if (route.name === 'Upload') {
            iconName = 'cloud-upload';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
        },
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Ana Sayfa' }}
      />

      <Tab.Screen 
        name="Upload" 
        component={UploadScreen} 
        options={{ title: 'Yükle' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const user = await AuthService.checkAuth();
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    AuthService.logout();
  };

  if (isLoading) {
    return null; // Loading screen eklenebilir
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <NavigationContainer>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {currentUser ? (
              <>
                <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                <Stack.Screen 
                  name="Calibration" 
                  component={CalibrationScreen}
                  options={{ 
                    headerShown: true,
                    title: 'Kalibrasyon',
                    headerStyle: { backgroundColor: '#1a1a1a' },
                    headerTintColor: '#fff'
                  }}
                />
              </>
            ) : (
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen 
                    {...props} 
                    onLogin={handleLogin}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                  />
                )}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
