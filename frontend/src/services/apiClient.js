import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}
const baseURL = rawUrl.replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for generic error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register';

      if (status === 401) {
        console.warn('Unauthorized access. Token may be invalid or expired.');
        if (!isAuthRoute) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.clear();
          window.location.href = '/login?expired=true';
        }
      } else if (status === 403) {
        console.warn('Forbidden. Account may be inactive.');
        if (!isAuthRoute) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.clear();
          
          if (data && data.message && data.message.includes('deactivated')) {
             window.location.href = `/login?inactive=true&message=${encodeURIComponent(data.message)}`;
          } else {
             window.location.href = '/login';
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
