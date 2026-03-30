import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, name);
      toast.success('Account created! Please check your email to verify.', { style: { background: 'hsl(0 0% 7%)', color: 'white', borderRadius: '0' } });
      navigate('/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg, { style: { background: 'hsl(0 0% 7%)', color: 'white', borderRadius: '0' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md relative z-10"
        >
          <Link to="/" className="text-4xl font-serif tracking-tighter mb-2 block hover:text-accent transition-colors text-accent">Grand Stays</Link>
          <div className="h-px w-12 bg-accent/50 mb-8" />

          <h1 className="text-3xl font-serif mb-2 text-foreground">Join the Elite</h1>
          <p className="text-muted-foreground text-sm mb-10 font-sans tracking-wide">
            Escape to a world of curated luxury and personalized hospitality.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 block">Name</label>
              <div className="group relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required 
                  className="w-full pl-12 pr-4 py-4 bg-card/50 backdrop-blur-sm border border-border group-focus-within:border-accent/50 rounded-2xl text-sm outline-none transition-all placeholder:text-muted-foreground/30" 
                  placeholder="John Doe" 
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 block">Identity (Email)</label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
                  className="w-full pl-12 pr-4 py-4 bg-card/50 backdrop-blur-sm border border-border group-focus-within:border-accent/50 rounded-2xl text-sm outline-none transition-all placeholder:text-muted-foreground/30" 
                  placeholder="you@example.com" 
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 block">Secret (Password)</label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} 
                  className="w-full pl-12 pr-12 py-4 bg-card/50 backdrop-blur-sm border border-border group-focus-within:border-accent/50 rounded-2xl text-sm outline-none transition-all placeholder:text-muted-foreground/30" 
                  placeholder="Min. 6 characters" 
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gold-gradient text-accent-foreground font-bold h-14 rounded-2xl shadow-xl shadow-accent/10 hover:shadow-accent/20 transition-all active:scale-[0.98]" disabled={loading}>
              {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" /> Creating sanctuary...</span> : 'Create Account'}
            </Button>
          </form>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Already a member? <Link to="/login" className="text-accent font-semibold hover:underline underline-offset-4">Sign In</Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right Side: Hero Image */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src="/images/login-hero.png" 
            alt="Luxury Hotel Sanctuary" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-background via-transparent to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>
        
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Exclusive Membership</span>
            <h2 className="text-5xl font-serif text-white leading-tight mb-6">Your personal retreat<br />awaits.</h2>
            <div className="w-24 h-1 bg-accent" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
