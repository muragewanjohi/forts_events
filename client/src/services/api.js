import axios from 'axios';

// Use relative URL for API - works for both local and remote access
// If VITE_API_URL is set, use it; otherwise use relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Offline queue for requests
class OfflineQueue {
  constructor() {
    this.queue = [];
    this.isOnline = navigator.onLine;
    this.init();
  }

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async add(request) {
    if (this.isOnline) {
      try {
        return await api(request);
      } catch (error) {
        if (!navigator.onLine) {
          this.queue.push({ request, timestamp: Date.now() });
          return Promise.reject({ offline: true, queued: true });
        }
        throw error;
      }
    } else {
      this.queue.push({ request, timestamp: Date.now() });
      return Promise.reject({ offline: true, queued: true });
    }
  }

  async processQueue() {
    while (this.queue.length > 0 && navigator.onLine) {
      const item = this.queue.shift();
      try {
        await api(item.request);
      } catch (error) {
        if (!navigator.onLine) {
          this.queue.unshift(item);
          break;
        }
        console.error('Failed to process queued request:', error);
      }
    }
  }
}

export const offlineQueue = new OfflineQueue();

