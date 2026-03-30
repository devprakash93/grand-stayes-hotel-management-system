import api from './api';

export interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  capacity: number;
  floor: number;
  description?: string;
  amenities: string[];
  images: string[];
  status: 'available' | 'booked' | 'cleaning' | 'maintenance';
}

export const roomService = {
  getAll: () => api.get<Room[]>('/rooms').then(r => r.data),
  getById: (id: string) => api.get<Room>(`/rooms/${id}`).then(r => r.data),
  create: (data: Partial<Room>) => api.post<Room>('/rooms', data).then(r => r.data),
  update: (id: string, data: Partial<Room>) => api.put<Room>(`/rooms/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/rooms/${id}`).then(r => r.data),
};
