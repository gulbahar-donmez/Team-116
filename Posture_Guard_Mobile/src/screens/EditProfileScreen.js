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

export default function EditProfileScreen({ navigation, route }) {
  const { user: initialUser } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    username: initialUser?.username || '',
    firstname: initialUser?.firstname || '',
    lastname: initialUser?.lastname || '',
    email: initialUser?.email || '',
  });

  const handleSave = async () => {
    if (!user.firstname || !user.lastname) {
      Alert.alert('Hata', 'Ad ve soyad alanları boş bırakılamaz.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.updateUserProfile(user);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
      navigation.goBack();
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.');
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
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Kullanıcı Adı</Text>
          <TextInput
            style={styles.input}
            value={user.username}
            onChangeText={(text) => setUser({ ...user, username: text })}
            placeholder="Kullanıcı adınız"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ad</Text>
          <TextInput
            style={styles.input}
            value={user.firstname}
            onChangeText={(text) => setUser({ ...user, firstname: text })}
            placeholder="Adınız"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Soyad</Text>
          <TextInput
            style={styles.input}
            value={user.lastname}
            onChangeText={(text) => setUser({ ...user, lastname: text })}
            placeholder="Soyadınız"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={styles.input}
            value={user.email}
            onChangeText={(text) => setUser({ ...user, email: text })}
            placeholder="E-posta adresiniz"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Kaydet</Text>
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
