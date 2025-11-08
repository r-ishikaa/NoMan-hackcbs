// API Configuration for React Native
// Note: For physical device testing, replace localhost with your machine's IP address
// Example: "http://192.168.1.X:5003"

const API_CONFIG = {
  // Backend URL - change this to your backend URL
  // For local development, use your machine's IP address
  // For production, use your deployed backend URL
  BASE_URL: typeof __DEV__ !== 'undefined' && __DEV__
    ? "http://localhost:5003"  // Change to your local IP for physical device testing: "http://192.168.1.X:5003"
    : "https://backend-1-kohl.vercel.app",

  // Get API URL
  getApiUrl: (endpoint) => {
    const baseUrl = API_CONFIG.BASE_URL.replace(/\/+$/, "");
    const path = String(endpoint || "").replace(/^\/+/, "");
    return `${baseUrl}/${path}`;
  },

  // Get auth headers
  getAuthHeaders: (token) => {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  },
};

export default API_CONFIG;

