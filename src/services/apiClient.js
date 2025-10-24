const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.api.apiKey,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.info('API Request', {
          method: config.method,
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('API Response', {
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        logger.error('API Response Error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async makeRequest(action, data) {
    try {
      const payload = {
        action,
        id_telegram: config.api.defaultIdTelegram,
        password: config.api.defaultPassword,
        ...data,
      };

      const response = await this.client.post('', payload);
      return response.data;
    } catch (error) {
      logger.error('API Request Failed', {
        action,
        error: error.message,
        response: error.response?.data,
      });
      throw error;
    }
  }
}

module.exports = new ApiClient();
