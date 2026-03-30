import api from './api';

export const userService = {
  getMe: () => api.get('/users/me').then(r => r.data),

  syncUser: (data: {
    supabaseUserId: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  }) => api.post('/auth/sync-user', data).then(r => r.data),
};
