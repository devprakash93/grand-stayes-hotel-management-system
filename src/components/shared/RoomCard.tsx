import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Wifi, Wind, Tv, Coffee } from 'lucide-react';

interface RoomCardProps {
  id: string;
  image: string;
  name: string;
  type: string;
  price: number;
  capacity: number;
  available: boolean;
  amenities?: string[];
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  ac: <Wind className="h-3.5 w-3.5" />,
  tv: <Tv className="h-3.5 w-3.5" />,
  minibar: <Coffee className="h-3.5 w-3.5" />,
};

const FALLBACK_IMAGES: Record<string, string> = {
  suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800',
  deluxe: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800',
  standard: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&q=80&w=800',
  penthouse: 'https://images.unsplash.com/photo-1512918766671-ed6a07be301f?auto=format&fit=crop&q=80&w=800',
};

const RoomCard = ({ id, image, name, type, price, capacity, available, amenities = [] }: RoomCardProps) => (
  <motion.div
    whileHover={{ y: -8 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
  >
    <Link to={`/rooms/${id}`} className="block group">
      <div className="card-sheet overflow-hidden">
        <div className="aspect-[4/5] overflow-hidden relative">
          <img
            src={image || FALLBACK_IMAGES[type.toLowerCase()] || FALLBACK_IMAGES.standard}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {!available && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <span className="text-primary-foreground font-medium text-sm px-4 py-2 rounded-full bg-foreground/70 backdrop-blur-sm">
                Booked
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${available ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
              {available ? 'Available' : 'Booked'}
            </span>
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{type}</p>
          <h3 className="mt-1 text-lg font-serif">{name}</h3>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{capacity} guests</span>
            </div>
            <p className="text-lg font-semibold">
              ₹{price}<span className="text-sm font-normal text-muted-foreground">/night</span>
            </p>
          </div>
          {amenities.length > 0 && (
            <div className="mt-3 flex gap-2">
              {amenities.slice(0, 4).map((a) => (
                <span key={a} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {amenityIcons[a.toLowerCase()] || null}
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  </motion.div>
);

export default RoomCard;
