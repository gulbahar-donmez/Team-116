import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import PostureService from '../services/PostureService';
import { commonStyles, getCommonStyles } from '../theme/theme';
import { useTheme } from '../hooks/useTheme';

export default function UploadScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Hata', 'Kamera izni gerekli!');
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Hata', 'Galeri izni gerekli!');
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        setAnalysisResult(null);
      }
    } catch (error) {
      console.error('Fotoğraf seçme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('Hata', 'Lütfen önce bir fotoğraf seçin');
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await PostureService.uploadAndAnalyze(selectedImage.uri);
      setAnalysisResult(result);
      
      Alert.alert('Başarılı', 'Postur analizi tamamlandı!');
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Fotoğraf Seç',
      'Nereden fotoğraf seçmek istiyorsunuz?',
      [
        { text: 'Kamera', onPress: () => pickImage('camera') },
        { text: 'Galeri', onPress: () => pickImage('gallery') },
        { text: 'İptal', style: 'cancel' },
      ]
    );
  };

  const dynamicStyles = getCommonStyles(isDarkMode);

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Fotoğraf Yükle</Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Postur analiziniz için bir fotoğraf seçin
          </Text>
        </View>

        {/* Image Selection */}
        <View style={styles.imageSection}>
          {selectedImage ? (
            <Animatable.View animation="fadeIn" style={styles.imageContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={showImagePicker}
              >
                <Icon name="edit" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </Animatable.View>
          ) : (
            <TouchableOpacity 
              style={[styles.imagePlaceholder, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6' }]} 
              onPress={showImagePicker}
            >
              <Icon name="add-a-photo" size={60} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              <Text style={[styles.placeholderText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Fotoğraf Seç</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, !selectedImage && styles.actionButtonDisabled]}
            onPress={analyzeImage}
            disabled={!selectedImage || isAnalyzing}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.actionButtonGradient}
            >
              <Icon 
                name={isAnalyzing ? 'hourglass-empty' : 'analytics'} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {isAnalyzing ? 'Analiz Ediliyor...' : 'Analiz Et'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6' }]} 
            onPress={showImagePicker}
          >
            <Icon name="photo-library" size={24} color="#4F46E5" />
            <Text style={[styles.secondaryButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Farklı Fotoğraf Seç</Text>
          </TouchableOpacity>
        </View>

        {/* Analysis Results */}
        {analysisResult && (
          <Animatable.View animation="fadeInUp" style={styles.resultsContainer}>
            <Text style={[styles.resultsTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Analiz Sonuçları</Text>
            
            <View style={styles.resultCard}>
              <LinearGradient
                colors={['#1a1a1a', '#2d2d2d']}
                style={styles.resultCardGradient}
              >
                <View style={styles.scoreSection}>
                  <Text style={styles.scoreLabel}>Postur Skoru</Text>
                  <Text style={[
                    styles.scoreValue,
                    { color: PostureService.getScoreColor(analysisResult.posture_score) }
                  ]}>
                    {analysisResult.posture_score}%
                  </Text>
                  <View style={[
                    styles.riskBadge,
                    { backgroundColor: PostureService.getRiskColor(analysisResult.risk_level) }
                  ]}>
                    <Text style={styles.riskText}>{analysisResult.risk_level}</Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Sırt Açısı</Text>
                    <Text style={styles.metricValue}>
                      {analysisResult.back_angle?.toFixed(1)}°
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Boyun Açısı</Text>
                    <Text style={styles.metricValue}>
                      {analysisResult.neck_angle?.toFixed(1)}°
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Güven</Text>
                    <Text style={styles.metricValue}>
                      {(analysisResult.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>

                {analysisResult.improvement_suggestions?.length > 0 && (
                  <View style={styles.suggestionsSection}>
                    <Text style={styles.suggestionsTitle}>Öneriler</Text>
                    {analysisResult.improvement_suggestions.map((suggestion, index) => (
                      <View key={index} style={styles.suggestionItem}>
                        <Icon name="lightbulb-outline" size={16} color="#F59E0B" />
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </View>
          </Animatable.View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={[styles.tipsTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>İpuçları</Text>
          <View style={[styles.tipItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <Icon name="info" size={20} color="#4F46E5" />
            <Text style={[styles.tipText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              En iyi sonuç için düz durun ve kamerayı göğüs hizasında tutun
            </Text>
          </View>
          <View style={[styles.tipItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <Icon name="wb-sunny" size={20} color="#F59E0B" />
            <Text style={[styles.tipText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              İyi aydınlatma altında fotoğraf çekin
            </Text>
          </View>
          <View style={[styles.tipItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <Icon name="straighten" size={20} color="#10B981" />
            <Text style={[styles.tipText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Vücudunuzun tamamı görünecek şekilde çekin
            </Text>
          </View>
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
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  imageSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  imageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: 250,
    height: 300,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  changeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  imagePlaceholder: {
    width: 250,
    height: 300,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#404040',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  resultCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  resultCardGradient: {
    padding: 20,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 16,
  },
  suggestionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestionText: {
    color: '#e5e5e5',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  tipsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tipText: {
    color: '#e5e5e5',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});
