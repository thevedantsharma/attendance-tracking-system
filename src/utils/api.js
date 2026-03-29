const BASE_URL = 'https://attendance-tracking-system-1cbj.onrender.com/api';
export const apiFetch = async (endpoint, options = {}) => {
  const { headers, ...rest } = options;
  
  // Always include credentials (cookies)
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, defaultOptions);
  
  if (response.status === 401 && endpoint !== '/auth/login') {
    // Possibly trigger refresh token logic or logout
    // For now, let caller handle it or redirect to login
  }

  return response;
};
