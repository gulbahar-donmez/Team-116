import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';

class APIService {
  constructor() {
    this.baseURL = Config.API_BASE_URL;
    this.setupInterceptors();
  }

  setupInterceptors() {
    axios.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          // Handle navigation to login screen
          // You'll need to implement a way to handle this
        }
        return Promise.reject(error);
      }
    );
  }

  async get(endpoint) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post(endpoint, data) {
    try {
      const response = await axios.post(`${this.baseURL}${endpoint}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put(endpoint, data) {
    try {
      const response = await axios.put(`${this.baseURL}${endpoint}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete(endpoint) {
    try {
      const response = await axios.delete(`${this.baseURL}${endpoint}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  handleError(error) {
    console.error('API Error:', {
      message: error.message,
      endpoint: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

export default new APIService();
