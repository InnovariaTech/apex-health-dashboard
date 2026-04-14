import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "@/constants/api";
import { normalizeApiError } from "@/utils/errorHandler";
import type { ApiError } from "@/api/types";

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type QueueItem = {
  resolve: () => void;
  reject: (error: ApiError) => void;
};

class AxiosService {
  private static instance: AxiosService;
  private axiosInstance: AxiosInstance;

  private isRefreshing = false;
  private refreshQueue: QueueItem[] = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      timeout: 50000,
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
      (config: InternalAxiosRequestConfig) => {
        // Cookie-based auth only.
        // Do not inject Authorization headers here.
        return config;
      },
      (error: AxiosError) => Promise.reject(normalizeApiError(error))
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const normalizedError = normalizeApiError(error);
        const status = error.response?.status;
        const originalRequest = error.config as RetryableRequestConfig | undefined;
        const requestUrl = String(originalRequest?.url || "");

        const isAuthEndpoint =
          requestUrl.includes("/api/auth/login") ||
          requestUrl.includes("/api/auth/signup") ||
          requestUrl.includes("/api/auth/refresh") ||
          requestUrl.includes("/api/auth/logout");

        if (!originalRequest) {
          return Promise.reject(normalizedError);
        }

        if (status === 401 && !isAuthEndpoint && !originalRequest._retry) {
          originalRequest._retry = true;

          //if the token is refreshing, add the request to the queue
          if (this.isRefreshing) {
            return new Promise<AxiosResponse>((resolve, reject) => {
              this.refreshQueue.push({
                resolve: async () => {
                  try {
                    const response = await this.axiosInstance(originalRequest);
                    resolve(response);
                  } catch (retryError) {
                    reject(normalizeApiError(retryError));
                  }
                },
                reject: (queueError) => {
                  reject(queueError);
                },
              });
            });
          }

          // if the token is not refreshing, set the flag to true and refresh the token process will be started
          this.isRefreshing = true;

          try {
            await this.axiosInstance.post("/api/auth/refresh");
            this.processQueueSuccess();

            return await this.axiosInstance(originalRequest);
          } catch (refreshError) {
            const normalizedRefreshError = normalizeApiError(refreshError);

            this.processQueueFailure(normalizedRefreshError);

            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("auth:session-expired"));
            }

            return Promise.reject(normalizedRefreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(normalizedError);
      }
    );
  }

  // refresh token process is successful, resolve the request queue
  private processQueueSuccess(): void {
    //make a copy of the queue
    const queue = [...this.refreshQueue];
    //clear the queue for upcoming requests
    this.refreshQueue = [];

    //resolve the requests in the queue
    queue.forEach(({ resolve }) => resolve());
  }

// refresh token process is failed, reject the requests in the queue
  private processQueueFailure(error: ApiError): void {
    // make a copy of the queue
    const queue = [...this.refreshQueue];
    // clear the queue for upcoming requests
    this.refreshQueue = [];
    // reject the requests in the queue
    queue.forEach(({ reject }) => reject(error));
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
    return this.request<T>({
      ...config,
      method: "PUT",
      url,
      data,
    });
  }

  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: "PATCH",
      url,
      data,
    });
  }

  public async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: "DELETE",
      url,
    });
  }
}

export const axiosService = AxiosService.getInstance();
 
