import { Platform } from 'react-native';

const Config = {
  // Google OAuth Configuration
  GOOGLE: {
    CLIENT_ID: "132533598821-fgrmsi8l19ssja1u3749acvu1s31iato.apps.googleusercontent.com",
    EXPO_CLIENT_ID: "132533598821-fgrmsi8l19ssja1u3749acvu1s31iato.apps.googleusercontent.com",
    ANDROID_CLIENT_ID: "132533598821-fgrmsi8l19ssja1u3749acvu1s31iato.apps.googleusercontent.com",
    IOS_CLIENT_ID: "132533598821-fgrmsi8l19ssja1u3749acvu1s31iato.apps.googleusercontent.com",
  },
  // API Configuration
  API_BASE_URL: Platform.select({
    android: 'http://10.0.2.2:8000',
    ios: 'http://192.168.1.3:8000'
  }),
  API_TIMEOUT: 30000, // 30 seconds
  
  // Authentication
  JWT_SECRET: "89c3266a6cecb3b494cf5030744bab8ccd45c3ad7d2fd112ffea6e7a46ccc645",

  // Feature Flags
  ENABLE_ANALYTICS: true,
  ENABLE_CRASH_REPORTING: true,

  // Cache Configuration
  CACHE_DURATION: 3600, // 1 hour in seconds

  // App Settings
  DEFAULT_LANGUAGE: 'tr',
  APP_VERSION: '1.0.0',
  
  // Analysis Settings
  ANALYSIS_INTERVAL: 2000, // 2 seconds
  MIN_CONFIDENCE_SCORE: 0.5,

  // Endpoints
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    GOOGLE_LOGIN: '/api/auth/google',
    USER_PROFILE: '/api/users/profile',
    POSTURE_ANALYSIS: '/api/posture/analysis',
    CALIBRATION: '/api/posture/calibration',
  },
};

export default Config;
