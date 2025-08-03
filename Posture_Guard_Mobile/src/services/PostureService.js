import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import AuthService from './AuthService';

// Backend API URL - Mevcut FastAPI backend'inizin URL'i
const API_BASE_URL = 'http://192.168.1.3:8000'; // Updated for network compatibility
// For mobile devices, replace 'localhost' with your computer's IP address
// Example: 'http://192.168.1.100:8000'

class PostureService {
  // Canlı postur analizi
  async analyzePosture(imageBase64) {
    try {
      const response = await AuthService.api.post('/live-posture/analyze', {
        image: imageBase64,
        analysis_type: 'real_time'
      });

      return {
        back_angle: response.data.back_angle,
        neck_angle: response.data.neck_angle,
        posture_score: response.data.posture_score,
        risk_level: this.getRiskLevelText(response.data.risk_level),
        suggestions: response.data.suggestions || [],
        confidence: response.data.confidence,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Postur analizi hatası:', error);
      
      // Hata durumunda örnek veri döndür (geliştirme aşamasında)
      return {
        back_angle: Math.random() * 30 + 10,
        neck_angle: Math.random() * 25 + 5,
        posture_score: Math.floor(Math.random() * 40) + 60,
        risk_level: ['İyi', 'Orta', 'Yüksek'][Math.floor(Math.random() * 3)],
        suggestions: [
          'Sırtınızı dik tutun',
          'Omuzlarınızı geriye alın',
          'Boyununuzu düz tutun'
        ],
        confidence: 0.85,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Fotoğraf yükleme ve analiz
  async uploadAndAnalyze(imageUri) {
    try {
      // Fotoğrafı base64'e çevir
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await AuthService.api.post('/posture/analyze', {
        image: base64,
        analysis_type: 'detailed'
      });

      return {
        analysis_id: response.data.analysis_id,
        back_angle: response.data.back_angle,
        neck_angle: response.data.neck_angle,
        posture_score: response.data.posture_score,
        risk_level: this.getRiskLevelText(response.data.risk_level),
        body_type: response.data.body_type,
        risk_factors: response.data.risk_factors || [],
        improvement_suggestions: response.data.improvement_suggestions || [],
        confidence: response.data.confidence,
        image_path: response.data.image_path,
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      console.error('Fotoğraf analizi hatası:', error);
      throw new Error(
        error.response?.data?.detail || 'Fotoğraf analizi sırasında bir hata oluştu'
      );
    }
  }

  // Kullanıcının analiz geçmişini getir
  async getAnalysisHistory(page = 1, limit = 20) {
    try {
      const response = await AuthService.api.get('/results/history', {
        params: { page, limit }
      });

      return {
        analyses: response.data.analyses.map(analysis => ({
          ...analysis,
          risk_level: this.getRiskLevelText(analysis.level),
        })),
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
      };
    } catch (error) {
      console.error('Analiz geçmişi getirme hatası:', error);
      throw new Error('Analiz geçmişi alınırken bir hata oluştu');
    }
  }

  // Günlük ortalama skorları getir
  async getDailyAverages(days = 7) {
    try {
      const response = await AuthService.api.get('/results/daily-averages', {
        params: { days }
      });

      return {
        daily_averages: response.data.daily_averages,
        total_days: response.data.total_days,
        days_with_analysis: response.data.days_with_analysis,
      };
    } catch (error) {
      console.error('Günlük ortalamalar getirme hatası:', error);
      throw new Error('Günlük ortalamalar alınırken bir hata oluştu');
    }
  }

  // Zaman serisi verilerini getir
  async getTimeSeriesData(page = 1, pageSize = 20) {
    try {
      const response = await AuthService.api.get('/results/time_series', {
        params: { page, page_size: pageSize }
      });

      return {
        results: response.data.results.map(result => ({
          ...result,
          risk_level: this.getRiskLevelText(result.level),
        })),
        total_records: response.data.total_records,
        page: response.data.page,
        page_size: response.data.page_size,
      };
    } catch (error) {
      console.error('Zaman serisi verileri getirme hatası:', error);
      throw new Error('Zaman serisi verileri alınırken bir hata oluştu');
    }
  }

  // Kullanıcı istatistiklerini getir
  async getUserStats() {
    try {
      const response = await AuthService.api.get('/results/stats');

      return {
        total_analyses: response.data.total_analyses,
        average_posture_score: response.data.average_posture_score,
        weekly_progress: response.data.weekly_progress || [],
        risk_distribution: response.data.risk_distribution || [],
        improvement_trend: response.data.improvement_trend || [],
        last_analysis_date: response.data.last_analysis_date,
      };
    } catch (error) {
      console.error('İstatistik getirme hatası:', error);
      
      // Hata durumunda örnek veri döndür
      return {
        total_analyses: 45,
        average_posture_score: 78,
        weekly_progress: [65, 70, 75, 72, 78, 80, 78],
        risk_distribution: [
          { name: 'İyi', count: 27, percentage: 60 },
          { name: 'Orta', count: 11, percentage: 25 },
          { name: 'Yüksek', count: 7, percentage: 15 },
        ],
        improvement_trend: 'positive',
        last_analysis_date: new Date().toISOString(),
      };
    }
  }

  // Fotoğraf ile kalibrasyon yap
  async calibrateWithPhoto(formData) {
    try {
      const response = await AuthService.api.post('/posture/calibrate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Kalibrasyon hatası:', error);
      throw new Error(
        error.response?.data?.detail || 'Kalibrasyon sırasında bir hata oluştu'
      );
    }
  }

  // Kalibrasyon verilerini getir
  async getCalibration() {
    try {
      const response = await AuthService.api.get('/calibration');
      return response.data;
    } catch (error) {
      console.error('Kalibrasyon getirme hatası:', error);
      return null;
    }
  }

  // Kalibrasyon kaydet
  async saveCalibration(calibrationData) {
    try {
      const response = await AuthService.api.post('/calibration', calibrationData);
      return response.data;
    } catch (error) {
      console.error('Kalibrasyon kaydetme hatası:', error);
      throw new Error('Kalibrasyon kaydedilirken bir hata oluştu');
    }
  }

  // Kalibrasyon güncelle
  async updateCalibration(calibrationData) {
    try {
      const response = await AuthService.api.put('/calibration', calibrationData);
      return response.data;
    } catch (error) {
      console.error('Kalibrasyon güncelleme hatası:', error);
      throw new Error('Kalibrasyon güncellenirken bir hata oluştu');
    }
  }

  // AI raporu oluştur
  async generateAIReport(analysisIds = []) {
    try {
      const response = await AuthService.api.post('/report/generate', {
        analysis_ids: analysisIds,
        report_type: 'comprehensive'
      });

      return {
        report_id: response.data.report_id,
        content: response.data.content,
        recommendations: response.data.recommendations || [],
        charts_data: response.data.charts_data || {},
        generated_at: response.data.generated_at,
      };
    } catch (error) {
      console.error('AI rapor oluşturma hatası:', error);
      throw new Error('AI raporu oluşturulurken bir hata oluştu');
    }
  }

  // Eşik değerlerini getir
  async getThresholds() {
    try {
      const response = await AuthService.api.get('/posture/thresholds');
      return response.data;
    } catch (error) {
      console.error('Eşik değerleri getirme hatası:', error);
      
      // Varsayılan eşik değerleri
      return {
        back_angle_threshold: 15,
        neck_angle_threshold: 20,
        confidence_threshold: 0.7,
        risk_levels: {
          good: { min: 80, max: 100 },
          moderate: { min: 60, max: 79 },
          high: { min: 0, max: 59 }
        }
      };
    }
  }

  // Risk seviyesi metnini çevir
  getRiskLevelText(riskLevel) {
    const riskMap = {
      'good': 'İyi',
      'moderate': 'Orta',
      'high': 'Yüksek',
      'low': 'İyi',
      'medium': 'Orta',
      'critical': 'Yüksek'
    };

    return riskMap[riskLevel?.toLowerCase()] || riskLevel || 'Bilinmiyor';
  }

  // Postur skoruna göre renk döndür
  getScoreColor(score) {
    if (score >= 80) return '#10B981'; // Yeşil
    if (score >= 60) return '#F59E0B'; // Sarı
    return '#EF4444'; // Kırmızı
  }

  // Risk seviyesine göre renk döndür
  getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'İyi':
        return '#10B981';
      case 'Orta':
        return '#F59E0B';
      case 'Yüksek':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  }

  // Postur önerilerini getir
  getPostureTips() {
    return [
      {
        title: 'Doğru Oturuş',
        description: 'Ayaklarınızı yere düz koyun, sırtınızı dik tutun.',
        icon: 'chair',
      },
      {
        title: 'Ekran Mesafesi',
        description: 'Ekranınızı göz hizasında ve 50-70 cm mesafede tutun.',
        icon: 'computer',
      },
      {
        title: 'Düzenli Molalar',
        description: 'Her 30 dakikada bir kalkıp hareket edin.',
        icon: 'schedule',
      },
      {
        title: 'Boyun Pozisyonu',
        description: 'Boyununuzu öne eğmekten kaçının, düz tutun.',
        icon: 'accessibility',
      },
    ];
  }
}

export default new PostureService();
