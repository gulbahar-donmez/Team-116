import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import AuthService from '../services/AuthService';
import { commonStyles, getCommonStyles } from '../theme/theme';
import { useTheme } from '../hooks/useTheme';

export default function ProfileScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    autoAnalysis: false,
    soundAlerts: true,
    privacyMode: false,
    language: 'tr',
  });

  // Tema context'ini kullan
  const { isDarkMode, toggleTheme } = useTheme();

  const handleSettingChange = async (setting, value) => {
    try {
      const newSettings = {
        ...settings,
        [setting]: value
      };
      setSettings(newSettings);
      await AuthService.saveUserSettings(newSettings);
      
      // Ayar değişikliğine göre ek işlemler
      switch(setting) {
        case 'darkMode':
          // Tema değişikliğini uygula
          if (toggleTheme) {
            toggleTheme();
          }
          break;
        case 'notifications':
          // Bildirim izinlerini güncelle
          break;
        case 'language':
          // Dil ayarlarını güncelle
          break;
      }
    } catch (error) {
      console.error('Ayar kaydetme hatası:', error);
      Alert.alert('Hata', 'Ayarlar kaydedilirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.');
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // isDarkMode değiştiğinde settings'i güncelle
  useEffect(() => {
    if (isDarkMode !== settings.darkMode) {
      setSettings(prev => ({
        ...prev,
        darkMode: isDarkMode
      }));
    }
  }, [isDarkMode]);

  const loadUserData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Kullanıcının kayıtlı ayarlarını yükle
        const savedSettings = await AuthService.getUserSettings();
        if (savedSettings) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...savedSettings
          }));
        }
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri yükleme hatası:', error);
      Alert.alert('Hata', 'Kullanıcı bilgileri yüklenirken bir hata oluştu.');
    }
  };

  const refreshProfile = async () => {
    try {
      await loadUserData();
      Alert.alert('Başarılı', 'Profil bilgileri yenilendi.');
    } catch (error) {
      console.error('Profil yenileme hatası:', error);
      Alert.alert('Hata', 'Profil yenilenirken bir hata oluştu.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              // AuthService.logout() token'ı temizledi
              // App.js'deki currentUser state'i otomatik olarak güncellenecek
            } catch (error) {
              console.error('Çıkış yapma hatası:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const toggleSetting = async (key) => {
    const newValue = !settings[key];
    setSettings(prev => ({
      ...prev,
      [key]: newValue,
    }));
    
    try {
      await handleSettingChange(key, newValue);
    } catch (error) {
      // Revert the change if saving failed
      setSettings(prev => ({
        ...prev,
        [key]: !newValue,
      }));
    }
  };

  const menuItems = [
    {
      icon: 'tune',
      title: 'Kalibrasyon',
      subtitle: 'Fotoğraf ile kişiselleştirilmiş analiz',
      onPress: () => navigation.navigate('Calibration'),
      color: '#4F46E5',
    },
    {
      icon: 'analytics',
      title: 'Analiz Geçmişi',
      subtitle: 'Geçmiş postur analizlerinizi görüntüleyin',
      onPress: () => {
        Alert.alert('Yakında', 'Bu özellik yakında eklenecek!');
      },
      color: '#10B981',
    },
    {
      icon: 'assessment',
      title: 'Raporlar',
      subtitle: 'Detaylı postur raporlarınızı inceleyin',
      onPress: () => {
        Alert.alert('Yakında', 'Bu özellik yakında eklenecek!');
      },
      color: '#F59E0B',
    },
    {
      icon: 'help',
      title: 'Yardım ve Destek',
      subtitle: 'SSS ve destek bilgileri',
      onPress: () => {
        Alert.alert('Yardım', 'Destek ekibimizle iletişime geçmek için support@postureguard.com adresine yazabilirsiniz.');
      },
      color: '#8B5CF6',
    },
    {
      icon: 'security',
      title: 'Gizlilik Politikası',
      subtitle: 'Veri kullanımı ve gizlilik',
      onPress: () => {
        Alert.alert('Gizlilik Politikası', 'Gizlilik politikamızı web sitemizden inceleyebilirsiniz: https://postureguard.com/privacy');
      },
      color: '#059669',
    },
    {
      icon: 'description',
      title: 'Kullanım Şartları',
      subtitle: 'Hizmet şartları ve koşulları',
      onPress: () => {
        Alert.alert('Kullanım Şartları', 'Kullanım şartlarımızı web sitemizden inceleyebilirsiniz: https://postureguard.com/terms');
      },
      color: '#DC2626',
    },
  ];

  const dynamicStyles = getCommonStyles(isDarkMode);

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Animatable.View animation="fadeInDown" style={styles.profileHeader}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.profileGradient}
          >
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshProfile}
            >
              <Icon name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.avatarContainer}>
              <Icon name="person" size={50} color="#fff" />
            </View>
            <Text style={[styles.userName, { color: '#ffffff' }]}>
              {user ? `${user.firstname} ${user.lastname}` : 'Kullanıcı'}
            </Text>
            <Text style={[styles.userEmail, { color: 'rgba(255, 255, 255, 0.8)' }]}>{user?.email || 'email@example.com'}</Text>
          </LinearGradient>
        </Animatable.View>

        {/* Quick Stats */}
        <Animatable.View animation="fadeInUp" delay={200} style={[styles.statsContainer, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{user?.stats?.totalAnalysis || 0}</Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Analiz</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{user?.stats?.averageScore || 0}%</Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Ortalama Skor</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{user?.stats?.streak || 0}</Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Gün Streak</Text>
          </View>
        </Animatable.View>

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Ayarlar</Text>
          
          <View style={[styles.settingItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <View style={styles.settingInfo}>
              <Icon name="notifications" size={24} color="#4F46E5" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Bildirimler</Text>
                <Text style={[styles.settingSubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Postur uyarıları alın</Text>
              </View>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting('notifications')}
              trackColor={{ false: isDarkMode ? '#404040' : '#d1d5db', true: '#4F46E5' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <View style={styles.settingInfo}>
              <Icon name="dark-mode" size={24} color="#4F46E5" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Karanlık Mod</Text>
                <Text style={[styles.settingSubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Koyu tema kullan</Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={() => toggleSetting('darkMode')}
              trackColor={{ false: isDarkMode ? '#404040' : '#d1d5db', true: '#4F46E5' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <View style={styles.settingInfo}>
              <Icon name="auto-awesome" size={24} color="#4F46E5" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Otomatik Analiz</Text>
                <Text style={[styles.settingSubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Sürekli postur takibi</Text>
              </View>
            </View>
            <Switch
              value={settings.autoAnalysis}
              onValueChange={() => toggleSetting('autoAnalysis')}
              trackColor={{ false: isDarkMode ? '#404040' : '#d1d5db', true: '#4F46E5' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <View style={styles.settingInfo}>
              <Icon name="volume-up" size={24} color="#4F46E5" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Ses Uyarıları</Text>
                <Text style={[styles.settingSubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Sesli postur uyarıları</Text>
              </View>
            </View>
            <Switch
              value={settings.soundAlerts}
              onValueChange={() => toggleSetting('soundAlerts')}
              trackColor={{ false: isDarkMode ? '#404040' : '#d1d5db', true: '#4F46E5' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Menü</Text>
          
          {menuItems.map((item, index) => (
            <Animatable.View
              key={index}
              animation="fadeInUp"
              delay={index * 100}
            >
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemContent}>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                    <Icon name={item.icon} size={24} color={item.color} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>{item.title}</Text>
                    <Text style={[styles.menuSubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>{item.subtitle}</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </View>

        {/* Account Actions */}
        <View style={styles.accountActions}>
          <TouchableOpacity 
            style={[styles.accountButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6' }]}
            onPress={() => navigation.navigate('EditProfile', { user })}
          >
            <Icon name="edit" size={20} color="#4F46E5" />
            <Text style={[styles.accountButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Profili Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.accountButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6' }]}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Icon name="security" size={20} color="#4F46E5" />
            <Text style={[styles.accountButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Şifre Değiştir</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.accountButton, styles.logoutButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6' }]}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color="#EF4444" />
            <Text style={[styles.accountButtonText, styles.logoutButtonText, { color: '#EF4444' }]}>
              Çıkış Yap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.accountButton, styles.deleteButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6' }]}
            onPress={() => {
              Alert.alert(
                'Hesabı Sil',
                'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.',
                [
                  { text: 'İptal', style: 'cancel' },
                  {
                    text: 'Hesabı Sil',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert('Yakında', 'Hesap silme özelliği yakında eklenecek.');
                    },
                  },
                ]
              );
            }}
          >
            <Icon name="delete-forever" size={20} color="#DC2626" />
            <Text style={[styles.accountButtonText, styles.deleteButtonText, { color: '#DC2626' }]}>
              Hesabı Sil
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>PostureGuard Mobile v1.0.0</Text>
          <Text style={[styles.appInfoText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>© 2024 PostureGuard</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGradient: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#404040',
    marginHorizontal: 10,
  },
  settingsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  menuContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  accountActions: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  accountButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    marginLeft: 12,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    color: '#EF4444',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#DC2626',
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
});
