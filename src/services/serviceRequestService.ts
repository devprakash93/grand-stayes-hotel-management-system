import api from './api';

export interface ServiceRequest {
  _id: string;
  guest: { _id: string; name: string };
  room: { _id: string; roomNumber: string };
  requestType: string;
  description?: string;
  price: number;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

export const serviceRequestService = {
  create: (data: { room: string; requestType: string; description?: string; price?: number }) =>
    api.post<ServiceRequest>('/service-requests', data).then(r => r.data),

  getAll: () => api.get<ServiceRequest[]>('/service-requests').then(r => r.data),

  updateStatus: (id: string, status: string) =>
    api.put<ServiceRequest>(`/service-requests/${id}`, { status }).then(r => r.data),
};
