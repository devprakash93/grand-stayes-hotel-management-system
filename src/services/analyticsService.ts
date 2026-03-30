import api from './api';

export interface AnalyticsDashboard {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: string;
  totalBookings: number;
  totalRevenue: number;
  monthlyRevenue: { label: string; revenue: number; bookings: number }[];
}

export interface Payment {
  _id: string;
  booking: { _id: string };
  amount: number;
  method: 'cash' | 'card' | 'online';
  status: 'pending' | 'completed' | 'refunded';
  transactionId?: string;
  createdAt: string;
}

export const analyticsService = {
  getDashboard: () => api.get<AnalyticsDashboard>('/analytics/dashboard').then(r => r.data),
};

export const paymentService = {
  create: (data: { bookingId: string; amount: number; method: string; transactionId?: string }) =>
    api.post<Payment>('/payments', data).then(r => r.data),

  getAll: () => api.get<Payment[]>('/payments').then(r => r.data),
};
