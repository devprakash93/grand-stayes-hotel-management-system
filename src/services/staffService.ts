import api from './api';

export interface Staff {
  _id: string;
  name: string;
  email: string;
  role: 'staff';
}

export const staffService = {
  create: (data: { name: string; email: string; password?: string }) =>
    api.post<Staff>('/staff', data).then(r => r.data),
  
  getAll: () =>
    api.get<Staff[]>('/staff').then(r => r.data),
};

export interface Guest {
  _id: string;
  name: string;
  email: string;
  role: 'guest';
  phone?: string;
}

export const userService = {
  getGuests: () =>
    api.get<Guest[]>('/users/guests').then(r => r.data),
};
