// import * as tf from '@tensorflow/tfjs';
// import * as poseDetection from '@tensorflow-models/pose-detection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import APIService from './APIService';

class CalibrationService {
  constructor() {
    this.calibrationData = null;
    this.isCalibrated = false;
  }

  async initializeModel() {
    // TensorFlow.js is not available in React Native
    // This method is disabled for now
    console.log('TensorFlow.js calibration is not available in React Native');
  }

  async calibrate(imageElement) {
    // TensorFlow.js is not available in React Native
    // This method is disabled for now
    console.log('TensorFlow.js calibration is not available in React Native');
    throw new Error('Calibration is not available in this version');
  }

  processCalibrationPose(pose) {
    // TensorFlow.js is not available in React Native
    // This method is disabled for now
    console.log('TensorFlow.js calibration is not available in React Native');
    return {
      angles: {},
      distances: {},
      timestamp: new Date().toISOString(),
    };
  }

  calculateNeckAngle(keypoints) {
    // TensorFlow.js is not available in React Native
    return null;
  }

  calculateBackAngle(keypoints) {
    // TensorFlow.js is not available in React Native
    return null;
  }

  calculateKneeAngle(keypoints) {
    // TensorFlow.js is not available in React Native
    return null;
  }

  calculateShoulderWidth(keypoints) {
    // TensorFlow.js is not available in React Native
    return null;
  }

  calculateHipWidth(keypoints) {
    // TensorFlow.js is not available in React Native
    return null;
  }

  calculateAngle(pointA, pointB, pointC) {
    // TensorFlow.js is not available in React Native
    return 0;
  }

  calculateDistance(pointA, pointB) {
    // TensorFlow.js is not available in React Native
    return 0;
  }

  async saveCalibrationData(calibrationData) {
    try {
      // Save locally
      await AsyncStorage.setItem('calibrationData', JSON.stringify(calibrationData));
      
      // Save to backend
      await APIService.post('/api/posture/calibration', calibrationData);
    } catch (error) {
      console.error('Save calibration error:', error);
      throw error;
    }
  }

  async getCalibrationData() {
    try {
      if (this.calibrationData) {
        return this.calibrationData;
      }

      // Try to get from local storage
      const localData = await AsyncStorage.getItem('calibrationData');
      if (localData) {
        this.calibrationData = JSON.parse(localData);
        this.isCalibrated = true;
        return this.calibrationData;
      }

      // If not in local storage, try to get from backend
      const backendData = await APIService.get('/api/posture/calibration');
      if (backendData) {
        await this.saveCalibrationData(backendData);
        this.calibrationData = backendData;
        this.isCalibrated = true;
        return backendData;
      }

      return null;
    } catch (error) {
      console.error('Get calibration data error:', error);
      return null;
    }
  }
}

export default new CalibrationService();
