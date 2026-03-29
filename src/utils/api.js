const BASE_URL = 'https://attendance-tracking-system-1cbj.onrender.com';

export const apiFetch = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}/api${endpoint}`, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body,
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("❌ Backend returned HTML:", text);
    alert("Backend not responding correctly");
    throw new Error("Invalid JSON");
  }
};