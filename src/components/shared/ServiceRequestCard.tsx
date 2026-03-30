import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ServiceRequestCardProps {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  room: string;
  createdAt: string;
  onUpdateStatus?: (id: string, status: string) => void;
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-accent/10 text-accent' },
  in_progress: { label: 'In Progress', icon: AlertCircle, className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'bg-success/10 text-success' },
};

const ServiceRequestCard = ({ type, description, status, room, createdAt, onUpdateStatus, id }: ServiceRequestCardProps) => {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card-sheet p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{type}</h4>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Room {room}</span>
        <span>{createdAt}</span>
      </div>
      {onUpdateStatus && status !== 'completed' && (
        <div className="flex gap-2 mt-1">
          {status === 'pending' && (
            <button
              onClick={() => onUpdateStatus(id, 'in_progress')}
              className="text-xs px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Start
            </button>
          )}
          {status === 'in_progress' && (
            <button
              onClick={() => onUpdateStatus(id, 'completed')}
              className="text-xs px-3 py-1.5 rounded-lg bg-success text-success-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Complete
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ServiceRequestCard;
