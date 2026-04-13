import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "@/constants/api";
import { normalizeApiError } from "../../utils/errorHandler";
import type { ApiError } from "../../types/error";

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
}

class AxiosService {
  private static instance: AxiosService;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshPromise: Promise<AxiosResponse<unknown>> | null = null;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL || "http://localhost:5000",
      timeout: 50000,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.setupInterceptors();
  }

  public static getInstance(): AxiosService {
    if (!AxiosService.instance) {
      AxiosService.instance = new AxiosService();
    }
    return AxiosService.instance;
  }

  public get client(): AxiosInstance {
    return this.axiosInstance;
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => config,
      (error: AxiosError) => Promise.reject(normalizeApiError(error))
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const status = error.response?.status;
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const requestUrl = String(originalRequest?.url || "");
        const isAuthEndpoint =
          requestUrl.includes("/api/auth/login") ||
          requestUrl.includes("/api/auth/signup") ||
          requestUrl.includes("/api/auth/refresh") ||
          requestUrl.includes("/api/auth/logout");

        if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          try {
            if (!this.isRefreshing) {
              this.isRefreshing = true;
              this.refreshPromise = this.axiosInstance.post("/api/auth/refresh");
            }
            await this.refreshPromise;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(normalizeApiError(refreshError));
          } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        const apiError: ApiError = normalizeApiError(error);
        return Promise.reject(apiError);
      }
    );
  }

  public async request<T = unknown>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.request<T>(config);
    return {
      data: response.data,
      status: response.status,
      message: response.statusText || "OK",
    };
  }

  public async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: "GET", url });
  }

  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: "POST", url, data });
  }

  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: "PUT", url, data });
  }

  public async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: "DELETE", url });
  }
}

export const axiosService = AxiosService.getInstance();
