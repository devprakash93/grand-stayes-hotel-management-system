import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';

const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const dashboardPath = role === 'admin' ? '/admin-dashboard' : role === 'staff' ? '/staff-dashboard' : '/guest-dashboard';

  useEffect(() => {
    if (user) {
      notificationService.getAll()
        .then(n => setUnreadCount(n.filter(x => !x.read).length))
        .catch(() => {});
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleBellClick = () => {
    navigate(`${dashboardPath}?tab=notifications`);
  };

  return (
    <nav className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-serif tracking-tight text-accent">Grand Stays</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/rooms" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Rooms</Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-accent" />
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-48 card-elevated rounded-xl py-2 z-50"
                  >
                    <Link to={dashboardPath} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setProfileOpen(false)}>
                      <User className="h-4 w-4" /> Dashboard
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-destructive">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
              <Link to="/register" className="text-sm font-medium px-5 py-2 rounded-xl gold-gradient text-accent-foreground transition-opacity hover:opacity-90">Register</Link>
            </div>
          )}
          {user && (
            <button 
              onClick={handleBellClick}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 min-w-[14px] px-1 flex items-center justify-center rounded-full bg-accent text-[8px] font-bold text-accent-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden bg-card"
          >
            <div className="flex flex-col p-4 gap-3">
              <Link to="/" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link to="/rooms" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Rooms</Link>
              {user ? (
                <>
                  <Link to={dashboardPath} className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <button onClick={handleSignOut} className="text-sm font-medium py-2 text-left text-destructive">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  <Link to="/register" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
