import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, Wind, MapPin } from 'lucide-react';

const WeatherWidget = () => {
  const [weatherIndex, setWeatherIndex] = useState(0);
  
  // Simulate changing weather for demo purposes
  const weatherStates = [
    { type: 'sunny', temp: 72, icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { type: 'cloudy', temp: 65, icon: Cloud, color: 'text-gray-400', bg: 'bg-gray-400/10' },
    { type: 'rainy', temp: 58, icon: CloudRain, color: 'text-blue-400', bg: 'bg-blue-400/10' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setWeatherIndex(prev => (prev + 1) % weatherStates.length);
    }, 10000); // Change weather every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const current = weatherStates[weatherIndex];
  const Icon = current.icon;

  return (
    <div className="card-sheet p-6 relative overflow-hidden group">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-serif">Local Weather</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" /> Default City, Resort Area
          </p>
        </div>
        <div className={`p-3 rounded-2xl ${current.bg} ${current.color} transition-colors duration-1000`}>
          <motion.div
            key={current.type}
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Icon className="h-8 w-8" />
          </motion.div>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <motion.span 
          key={current.temp}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl font-serif font-bold tracking-tighter"
        >
          {current.temp}°
        </motion.span>
        <span className="text-xl text-muted-foreground mb-1 capitalize tracking-wide">{current.type}</span>
      </div>

      <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Wind</p>
            <p className="text-sm font-semibold">12 mph</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Humidity</p>
            <p className="text-sm font-semibold">45%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
