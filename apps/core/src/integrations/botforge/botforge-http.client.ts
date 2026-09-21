import axios, { AxiosInstance } from 'axios';

/**
 * Dedicated Axios HTTP Client instance configured for BotForge API communication.
 */
export const createBotforgeHttpClient = (baseURL?: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: baseURL || process.env.BOTFORGE_URL || 'http://localhost:8080',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request logging interceptor
  instance.interceptors.request.use(
    (config) => {
      // Optional logging or auth header injection
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response error handling interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      console.error(`[BotForge API Error] Status ${status}: ${message}`);
      return Promise.reject(error);
    }
  );

  return instance;
};
