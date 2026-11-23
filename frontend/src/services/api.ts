import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('expensely_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('expensely_refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('expensely_token');
        localStorage.removeItem('expensely_user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem('expensely_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('expensely_refresh_token', newRefreshToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('expensely_token');
        localStorage.removeItem('expensely_refresh_token');
        localStorage.removeItem('expensely_user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Endpoints
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  googleAuth: (data: any) => api.post('/auth/google', data),
  checkUsername: (username: string) => api.get(`/auth/check-username/${username}`),
  logout: (refreshToken?: string) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data)
};

export const userApi = {
  search: (q: string) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getByUsername: (username: string) => api.get(`/users/${username}`),
  updateProfile: (data: any) => api.patch('/users/profile', data)
};

export const friendApi = {
  getAll: () => api.get('/friends'),
  getRequests: () => api.get('/friends/requests'),
  sendRequest: (identifier: string) => api.post('/friends/request', { identifier }),
  acceptRequest: (id: string) => api.post(`/friends/accept/${id}`),
  rejectRequest: (id: string) => api.post(`/friends/reject/${id}`),
  removeFriend: (id: string) => api.delete(`/friends/${id}`)
};

export const groupApi = {
  getAll: () => api.get('/groups'),
  getById: (id: string) => api.get(`/groups/${id}`),
  create: (data: any) => api.post('/groups', data),
  update: (id: string, data: any) => api.patch(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
  invite: (id: string, identifier: string) => api.post(`/groups/${id}/invite`, { identifier }),
  joinByCode: (code: string) => api.post(`/groups/join/${code}`),
  removeMember: (groupId: string, memberId: string) => api.delete(`/groups/${groupId}/members/${memberId}`)
};

export const invitationApi = {
  getAll: () => api.get('/invitations'),
  accept: (id: string) => api.post(`/invitations/${id}/accept`),
  reject: (id: string) => api.post(`/invitations/${id}/reject`)
};

export const expenseApi = {
  getByGroup: (groupId: string, params?: any) => api.get(`/expenses/group/${groupId}`, { params }),
  getById: (id: string) => api.get(`/expenses/${id}`),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.patch(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`)
};

export const balanceApi = {
  getGroupBalances: (groupId: string) => api.get(`/balances/groups/${groupId}`),
  getSuggestions: (groupId: string) => api.get(`/balances/groups/${groupId}/suggestions`),
  getUserBalances: () => api.get('/balances/me')
};

export const settlementApi = {
  create: (data: any) => api.post('/settlements', data),
  getByGroup: (groupId: string) => api.get(`/settlements/group/${groupId}`),
  confirm: (id: string) => api.patch(`/settlements/${id}/confirm`),
  reject: (id: string) => api.patch(`/settlements/${id}/reject`)
};

export const analyticsApi = {
  getAnalytics: (params?: any) => api.get('/analytics', { params }),
  getCSVUrl: (groupId?: string) => `${API_BASE_URL}/analytics/export/csv${groupId ? `?groupId=${groupId}` : ''}`
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
};

export const activityApi = {
  getGroupActivities: (groupId: string) => api.get(`/activities/group/${groupId}`),
  getUserActivities: () => api.get('/activities/me')
};

export const uploadApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
