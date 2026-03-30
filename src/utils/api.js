const BASE_URL = 'https://attendance-tracking-system-1cbj.onrender.com';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  return response; // Return raw response so callers can do .ok check + .json()
};