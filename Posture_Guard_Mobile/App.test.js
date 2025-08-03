import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Basit test uygulaması
export default function App() {
  const handleTestPress = () => {
    Alert.alert('Test Başarılı!', 'React Native uygulamanız çalışıyor!');
  };

  const handlePostureTest = () => {
    // PostureService'i test et
    try {
      const PostureService = require('./src/services/PostureService').default;
      const service = new PostureService();
      Alert.alert('PostureService', 'PostureService başarıyla yüklendi!');
    } catch (error) {
      Alert.alert('Hata', `PostureService yüklenemedi: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <Text style={styles.title}>PostureGuard Mobile Test</Text>
      <Text style={styles.subtitle}>React Native Uygulaması Çalışıyor! 🎉</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleTestPress}>
        <Text style={styles.buttonText}>Temel Test</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handlePostureTest}>
        <Text style={styles.buttonText}>PostureService Test</Text>
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>✅ React Native: Çalışıyor</Text>
        <Text style={styles.infoText}>✅ Expo SDK: 53.0.0</Text>
        <Text style={styles.infoText}>✅ iPhone Uyumlu</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    minWidth: 200,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  infoText: {
    color: '#4CAF50',
    fontSize: 14,
    marginVertical: 2,
  },
});
