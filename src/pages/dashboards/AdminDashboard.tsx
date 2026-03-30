import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BedDouble, Users as UsersIcon, CalendarDays, CreditCard, BarChart3,
  Plus, Pencil, Trash2, Search, Loader2, Headphones, CheckCircle, LogIn, LogOut, Sparkles, ClipboardList
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import Modal from '@/components/shared/Modal';
import toast from 'react-hot-toast';
import type { SidebarItem } from '@/components/shared/DashboardSidebar';
import { UserRole } from '@/context/AuthContext';
import { roomService, Room } from '@/services/roomService';
import { bookingService, Booking } from '@/services/bookingService';
import { paymentService, Payment, analyticsService, AnalyticsDashboard } from '@/services/analyticsService';
import { staffService, userService, Staff } from '@/services/staffService';
import { format } from 'date-fns';
import { notificationService, Notification } from '@/services/notificationService';
import { serviceRequestService, ServiceRequest } from '@/services/serviceRequestService';
import { auditService, AuditLog as AuditLogType } from '@/services/auditService';
import { Bell } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend);

const sidebarItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', path: '/admin-dashboard', icon: LayoutDashboard },
  { id: 'rooms', label: 'Rooms', path: '/admin-dashboard', icon: BedDouble },
  { id: 'bookings', label: 'Bookings', path: '/admin-dashboard', icon: CalendarDays },
  { id: 'services', label: 'Services', path: '/admin-dashboard', icon: Headphones },
  { id: 'payments', label: 'Payments', path: '/admin-dashboard', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', path: '/admin-dashboard', icon: Bell },
  { id: 'staff', label: 'Manage Users', path: '/admin-dashboard', icon: UsersIcon },
  { id: 'audit', label: 'Audit Log', path: '/admin-dashboard', icon: ClipboardList },
  { id: 'reports', label: 'Reports', path: '/admin-dashboard', icon: BarChart3 },
];

const statusColors: Record<string, string> = {
  available: 'bg-success/10 text-success',
  booked: 'bg-accent/10 text-accent',
  cleaning: 'bg-destructive/10 text-destructive',
  maintenance: 'bg-muted text-muted-foreground',
  reserved: 'bg-accent/10 text-accent',
  'checked-in': 'bg-success/10 text-success',
  'checked-out': 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  completed: 'bg-success/10 text-success',
  pending: 'bg-accent/10 text-accent',
  refunded: 'bg-destructive/10 text-destructive',
};

const goldColor = 'hsl(40, 45%, 55%)';
const goldAlpha = 'hsla(40, 45%, 55%, 0.2)';
const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

const getPricingInsight = (rooms: Room[], bookings: Booking[]) => {
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'booked').length;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  
  if (occupancyRate > 75) {
    return {
      title: 'High Demand Peak',
      advice: 'Occupancy is at 75%+. AI suggests a 15-20% rate increase for remaining rooms.',
      impact: '+₹42,000 potential revenue',
      type: 'high'
    };
  } else if (occupancyRate > 40) {
    return {
      title: 'Optimal Performance',
      advice: 'Occupancy is stable. Maintain current dynamic rates to maximize duration.',
      impact: 'Steady growth',
      type: 'medium'
    };
  }
  return {
    title: 'Low Occupancy Warning',
    advice: 'Demand is below index. Suggesting a 10% "Flash Sale" for next 48 hours.',
    impact: '+₹18,500 projected volume',
    type: 'low'
  };
};

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'bookings' | 'services' | 'payments' | 'notifications' | 'staff' | 'reports' | 'audit'>('overview');
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'rooms', 'bookings', 'services', 'payments', 'notifications', 'staff', 'reports', 'audit'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'rooms' | 'bookings' | 'services' | 'payments' | 'notifications' | 'staff' | 'reports' | 'audit');
    }
  }, [searchParams]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [serviceFilter, setServiceFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newRoom, setNewRoom] = useState({ roomNumber: '', roomType: 'single', pricePerNight: '', floor: '', capacity: '1' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'guest' as UserRole });
  const [guestList, setGuestList] = useState<{ _id: string; name: string; email: string; phone?: string; createdAt?: string }[]>([]);

  const notify = (msg: string) => toast.success(msg, { style: { background: 'hsl(0 0% 7%)', color: 'white', borderRadius: '0' } });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      roomService.getAll(),
      bookingService.getAll(),
      serviceRequestService.getAll().catch(() => []),
      paymentService.getAll(),
      analyticsService.getDashboard().catch(() => null),
      userService.getGuests().catch(() => []),
      notificationService.getAll().catch(() => []),
      auditService.getAll().catch(() => []),
    ])
      .then(([r, b, s, p, a, g, n, au]) => { 
        setRooms(r); 
        setBookings(b); 
        setServices(s);
        setPayments(p); 
        setAnalytics(a); 
        setGuestList(g);
        setNotifications(n);
        setAuditLogs(au);
      })
      .catch(() => toast.error('Error loading admin data'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddRoom = async () => {
    try {
      const created = await roomService.create({
        roomNumber: newRoom.roomNumber,
        roomType: newRoom.roomType as Room['roomType'],
        pricePerNight: Number(newRoom.pricePerNight),
        floor: Number(newRoom.floor),
        capacity: Number(newRoom.capacity),
      });
      setRooms(prev => [created, ...prev]);
      setShowModal(false);
      notify('Room added successfully!');
    } catch {
      toast.error('Failed to add room');
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      return toast.error('Please fill all fields');
    }
    try {
      await staffService.create(newUser);
      notify(`${newUser.role} account created successfully!`);
      setNewUser({ name: '', email: '', password: '', role: 'guest' });
      // Refresh guest data
      userService.getGuests().then(setGuestList);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await roomService.delete(id);
      setRooms(prev => prev.filter(r => r._id !== id));
      notify('Room deleted');
    } catch { toast.error('Failed to delete room'); }
  };

  const handleConfirmBooking = async (id: string) => {
    try {
      await bookingService.confirm(id);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, bookingStatus: 'reserved' } : b));
      notify('Booking confirmed and guest notified!');
    } catch { toast.error('Failed to confirm booking'); }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await bookingService.checkIn(id);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, bookingStatus: 'checked-in' } : b));
      notify('Guest checked in!');
    } catch { toast.error('Failed to check in'); }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await bookingService.checkOut(id);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, bookingStatus: 'checked-out' } : b));
      notify('Guest checked out! Room set to cleaning.');
      // refresh rooms
      roomService.getAll().then(setRooms);
    } catch { toast.error('Failed to check out'); }
  };
  
  const handleServiceUpdate = async (id: string, status: string) => {
    try {
      await serviceRequestService.updateStatus(id, status);
      setServices(prev => prev.map(s => s._id === id ? { ...s, status: status as ServiceRequest['status'] } : s));
      notify(`Request updated to ${status}`);
    } catch { toast.error('Failed to update request'); }
  };

  const roomTypeData = {
    labels: ['Single', 'Double', 'Deluxe', 'Suite'],
    datasets: [{
      data: [
        rooms.filter(r => r.roomType === 'single').length,
        rooms.filter(r => r.roomType === 'double').length,
        rooms.filter(r => r.roomType === 'deluxe').length,
        rooms.filter(r => r.roomType === 'suite').length,
      ],
      backgroundColor: [goldAlpha, goldColor, 'hsl(142, 64%, 24%)', 'hsl(0 0% 7%)'],
      borderWidth: 0,
    }],
  };

  const occupancyData = {
    labels: ['Available', 'Booked', 'Cleaning', 'Maintenance'],
    datasets: [{
      data: [
        rooms.filter(r => r.status === 'available').length,
        rooms.filter(r => r.status === 'booked').length,
        rooms.filter(r => r.status === 'cleaning').length,
        rooms.filter(r => r.status === 'maintenance').length,
      ],
      backgroundColor: [goldColor, 'hsl(142, 64%, 24%)', 'hsl(0, 84%, 60%)', goldAlpha],
      borderWidth: 0,
    }],
  };

  const bookingsByStatus = {
    labels: ['Reserved', 'Checked-in', 'Checked-out', 'Cancelled'],
    datasets: [{
      label: 'Bookings',
      data: [
        bookings.filter(b => b.bookingStatus === 'reserved').length,
        bookings.filter(b => b.bookingStatus === 'checked-in').length,
        bookings.filter(b => b.bookingStatus === 'checked-out').length,
        bookings.filter(b => b.bookingStatus === 'cancelled').length,
      ],
      backgroundColor: goldAlpha,
      borderColor: goldColor,
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  const currentLabels = analytics?.monthlyRevenue?.map(m => m.label) || [];
  const currentData = analytics?.monthlyRevenue?.map(m => m.revenue) || [];
  const last3 = currentData.slice(-3);
  const avg = last3.length ? last3.reduce((a, b) => a + b, 0) / last3.length : 5000;
  
  const revenueForecastData = {
    labels: [...currentLabels, 'Month +1', 'Month +2', 'Month +3'],
    datasets: [
      {
        label: 'Actual Revenue',
        data: [...currentData, null, null, null] as (number | null)[],
        borderColor: goldColor,
        backgroundColor: goldAlpha,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'AI Predicted (90-Day)',
        data: [...Array(Math.max(0, currentData.length - 1)).fill(null), currentData[currentData.length - 1] || avg, avg * 1.05, avg * 1.12, avg * 1.25] as (number | null)[],
        borderColor: 'hsl(221, 83%, 53%)',
        backgroundColor: 'hsla(221, 83%, 53%, 0.1)',
        borderDash: [5, 5],
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      }
    ],
  };

  const serviceVolumeData = {
    labels: ['Dining', 'Wellness', 'Amenities', 'Other'],
    datasets: [{
      label: 'Requests',
      data: [
        services.filter(s => s.requestType.toLowerCase().includes('dining') || s.requestType.toLowerCase().includes('artisan') || s.requestType.toLowerCase().includes('dinner')).length,
        services.filter(s => s.requestType.toLowerCase().includes('wellness') || s.requestType.toLowerCase().includes('massage') || s.requestType.toLowerCase().includes('spa')).length,
        services.filter(s => s.requestType.toLowerCase().includes('amenities') || s.requestType.toLowerCase().includes('towel') || s.requestType.toLowerCase().includes('clean')).length,
        services.filter(s => !['dining', 'wellness', 'amenities'].some(key => s.requestType.toLowerCase().includes(key))).length,
      ],
      backgroundColor: [goldColor, 'hsl(142, 64%, 24%)', 'hsl(221, 83%, 53%)', goldAlpha],
      borderWidth: 0,
    }],
  };

  if (loading) {
    return (
      <DashboardLayout 
        items={sidebarItems} 
        title="Admin Dashboard"
        onNotificationClick={() => setActiveTab('notifications')}
        unreadCount={notifications.filter(n => !n.read).length}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardLayout 
      items={sidebarItems} 
      title="Admin Dashboard"
      activeId={activeTab}
      onItemClick={(id) => setActiveTab(id as 'overview' | 'rooms' | 'bookings' | 'services' | 'payments' | 'notifications' | 'staff' | 'reports' | 'audit')}
      onNotificationClick={() => setActiveTab('notifications')}
      unreadCount={notifications.filter(n => !n.read).length}
    >
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(['overview', 'rooms', 'bookings', 'payments', 'notifications', 'staff', 'audit', 'reports'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >{tab.replace('-', ' ')}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatsCard title="Total Rooms" value={analytics?.totalRooms ?? rooms.length} icon={BedDouble} />
            <StatsCard title="Total Bookings" value={analytics?.totalBookings ?? bookings.length} icon={CalendarDays} />
            <StatsCard title="Total Revenue" value={`₹${(analytics?.totalRevenue ?? payments.reduce((s, p) => s + p.amount, 0)).toLocaleString()}`} icon={CreditCard} />
            <StatsCard title="Occupancy" value={analytics?.occupancyRate ?? `${rooms.length > 0 ? Math.round((rooms.filter(r => r.status === 'booked').length / rooms.length) * 100) : 0}%`} icon={BarChart3} />
            <StatsCard title="Active Services" value={services.filter(s => s.status !== 'completed').length} icon={Headphones} />
          </div>

          {/* AI Yield Maximizer Widget */}
          <div className="card-sheet relative overflow-hidden p-6 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/5 to-transparent">
            <div className="absolute top-4 right-6 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">AI Yield Intelligence</span>
            </div>
            {(() => {
              const insight = getPricingInsight(rooms, bookings);
              return (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-2">
                  <div className="space-y-1">
                    <h4 className="text-xl font-serif text-foreground">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground max-w-2xl">{insight.advice}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Estimated Impact</p>
                    <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{insight.impact}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-sheet p-6">
              <h3 className="text-lg font-serif mb-4">Bookings by Status</h3>
              <div className="h-64"><Bar data={bookingsByStatus} options={chartOpts} /></div>
            </div>
            <div className="card-sheet p-6">
              <h3 className="text-lg font-serif mb-4">Room Occupancy</h3>
              <div className="h-64 flex items-center justify-center"><div className="w-48 h-48"><Doughnut data={occupancyData} options={{ ...chartOpts, cutout: '65%' }} /></div></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-sheet p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <h3 className="text-lg font-serif mb-4 flex items-center gap-2">
                Revenue Growth & AI Forecast
                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-sans uppercase tracking-wider font-bold">Predictive</span>
              </h3>
              <div className="h-72"><Line data={revenueForecastData} options={{ ...chartOpts, plugins: { legend: { display: true, position: 'bottom' } } }} /></div>
            </div>
            <div className="card-sheet p-6">
              <h3 className="text-lg font-serif mb-4">Service Volume</h3>
              <div className="h-72 flex items-center justify-center">
                <div className="w-48 h-48 text-center">
                  <Doughnut data={serviceVolumeData} options={{ ...chartOpts, cutout: '65%' }} />
                  <p className="text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-tighter">Requests by Category</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'rooms' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-6 mb-8 py-10 bg-accent/5 rounded-3xl border border-accent/10">
            <h2 className="text-2xl font-serif text-center">Manage Your Rooms</h2>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-8 py-3 rounded-xl gold-gradient text-accent-foreground text-base font-semibold shadow-lg shadow-accent/20 hover:scale-105 transition-transform">
              <Plus className="h-5 w-5" /> Add New Room
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2 card-sheet flex-1 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search rooms..." className="bg-transparent text-sm outline-none w-full" />
            </div>
          </div>
          <div className="card-sheet overflow-auto">
            <table className="w-full min-w-[600px]">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price/Night</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Floor</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {rooms.filter(r => r.roomNumber.includes(searchTerm) || r.roomType.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                  <tr key={r._id} className="border-b border-border/50 last:border-0">
                    <td className="p-4 text-sm font-medium">{r.roomNumber}</td>
                    <td className="p-4 text-sm capitalize">{r.roomType}</td>
                    <td className="p-4 text-sm font-semibold">₹{r.pricePerNight}</td>
                    <td className="p-4 text-sm">{r.floor}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[r.status]}`}>{r.status}</span></td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => notify('Edit coming soon')} className="p-2 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDeleteRoom(r._id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && <tr><td colSpan={6} className="p-4 text-sm text-muted-foreground">No rooms found. Add one to get started.</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'bookings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2 card-sheet max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search bookings..." className="bg-transparent text-sm outline-none w-full" />
          </div>
          <div className="card-sheet overflow-auto">
            <table className="w-full min-w-[700px]">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-in</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-out</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
              </tr></thead>
              <tbody>
                {bookings.filter(b => b.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
                  <tr key={b._id} className="border-b border-border/50 last:border-0">
                    <td className="p-4 text-sm font-medium">{b.guest?.name || 'Deleted Guest'}</td>
                    <td className="p-4 text-sm">{b.room ? `Room ${b.room.roomNumber}` : 'Deleted Room'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{b.checkInDate ? format(new Date(b.checkInDate), 'MMM d, yyyy') : 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{b.checkOutDate ? format(new Date(b.checkOutDate), 'MMM d, yyyy') : 'N/A'}</td>
                    <td className="p-4 text-sm font-semibold">₹{b.totalPrice}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[b.bookingStatus] || 'bg-muted'}`}>{b.bookingStatus}</span></td>
                    <td className="p-4 flex gap-2">
                      {b.bookingStatus === 'pending' && (
                        <button onClick={() => handleConfirmBooking(b._id)} className="text-xs px-3 py-1.5 rounded-lg gold-gradient text-accent-foreground font-medium">
                          Confirm
                        </button>
                      )}
                      {b.bookingStatus === 'reserved' && (
                        <button onClick={() => handleCheckIn(b._id)} className="text-xs px-3 py-1.5 rounded-lg bg-success/20 text-success font-medium hover:bg-success/30 transition-colors">
                          <LogIn className="h-3 w-3 inline mr-1" />Check In
                        </button>
                      )}
                      {b.bookingStatus === 'checked-in' && (
                        <button onClick={() => handleCheckOut(b._id)} className="text-xs px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors">
                          <LogOut className="h-3 w-3 inline mr-1" />Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={7} className="p-4 text-sm text-muted-foreground">No bookings yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'services' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2 card-sheet max-w-sm flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search services..." className="bg-transparent text-sm outline-none w-full" />
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'pending', 'in-progress', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setServiceFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                    serviceFilter === s ? 'bg-accent text-accent-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="card-sheet overflow-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Service</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Guest</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Room</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.filter(s => 
                  (serviceFilter === 'all' || s.status === serviceFilter) &&
                  (s.requestType.toLowerCase().includes(searchTerm.toLowerCase()) || s.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                ).map((s) => (
                  <tr key={s._id} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-bold">{s.requestType}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                    </td>
                    <td className="p-4 text-sm font-medium">{s.guest?.name || 'Deleted Guest'}</td>
                    <td className="p-4 text-sm font-bold text-accent">Room {s.room?.roomNumber || '?'}</td>
                    <td className="p-4 text-xs text-muted-foreground">{format(new Date(s.createdAt), 'MMM d, h:mm a')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'pending' ? 'bg-accent/10 text-accent' : 
                        s.status === 'in-progress' ? 'bg-indigo-500/10 text-indigo-500' : 
                        'bg-success/10 text-success'
                      }`}>{s.status}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {s.status === 'pending' && (
                          <button onClick={() => handleServiceUpdate(s._id, 'in-progress')} className="text-[10px] font-bold uppercase text-indigo-500 hover:underline">Start</button>
                        )}
                        {s.status !== 'completed' && (
                          <button onClick={() => handleServiceUpdate(s._id, 'completed')} className="text-[10px] font-bold uppercase text-success hover:underline">Resolve</button>
                        )}
                        {s.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-success opacity-50" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground italic">No service requests found.</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'payments' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card-sheet overflow-auto">
            <table className="w-full min-w-[600px]">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booking ID</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id} className="border-b border-border/50 last:border-0">
                    <td className="p-4 text-sm font-mono text-muted-foreground">{p.booking._id.slice(-6).toUpperCase()}</td>
                    <td className="p-4 text-sm font-semibold">₹{p.amount}</td>
                    <td className="p-4 text-sm capitalize">{p.method}</td>
                    <td className="p-4 text-sm text-muted-foreground">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[p.status]}`}>{p.status}</span></td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={5} className="p-4 text-sm text-muted-foreground">No payments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'staff' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto space-y-8">
          <div className="card-sheet p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif">Create New Account</h3>
              <p className="text-sm text-muted-foreground">Add a guest or staff member directly</p>
            </div>
            
            <div className="bg-success/10 border border-success/20 p-4 rounded-xl space-y-2">
              <p className="text-xs font-bold text-success uppercase tracking-wider">Rate Limit Bypass Active:</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Using this form bypasses Supabase rate limits and email confirmation. Accounts are active immediately.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Account Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
                >
                  <option value="guest">Guest</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Full Name</label>
                <input
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email Address</label>
                <input
                  placeholder="user@example.com"
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
                <input
                  placeholder="••••••••"
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
              <button
                onClick={handleAddUser}
                className="w-full py-4 rounded-xl gold-gradient text-accent-foreground font-bold text-sm shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity mt-4"
              >
                Create Account
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif">Guest Details Report</h3>
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Export to PDF
            </button>
          </div>
          <div className="card-sheet overflow-x-auto bg-white dark:bg-zinc-950">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Guest Name</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Registered Date</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {guestList.map((g, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                    <td className="p-4 text-sm font-medium">{g.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{g.email || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{g.phone || g._id.slice(-8).toUpperCase()}</td>
                    <td className="p-4 text-sm">{g.createdAt ? format(new Date(g.createdAt), 'MMM d, yyyy') : 'N/A'}</td>
                    <td className="p-4">
                      {(() => {
                        const types = [
                          { label: 'Loyal', color: 'bg-success/10 text-success' },
                          { label: 'Neutral', color: 'bg-muted text-muted-foreground' },
                          { label: 'Potential VIP', color: 'bg-accent/10 text-accent' }
                        ];
                        const sentiment = types[i % types.length];
                        return (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sentiment.color}`}>
                            {sentiment.label}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {guestList.length === 0 && (
                  <tr><td colSpan={4} className="p-10 text-center text-muted-foreground italic">No guest records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
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

      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2 card-sheet max-w-sm mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Search audit logs..." 
              className="bg-transparent text-sm outline-none w-full" 
            />
          </div>
          <div className="card-sheet overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Timestamp</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Action</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Performed By</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Resource</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs
                  .filter(log => 
                    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    log.performedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.details.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((log) => (
                  <tr key={log._id} className="border-b border-border/50 last:border-0 hover:bg-accent/5 transition-colors">
                    <td className="p-4 text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), 'MMM d, h:mm:ss a')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.action.includes('DELETE') ? 'bg-destructive/10 text-destructive' :
                        log.action.includes('CREATE') ? 'bg-success/10 text-success' :
                        'bg-accent/10 text-accent'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold">{log.performedBy?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground">{log.performedBy?.email}</p>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-[10px] font-mono">
                        {log.resourceType || 'system'}: {log.resourceId?.slice(-6) || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground italic">
                      No audit logs found. Activity will appear here as staff perform actions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add Room Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Room">
        <div className="flex flex-col items-center space-y-5 text-center px-2 pb-2">
          <div className="w-full space-y-4">
            <input
              placeholder="Room Number (e.g. 101)"
              value={newRoom.roomNumber}
              onChange={e => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center"
            />
            <select
              value={newRoom.roomType}
              onChange={e => setNewRoom({ ...newRoom, roomType: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center appearance-none cursor-pointer"
            >
              <option value="single">Single Room</option>
              <option value="double">Double Room</option>
              <option value="deluxe">Deluxe Room</option>
              <option value="suite">Executive Suite</option>
            </select>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold whitespace-nowrap">Price</p>
                <input
                  placeholder="₹"
                  type="number"
                  value={newRoom.pricePerNight}
                  onChange={e => setNewRoom({ ...newRoom, pricePerNight: e.target.value })}
                  className="w-full px-2 py-3 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center"
                />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold whitespace-nowrap">Floor</p>
                <input
                  placeholder="Fl"
                  type="number"
                  value={newRoom.floor}
                  onChange={e => setNewRoom({ ...newRoom, floor: e.target.value })}
                  className="w-full px-2 py-3 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center"
                />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold whitespace-nowrap">Capacity</p>
                <input
                  placeholder="Pax"
                  type="number"
                  value={newRoom.capacity}
                  onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })}
                  className="w-full px-2 py-3 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center"
                />
              </div>
            </div>

            <button
              onClick={handleAddRoom}
              className="w-full py-3.5 mt-2 rounded-xl gold-gradient text-accent-foreground font-bold text-sm shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Confirm & Save Room
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminDashboard;
