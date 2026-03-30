import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Mic, MicOff } from 'lucide-react';
import { serviceRequestService } from '@/services/serviceRequestService';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
}

const AIConcierge = ({ roomId }: { roomId?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'bot', content: 'Hello! I am your Grand Stays AI Concierge. How can I assist you with your stay today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isListening]);

  const processMessage = async (text: string) => {
    const lower = text.toLowerCase();
    
    // Simple intent recognition
    if (lower.includes('wifi') || lower.includes('internet')) {
      return "The Wi-Fi network is 'GrandStays-Guest' and the password is 'Welcome2026'.";
    }
    if (lower.includes('checkout') || lower.includes('check out')) {
      return "Standard checkout time is 11:00 AM. Would you like to request a late checkout?";
    }
    if (lower.includes('towel') || lower.includes('cleaning') || lower.includes('room service')) {
      if (!roomId) return "I can help with that, but it looks like you don't have an active checked-in room right now.";
      
      try {
        await serviceRequestService.create({
          room: roomId,
          requestType: '🧹 AI Automated Request',
          description: text,
          price: 0
        });
        toast.success('Your request was sent to the staff!', { style: { background: 'hsl(0 0% 7%)', color: 'white', borderRadius: '0' } });
        return "I've analyzed your request and automatically forwarded it to our ground staff. They will be right with you!";
      } catch {
        return "I tried to send your request to the staff, but there was a system error. Please try again later or visit the front desk.";
      }
    }
    
    return "I'm a simple AI concierge. Try asking me about 'wifi', 'checkout time', or requesting room services like 'towels' or 'cleaning'!";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(async () => {
      const response = await processMessage(userMsg.content);
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'bot', content: response }]);
    }, 1500);
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    interface SR {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: (() => void) | null;
      onresult: ((event: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
    }
    interface SpeechRecognitionWindow extends Window {
      SpeechRecognition?: new () => SR;
      webkitSpeechRecognition?: new () => SR;
    }
    const win = window as SpeechRecognitionWindow;
    const SRConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
    
    if (!SRConstructor) {
      toast.error("Your browser doesn't support voice recognition.");
      return;
    }

    const recognition = new SRConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Automatically send the voice message
      setTimeout(() => {
        handleSendVoice(transcript);
      }, 500);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition failed. Please try again.');
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSendVoice = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(async () => {
      const response = await processMessage(userMsg.content);
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'bot', content: response }]);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/20 flex items-center justify-center z-50"
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full gold-gradient shadow-inner flex items-center justify-center">
                  <Bot className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold">AI Concierge</h3>
                  <p className="text-[10px] text-success font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex items-start gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center mt-1 ${msg.type === 'user' ? 'bg-muted text-muted-foreground' : 'bg-accent/20 text-accent'}`}>
                    {msg.type === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.type === 'user' ? 'bg-muted text-foreground rounded-tr-sm' : 'bg-accent/10 border border-accent/20 text-foreground rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center mt-1 bg-accent/20 text-accent">
                    <Bot className="h-3 w-3" />
                  </div>
                  <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 rounded-tl-sm flex items-center gap-1 h-10">
                    <span className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              {isListening && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center my-2">
                  <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
                    <Mic className="h-4 w-4 text-accent animate-pulse" />
                    <span className="text-xs font-semibold text-accent">Listening...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-card border-t border-border/50">
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 shrink-0 rounded-xl transition-colors ${isListening ? 'bg-destructive/10 text-destructive' : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask for towels, Wi-Fi password..."}
                    disabled={isListening}
                    className="w-full bg-muted/50 rounded-xl pl-4 pr-12 py-3 text-sm outline-none placeholder:text-muted-foreground focus:bg-muted transition-colors disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping || isListening}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:hover:bg-accent transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIConcierge;
