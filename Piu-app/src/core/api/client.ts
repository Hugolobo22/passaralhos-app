import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import { tokenManager } from "../auth/tokenManager";

// Emuladores: Android usa 10.0.2.2, iOS usa localhost.
// Dispositivo físico: troque DEV_HOST pelo IP da sua máquina na rede (ex: "192.168.1.x").
const DEV_HOST = Platform.select({ android: "192.168.1.229", default: "localhost" });
const BASE_URL = __DEV__
  ? `http://${DEV_HOST}:8000/api/v1`
  : "https://api.passaralhos.app/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Interceptor de Request: injeta o Access Token ────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Interceptor de Response: renova token em 401 ────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v: string) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token!),
  );
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenManager.getRefreshToken();
        if (!refreshToken) throw new Error("Sem refresh token");

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        await tokenManager.saveTokens(data.access_token, data.refresh_token);
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenManager.clearTokens();
        // O authStore vai detectar tokens ausentes e redirecionar para login
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
