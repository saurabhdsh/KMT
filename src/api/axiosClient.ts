import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:4000",
  timeout: 30000,
});

// TODO: Attach auth headers / interceptors as needed.
axiosClient.interceptors.request.use((config) => {
  // e.g. config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor to handle errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract error message from response
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

