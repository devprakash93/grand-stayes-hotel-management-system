import api from './api';

export interface Booking {
  _id: string;
  guest: { _id: string; name: string; email: string };
  room: { _id: string; roomNumber: string; roomType: string };
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  totalPrice: number;
  bookingStatus: 'pending' | 'reserved' | 'checked-in' | 'checked-out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
}

export const bookingService = {
  create: (data: { room: string; checkInDate: string; checkOutDate: string; totalGuests: number }) =>
    api.post<Booking>('/bookings', data).then(r => r.data),

  getMyBookings: () => api.get<Booking[]>('/bookings/my').then(r => r.data),

  getAll: () => api.get<Booking[]>('/bookings').then(r => r.data),

  cancel: (id: string) => api.put(`/bookings/cancel/${id}`).then(r => r.data),

  checkIn: (id: string) => api.post(`/bookings/checkin/${id}`).then(r => r.data),

  checkOut: (id: string) => api.post(`/bookings/checkout/${id}`).then(r => r.data),
  confirm: (id: string) => api.put(`/bookings/confirm/${id}`).then(r => r.data),
};
