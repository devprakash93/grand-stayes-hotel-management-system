import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CalendarDays, Headphones, CreditCard, User,
  BedDouble, Clock, XCircle, Loader2, Key, Thermometer, Lightbulb, Tv, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import ServiceRequestCard from '@/components/shared/ServiceRequestCard';
import AIConcierge from '@/components/shared/AIConcierge';
import WeatherWidget from '@/components/shared/WeatherWidget';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import type { SidebarItem } from '@/components/shared/DashboardSidebar';
import { bookingService, Booking } from '@/services/bookingService';
import { serviceRequestService, ServiceRequest } from '@/services/serviceRequestService';
import { paymentService, Payment } from '@/services/analyticsService';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { notificationService, Notification } from '@/services/notificationService';
import { Bell } from 'lucide-react';

const sidebarItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', path: '/guest-dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'My Bookings', path: '/guest-dashboard', icon: CalendarDays },
  { id: 'services', label: 'Services', path: '/guest-dashboard', icon: Headphones },
  { id: 'payments', label: 'Payments', path: '/guest-dashboard', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', path: '/guest-dashboard', icon: Bell },
  { id: 'profile', label: 'Profile', path: '/guest-dashboard', icon: User },
];

const statusBadge: Record<string, string> = {
  reserved: 'bg-accent/10 text-accent',
  'checked-in': 'bg-success/10 text-success',
  'checked-out': 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  paid: 'bg-success/10 text-success',
  pending: 'bg-accent/10 text-accent',
  completed: 'bg-muted text-muted-foreground',
  refunded: 'bg-destructive/10 text-destructive',
};

const GuestDashboard = () => {
  const { dbUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'services' | 'payments' | 'notifications' | 'profile'>('overview');
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'bookings', 'services', 'payments', 'notifications', 'profile'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'bookings' | 'services' | 'payments' | 'notifications' | 'profile');
    }
  }, [searchParams]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // IoT Simulation States
  const [roomTemp, setRoomTemp] = useState(72);
  const [lightsOn, setLightsOn] = useState(true);
  const [tvOn, setTvOn] = useState(false);

  const notify = (msg: string) =>
    toast.success(msg, { style: { background: 'hsl(0 0% 7%)', color: 'white', borderRadius: '0' } });

  useEffect(() => {
    Promise.all([
      bookingService.getMyBookings(),
      serviceRequestService.getAll(),
      paymentService.getAll(),
      notificationService.getAll(),
    ])
      .then(([b, s, p, n]) => {
        setBookings(b);
        setServices(s);
        setPayments(p);
        setNotifications(n);
      })
      .catch(() => notify('Error loading data'))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelBooking = async (id: string) => {
    try {
      await bookingService.cancel(id);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, bookingStatus: 'cancelled' } : b));
      notify('Booking cancelled');
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  const CONCIERGE_MENU = [
    { category: 'Dining', items: [
      { id: 'breakfast', name: 'Artisan Breakfast', price: 25, icon: '🍳', desc: 'Fresh local ingredients, pastries, and coffee.' },
      { id: 'dinner', name: 'Private Dinner', price: 85, icon: '🍷', desc: '4-course gourmet meal delivered to your room.' },
    ]},
    { category: 'Wellness', items: [
      { id: 'massage', name: 'In-Room Massage', price: 120, icon: '💆', desc: '60 min therapeutic deep tissue treatment.' },
      { id: 'spa', name: 'Spa Day Pass', price: 45, icon: '🧖', desc: 'Access to sauna, steam, and pool facilities.' },
    ]},
    { category: 'Amenities', items: [
      { id: 'towels', name: 'Extra Towels', price: 0, icon: '🧼', desc: 'Fluffy white Egyptian cotton towels.' },
      { id: 'cleaning', name: 'Priority Cleaning', price: 0, icon: '🧹', desc: 'Immediate room freshening and turndown.' },
    ]}
  ];

  const handleServiceRequest = async (item: { name: string; price: number; icon: string; desc: string }) => {
    if (!bookings.length) {
      toast.error('You need an active booking to request services');
      return;
    }
    const activeBooking = bookings.find(b => b.bookingStatus === 'checked-in' || b.bookingStatus === 'reserved');
    if (!activeBooking) {
      toast.error('No active booking found');
      return;
    }
    try {
      const newRequest = await serviceRequestService.create({
        room: activeBooking.room._id,
        requestType: `${item.icon} ${item.name}`,
        description: item.desc,
        price: item.price
      });
      setServices(prev => [newRequest, ...prev]);
      notify(`${item.name} requested!`);
    } catch {
      toast.error('Failed to submit request');
    }
  };

  const upcomingBookings = bookings.filter(b => b.bookingStatus === 'reserved' || b.bookingStatus === 'checked-in');
  const totalSpent = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const activeBooking = bookings.find(b => b.bookingStatus === 'checked-in');

  // If we have a session but dbUser failed to sync, show a graceful error state instead of crashing
  if (!loading && !dbUser) {
    return (
      <DashboardLayout items={sidebarItems} title="Guest Dashboard">
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-foreground">Profile Synchronization Issue</h2>
            <p className="max-w-md mx-auto mt-2 text-muted-foreground">
              We couldn't link your account to our records. This usually happens if the environment variables (like MONGO_URI) are missing or incorrect in your deployment dashboard.
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <Button 
                className="gold-gradient text-accent-foreground font-bold rounded-xl px-8"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout items={sidebarItems} title="Guest Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  const handleDownloadInvoice = async (booking: Booking) => {
    // Create a temporary hidden div to render the invoice beautifully
    const invoiceEl = document.createElement('div');
    invoiceEl.style.width = '800px';
    invoiceEl.style.padding = '40px';
    invoiceEl.style.backgroundColor = '#ffffff';
    invoiceEl.style.color = '#000000';
    invoiceEl.style.fontFamily = 'serif';
    
    invoiceEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="margin: 0; font-size: 32px; color: #111;">Grand Stays</h1>
          <p style="margin: 5px 0 0; color: #666;">Luxury Hotel & Resort</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #111;">INVOICE</h2>
          <p style="margin: 5px 0 0; font-family: monospace;">#INV-${booking._id.slice(-8).toUpperCase()}</p>
          <p style="margin: 5px 0 0; color: #666;">Date: ${format(new Date(), 'MMM d, yyyy')}</p>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h3 style="margin: 0 0 10px; color: #333;">Billed To:</h3>
          <p style="margin: 0;"><strong>${booking.guest.name}</strong></p>
          <p style="margin: 5px 0 0; color: #666;">${booking.guest.email}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 10px; color: #333;">Stay Details:</h3>
          <p style="margin: 0;">Room ${booking.room.roomNumber} (${booking.room.roomType})</p>
          <p style="margin: 5px 0 0; color: #666;">Check-in: ${format(new Date(booking.checkInDate), 'MMM d, yyyy')}</p>
          <p style="margin: 5px 0 0; color: #666;">Check-out: ${format(new Date(booking.checkOutDate), 'MMM d, yyyy')}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">Room Rate (${booking.room.roomType})</td>
            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">₹${booking.totalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Total Amount Paid</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #D4AF37;">₹${booking.totalPrice.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center; color: #666; margin-top: 60px; font-size: 14px;">
        <p>Thank you for choosing Grand Stays. We hope to see you again.</p>
      </div>
    `;

    // Briefly append to body to render canvas
    document.body.appendChild(invoiceEl);
    
    try {
      const canvas = await html2canvas(invoiceEl, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`GrandStays_Invoice_${booking._id.slice(-6)}.pdf`);
      notify('Invoice downloaded successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF');
    } finally {
      document.body.removeChild(invoiceEl);
    }
  };

  return (
    <DashboardLayout 
      items={sidebarItems} 
      title="Guest Dashboard"
      activeId={activeTab}
      onItemClick={(id) => setActiveTab(id as 'overview' | 'bookings' | 'services' | 'payments' | 'notifications' | 'profile')}
      onNotificationClick={() => setActiveTab('notifications')}
      unreadCount={notifications.filter(n => !n.read).length}
    >
      <AIConcierge roomId={activeBooking?.room?._id} />

      {/* Notifications indicator */}
      {notifications.some(n => !n.read) && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-accent animate-bounce" />
            <p className="text-sm font-medium">You have {notifications.filter(n => !n.read).length} new notification(s)</p>
          </div>
          <button onClick={() => setActiveTab('notifications')} className="text-xs font-semibold text-accent hover:underline">View All</button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(['overview', 'bookings', 'services', 'payments', 'notifications', 'profile'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors whitespace-nowrap ${
              activeTab === tab ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              <StatsCard title="Total Bookings" value={bookings.length} icon={CalendarDays} />
              <StatsCard title="Upcoming" value={upcomingBookings.length} icon={Clock} trend="up" change={upcomingBookings.length > 0 ? `Next: ${format(new Date(upcomingBookings[0].checkInDate), 'MMM d')}` : 'None'} />
              <StatsCard title="Total Spent" value={`₹${totalSpent.toLocaleString()}`} icon={CreditCard} />
              <StatsCard title="Notifications" value={notifications.filter(n => !n.read).length} icon={Bell} />
            </div>
            
            {/* Weather Widget Panel */}
            <div className="md:col-span-1 h-full">
              <WeatherWidget />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-serif mb-4">Upcoming Stays</h3>
            <div className="space-y-3">
              {upcomingBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming stays.</p>
              ) : upcomingBookings.map(b => (
                <div key={b._id} className="card-sheet p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
                      <BedDouble className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{b.room ? `Room ${b.room.roomNumber}` : 'Deleted Room'}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.checkInDate ? format(new Date(b.checkInDate), 'MMM d') : 'N/A'} → {b.checkOutDate ? format(new Date(b.checkOutDate), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">₹{b.totalPrice}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Room & Digital Key (Only visible if checked in) */}
          {bookings.find(b => b.bookingStatus === 'checked-in') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Digital Key */}
              <div className="card-sheet p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                  <Key className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-serif">Digital Key</h3>
                  <p className="text-xs text-muted-foreground mt-1">Hold near door lock to open</p>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-inner">
                  <QRCodeCanvas 
                    value={`ROOMIFY-UNLOCK-${bookings.find(b => b.bookingStatus === 'checked-in')?._id}`} 
                    size={150} 
                    level={"H"}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-accent mt-2">Active</p>
              </div>

              {/* IoT Controls */}
              <div className="lg:col-span-2 card-sheet p-6 relative overflow-hidden transition-colors duration-500" 
                   style={{ backgroundColor: lightsOn ? 'var(--card)' : 'hsl(0 0% 8%)' }}>
                
                {/* Decorative background glow based on temp */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-1000"
                     style={{ backgroundColor: roomTemp > 74 ? 'hsla(0, 100%, 50%, 0.05)' : roomTemp < 68 ? 'hsla(210, 100%, 50%, 0.05)' : 'hsla(40, 45%, 55%, 0.05)' }} 
                />

                <h3 className="text-xl font-serif mb-6 relative z-10 flex items-center gap-2">
                  Smart Room Controls 
                  <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-sans uppercase tracking-wider font-bold">Live</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  
                  {/* Climate */}
                  <div className="space-y-4 bg-muted/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-semibold">Climate Control</span>
                      </div>
                      <span className="text-2xl font-serif">{roomTemp}°F</span>
                    </div>
                    <input 
                      type="range" 
                      min="60" max="85" 
                      value={roomTemp} 
                      onChange={(e) => setRoomTemp(Number(e.target.value))}
                      className="w-full accent-accent h-1 bg-muted rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      <span>Cool</span>
                      <span>Warm</span>
                    </div>
                  </div>

                  {/* Environment */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${lightsOn ? 'bg-accent/20' : 'bg-muted'}`}>
                          <Lightbulb className={`h-5 w-5 ${lightsOn ? 'text-accent' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Master Lights</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lightsOn ? 'On' : 'Off'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setLightsOn(!lightsOn); notify(`Lights turned ${!lightsOn ? 'on' : 'off'}`); }}
                        className={`w-12 h-6 rounded-full transition-colors relative ${lightsOn ? 'bg-accent' : 'bg-muted'}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${lightsOn ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${tvOn ? 'bg-indigo-500/20' : 'bg-muted'}`}>
                          <Tv className={`h-5 w-5 ${tvOn ? 'text-indigo-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Television</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{tvOn ? 'On' : 'Off'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setTvOn(!tvOn); notify(`TV turned ${!tvOn ? 'on' : 'off'}`); }}
                        className={`w-12 h-6 rounded-full transition-colors relative ${tvOn ? 'bg-indigo-500' : 'bg-muted'}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${tvOn ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xl font-serif mb-4">Recent Service Requests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.slice(0, 2).map(s => (
                <ServiceRequestCard 
                  key={s._id} 
                  id={s._id} 
                  type={s.requestType} 
                  description={s.description || ''} 
                  status={s.status === 'in-progress' ? 'in_progress' : s.status as 'pending' | 'completed'} 
                  room={s.room?.roomNumber || 'Unknown'} 
                  createdAt={format(new Date(s.createdAt), 'MMM d, h:mm a')} 
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'bookings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground">No bookings found.</p>
          ) : (
            <div className="card-sheet overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-in</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-out</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} className="border-b border-border/50 last:border-0">
                      <td className="p-4 text-sm font-medium">{b.room ? `Room ${b.room.roomNumber}` : 'Deleted Room'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{b.checkInDate ? format(new Date(b.checkInDate), 'MMM d, yyyy') : 'N/A'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{b.checkOutDate ? format(new Date(b.checkOutDate), 'MMM d, yyyy') : 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge[b.bookingStatus]}`}>{b.bookingStatus}</span>
                      </td>
                      <td className="p-4 text-sm font-semibold">₹{b.totalPrice}</td>
                      <td className="p-4">
                        {b.bookingStatus === 'reserved' && (
                          <button onClick={() => handleCancelBooking(b._id)} className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Cancel
                          </button>
                        )}
                        {b.bookingStatus === 'checked-out' && (
                          <button onClick={() => handleDownloadInvoice(b)} className="text-xs px-3 py-1.5 rounded-lg border border-accent/20 text-accent font-medium hover:bg-accent/10 transition-colors flex items-center gap-1 whitespace-nowrap">
                            <Download className="h-3 w-3" /> Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'services' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
          <div className="space-y-8">
            {CONCIERGE_MENU.map(cat => (
              <div key={cat.category} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">{cat.category}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cat.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleServiceRequest(item)}
                      className="group flex items-start gap-4 p-5 rounded-2xl bg-card card-sheet text-left hover:scale-[1.02] hover:border-accent/40 active:scale-95 transition-all"
                    >
                      <span className="text-3xl bg-muted p-2.5 rounded-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs font-bold text-accent px-2 py-1 bg-accent/10 rounded-lg">{item.price === 0 ? 'COMPLIMENTARY' : `₹${item.price}`}</p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-serif">Service Hub History</h4>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No requests active at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(s => (
                  <ServiceRequestCard 
                    key={s._id} 
                    id={s._id} 
                    type={s.requestType} 
                    description={s.description || ''} 
                    status={s.status === 'in-progress' ? 'in_progress' : s.status as 'pending' | 'completed'} 
                    room={s.room?.roomNumber || 'Unknown'} 
                    createdAt={format(new Date(s.createdAt), 'MMM d, h:mm a')} 
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'payments' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {payments.length === 0 ? (
            <p className="text-muted-foreground">No payments found.</p>
          ) : (
            <div className="card-sheet overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booking</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id} className="border-b border-border/50 last:border-0">
                      <td className="p-4 text-sm font-mono text-muted-foreground">{p.booking._id.slice(-6).toUpperCase()}</td>
                      <td className="p-4 text-sm font-semibold">₹{p.amount}</td>
                      <td className="p-4 text-sm capitalize">{p.method}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge[p.status]}`}>{p.status}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground">No notifications.</p>
          ) : (
            notifications.map(n => (
              <div key={n._id} className={`card-sheet p-4 border-l-4 ${n.read ? 'border-transparent' : 'border-accent'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm">{n.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</p>
                  </div>
                  {!n.read && (
                    <button 
                      onClick={async () => {
                        await notificationService.markRead([n._id]);
                        setNotifications(prev => prev.map(notif => notif._id === n._id ? { ...notif, read: true } : notif));
                      }}
                      className="text-xs text-accent hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
          <div className="card-sheet p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-accent/20 flex items-center justify-center">
                <User className="h-8 w-8 text-accent" />
              </div>
              <div>
                <p className="font-semibold">{dbUser?.name as string || 'Guest User'}</p>
                <p className="text-sm text-muted-foreground">{dbUser?.email as string || ''}</p>
                <span className="text-xs capitalize bg-accent/10 text-accent px-2 py-0.5 rounded-full">{dbUser?.role as string || 'guest'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default GuestDashboard;
