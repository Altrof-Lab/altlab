import axios, { AxiosInstance } from 'axios';

/**
 * Creates an isolated Axios HTTP Client instance for a specific SpyHub node.
 * Uses a fast-fail 1500ms timeout so offline nodes do not block UI queries.
 */
export const createSpyhubHttpClient = (nodeUrl: string, customTimeoutMs: number = 1500): AxiosInstance => {
  const instance = axios.create({
    baseURL: nodeUrl,
    timeout: customTimeoutMs, // 1.5s fast-fail timeout
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
      // Silent log for fast fail timeouts
      if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
        console.warn(`[SpyHub Node ${nodeUrl}] Offline/Timeout (Fast-fail ${customTimeoutMs}ms)`);
      } else {
        console.warn(`[SpyHub Node ${nodeUrl} Error] ${status || 'OFFLINE'}: ${message}`);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};
