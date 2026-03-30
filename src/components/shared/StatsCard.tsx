import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
}

const StatsCard = ({ title, value, change, icon: Icon, trend = 'neutral' }: StatsCardProps) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    className="card-sheet p-6"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="mt-2 text-3xl font-serif">{value}</p>
        {change && (
          <p className={`mt-1 text-sm font-medium ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {change}
          </p>
        )}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
        <Icon className="h-6 w-6 text-accent" />
      </div>
    </div>
  </motion.div>
);

export default StatsCard;
