import { getAuthData } from './storage';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Centralized API client that automatically includes JWT token in all requests
 */
class ApiClient {
  /**
   * Make a fetch request with automatic token injection
   */
  private async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Get auth data and token
      const authData = getAuthData();
      
      if (!authData?.token) {
        throw new ApiError('Not authenticated - please login', 401);
      }

      // Merge headers with Authorization header
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${authData.token}`,
      };

      // Make the request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Parse response
      const data = await response.json();

      // Handle non-OK responses
      if (!response.ok) {
        throw new ApiError(
          data.message || `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      // Re-throw ApiErrors
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new ApiError('Network error - please check your connection');
      }

      // Handle other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience methods
export const { get, post, put, delete: del, patch } = apiClient;