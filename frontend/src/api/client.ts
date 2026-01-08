import axios from 'axios';
import { supabase, isAuthEnabled } from '@/lib/supabase';

// 开发环境：通过 Vite proxy 转发
// 生产环境：通过 nginx proxy 转发
const API_BASE_URL = '';

// 创建 axios 实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5分钟超时（AI生成可能很慢）
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    // Add Authorization header if auth is enabled
    if (isAuthEnabled && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        console.error('Failed to get session for auth header:', error);
      }
    }

    // 如果请求体是 FormData，删除 Content-Type 让浏览器自动设置
    // 浏览器会自动添加正确的 Content-Type 和 boundary
    if (config.data instanceof FormData) {
      // 不设置 Content-Type，让浏览器自动处理
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    } else if (config.headers && !config.headers['Content-Type']) {
      // 对于非 FormData 请求，默认设置为 JSON
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if we're already refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized - try to refresh token first
    if (error.response?.status === 401 && isAuthEnabled && supabase) {
      console.warn('401 received, attempting token refresh...');

      // Avoid multiple simultaneous refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !data.session) {
              console.error('Token refresh failed:', refreshError);
              return false;
            }
            console.log('Token refreshed successfully');
            return true;
          } catch (e) {
            console.error('Token refresh error:', e);
            return false;
          } finally {
            isRefreshing = false;
          }
        })();
      }

      // Wait for refresh to complete
      const refreshed = await refreshPromise;

      if (refreshed && error.config) {
        // Retry the original request with new token
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            error.config.headers.Authorization = `Bearer ${session.access_token}`;
            return apiClient.request(error.config);
          }
        } catch (retryError) {
          console.error('Retry after refresh failed:', retryError);
        }
      }

      // If refresh failed or retry failed, redirect to login
      console.error('Authentication failed - redirecting to login');
      localStorage.removeItem('currentProjectId');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 统一错误处理
    if (error.response) {
      // 服务器返回错误状态码
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('Network Error:', error.request);
    } else {
      // 其他错误
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// 图片URL处理工具
// 使用相对路径，通过代理转发到后端
export const getImageUrl = (path?: string, timestamp?: string | number): string => {
  if (!path) return '';
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // 使用相对路径（确保以 / 开头）
  let url = path.startsWith('/') ? path : '/' + path;
  
  // 添加时间戳参数避免浏览器缓存（仅在提供时间戳时添加）
  if (timestamp) {
    const ts = typeof timestamp === 'string' 
      ? new Date(timestamp).getTime() 
      : timestamp;
    url += `?v=${ts}`;
  }
  
  return url;
};

export default apiClient;

