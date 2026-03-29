const BASE_URL = 'https://attendance-tracking-system-1cbj.onrender.com/api';

export const apiFetch = async (endpoint, options = {}) => {
  const { headers, ...rest } = options;

  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  };

  // 🔥 FORCE POST for login automatically
  if (endpoint.includes('/auth/login') && !defaultOptions.method) {
    defaultOptions.method = 'POST';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, defaultOptions);

  // 🔥 HANDLE HTML ERROR SAFELY
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Not JSON response:', text);
    throw new Error('Server error - check backend');
  }
};