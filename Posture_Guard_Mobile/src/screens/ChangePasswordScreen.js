import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';

export default function ChangePasswordScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChangePassword = async () => {
    // Validate inputs
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    if (passwords.newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.changePassword(passwords.currentPassword, passwords.newPassword);
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.');
      navigation.goBack();
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Hata', 'Şifre değiştirme işlemi başarısız oldu. Lütfen mevcut şifrenizi kontrol edin ve internet bağlantınızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Şifre Değiştir</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mevcut Şifre</Text>
          <TextInput
            style={styles.input}
            value={passwords.currentPassword}
            onChangeText={(text) => setPasswords({ ...passwords, currentPassword: text })}
            placeholder="Mevcut şifreniz"
            placeholderTextColor="#666"
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Yeni Şifre</Text>
          <TextInput
            style={styles.input}
            value={passwords.newPassword}
            onChangeText={(text) => setPasswords({ ...passwords, newPassword: text })}
            placeholder="Yeni şifreniz"
            placeholderTextColor="#666"
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Yeni Şifre Tekrar</Text>
          <TextInput
            style={styles.input}
            value={passwords.confirmPassword}
            onChangeText={(text) => setPasswords({ ...passwords, confirmPassword: text })}
            placeholder="Yeni şifrenizi tekrar girin"
            placeholderTextColor="#666"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Şifreyi Değiştir</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
