import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronDown, Loader2 } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import RoomCard from '@/components/shared/RoomCard';
import { roomService, Room } from '@/services/roomService';

const Rooms = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'all';
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [availFilter, setAvailFilter] = useState('all');
  const [sort, setSort] = useState('price-asc');
  const [showFilters, setShowFilters] = useState(false);

  const ALL_AMENITIES = ['WiFi', 'TV', 'Mini Bar', 'Ocean View', 'Balcony', 'King Bed'];

  useEffect(() => {
    roomService.getAll()
      .then(setRooms)
      .catch(() => setError('Failed to load rooms. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const result = rooms.filter((r) => {
      if (search && !r.roomNumber.toLowerCase().includes(search.toLowerCase()) && !r.roomType.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && r.roomType.toLowerCase() !== typeFilter.toLowerCase()) return false;
      if (availFilter === 'available' && r.status !== 'available') return false;
      if (availFilter === 'booked' && r.status !== 'booked') return false;
      if (r.pricePerNight < priceRange.min || r.pricePerNight > priceRange.max) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every(a => r.amenities?.includes(a))) return false;
      return true;
    });
    result.sort((a, b) => {
      if (sort === 'price-asc') return a.pricePerNight - b.pricePerNight;
      if (sort === 'price-desc') return b.pricePerNight - a.pricePerNight;
      if (sort === 'capacity') return b.capacity - a.capacity;
      return 0;
    });
    return result;
  }, [rooms, search, typeFilter, availFilter, sort, priceRange.min, priceRange.max, selectedAmenities]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl md:text-5xl font-serif mb-2">Our Rooms</h1>
          <p className="text-muted-foreground mb-8">Find your perfect stay from our curated collection.</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 flex items-center gap-2 bg-card rounded-xl px-4 py-3 card-sheet">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="bg-transparent text-sm outline-none w-full"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 px-4 py-3 bg-card rounded-xl card-sheet text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <div className={`flex flex-col gap-6 p-6 bg-card rounded-2xl card-sheet w-full ${showFilters ? '' : 'hidden md:flex'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Room Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm font-medium outline-none">
                  <option value="all">Any Type</option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price Range</label>
                <div className="flex items-center gap-3">
                  <input type="number" value={priceRange.min} onChange={e => setPriceRange({...priceRange, min: Number(e.target.value)})} className="w-full px-3 py-2 bg-muted/50 rounded-lg text-xs outline-none" placeholder="Min" />
                  <span className="text-muted-foreground">-</span>
                  <input type="number" value={priceRange.max} onChange={e => setPriceRange({...priceRange, max: Number(e.target.value)})} className="w-full px-3 py-2 bg-muted/50 rounded-lg text-xs outline-none" placeholder="Max" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sort By</label>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm font-medium outline-none">
                  <option value="price-asc">Lowest Price</option>
                  <option value="price-desc">Highest Price</option>
                  <option value="capacity">Max Guests</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Availability</label>
                <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value)} className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm font-medium outline-none">
                  <option value="all">Any Status</option>
                  <option value="available">Available Only</option>
                  <option value="booked">Booked (Waitlist)</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Exclusive Amenities</label>
              <div className="flex flex-wrap gap-2">
                {ALL_AMENITIES.map(amenity => (
                  <button
                    key={amenity}
                    onClick={() => setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${selectedAmenities.includes(amenity) ? 'bg-accent border-accent text-accent-foreground' : 'bg-transparent border-border text-muted-foreground hober:border-accent'}`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">{filtered.length} room{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((room) => (
                <RoomCard
                  key={room._id}
                  id={room._id}
                  name={`Room ${room.roomNumber}`}
                  type={room.roomType}
                  price={room.pricePerNight}
                  capacity={room.capacity}
                  available={room.status === 'available'}
                  amenities={room.amenities}
                  image={room.images?.[0] || ''}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl font-serif text-muted-foreground">No rooms match your criteria</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Rooms;
