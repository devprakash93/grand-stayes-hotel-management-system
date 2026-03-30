import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDays, Users, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Modal from '@/components/shared/Modal';

interface BookingFormProps {
  roomId?: string;
  pricePerNight: number;
  maxCapacity: number;
  onBook?: (data: { checkIn: Date; checkOut: Date; guests: number; total: number }) => void;
}

const BookingForm = ({ pricePerNight, maxCapacity, onBook }: BookingFormProps) => {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const total = nights * pricePerNight;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkIn && checkOut && nights > 0) {
      setShowConfirm(true);
    }
  };

  const confirmBooking = () => {
    if (checkIn && checkOut) {
      onBook?.({ checkIn, checkOut, guests, total });
      setShowConfirm(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="card-sheet p-6 space-y-5">
        <h3 className="text-xl font-serif flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-accent" />
          Book This Room
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Check-in</label>
            <DatePicker
              selected={checkIn}
              onChange={(d) => setCheckIn(d)}
              minDate={new Date()}
              placeholderText="Select date"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Check-out</label>
            <DatePicker
              selected={checkOut}
              onChange={(d) => setCheckOut(d)}
              minDate={checkIn || new Date()}
              placeholderText="Select date"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Guests
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="mt-1 w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {Array.from({ length: maxCapacity }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} Guest{i > 0 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        {nights > 0 && (
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calculator className="h-4 w-4 text-accent" />
              Price Summary
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">₹{pricePerNight} × {nights} night{nights > 1 ? 's' : ''}</span>
              <span className="font-semibold">₹{total}</span>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full gold-gradient text-accent-foreground font-semibold h-12 rounded-xl" disabled={!checkIn || !checkOut || nights <= 0}>
          Reserve Now
        </Button>
      </form>

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Booking">
        <div className="space-y-4">
          <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">{checkIn?.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium">{checkOut?.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guests</span>
              <span className="font-medium">{guests}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button className="flex-1 gold-gradient text-accent-foreground" onClick={confirmBooking}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BookingForm;
