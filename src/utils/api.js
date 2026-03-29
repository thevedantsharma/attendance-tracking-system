const BASE_URL = 'https://attendance-tracking-system-1cbj.onrender.com/api';

export const apiFetch = async (endpoint, options = {}) => {
  const { headers, ...rest } = options;

  const defaultOptions = {
    method: 'POST', // 🔥 FORCE POST (important)
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, defaultOptions);

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Server returned HTML instead of JSON:', text);
    throw new Error('Backend not responding correctly');
  }
};