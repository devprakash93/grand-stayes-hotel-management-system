import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Crown, Palette } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'luxury', icon: Crown, label: 'Luxury' }
  ] as const;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mb-4 p-2 bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col gap-1"
          >
            {themes.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    theme === t.id 
                      ? 'bg-accent text-accent-foreground' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center text-foreground hover:border-accent/50 transition-colors"
      >
        <Palette className={`h-5 w-5 ${isOpen ? 'text-accent' : ''}`} />
      </motion.button>
    </div>
  );
};

export default ThemeToggle;
