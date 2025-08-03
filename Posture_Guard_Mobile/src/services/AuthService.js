import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Google from 'expo-auth-session/providers/google';
import axios from 'axios';
import Config from '../config';

const API_BASE_URL = Config.API_BASE_URL;

class AuthService {
  constructor() {
    this.user = null;
    this.onLogout = null; // Logout callback
    this.setupAxiosInterceptors();
  }

  // Google Auth configuration - this should be used in a React component
  static getGoogleConfig() {
    return {
      expoClientId: Config.GOOGLE.EXPO_CLIENT_ID,
      androidClientId: Config.GOOGLE.ANDROID_CLIENT_ID,
      iosClientId: Config.GOOGLE.IOS_CLIENT_ID,
      webClientId: Config.GOOGLE.CLIENT_ID,
      scopes: ['profile', 'email'],
    };
  }

  setupAxiosInterceptors() {
    console.log('🔧 Setting up axios interceptors...');
    console.log('🔧 API_BASE_URL:', Config.API_BASE_URL);
    console.log('🔧 API_TIMEOUT:', Config.API_TIMEOUT);
    
    const instance = axios.create({
      baseURL: Config.API_BASE_URL,
      timeout: Config.API_TIMEOUT
    });

    // Request interceptor - Add token to all requests
    instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync('userToken');
          console.log('🔧 Request interceptor - URL:', config.url);
          console.log('🔧 Request interceptor - Method:', config.method);
          console.log('🔧 Request interceptor - Token:', token ? 'Present' : 'Not found');
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('❌ Error getting token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle 401 errors
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.logout();
        }
        return Promise.reject(error);
      }
    );

    this.api = instance;
  }

  // Token'ı güvenli şekilde sakla
  async setToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Token must be a string');
      }
      await SecureStore.setItemAsync('userToken', token);
    } catch (error) {
      console.error('Token saklama hatası:', error);
      throw error;
    }
  }

  // Token'ı güvenli şekilde al
  async getToken() {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      return token;
    } catch (error) {
      console.error('Token alma hatası:', error);
      return null;
    }
  }

  // Kullanıcı ayarlarını kaydet
  async saveUserSettings(settings) {
    try {
      console.log('💾 Saving user settings locally...');
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      console.log('✅ Settings saved locally');
      
      // Backend'de settings endpoint'i yok, sadece local'de saklıyoruz
      console.log('ℹ️ Settings endpoint not available on backend, using local storage only');
    } catch (error) {
      console.error('❌ Settings save error:', error);
      throw error;
    }
  }

  // Kullanıcı ayarlarını getir
  async getUserSettings() {
    try {
      console.log('📱 Getting user settings...');
      // Sadece local'den al (backend'de endpoint yok)
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        console.log('✅ Settings found in local storage');
        return JSON.parse(settings);
      }
      
      console.log('ℹ️ No settings found, returning null');
      return null;
    } catch (error) {
      console.error('❌ Settings fetch error:', error);
      return null;
    }
  }

  // Kullanıcı bilgilerini güncelle
  async updateUserProfile(profileData) {
    try {
      console.log('🔄 UPDATING USER PROFILE...');
      console.log('📤 Profile data:', profileData);
      
      const token = await this.getToken();
      console.log('🔑 Token:', token ? 'Found' : 'Not found');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('📤 Sending profile update request...');
      console.log('📤 Request URL:', '/auth/update-profile');
      console.log('📤 Request data:', {
        username: profileData.username,
        firstname: profileData.firstname,
        lastname: profileData.lastname,
        email: profileData.email
      });

      const response = await this.api.put('/auth/update-profile', {
        username: profileData.username,
        firstname: profileData.firstname,
        lastname: profileData.lastname,
        email: profileData.email
      });

      console.log('✅ Profile update response:', response.data);

      if (response.data && response.data.success) {
        console.log('✅ Profile update successful, updating local data...');
        // Yerel kullanıcı verisini güncelle
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...response.data.user };
          await this.setUser(updatedUser);
          console.log('✅ Local user data updated');
        }
        return response.data;
      }
      throw new Error('Profile update failed');
    } catch (error) {
      console.error('❌ PROFILE UPDATE ERROR DETAILS:');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Response status:', error.response?.status);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Request config:', error.config);
      throw error;
    }
  }

  // Şifre değiştir
  async changePassword(currentPassword, newPassword) {
    try {
      console.log('🔄 CHANGING PASSWORD...');
      console.log('🔐 Current password length:', currentPassword.length);
      console.log('🔐 New password length:', newPassword.length);
      
      const token = await this.getToken();
      console.log('🔑 Token:', token ? 'Found' : 'Not found');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('📤 Sending password change request...');
      console.log('📤 Request URL:', '/auth/change-password');
      console.log('📤 Request data:', {
        current_password: '***',
        new_password: '***'
      });

      const response = await this.api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      console.log('✅ Password change response:', response.data);

      if (response.data && response.data.success) {
        console.log('✅ Password change successful');
        return response.data;
      }
      throw new Error('Password change failed');
    } catch (error) {
      console.error('❌ PASSWORD CHANGE ERROR DETAILS:');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Response status:', error.response?.status);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Request config:', error.config);
      throw error;
    }
  }

  // Kullanıcı bilgilerini sakla
  async setUser(user) {
    try {
      if (!user) {
        throw new Error('User data cannot be null or undefined');
      }
      const userString = JSON.stringify(user);
      await AsyncStorage.setItem('currentUser', userString);
    } catch (error) {
      console.error('Kullanıcı bilgisi saklama hatası:', error);
      throw error;
    }
  }

  // Kullanıcı bilgilerini al
  async getUser() {
    try {
      const userString = await AsyncStorage.getItem('currentUser');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Kullanıcı bilgisi alma hatası:', error);
      return null;
    }
  }

  // Mevcut kullanıcıyı al (getUser ile aynı)
  async getCurrentUser() {
    return await this.getUser();
  }

  // Google ile giriş yap
  async handleGoogleLogin(accessToken) {
    try {
      console.log('🔐 GOOGLE LOGIN: Processing authentication...');
      
      console.log('🌐 Sending Google token to backend...');
      const response = await this.api.post('/auth/google-auth', {
        id_token: accessToken,
      });

      if (response.data.access_token) {
        console.log('✅ Backend authentication successful');
        
        await SecureStore.setItemAsync('userToken', response.data.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        this.user = response.data.user;
        console.log('🎉 GOOGLE LOGIN COMPLETE');
        return response.data.user;
      }
      throw new Error('Google login failed');
    } catch (error) {
      console.error('❌ GOOGLE LOGIN ERROR:', {
        message: error.message,
        response_status: error.response?.status,
        response_data: error.response?.data
      });
      throw new Error(error.response?.data?.detail || 'Google login failed');
    }
  }

  // Normal giriş yap
  async login(username, password) {
    try {
      console.log('🔐 LOGIN ATTEMPT: Initiating login process...');
      console.log('🔐 Username:', username);
      console.log('🔐 Password length:', password.length);
      
      console.log('🌐 API_BASE_URL:', Config.API_BASE_URL);
      console.log('🌐 Full URL:', `${Config.API_BASE_URL}/auth/token`);
      
      // Get access token using URLSearchParams for form data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      console.log('📤 FormData content:', formData.toString());

      console.log('📤 Sending request to:', '/auth/token');
      console.log('📤 Headers:', {
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      const tokenResponse = await this.api.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('✅ Token received successfully');
      
      const { access_token } = tokenResponse.data;
      console.log('💾 Saving token...');
      await this.setToken(access_token);
      console.log('✅ Token saved successfully');

      console.log('🔄 Fetching user data...');
      // Get user data
      const userResponse = await this.api.get('/auth/me');

      const userData = userResponse.data;
      console.log('👤 User data received:', { 
        id: userData.id,
        username: userData.username,
        has_data: !!userData
      });
      
      console.log('💾 Saving user data...');
      await this.setUser(userData);
      console.log('✅ User data saved successfully');
      
      console.log('🎉 LOGIN COMPLETE: All steps successful');
      return userData;
      
    } catch (error) {
      console.error('❌ LOGIN ERROR DETAILS:');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error config:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
        headers: error.config?.headers
      });
      console.error('❌ Response status:', error.response?.status);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Network error:', error.message === 'Network Error');
      
      if (error.message === 'Network Error') {
        console.error('🌐 NETWORK ERROR - Possible causes:');
        console.error('🌐 1. Backend not running');
        console.error('🌐 2. Wrong IP address');
        console.error('🌐 3. Firewall blocking');
        console.error('🌐 4. Network connectivity issue');
      }
      
      throw new Error(
        error.response?.data?.detail || 'Giriş yapılırken bir hata oluştu'
      );
    }
  }

  // Kayıt ol
  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      
      // Register sonrası otomatik login yap
      const loginResponse = await this.login(userData.username, userData.password);
      
      return loginResponse;
    } catch (error) {
      console.error('Kayıt hatası:', error);
      throw new Error(
        error.response?.data?.detail || 'Kayıt olurken bir hata oluştu'
      );
    }
  }

  // Çıkış yap
  async logout() {
    try {
      console.log('🔓 LOGOUT: Starting logout process...');
      
      // Check current token before clearing
      const currentToken = await this.getToken();
      console.log('🔑 Current token before logout:', currentToken ? 'Present' : 'Not found');
      
      // Clear auth token
      await SecureStore.deleteItemAsync('userToken');
      console.log('✅ Token cleared from SecureStore');
      
      // Clear all user data from storage
      await AsyncStorage.removeItem('currentUser');
      console.log('✅ currentUser cleared from AsyncStorage');
      
      await AsyncStorage.removeItem('userSettings');
      console.log('✅ userSettings cleared from AsyncStorage');
      
      // Reset instance variables
      this.user = null;
      console.log('✅ Instance user variable reset');
      
      // Verify token is cleared
      const tokenAfterLogout = await this.getToken();
      console.log('🔑 Token after logout:', tokenAfterLogout ? 'Still present (ERROR)' : 'Cleared (OK)');
      
      console.log('🎉 LOGOUT COMPLETE');
      
      // Logout event'ini tetikle
      if (this.onLogout) {
        this.onLogout();
      }
    } catch (error) {
      console.error('❌ LOGOUT ERROR DETAILS:');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error stack:', error.stack);
      // Still consider logout successful even if there were errors clearing data
    }
  }

  // Kimlik doğrulama kontrolü
  async checkAuth() {
    try {
      console.log('🔒 Checking authentication status...');
      
      // First try to get cached user data
      const cachedUser = await this.getUser();
      if (cachedUser) {
        console.log('📱 Found cached user data');
      }
      
      // Check if we have a valid token
      const token = await this.getToken();
      if (!token) {
        console.log('❌ No token found');
        return null;
      }

      // Validate token with backend and get fresh user data
      try {
        console.log('🌐 Validating token with backend...');
        const response = await this.api.get('/auth/me');
        
        const user = response.data;
        console.log('✅ Token valid, got fresh user data');
        
        // Update cached user data
        await this.setUser(user);
        return user;
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('❌ Token invalid or expired');
          await this.logout();
          return null;
        }
        // For other errors, return cached user if available
        console.warn('⚠️ Error checking auth, using cached data:', error.message);
        return cachedUser;
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      await this.logout();
      return null;
    }
  }

  // Şifre sıfırlama
  async resetPassword(email) {
    try {
      const response = await this.api.post('/auth/forgot-password', {
        email,
      });
      return response.data;
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      throw new Error(
        error.response?.data?.detail || 'Şifre sıfırlama hatası'
      );
    }
  }

  // Profil güncelle
  async updateProfile(userData) {
    try {
      const response = await this.api.put('/auth/update-profile', userData);
      const updatedUser = response.data;
      
      await this.setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw new Error(
        error.response?.data?.detail || 'Profil güncellenirken bir hata oluştu'
      );
    }
  }
}

export default new AuthService();
