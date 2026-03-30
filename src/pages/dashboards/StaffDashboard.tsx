import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CalendarDays, BedDouble, Headphones, SprayCan,
  LogIn, LogOut, CheckCircle, Loader2, Zap, AlertCircle, Sparkles, Activity
} from 'lucide-react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import ServiceRequestCard from '@/components/shared/ServiceRequestCard';
import toast from 'react-hot-toast';
import type { SidebarItem } from '@/components/shared/DashboardSidebar';
import { bookingService, Booking } from '@/services/bookingService';
import { roomService, Room } from '@/services/roomService';
import { serviceRequestService, ServiceRequest } from '@/services/serviceRequestService';
import { notificationService, Notification } from '@/services/notificationService';
import { format } from 'date-fns';
import { Bell } from 'lucide-react';

const getAiPriority = (request: ServiceRequest) => {
  let score = 0;
  const type = request.requestType.toLowerCase();
  
  // Weights based on type
  if (type.includes('cleaning')) score += 40;
  if (type.includes('dining') || type.includes('food')) score += 30;
  if (type.includes('wellness') || type.includes('spa')) score += 10;
  if (type.includes('urgent') || type.includes('emergency')) score += 80;

  // Age factor
  const hours = (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60);
  score += Math.min(score, hours * 5); // Don't let age exceed the importance of the type unless it's very old

  if (score >= 70) return { label: 'Urgent', color: 'bg-destructive/10 text-destructive', icon: AlertCircle };
  if (score >= 35) return { label: 'High', color: 'bg-accent/10 text-accent', icon: Zap };
  return { label: 'Standard', color: 'bg-muted text-muted-foreground', icon: Activity };
};

const sidebarItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', path: '/staff-dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', path: '/staff-dashboard', icon: CalendarDays },
  { id: 'rooms', label: 'Rooms', path: '/staff-dashboard', icon: BedDouble },
  { id: 'services', label: 'Services', path: '/staff-dashboard', icon: Headphones },
  { id: 'notifications', label: 'Notifications', path: '/staff-dashboard', icon: Bell },
];

const roomStatusBadge: Record<string, string> = {
  available: 'bg-success/10 text-success',
  booked: 'bg-accent/10 text-accent',
  cleaning: 'bg-destructive/10 text-destructive',
  maintenance: 'bg-muted text-muted-foreground',
};

const StaffDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'rooms' | 'services' | 'notifications'>('overview');
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'bookings', 'rooms', 'services', 'notifications'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'bookings' | 'rooms' | 'services' | 'notifications');
    }
  }, [searchParams]);
  const [serviceFilter, setServiceFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const notify = (msg: string) =>
    toast.success(msg, { style: { background: 'hsl(0 0% 7%)', color: 'white', borderRadius: '0' } });

  useEffect(() => {
    Promise.all([
      bookingService.getAll(),
      roomService.getAll(),
      serviceRequestService.getAll(),
      notificationService.getAll(),
    ])
      .then(([b, r, s, n]) => { 
        setBookings(b); 
        setRooms(r); 
        setServices(s); 
        setNotifications(n);
      })
      .catch(() => toast.error('Error loading data'))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmBooking = async (id: string) => {
    try {
      await bookingService.confirm(id);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, bookingStatus: 'reserved' } : b));
      notify('Booking confirmed and guest notified!');
      // Refresh notifications
      notificationService.getAll().then(setNotifications);
    } catch {
      toast.error('Failed to confirm booking');
    }
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
      if (status === 'completed') roomService.getAll().then(setRooms);
    } catch { toast.error('Failed to update request'); }
  };

  const cleaningRooms = rooms.filter(r => r.status === 'cleaning');
  const todayCheckIns = bookings.filter(b => b.bookingStatus === 'reserved');
  const todayCheckOuts = bookings.filter(b => b.bookingStatus === 'checked-in');

  const liveActivity = [
    ...bookings.map(b => ({ id: b._id, type: 'booking', date: b.createdAt, title: 'New Booking', desc: `Room ${b.room?.roomNumber || '?'}: ${b.guest?.name || 'Guest'}`, status: b.bookingStatus })),
    ...services.map(s => ({ id: s._id, type: 'service', date: s.createdAt, title: s.requestType, desc: `Room ${s.room?.roomNumber || '?'}: ${s.description || 'Service needed'}`, status: s.status }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  const handleToggleRoomStatus = async (roomId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'cleaning' ? 'available' : 'cleaning';
    try {
      await roomService.update(roomId, { status: nextStatus as Room['status'] });
      setRooms(prev => prev.map(r => r._id === roomId ? { ...r, status: nextStatus as Room['status'] } : r));
      notify(`Room ${rooms.find(r => r._id === roomId)?.roomNumber} is now ${nextStatus}`);
    } catch { toast.error('Failed to update room status'); }
  };

  if (loading) {
    return (
      <DashboardLayout items={sidebarItems} title="Staff Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      items={sidebarItems} 
      title="Staff Dashboard"
      activeId={activeTab}
      onItemClick={(id) => setActiveTab(id as 'overview' | 'bookings' | 'rooms' | 'services' | 'notifications')}
      onNotificationClick={() => setActiveTab('notifications')}
      unreadCount={notifications.filter(n => !n.read).length}
    >
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(['overview', 'bookings', 'rooms', 'services', 'notifications'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >{tab}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="New Requests" value={bookings.filter(b => b.bookingStatus === 'pending').length} icon={Bell} />
            <StatsCard title="Pending Check-ins" value={todayCheckIns.length} icon={LogIn} />
            <StatsCard title="Rooms Cleaning" value={cleaningRooms.length} icon={BedDouble} />
            <StatsCard title="Pending Requests" value={services.filter(s => s.status === 'pending').length} icon={Headphones} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-serif">Live Activity Hub</h3>
              <div className="space-y-3">
                {liveActivity.map((act) => (
                  <div key={act.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card card-sheet group hover:bg-muted/50 transition-colors">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${act.type === 'booking' ? 'bg-accent/20 text-accent' : 'bg-success/20 text-success'}`}>
                      {act.type === 'booking' ? <CalendarDays className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-sm font-bold truncate">{act.title}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(act.date), 'h:mm a')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{act.desc}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roomStatusBadge[act.status] || 'bg-muted text-muted-foreground'}`}>{act.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-serif">Quick Actions</h3>
              <div className="card-sheet p-5 space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Rooms Needing Attention</p>
                {cleaningRooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">All rooms are spotless ✨</p>
                ) : (
                  <div className="space-y-2">
                    {cleaningRooms.map(r => (
                      <div key={r._id} className="flex justify-between items-center bg-destructive/5 p-3 rounded-xl border border-destructive/10">
                        <span className="text-sm font-bold">Room {r.roomNumber}</span>
                        <button 
                          onClick={() => handleToggleRoomStatus(r._id, r.status)}
                          className="px-3 py-1.5 rounded-lg bg-success text-success-foreground text-[10px] font-bold uppercase transition-transform hover:scale-105"
                        >
                          Mark Ready
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card-sheet p-5 space-y-4 bg-accent/5 border-accent/20">
                <p className="text-xs font-bold text-accent uppercase tracking-widest">Arrivals Today</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-serif font-bold text-accent">{todayCheckIns.length}</span>
                  <button onClick={() => setActiveTab('bookings')} className="text-[10px] font-bold text-accent hover:underline">Manage Arrivals →</button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'bookings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card-sheet overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-in</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-out</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-sm text-muted-foreground">No bookings found</td></tr>
                ) : bookings.map(b => (
                  <tr key={b._id} className="border-b border-border/50 last:border-0">
                    <td className="p-4 text-sm font-medium">{b.guest?.name || 'Deleted Guest'}</td>
                    <td className="p-4 text-sm">{b.room ? `Room ${b.room.roomNumber}` : 'Deleted Room'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{b.checkInDate ? format(new Date(b.checkInDate), 'MMM d') : 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{b.checkOutDate ? format(new Date(b.checkOutDate), 'MMM d') : 'N/A'}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roomStatusBadge[b.bookingStatus] || 'bg-muted'}`}>{b.bookingStatus}</span></td>
                    <td className="p-4 flex gap-2">
                      {b.bookingStatus === 'pending' && (
                        <button onClick={() => handleConfirmBooking(b._id)} className="text-xs px-3 py-1.5 rounded-lg gold-gradient text-accent-foreground font-medium">
                           Confirm
                        </button>
                      )}
                      {b.bookingStatus === 'reserved' && (
                        <button onClick={() => handleCheckIn(b._id)} className="text-xs px-3 py-1.5 rounded-lg bg-success/20 text-success font-medium">
                          <LogIn className="h-3 w-3 inline mr-1" />Check In
                        </button>
                      )}
                      {b.bookingStatus === 'checked-in' && (
                        <button onClick={() => handleCheckOut(b._id)} className="text-xs px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-medium">
                          <LogOut className="h-3 w-3 inline mr-1" />Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'rooms' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card-sheet overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Floor</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r._id} className="border-b border-border/50 last:border-0">
                    <td className="p-4 text-sm font-medium">{r.roomNumber}</td>
                    <td className="p-4 text-sm capitalize">{r.roomType}</td>
                    <td className="p-4 text-sm">{r.floor}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roomStatusBadge[r.status]}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'services' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <h3 className="text-xl font-serif">Service Hub</h3>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filter:</span>
              {(['all', 'pending', 'in-progress', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setServiceFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    serviceFilter === s ? 'bg-accent text-accent-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card-sheet overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Service</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Priority</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Guest / Room</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Submitted</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.filter(s => serviceFilter === 'all' || s.status === serviceFilter).length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-muted-foreground italic">No {serviceFilter !== 'all' ? serviceFilter : ''} requests found.</td></tr>
                ) : (
                  services.filter(s => serviceFilter === 'all' || s.status === serviceFilter).map((s) => (
                    <tr key={s._id} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-bold">{s.requestType}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.description || 'No notes provided'}</p>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const p = getAiPriority(s);
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${p.color}`}>
                              <p.icon className="h-3 w-3" />
                              {p.label}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium">{s.guest?.name || 'Guest'}</p>
                        <p className="text-xs text-accent font-bold">Room {s.room?.roomNumber || '?'}</p>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {format(new Date(s.createdAt), 'MMM d, h:mm a')}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'pending' ? 'bg-accent/10 text-accent' : 
                          s.status === 'in-progress' ? 'bg-indigo-500/10 text-indigo-500' : 
                          'bg-success/10 text-success'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {s.status === 'pending' && (
                            <button
                              onClick={() => handleServiceUpdate(s._id, 'in-progress')}
                              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase hover:bg-indigo-500/20 transition-all"
                            >
                              In Progress
                            </button>
                          )}
                          {(s.status === 'pending' || s.status === 'in-progress') && (
                            <button
                              onClick={() => handleServiceUpdate(s._id, 'completed')}
                              className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-[10px] font-bold uppercase hover:bg-success/20 transition-all"
                            >
                              Complete
                            </button>
                          )}
                          {s.status === 'completed' && (
                            <div className="flex items-center gap-1 text-success opacity-60">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-[10px] font-bold uppercase">Settled</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
    </DashboardLayout>
  );
};

export default StaffDashboard;
