import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import { useAuthRequest } from 'expo-auth-session/providers/google';

import AuthService from '../services/AuthService';
import { commonStyles } from '../theme/theme';
import Config from '../config';

export default function LoginScreen({ onLogin, isDarkMode, setIsDarkMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    email: '',
    phone_number: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Google Auth Hook'u
  const [request, response, promptAsync] = useAuthRequest({
    expoClientId: Config.GOOGLE.EXPO_CLIENT_ID,
    androidClientId: Config.GOOGLE.ANDROID_CLIENT_ID,
    iosClientId: Config.GOOGLE.IOS_CLIENT_ID,
    webClientId: Config.GOOGLE.CLIENT_ID,
    scopes: ['profile', 'email']
  });

  // Google Auth yanıtını dinle
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication.accessToken);
    }
  }, [response]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Google ile giriş işlemi
  const handleGoogleLogin = async (accessToken) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const user = await AuthService.handleGoogleLogin(accessToken);
      onLogin(user);
      Alert.alert('Başarılı', 'Google ile giriş başarılı!');
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    // Form validasyonu
    if (!formData.username || !formData.password) {
      Alert.alert('Hata', 'Kullanıcı adı ve şifre gereklidir');
      return;
    }

    if (!isLogin) {
      if (!formData.firstname || !formData.lastname || !formData.email) {
        Alert.alert('Hata', 'Tüm alanları doldurun');
        return;
      }
    }

    setIsLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await AuthService.login(formData.username, formData.password);
      } else {
        user = await AuthService.register(formData);
      }

      onLogin(user);
      Alert.alert(
        'Başarılı',
        isLogin ? 'Giriş başarılı!' : 'Kayıt başarılı!'
      );
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      password: '',
      firstname: '',
      lastname: '',
      email: '',
      phone_number: '',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#2d2d2d']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Icon name="accessibility" size={60} color="#4F46E5" />
              </View>
              <Text style={styles.title}>
                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              </Text>
            </View>

            <Animatable.View
              animation="fadeInUpBig"
              style={styles.formContainer}
            >
              {/* Normal giriş formu */}
              <View style={styles.inputContainer}>
                <Icon name="person" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Kullanıcı Adı"
                  placeholderTextColor="#9CA3AF"
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  autoCapitalize="none"
                />
              </View>

              {/* Şifre */}
              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Şifre"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Kayıt için ek alanlar */}
              {!isLogin && (
                <>
                  <View style={styles.inputContainer}>
                    <Icon name="badge" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ad"
                      placeholderTextColor="#9CA3AF"
                      value={formData.firstname}
                      onChangeText={(value) => handleInputChange('firstname', value)}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Icon name="badge" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Soyad"
                      placeholderTextColor="#9CA3AF"
                      value={formData.lastname}
                      onChangeText={(value) => handleInputChange('lastname', value)}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Icon name="email" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="E-posta"
                      placeholderTextColor="#9CA3AF"
                      value={formData.email}
                      onChangeText={(value) => handleInputChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Icon name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Telefon (Opsiyonel)"
                      placeholderTextColor="#9CA3AF"
                      value={formData.phone_number}
                      onChangeText={(value) => handleInputChange('phone_number', value)}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading ? 'Yükleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Google Login Button */}
              <TouchableOpacity
                style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                onPress={() => promptAsync()}
                disabled={isLoading}
              >
                <View style={styles.googleButtonContent}>
                  <Icon
                    name="g-translate"
                    size={24}
                    color="#4285F4"
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>
                    Google ile {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Toggle Mode */}
              <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
                <Text style={styles.toggleText}>
                  {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
                  <Text style={styles.toggleTextBold}>
                    {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  formContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#404040',
    paddingLeft: 45,
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 15,
    zIndex: 1,
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#404040',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  toggleText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  toggleTextBold: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
