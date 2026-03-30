import api from './api';

export interface AuditLog {
  _id: string;
  action: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  details: string;
  resourceId?: string;
  resourceType?: string;
  createdAt: string;
}

export const auditService = {
  getAll: () => api.get<AuditLog[]>('/audit').then(r => r.data),
};
