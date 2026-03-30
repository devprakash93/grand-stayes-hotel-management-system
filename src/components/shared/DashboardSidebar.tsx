import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LucideIcon, X } from 'lucide-react';

export interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
  id?: string;
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
  onItemClick?: (id: string) => void;
  activeId?: string;
  open?: boolean;
  onClose?: () => void;
}

const DashboardSidebar = ({ items, title = 'Dashboard', onItemClick, activeId, open, onClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 lg:sticky top-0 h-screen bg-card border-r border-border/50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col z-50 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'} w-[260px]`}
      >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        {!collapsed && (
          <Link to="/" className="text-xl font-serif tracking-tight text-accent">Grand Stays</Link>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      )}

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = activeId ? activeId === item.id : location.pathname === item.path;
          
          const handleClick = (e: React.MouseEvent) => {
            if (onClose) onClose();
            if (onItemClick && item.id) {
              e.preventDefault();
              onItemClick(item.id);
            }
          };

          return (
            <Link
              key={item.id || item.path}
              to={item.path}
              onClick={handleClick}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-accent/10 text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-accent"
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      </aside>
    </>
  );
};

export default DashboardSidebar;
