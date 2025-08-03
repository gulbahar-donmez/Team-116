import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';

import PostureService from '../services/PostureService';
import { commonStyles } from '../theme/theme';

export default function CalibrationScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState(null);
  const [isCalibrated, setIsCalibrated] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        setCalibrationResult(null);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kamera izni gerekli.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        setCalibrationResult(null);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  const performCalibration = async () => {
    if (!selectedImage) {
      Alert.alert('Hata', 'Lütfen önce bir fotoğraf seçin.');
      return;
    }

    setIsLoading(true);
    try {
      // Fotoğrafı base64'e çevir
      const response = await fetch(selectedImage.uri);
      const blob = await response.blob();
      
      // FormData oluştur
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage.uri,
        type: 'image/jpeg',
        name: 'calibration_photo.jpg',
      });

      const result = await PostureService.calibrateWithPhoto(formData);
      setCalibrationResult(result);
      setIsCalibrated(true);
      
      Alert.alert(
        'Kalibrasyon Tamamlandı!',
        `Vücut tipiniz: ${result.body_type}\n\nKalibrasyon başarıyla tamamlandı. Artık postur analizleriniz kişiselleştirilmiş olacak.`
      );
    } catch (error) {
      console.error('Kalibrasyon hatası:', error);
      Alert.alert('Hata', 'Kalibrasyon sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetCalibration = () => {
    setSelectedImage(null);
    setCalibrationResult(null);
    setIsCalibrated(false);
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
        <Text style={styles.headerTitle}>Kalibrasyon</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bilgilendirme Kartı */}
        <Animatable.View animation="fadeIn" style={styles.infoCard}>
          <Icon name="info" size={24} color="#4F46E5" />
          <Text style={styles.infoTitle}>Kişiselleştirilmiş Analiz</Text>
          <Text style={styles.infoText}>
            Kalibrasyon için bir fotoğraf yükleyin. Bu fotoğraf, postur analizlerinizin 
            vücut tipinize göre kişiselleştirilmesini sağlayacak.
          </Text>
        </Animatable.View>

        {/* Fotoğraf Seçimi */}
        <Animatable.View animation="fadeIn" delay={200} style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Fotoğraf Seçimi</Text>
          
          {selectedImage ? (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={pickImage}
              >
                <Text style={styles.changePhotoText}>Fotoğrafı Değiştir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={pickImage}
              >
                <LinearGradient
                  colors={['#4F46E5', '#6366F1']}
                  style={styles.photoButtonGradient}
                >
                  <Icon name="photo-library" size={32} color="#fff" />
                  <Text style={styles.photoButtonText}>Galeriden Seç</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={takePhoto}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.photoButtonGradient}
                >
                  <Icon name="camera-alt" size={32} color="#fff" />
                  <Text style={styles.photoButtonText}>Fotoğraf Çek</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animatable.View>

        {/* Kalibrasyon Sonucu */}
        {calibrationResult && (
          <Animatable.View animation="fadeIn" delay={400} style={styles.resultCard}>
            <Text style={styles.sectionTitle}>Kalibrasyon Sonucu</Text>
            
            <View style={styles.resultItem}>
              <Icon name="person" size={20} color="#4F46E5" />
              <Text style={styles.resultLabel}>Vücut Tipi:</Text>
              <Text style={styles.resultValue}>{calibrationResult.body_type}</Text>
            </View>

            <View style={styles.resultItem}>
              <Icon name="straighten" size={20} color="#10B981" />
              <Text style={styles.resultLabel}>İdeal Sırt Açısı:</Text>
              <Text style={styles.resultValue}>{calibrationResult.ideal_back_angle?.toFixed(1)}°</Text>
            </View>

            <View style={styles.resultItem}>
              <Icon name="accessibility" size={20} color="#F59E0B" />
              <Text style={styles.resultLabel}>İdeal Boyun Açısı:</Text>
              <Text style={styles.resultValue}>{calibrationResult.ideal_neck_angle?.toFixed(1)}°</Text>
            </View>
          </Animatable.View>
        )}

        {/* Aksiyon Butonları */}
        <Animatable.View animation="fadeIn" delay={600} style={styles.actionContainer}>
          {selectedImage && !isCalibrated && (
            <TouchableOpacity
              style={styles.calibrateButton}
              onPress={performCalibration}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.calibrateButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="tune" size={24} color="#fff" />
                    <Text style={styles.calibrateButtonText}>Kalibrasyonu Başlat</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isCalibrated && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetCalibration}
            >
              <LinearGradient
                colors={['#6B7280', '#4B5563']}
                style={styles.resetButtonGradient}
              >
                <Icon name="refresh" size={24} color="#fff" />
                <Text style={styles.resetButtonText}>Yeni Kalibrasyon</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animatable.View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d2d2d',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  photoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoButtonGradient: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  selectedImageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  changePhotoButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionContainer: {
    marginTop: 20,
  },
  calibrateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  calibrateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  calibrateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resetButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
