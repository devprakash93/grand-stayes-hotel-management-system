import api from './api';

export interface Notification {
  _id: string;
  recipient?: string;
  recipientRole?: 'admin' | 'staff' | 'guest';
  title: string;
  message: string;
  type: 'booking_new' | 'booking_confirmed' | 'booking_cancelled' | 'service_request';
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  getAll: () => api.get<Notification[]>('/notifications').then(r => r.data),
  markRead: (ids: string[]) => api.put('/notifications/mark-read', { ids }).then(r => r.data),
};
