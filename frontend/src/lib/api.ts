import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api",
  timeout: 60000, 
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth interceptor if needed later
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("dev_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("dev_token");
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const fetcher = (url: string) => api.get(url).then((res) => res.data);
