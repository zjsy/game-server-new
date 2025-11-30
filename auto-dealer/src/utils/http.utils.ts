import { getTauriVersion } from "@tauri-apps/api/app";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

async function isTauri() {
  try {
    const version = await getTauriVersion();
    return !!version;
  } catch (error) {
    return false;
  }
}

export async function httpFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  if (await isTauri()) {
    // Tauri 环境：使用插件
    return await tauriFetch(url, options as any);
  } else {
    // 浏览器环境：使用原生 fetch
    return await fetch(url, options);
  }
}

interface TokenStorage {
  token?: string;
  refreshToken?: string;
}

interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
}

interface FetchClientConfig {
  baseURL?: string;
  timeout?: number;
  tokenStorage: TokenStorage;
  refreshTokenUrl?: string;
  onRefreshTokenFailed?: () => void;
}

class FetchClient {
  private tokenStorage: TokenStorage;
  private baseURL?: string;
  private refreshTokenUrl: string;
  private timeout: number;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  private onRefreshTokenFailed?: () => void;

  constructor(config: FetchClientConfig) {
    const {
      baseURL,
      timeout = 10000,
      tokenStorage,
      refreshTokenUrl = "/api/auth/refresh",
      onRefreshTokenFailed,
    } = config;

    this.baseURL = baseURL;
    this.timeout = timeout;
    this.tokenStorage = tokenStorage;
    this.refreshTokenUrl = refreshTokenUrl;
    this.onRefreshTokenFailed = onRefreshTokenFailed;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const fullUrl = this.baseURL ? `${this.baseURL}${url}` : url;

    // 注入 token
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (this.tokenStorage.token) {
      headers["Authorization"] = `Bearer ${this.tokenStorage.token}`;
    }

    try {
      const response = await httpFetch(fullUrl, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // 如果是刷新 token 请求失败
        if (url === this.refreshTokenUrl) {
          this.tokenStorage.token = undefined;
          this.tokenStorage.refreshToken = undefined;
          this.onRefreshTokenFailed?.();
          throw new Error("Refresh token failed");
        }

        // 尝试刷新 token
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const newToken = await this.refreshToken();
            this.isRefreshing = false;
            this.onRefreshed(newToken);
          } catch (err) {
            this.isRefreshing = false;
            this.tokenStorage.token = undefined;
            this.tokenStorage.refreshToken = undefined;
            this.onRefreshTokenFailed?.();
            throw err;
          }
        }

        // 等待刷新完成后重试
        return new Promise<T>((resolve, reject) => {
          this.subscribeTokenRefresh(async (token: string) => {
            try {
              const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${token}`,
              };
              const retryResponse = await httpFetch(fullUrl, {
                ...options,
                headers: retryHeaders,
              });
              resolve(await retryResponse.json());
            } catch (err) {
              reject(err);
            }
          });
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (err) {
      throw err;
    }
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = this.tokenStorage.refreshToken;
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await httpFetch(this.refreshTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data: RefreshTokenResponse = await response.json();
    this.tokenStorage.token = data.token;
    if (data.refreshToken) {
      this.tokenStorage.refreshToken = data.refreshToken;
    }
    return data.token;
  }

  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  // 封装常用方法
  public get<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: "GET" });
  }

  public post<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : "{}",
    });
  }

  public put<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : "{}",
    });
  }

  public patch<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : "{}",
    });
  }

  public delete<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: "DELETE" });
  }
}

// 工厂函数
export const createFetchClient = (config: FetchClientConfig): FetchClient => {
  return new FetchClient(config);
};

export type { TokenStorage, RefreshTokenResponse, FetchClientConfig };
export { FetchClient };
