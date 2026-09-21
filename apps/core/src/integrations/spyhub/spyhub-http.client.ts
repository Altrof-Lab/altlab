import axios, { AxiosInstance } from 'axios';

/**
 * Creates an isolated Axios HTTP Client instance for a specific SpyHub node.
 */
export const createSpyhubHttpClient = (nodeUrl: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: nodeUrl,
    timeout: 5000, // 5s timeout to handle offline nodes quickly
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.detail || error.message;
      console.warn(`[SpyHub Node ${nodeUrl} Error] ${status || 'OFFLINE'}: ${message}`);
      return Promise.reject(error);
    }
  );

  return instance;
};
