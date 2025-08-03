import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import AuthService from '../services/AuthService';
import PostureService from '../services/PostureService';
import { commonStyles, getCommonStyles } from '../theme/theme';
import { useTheme } from '../hooks/useTheme';

const screenWidth = Dimensions.get('window').width;


const MESH_TURKCE = {
  back_neck: 'Boyun Arkası',
  chest: 'Göğüs',
  front_neck: 'Boyun Önü',
  head: 'Baş',
  left_arm: 'Sol Kol',
  left_buttock: 'Sol Kalça',
  left_elbow: 'Sol Dirsek',
  left_foot: 'Sol Ayak',
  left_hand: 'Sol El',
  left_knee: 'Sol Diz',
  left_leg: 'Sol Bacak',
  left_shoulder: 'Sol Omuz',
  lower_back: 'Bel',
  right_arm: 'Sağ Kol',
  right_buttock: 'Sağ Kalça',
  right_elbow: 'Sağ Dirsek',
  right_foot: 'Sağ Ayak',
  right_hand: 'Sağ El',
  right_knee: 'Sağ Diz',
  right_leg: 'Sağ Bacak',
  right_shoulder: 'Sağ Omuz',
  upper_back: 'Üst Sırt'
};

export default function DashboardScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [postureInsights, setPostureInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('analiz');
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState(0);
  const [chartPeriod, setChartPeriod] = useState('7');
  const [refreshing, setRefreshing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    if (userProgress) {
      fetchChartData(parseInt(chartPeriod));
    } else {
      fetchUserData(parseInt(chartPeriod));
    }
  }, [chartPeriod]);

  useEffect(() => {
    fetchUserData(parseInt(chartPeriod));
    fetchAnalysisHistory();
  }, []);

  const fetchChartData = async (period = 7) => {
    try {
      setChartLoading(true);
      
      const response = await AuthService.api.get(`/results/daily-averages?days=${period}`);

      if (response.status === 200) {
        const dailyData = response.data;
        setUserProgress(prev => ({
          ...prev,
          daily_averages: dailyData.daily_averages,
          total_days: dailyData.total_days,
          days_with_analysis: dailyData.days_with_analysis
        }));
      }
    } catch (error) {
      console.error('Chart data fetch error:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchUserData = async (period = 7) => {
    try {
      setLoading(true);
      const user = await AuthService.getUser();
      setCurrentUser(user);
      
      const [dailyResponse, progressResponse, insightsResponse] = await Promise.all([
        AuthService.api.get(`/results/daily-averages?days=${period}`),
        AuthService.api.get('/posture_analyzer/user_progress'),
        AuthService.api.get('/posture_analyzer/posture_insights')
      ]);

      let combinedData = {};

      if (dailyResponse.status === 200) {
        const dailyData = dailyResponse.data;
        combinedData = {
          ...combinedData,
          daily_averages: dailyData.daily_averages,
          total_days: dailyData.total_days,
          days_with_analysis: dailyData.days_with_analysis
        };
      }

      if (progressResponse.status === 200) {
        const progressData = progressResponse.data;
        combinedData = {
          ...combinedData,
          analysis_period: progressData.analysis_period,
          calibration_status: progressData.calibration_status,
          progress_data: progressData.progress_data,
          recent_scores: progressData.recent_scores,
          recommendations: progressData.recommendations
        };
      }

      if (insightsResponse.status === 200) {
        const insightsData = insightsResponse.data;
        setPostureInsights(insightsData);
      }

      setUserProgress(combinedData);
    } catch (error) {
      console.error('Data fetch error:', error);
      setError('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserData(parseInt(chartPeriod)),
      fetchAnalysisHistory()
    ]);
    setRefreshing(false);
  };

  const fetchAnalysisHistory = async (page = 1) => {
    try {
      setHistoryLoading(true);
      const historyData = await PostureService.getAnalysisHistory(page, 10);
      if (page === 1) {
        setAnalysisHistory(historyData.analyses);
      } else {
        setAnalysisHistory(prev => [...prev, ...historyData.analyses]);
      }
      setHistoryPage(page);
    } catch (error) {
      console.error('Analysis history fetch error:', error);
      setError('Geçmiş veriler yüklenirken hata oluştu');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadMoreHistory = () => {
    if (!historyLoading) {
      fetchAnalysisHistory(historyPage + 1);
    }
  };

  const downloadPDFReport = async () => {
    try {
      const response = await AuthService.api.post('/reports/generate-pdf', {
        period: parseInt(chartPeriod),
        include_charts: true,
        include_recommendations: true
      });

      if (response.status === 200) {
        const blob = await response.blob();
        const fileUri = `${FileSystem.documentDirectory}posture_report_${new Date().getTime()}.pdf`;
        
        // Convert blob to base64 and save
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          } else {
            Alert.alert('Başarılı', 'PDF rapor kaydedildi');
          }
        };
        reader.readAsDataURL(blob);
      } else {
        Alert.alert('Hata', 'PDF rapor oluşturulamadı');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      Alert.alert('Hata', 'PDF rapor oluşturulamadı');
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'Kritik Seviye': return '#ef4444';
      case 'Çok Ciddi': return '#f97316';
      case 'Orta Risk': return '#fdba74';
      case 'Düşük Risk': return '#fef08a';
      case 'Sağlıklı': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Chart configuration matching web version
  const chartConfig = {
    backgroundGradientFrom: isDarkMode ? '#0f0f0f' : '#ffffff',
    backgroundGradientTo: isDarkMode ? '#1a1a1a' : '#f9fafb',
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      color: isDarkMode ? '#2d2d2d' : '#e5e5e5',
    },
  };

  const prepareChartData = () => {
    if (!userProgress?.daily_averages) {
      return {
        labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
        datasets: [{
          data: [0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
          strokeWidth: 3,
        }],
      };
    }

    // Backend'den gelen veri yapısına uygun olarak
    const labels = userProgress.daily_averages.map(item => {
      // day_label formatı: "dd/mm" şeklinde
      if (item.day_label) {
        return item.day_label;
      }
      // Eski format için fallback
      const date = new Date(item.date);
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    });
    
    const data = userProgress.daily_averages.map(item => item.average_score || 0);

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
        strokeWidth: 3,
      }],
    };
  };

  const dynamicStyles = getCommonStyles(isDarkMode);

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header matching web version */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>PostureGuard Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Hoş geldin, {currentUser?.username || 'Kullanıcı'}!
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab, 
              { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' },
              selectedTab === 'analiz' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('analiz')}
          >
            <Text style={[
              styles.tabText, 
              { color: isDarkMode ? '#ffffff' : '#000000' },
              selectedTab === 'analiz' && styles.activeTabText
            ]}>
              Analiz
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab, 
              { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' },
              selectedTab === 'istatistik' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('istatistik')}
          >
            <Text style={[
              styles.tabText, 
              { color: isDarkMode ? '#ffffff' : '#000000' },
              selectedTab === 'istatistik' && styles.activeTabText
            ]}>
              İstatistik
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab, 
              { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' },
              selectedTab === 'gecmis' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('gecmis')}
          >
            <Text style={[
              styles.tabText, 
              { color: isDarkMode ? '#ffffff' : '#000000' },
              selectedTab === 'gecmis' && styles.activeTabText
            ]}>
              Geçmiş
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'analiz' ? (
          <>
            {/* Analysis Tab Content */}
            {/* Calibration Status Card */}
            <View style={[styles.dashboardCard, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
              <View style={styles.cardHeader}>
                <Icon name="settings" size={24} color="#F59E0B" />
                <Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Kalibrasyon Durumu</Text>
              </View>
              <View style={styles.calibrationStatus}>
                <Text style={[styles.calibrationText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  {userProgress?.calibration_status || 'Kalibrasyon gerekli'}
                </Text>
              </View>
            </View>

            {/* Recent Analysis Card */}
            <View style={[styles.dashboardCard, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
              <View style={styles.cardHeader}>
                <Icon name="assessment" size={24} color="#4F46E5" />
                <Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Son Analizler</Text>
              </View>
              {userProgress?.recent_scores ? (
                <View style={styles.recentScores}>
                  {userProgress.recent_scores.slice(0, 5).map((score, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.scoreItem,
                        selectedAnalysisIndex === index && styles.selectedScoreItem
                      ]}
                      onPress={() => setSelectedAnalysisIndex(index)}
                    >
                      <View style={styles.scoreDate}>
                        <Text style={styles.scoreDateText}>
                          {formatDate(score.date)}
                        </Text>
                      </View>
                      <View style={styles.scoreValue}>
                        <Text style={styles.scoreValueText}>{score.score}%</Text>
                      </View>
                      <View style={[
                        styles.riskIndicator,
                        { backgroundColor: getRiskLevelColor(score.level) }
                      ]} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noDataText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Henüz analiz yok</Text>
              )}
            </View>

            {/* Risk Factors Card */}
            {userProgress?.recent_scores?.[selectedAnalysisIndex]?.risk_factors && (
              <View style={[styles.dashboardCard, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
                <View style={styles.cardHeader}>
                  <Icon name="warning" size={24} color="#F59E0B" />
                  <Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Risk Faktörleri</Text>
                </View>
                <View style={styles.riskFactors}>
                  {userProgress.recent_scores[selectedAnalysisIndex].risk_factors.map((risk, index) => (
                    <View key={index} style={styles.riskFactor}>
                      <Text style={styles.riskFactorMesh}>
                        {risk}
                      </Text>
                      <View style={[
                        styles.riskFactorLevel,
                        { backgroundColor: getRiskLevelColor('Orta Risk') }
                      ]}>
                        <Text style={styles.riskFactorLevelText}>Risk</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recommendations Card */}
            <View style={[styles.dashboardCard, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
              <View style={styles.cardHeader}>
                <Icon name="lightbulb-outline" size={24} color="#10B981" />
                <Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Öneriler</Text>
              </View>
              {userProgress?.recommendations ? (
                <View style={styles.recommendations}>
                  {userProgress.recommendations.map((rec, index) => (
                    <Text key={index} style={[styles.recommendationItem, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>• {rec}</Text>
                  ))}
                </View>
              ) : (
                <View style={styles.recommendations}>
                  <Text style={[styles.recommendationItem, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>• Düzenli analiz yapın</Text>
                  <Text style={[styles.recommendationItem, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>• Kalibrasyon yapın</Text>
                  <Text style={[styles.recommendationItem, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>• Egzersizlerinizi takip edin</Text>
                </View>
              )}
            </View>
          </>
        ) : selectedTab === 'istatistik' ? (
          <>
            {/* Statistics Tab Content */}
            {/* Period Selection */}
            <View style={styles.periodSelector}>
              <Text style={[styles.periodLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Periyot:</Text>
              {['7', '30', '90'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' },
                    chartPeriod === period && styles.activePeriodButton
                  ]}
                  onPress={() => setChartPeriod(period)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    { color: isDarkMode ? '#ffffff' : '#000000' },
                    chartPeriod === period && styles.activePeriodButtonText
                  ]}>
                    {period} gün
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Statistics Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.statCardGradient}
                >
                  <Icon name="analytics" size={32} color="#fff" />
                  <Text style={styles.statNumber}>
                    {userProgress?.recent_scores?.length || 0}
                  </Text>
                  <Text style={styles.statLabel}>Toplam Analiz</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.statCardGradient}
                >
                  <Icon name="trending-up" size={32} color="#fff" />
                  <Text style={styles.statNumber}>
                    {userProgress?.recent_scores?.length > 0 ? 
                      Math.round(userProgress.recent_scores.reduce((sum, score) => sum + score.score, 0) / userProgress.recent_scores.length) : 0}%
                  </Text>
                  <Text style={styles.statLabel}>Ortalama Skor</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.statCardGradient}
                >
                  <Icon name="calendar-today" size={32} color="#fff" />
                  <Text style={styles.statNumber}>
                    {userProgress?.total_days || 0}
                  </Text>
                  <Text style={styles.statLabel}>Aktif Gün</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.statCardGradient}
                >
                  <Icon name="trending-down" size={32} color="#fff" />
                  <Text style={styles.statNumber}>
                    {userProgress?.improvement_percentage ? 
                      `+${Math.round(userProgress.improvement_percentage)}%` : '0%'
                    }
                  </Text>
                  <Text style={styles.statLabel}>İyileşme</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Progress Chart */}
            {chartLoading ? (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Grafik yükleniyor...</Text>
              </View>
            ) : (
              <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff', borderColor: isDarkMode ? '#2d2d2d' : '#e5e5e5' }]}>
                <View style={styles.chartHeader}>
                  <Text style={[styles.chartTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Postur Skoru Trendi</Text>
                  <Text style={[styles.chartSubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                    Son {chartPeriod} günlük ortalama skorlar
                  </Text>
                </View>
                <LineChart
                  data={prepareChartData()}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withDots={true}
                  withShadow={false}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                />
                {userProgress?.daily_averages && (
                  <View style={[styles.chartStats, { borderTopColor: isDarkMode ? '#2d2d2d' : '#e5e5e5' }]}>
                    <View style={styles.chartStat}>
                      <Text style={[styles.chartStatLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                        En Yüksek
                      </Text>
                      <Text style={[styles.chartStatValue, { color: isDarkMode ? '#10B981' : '#059669' }]}>
                        {Math.max(...userProgress.daily_averages.map(item => item.average_score || 0))}%
                      </Text>
                    </View>
                    <View style={styles.chartStat}>
                      <Text style={[styles.chartStatLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                        En Düşük
                      </Text>
                      <Text style={[styles.chartStatValue, { color: isDarkMode ? '#EF4444' : '#DC2626' }]}>
                        {Math.min(...userProgress.daily_averages.filter(item => item.average_score > 0).map(item => item.average_score) || [0])}%
                      </Text>
                    </View>
                    <View style={styles.chartStat}>
                      <Text style={[styles.chartStatLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                        Ortalama
                      </Text>
                      <Text style={[styles.chartStatValue, { color: isDarkMode ? '#4F46E5' : '#3730A3' }]}>
                        {Math.round(userProgress.daily_averages.reduce((sum, item) => sum + (item.average_score || 0), 0) / userProgress.daily_averages.length)}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            {/* History Tab Content */}
            <View style={[styles.dashboardCard, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
              <View style={styles.cardHeader}>
                <Icon name="history" size={24} color="#4F46E5" />
                <Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Analiz Geçmişi</Text>
              </View>
              
              {historyLoading && analysisHistory.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={[styles.loadingText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Geçmiş yükleniyor...</Text>
                </View>
              ) : analysisHistory.length > 0 ? (
                <View style={styles.historyList}>
                  {analysisHistory.map((analysis, index) => (
                    <TouchableOpacity
                      key={analysis.log_id || index}
                      style={[styles.historyItem, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6' }]}
                    >
                      <View style={styles.historyHeader}>
                        <View style={styles.historyDate}>
                          <Text style={[styles.historyDateText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                            {formatDate(analysis.timestamp)}
                          </Text>
                        </View>
                        <View style={[
                          styles.historyScore,
                          { backgroundColor: PostureService.getScoreColor(analysis.personalized_score) }
                        ]}>
                          <Text style={styles.historyScoreText}>
                            {analysis.personalized_score}%
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.historyDetails}>
                        <View style={styles.historyDetail}>
                          <Icon name="analytics" size={16} color="#4F46E5" />
                          <Text style={[styles.historyDetailText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                            {analysis.analysis_type || 'Tam Vücut'}
                          </Text>
                        </View>
                        
                        <View style={styles.historyDetail}>
                          <Icon name="person" size={16} color="#10B981" />
                          <Text style={[styles.historyDetailText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                            {analysis.body_type_classification || 'NORMAL'}
                          </Text>
                        </View>
                        
                        <View style={styles.historyDetail}>
                          <Icon name="warning" size={16} color={PostureService.getRiskColor(analysis.risk_level)} />
                          <Text style={[styles.historyDetailText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                            {analysis.risk_level}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {historyLoading && (
                    <View style={styles.loadMoreContainer}>
                      <ActivityIndicator size="small" color="#4F46E5" />
                      <Text style={[styles.loadMoreText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                        Daha fazla yükleniyor...
                      </Text>
                    </View>
                  )}
                  
                  {!historyLoading && analysisHistory.length > 0 && (
                    <TouchableOpacity
                      style={styles.loadMoreButton}
                      onPress={loadMoreHistory}
                    >
                      <Text style={styles.loadMoreButtonText}>Daha Fazla Göster</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.noHistoryContainer}>
                  <Icon name="history" size={48} color="#9CA3AF" />
                  <Text style={[styles.noHistoryText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                    Henüz analiz geçmişi yok
                  </Text>
                  <Text style={[styles.noHistorySubtext, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>
                    İlk analizinizi yapmak için fotoğraf yükleyin
                  </Text>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => navigation.navigate('Upload')}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.uploadButtonGradient}
                    >
                      <Icon name="cloud-upload" size={20} color="#fff" />
                      <Text style={styles.uploadButtonText}>Fotoğraf Yükle</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRefresh}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              style={styles.actionButtonGradient}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Verileri Yenile</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={downloadPDFReport}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.actionButtonGradient}
            >
              <Icon name="file-download" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>PDF Rapor İndir</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Navigation */}
        <View style={styles.quickNavContainer}>
          <TouchableOpacity
            style={styles.quickNavButton}
            onPress={() => navigation.navigate('Upload')}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.quickNavGradient}
            >
              <Icon name="cloud-upload" size={24} color="#F59E0B" />
              <Text style={styles.actionButtonText}>Fotoğraf Yükle</Text>
              <Icon name="arrow-forward" size={20} color="#9CA3AF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000', fontWeight: '400' }]}>Son Aktiviteler</Text>
          
          <View style={[styles.activityItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <Icon name="check-circle" size={20} color="#10B981" />
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Postur analizi tamamlandı</Text>
              <Text style={[styles.activityTime, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>2 saat önce</Text>
            </View>
          </View>

          <View style={[styles.activityItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <Icon name="warning" size={20} color="#F59E0B" />
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Postur uyarısı alındı</Text>
              <Text style={[styles.activityTime, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>5 saat önce</Text>
            </View>
          </View>

          <View style={[styles.activityItem, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
            <Icon name="settings" size={20} color="#4F46E5" />
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Kalibrasyon güncellendi</Text>
              <Text style={[styles.activityTime, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>1 gün önce</Text>
            </View>
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
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#fff',
  },
  dashboardCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  recentScores: {
    gap: 10,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  selectedScoreItem: {
    borderColor: '#4F46E5',
    backgroundColor: '#1a1a3a',
  },
  scoreDate: {
    flex: 1,
  },
  scoreDateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scoreValue: {
    marginRight: 10,
  },
  scoreValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  riskFactors: {
    gap: 8,
  },
  riskFactor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  riskFactorMesh: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  riskFactorLevel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskFactorLevelText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  recommendations: {
    gap: 8,
  },
  recommendationItem: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  periodLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  activePeriodButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activePeriodButtonText: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 25,
  },
  statCard: {
    width: (screenWidth - 55) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  chartLoadingContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 16,
    padding: 40,
    borderWidth: 1,
    borderColor: '#2d2d2d',
    alignItems: 'center',
  },
  chartContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  quickNavContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  quickNavButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickNavGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  quickNavText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  recentActivity: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityText: {
    color: '#fff',
    fontSize: 14,
  },
  activityTime: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  // History styles
  historyList: {
    gap: 12,
  },
  historyItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    flex: 1,
  },
  historyDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  historyScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyDetails: {
    gap: 8,
  },
  historyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDetailText: {
    fontSize: 14,
    flex: 1,
  },
  loadMoreContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
  },
  loadMoreButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noHistoryContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  noHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  noHistorySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  uploadButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  calibrationStatus: {
    paddingVertical: 8,
  },
  calibrationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  chartHeader: {
    marginBottom: 15,
  },
  chartSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2d2d2d',
  },
  chartStat: {
    alignItems: 'center',
  },
  chartStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  chartStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
