import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          console.error('Bad Request:', data.message || data.error);
          break;
        case 404:
          console.error('Not Found:', data.message || data.error);
          break;
        case 500:
          console.error('Server Error:', data.message || data.error);
          break;
        default:
          console.error('API Error:', data.message || data.error);
      }
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Generic methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  // Content API
  content: {
    // Blog posts
    getBlogPosts: (params = {}) => api.get('/content/blog', { params }),
    getBlogPost: (id) => api.get(`/content/blog/${id}`),
    createBlogPost: (data) => api.post('/content/blog', data),
    updateBlogPost: (id, data) => api.put(`/content/blog/${id}`, data),
    deleteBlogPost: (id) => api.delete(`/content/blog/${id}`),

    // Music sets
    getMusicSets: (params = {}) => api.get('/content/sets', { params }),
    getMusicSet: (id) => api.get(`/content/sets/${id}`),
    createMusicSet: (data) => api.post('/content/sets', data),
    updateMusicSet: (id, data) => api.put(`/content/sets/${id}`, data),
    deleteMusicSet: (id) => api.delete(`/content/sets/${id}`),

    // Tracks
    getTracks: (setId) => api.get(`/content/sets/${setId}/tracks`),
    createTrack: (setId, data) => api.post(`/content/sets/${setId}/tracks`, data),
    updateTrack: (id, data) => api.put(`/content/tracks/${id}`, data),
    deleteTrack: (id) => api.delete(`/content/tracks/${id}`),

    // Testimonials
    getTestimonials: (params = {}) => api.get('/content/testimonials', { params }),
    getTestimonial: (id) => api.get(`/content/testimonials/${id}`),
    createTestimonial: (data) => api.post('/content/testimonials', data),
    updateTestimonial: (id, data) => api.put(`/content/testimonials/${id}`, data),
    deleteTestimonial: (id) => api.delete(`/content/testimonials/${id}`),

    // Batch operations
    batchOperation: (operations) => api.post('/content/batch', { operations }),
  },

  // Media API
  media: {
    getGallery: (params = {}) => api.get('/media/gallery', { params }),
    getPhoto: (id) => api.get(`/media/gallery/${id}`),
    uploadPhotos: (formData) => api.post('/media/gallery/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updatePhoto: (id, data) => api.put(`/media/gallery/${id}`, data),
    deletePhoto: (id) => api.delete(`/media/gallery/${id}`),
    batchOperation: (action, photoIds, data = {}) =>
      api.post('/media/gallery/batch', { action, photoIds, data }),
    getCategories: () => api.get('/media/gallery/categories'),
    getStats: () => api.get('/media/gallery/stats'),
  },

  // Events API
  events: {
    getEvents: (params = {}) => api.get('/events', { params }),
    getEvent: (id) => api.get(`/events/${id}`),
    getEventBySlug: (slug) => api.get(`/events/slug/${slug}`),
    createEvent: (data) => api.post('/events', data),
    updateEvent: (id, data) => api.put(`/events/${id}`, data),
    deleteEvent: (id) => api.delete(`/events/${id}`),
    getUpcoming: (params = {}) => api.get('/events/public/upcoming', { params }),
    getFeatured: (params = {}) => api.get('/events/public/featured', { params }),
    getByCity: (city, params = {}) => api.get(`/events/city/${city}`, { params }),
    getByType: (type, params = {}) => api.get(`/events/type/${type}`, { params }),
    batchOperation: (action, eventIds, data = {}) =>
      api.post('/events/batch', { action, eventIds, data }),
    getStats: () => api.get('/events/stats/overview'),
    getCalendar: (year, month) => api.get(`/events/calendar/${year}/${month}`),
  },

  // Contact API
  contact: {
    getMessages: (params = {}) => api.get('/contact', { params }),
    getMessage: (id) => api.get(`/contact/${id}`),
    sendMessage: (data) => api.post('/contact', data),
    updateMessage: (id, data) => api.put(`/contact/${id}`, data),
    deleteMessage: (id) => api.delete(`/contact/${id}`),
    markAsRead: (id) => api.patch(`/contact/${id}/read`),
    markAsUnread: (id) => api.patch(`/contact/${id}/unread`),
    reply: (id, data) => api.post(`/contact/${id}/reply`, data),
    batchOperation: (action, messageIds, data = {}) =>
      api.post('/contact/batch', { action, messageIds, data }),
    getStats: () => api.get('/contact/stats/overview'),
    getUnreadCount: () => api.get('/contact/unread/count'),
  },

  // Settings API
  settings: {
    getAll: (params = {}) => api.get('/settings', { params }),
    getPublic: () => api.get('/settings/public'),
    get: (key) => api.get(`/settings/${key}`),
    create: (data) => api.post('/settings', data),
    update: (key, data) => api.put(`/settings/${key}`, data),
    updateValue: (key, value) => api.patch(`/settings/${key}`, { value }),
    delete: (key) => api.delete(`/settings/${key}`),
    batchUpdate: (configs) => api.post('/settings/batch', { configs }),
    reset: (key) => api.post(`/settings/${key}/reset`),
    getCategories: () => api.get('/settings/meta/categories'),
    initialize: () => api.post('/settings/init'),
  },

  // Analytics API
  analytics: {
    track: (data) => api.post('/analytics/track', data),
    get: (params = {}) => api.get('/analytics', { params }),
    getSummary: (params = {}) => api.get('/analytics/summary', { params }),
    getMetrics: (params = {}) => api.get('/analytics/metrics', { params }),
    getDaily: (params = {}) => api.get('/analytics/daily', { params }),
    getRealtime: () => api.get('/analytics/realtime'),
    cleanup: (days = 90) => api.delete('/analytics/cleanup', { params: { days } }),
  },
};

export default apiClient;

