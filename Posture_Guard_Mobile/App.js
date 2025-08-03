import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { View, Text } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CalibrationScreen from './src/screens/CalibrationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import UploadScreen from './src/screens/UploadScreen';

// Services
import AuthService from './src/services/AuthService';

// Theme
import { darkTheme, lightTheme } from './src/theme/theme';
import { ThemeContext, useTheme } from './src/hooks/useTheme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Ana Tab Navigator
function MainTabNavigator() {
  const { isDarkMode } = useTheme();
  
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
        tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          borderTopColor: isDarkMode ? '#333' : '#e5e5e5',
        },
        headerStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: isDarkMode ? '#fff' : '#000',
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
    
    // AuthService'e logout callback'i ekle
    AuthService.onLogout = () => {
      console.log('🔓 Logout callback triggered');
      setCurrentUser(null);
    };
  }, []);

  const checkAuthentication = async () => {
    console.log('🔍 Starting authentication check...');
    try {
      const user = await AuthService.checkAuth();
      console.log('🔍 Auth check result:', user ? 'User found' : 'No user');
      setCurrentUser(user);
    } catch (error) {
      console.error('Authentication check failed:', error);
      setCurrentUser(null);
    } finally {
      console.log('🔍 Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleLogin = (user) => {
    console.log('🔐 Login successful, setting user:', user);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      // AuthService.logout() zaten onLogout callback'ini tetikliyor
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleTheme = () => {
    console.log('🌙 Toggle theme from:', isDarkMode ? 'dark' : 'light', 'to:', !isDarkMode ? 'dark' : 'light');
    setIsDarkMode(!isDarkMode);
  };

  // currentUser değişikliklerini dinle
  useEffect(() => {
    console.log('🔍 Current user changed:', currentUser ? 'Logged in' : 'Logged out');
  }, [currentUser]);



  console.log('🔍 App render - isLoading:', isLoading, 'currentUser:', currentUser ? 'exists' : 'null');
  
  if (isLoading) {
    console.log('⏳ Showing loading screen...');
    return (
      <SafeAreaProvider>
        <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
          <View style={{ flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>Yükleniyor...</Text>
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <SafeAreaProvider>
        <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
          <NavigationContainer>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {currentUser ? (
                <>
                  <Stack.Screen 
                    name="MainTabs" 
                    component={MainTabNavigator}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="Calibration" 
                    component={CalibrationScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Kalibrasyon',
                      headerStyle: { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' },
                      headerTintColor: isDarkMode ? '#fff' : '#000'
                    }}
                  />
                  <Stack.Screen 
                    name="EditProfile" 
                    component={EditProfileScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Profili Düzenle',
                      headerStyle: { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' },
                      headerTintColor: isDarkMode ? '#fff' : '#000'
                    }}
                  />
                  <Stack.Screen 
                    name="ChangePassword" 
                    component={ChangePasswordScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Şifre Değiştir',
                      headerStyle: { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' },
                      headerTintColor: isDarkMode ? '#fff' : '#000'
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
    </ThemeContext.Provider>
  );
}
