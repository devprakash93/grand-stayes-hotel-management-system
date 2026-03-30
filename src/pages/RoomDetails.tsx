import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Wifi, Wind, Tv, Coffee, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import BookingForm from '@/components/shared/BookingForm';
import toast from 'react-hot-toast';
import { roomService, Room } from '@/services/roomService';
import { bookingService } from '@/services/bookingService';
import roomSuite from '@/assets/room-suite.jpg';
import roomDeluxe from '@/assets/room-deluxe.jpg';
import roomStandard from '@/assets/room-standard.jpg';
import roomPenthouse from '@/assets/room-penthouse.jpg';

const FALLBACK_IMAGES: Record<string, string> = {
  suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200',
  deluxe: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1200',
  standard: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&q=80&w=1200',
  penthouse: 'https://images.unsplash.com/photo-1512918766671-ed6a07be301f?auto=format&fit=crop&q=80&w=1200',
};

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-4 w-4" />,
  AC: <Wind className="h-4 w-4" />,
  TV: <Tv className="h-4 w-4" />,
  Minibar: <Coffee className="h-4 w-4" />,
};

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    if (id) {
      roomService.getById(id)
        .then(setRoom)
        .catch(() => toast.error('Error loading room details'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] space-y-4">
          <p className="text-xl font-serif">Room not found</p>
          <Link to="/rooms" className="text-accent hover:underline">Return to Rooms</Link>
        </div>
      </div>
    );
  }

  // Map backend room images or use fallbacks
  const images = room.images && room.images.length > 0 ? room.images : [
    FALLBACK_IMAGES[room.roomType.toLowerCase()] || FALLBACK_IMAGES.standard
  ];

  const prevImg = () => setCurrentImg((c) => (c - 1 + images.length) % images.length);
  const nextImg = () => setCurrentImg((c) => (c + 1) % images.length);

  const handleBook = async (data: { checkIn: Date; checkOut: Date; guests: number; total: number }) => {
    try {
      await bookingService.create({
        room: room._id,
        checkInDate: data.checkIn.toISOString(),
        checkOutDate: data.checkOut.toISOString(),
        totalGuests: data.guests
      });
      
      toast.success('Booking confirmed! Redirecting to dashboard...', {
        style: { background: 'hsl(0 0% 7%)', color: 'white', borderRadius: '0' },
      });
      
      setTimeout(() => navigate('/guest-dashboard'), 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to confirm booking');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Link to="/rooms" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Rooms
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Images & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-2xl overflow-hidden aspect-[16/10]">
              <img src={images[currentImg]} alt={room.roomNumber} className="h-full w-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextImg} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImg(i)} className={`h-2 rounded-full transition-all ${i === currentImg ? 'w-6 bg-accent' : 'w-2 bg-card/60'}`} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setCurrentImg(i)} className={`rounded-xl overflow-hidden shrink-0 w-24 h-16 border-2 transition-colors ${i === currentImg ? 'border-accent' : 'border-transparent'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* Details */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent">{room.roomType}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-serif">Room {room.roomNumber}</h1>
              <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Up to {room.capacity} guests</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${room.status === 'available' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {room.status === 'available' ? 'Available' : 'Booked'}
                </span>
              </div>
              <p className="mt-6 text-muted-foreground leading-relaxed">{room.description || 'No description available for this room.'}</p>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-xl font-serif mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {room.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm">
                    {amenityIcons[a] || <Check className="h-4 w-4 text-accent" />}
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="mb-4 text-center">
                <p className="text-3xl font-serif">₹{room.pricePerNight}<span className="text-base font-sans text-muted-foreground">/night</span></p>
              </div>
              <BookingForm pricePerNight={room.pricePerNight} maxCapacity={room.capacity} onBook={handleBook} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
