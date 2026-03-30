import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, CalendarDays, Users, Star, Wifi, UtensilsCrossed, Dumbbell, Car, Shield, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/shared/Navbar';
import RoomCard from '@/components/shared/RoomCard';
import heroImg from '@/assets/hero-hotel.jpg';
import roomSuite from '@/assets/room-suite.jpg';
import roomDeluxe from '@/assets/room-deluxe.jpg';
import roomStandard from '@/assets/room-standard.jpg';
import roomPenthouse from '@/assets/room-penthouse.jpg';

import { roomService, Room } from '@/services/roomService';

const amenities = [
  { icon: Wifi, label: 'High-Speed WiFi' },
  { icon: UtensilsCrossed, label: 'Fine Dining' },
  { icon: Dumbbell, label: 'Fitness Center' },
  { icon: Car, label: 'Valet Parking' },
  { icon: Shield, label: '24/7 Security' },
  { icon: Sparkles, label: 'Spa & Wellness' },
];

const testimonials = [
  { name: 'Sarah Mitchell', role: 'Travel Blogger', text: 'Grand Stays redefined what luxury means. Every detail was curated to perfection.', rating: 5 },
  { name: 'James Chen', role: 'Business Executive', text: 'The seamless booking experience and impeccable service made my trip unforgettable.', rating: 5 },
  { name: 'Elena Rossi', role: 'Interior Designer', text: 'The architecture and interior design of the suites are truly world-class.', rating: 5 },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const Home = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('');
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    roomService.getAll()
      .then(rooms => setFeaturedRooms(rooms.slice(0, 4)))
      .catch(() => console.error('Failed to load featured rooms'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchType) params.append('type', searchType);
    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Luxury hotel lobby" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/70" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-accent font-medium text-sm uppercase tracking-[0.2em] mb-4">Premium Hospitality</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-primary-foreground tracking-tight leading-[0.95]">
              The Art of<br />Staying.
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/80 max-w-lg mx-auto font-light">
              Experience curated luxury. Every room tells a story. Every stay becomes a memory.
            </p>
          </motion.div>

          {/* Booking bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 glass-panel max-w-3xl mx-auto p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 group focus-within:border-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent/80">Check-in</span>
                </div>
                <input type="text" placeholder="Select Date" className="bg-transparent text-sm text-white placeholder:text-white/40 outline-none w-full font-medium" />
              </div>
              <div className="flex flex-col gap-1 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 group focus-within:border-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent/80">Check-out</span>
                </div>
                <input type="text" placeholder="Select Date" className="bg-transparent text-sm text-white placeholder:text-white/40 outline-none w-full font-medium" />
              </div>
              <div className="flex flex-col gap-1 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 group focus-within:border-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent/80">Room Type</span>
                </div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="bg-transparent text-sm text-white outline-none w-full appearance-none cursor-pointer font-medium"
                >
                  <option value="" className="bg-neutral-900">Any Type</option>
                  <option value="single" className="bg-neutral-900">Single</option>
                  <option value="double" className="bg-neutral-900">Double</option>
                  <option value="deluxe" className="bg-neutral-900">Deluxe</option>
                  <option value="suite" className="bg-neutral-900">Suite</option>
                </select>
              </div>
              <Button 
                onClick={handleSearch}
                className="w-full h-full gold-gradient text-accent-foreground font-bold rounded-xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center py-4"
              >
                <Search className="h-5 w-5 mb-1" />
                <span className="text-xs uppercase tracking-widest">Search Rooms</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section id="rooms" className="py-24 container mx-auto px-4">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-accent text-sm font-medium uppercase tracking-[0.15em]">Curated Spaces</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-serif">Featured Rooms</h2>
          </motion.div>
          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
            ) : featuredRooms.map((room) => (
              <RoomCard 
                key={room._id} 
                id={room._id}
                image={room.images?.[0] || (room.roomType === 'suite' ? roomSuite : room.roomType === 'deluxe' ? roomDeluxe : roomStandard)}
                name={`Room ${room.roomNumber}`}
                type={room.roomType}
                price={room.pricePerNight}
                capacity={room.capacity}
                available={room.status === 'available'}
                amenities={room.amenities}
              />
            ))}
          </motion.div>
          <motion.div variants={fadeUp} className="text-center mt-12">
            <Link to="/rooms">
              <Button variant="outline" className="rounded-xl px-8">
                View All Rooms <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <p className="text-accent text-sm font-medium uppercase tracking-[0.15em]">World-Class</p>
              <h2 className="mt-3 text-4xl md:text-5xl font-serif">Hotel Amenities</h2>
            </motion.div>
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {amenities.map((a) => (
                <motion.div
                  key={a.label}
                  whileHover={{ y: -4 }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-background hover:shadow-lg transition-shadow"
                >
                  <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <a.icon className="h-7 w-7 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-center">{a.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-24 container mx-auto px-4">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-accent text-sm font-medium uppercase tracking-[0.15em]">Visual Journey</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-serif">Gallery</h2>
          </motion.div>
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[roomSuite, roomDeluxe, roomStandard, roomPenthouse].map((img, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }} className="overflow-hidden rounded-2xl aspect-square">
                <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <p className="text-accent text-sm font-medium uppercase tracking-[0.15em]">Guest Stories</p>
              <h2 className="mt-3 text-4xl md:text-5xl font-serif">Testimonials</h2>
            </motion.div>
            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <motion.div key={t.name} whileHover={{ y: -4 }} className="card-sheet p-8">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-foreground text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-2xl font-serif mb-4 text-accent">Grand Stays</h3>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">The art of staying. Premium hospitality redefined for the modern traveler.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 font-sans">Explore</h4>
              <div className="space-y-2">
                <Link to="/rooms" className="block text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Rooms</Link>
                <a href="#amenities" className="block text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Amenities</a>
                <a href="#gallery" className="block text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Gallery</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 font-sans">Support</h4>
              <div className="space-y-2">
                <Link to="/" className="block text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Contact</Link>
                <Link to="/" className="block text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">FAQ</Link>
                <Link to="/" className="block text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Privacy</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 font-sans">Contact</h4>
              <div className="space-y-2 text-sm text-primary-foreground/60">
                <p>hello@grandstays.com</p>
                <p>+1 (555) 123-4567</p>
                <p>123 Luxury Avenue</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/40">
            © 2026 Grand Stays. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
