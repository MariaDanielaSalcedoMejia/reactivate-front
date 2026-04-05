// Environment configuration
const getApiUrl = (): string => {
  // Browser environment
  if (typeof window !== 'undefined') {
    return (window as any).__API_URL__ || 'https://reactivate-back.onrender.com';
  }

  // SSR environment
  if (typeof global !== 'undefined') {
    return (global as any).__API_URL__ || 'https://reactivate-back.onrender.com';
  }

  // Fallback
  return 'https://reactivate-back.onrender.com';
};

export const API_CONFIG = {
  baseUrl: getApiUrl()
};
