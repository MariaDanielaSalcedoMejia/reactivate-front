// Environment configuration
export class ApiConfig {
  static getBaseUrl(): string {
    // Browser environment - use relative path (Express will proxy it)
    if (typeof window !== 'undefined') {
      return '';  // Relative to same origin
    }
    // SSR environment - use absolute URL for internal requests
    if (typeof global !== 'undefined') {
      return 'https://reactivate-back.onrender.com';
    }
    return '';
  }
}

export const API_CONFIG = {
  get baseUrl() {
    return ApiConfig.getBaseUrl();
  }
};
