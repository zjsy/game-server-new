import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

interface TokenStorage {
  token?: string;
  refreshToken?: string;
}

interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
}

interface AxiosClientConfig {
  baseURL?: string;
  timeout?: number;
  tokenStorage: TokenStorage;
  refreshTokenUrl?: string;
  onRefreshTokenFailed?: () => void;
}

class AxiosClient {
  private axiosInstance: AxiosInstance;
  private tokenStorage: TokenStorage;
  private refreshTokenUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  private onRefreshTokenFailed?: () => void;

  constructor(config: AxiosClientConfig) {
    const { baseURL, timeout = 10000, tokenStorage, refreshTokenUrl = '/api/auth/refresh', onRefreshTokenFailed } = config;

    this.tokenStorage = tokenStorage;
    this.refreshTokenUrl = refreshTokenUrl;
    this.onRefreshTokenFailed = onRefreshTokenFailed;

    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器：自动注入 token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.tokenStorage.token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器：处理 token 过期
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // 如果是 401 错误且不是刷新 token 请求本身，尝试刷新 token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (originalRequest.url === this.refreshTokenUrl) {
            // 刷新 token 失败，清除 token 并执行回调
            this.tokenStorage.token = undefined;
            this.tokenStorage.refreshToken = undefined;
            this.onRefreshTokenFailed?.();
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          if (this.isRefreshing) {
            // 如果正在刷新 token，将请求加入队列
            return new Promise((resolve) => {
              this.subscribeTokenRefresh((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.axiosInstance(originalRequest));
              });
            });
          }

          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.isRefreshing = false;
            this.onRefreshed(newToken);
            
            // 使用新 token 重试原始请求
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.tokenStorage.token = undefined;
            this.tokenStorage.refreshToken = undefined;
            this.onRefreshTokenFailed?.();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = this.tokenStorage.refreshToken;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<RefreshTokenResponse>(
        this.refreshTokenUrl,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { token, refreshToken: newRefreshToken } = response.data;
      
      this.tokenStorage.token = token;
      if (newRefreshToken) {
        this.tokenStorage.refreshToken = newRefreshToken;
      }

      return token;
    } catch (error) {
      throw error;
    }
  }

  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  // 封装常用的请求方法
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }

  // 获取原始 axios 实例（用于特殊场景）
  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// 创建默认的 axios 客户端实例
export const createAxiosClient = (config: AxiosClientConfig): AxiosClient => {
  return new AxiosClient(config);
};

// 导出类型
export type { TokenStorage, RefreshTokenResponse, AxiosClientConfig };
export { AxiosClient };
