import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar, { SidebarItem } from './DashboardSidebar';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  items: SidebarItem[];
  title: string;
  children?: React.ReactNode;
  onItemClick?: (id: string) => void;
  onNotificationClick?: () => void;
  unreadCount?: number;
  activeId?: string;
}

const DashboardLayout = ({ 
  items, 
  title, 
  children, 
  onItemClick, 
  onNotificationClick,
  unreadCount = 0,
  activeId 
}: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    console.log('DashboardLayout: Sign Out button clicked');
    await signOut();
    console.log('DashboardLayout: Sign Out complete, navigating to /');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        items={items} 
        title={title} 
        onItemClick={onItemClick} 
        activeId={activeId} 
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <h2 className="text-lg font-serif">{title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onNotificationClick}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center">
              <User className="h-4 w-4 text-accent" />
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.email}</span>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors ml-2"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium hidden md:block">Sign Out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
