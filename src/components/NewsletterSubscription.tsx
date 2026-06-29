import React, { useState, useEffect } from 'react';
import { Mail, Bell, Check, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Check if user is already subscribed in this browser
    const subscribedEmails = JSON.parse(localStorage.getItem('subscribed_emails') || '[]');
    if (subscribedEmails.length > 0) {
      // Just a check to see if they previously subscribed
      setIsSubscribed(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.trim()) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Basic email pattern check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error('Please enter a valid email format.');
      return;
    }

    setIsSubmitting(true);

    // Simulate server side request with a premium micro-interaction feel
    setTimeout(() => {
      const subscribedEmails = JSON.parse(localStorage.getItem('subscribed_emails') || '[]');
      if (!subscribedEmails.includes(email.trim().toLowerCase())) {
        subscribedEmails.push(email.trim().toLowerCase());
        localStorage.setItem('subscribed_emails', JSON.stringify(subscribedEmails));
      }
      
      setIsSubmitting(false);
      setIsSubscribed(true);
      toast.success('Successfully subscribed to daily job alerts! 🎉');
      setEmail('');

      // Trigger simple confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b']
      });
    }, 1200);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#131b2e] to-slate-950 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-lg animate-in fade-in duration-300">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest">
            <Bell className="w-3 h-3 animate-bounce" />
            <span>Never Miss an Update</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Get Instant Job Alerts in Your Inbox
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
            Subscribe to receive daily updates on latest Government recruitments, admit cards, exam results, and answer keys. Zero spam, direct links only.
          </p>
        </div>

        <div className="w-full md:w-auto shrink-0 md:min-w-[340px]">
          {isSubscribed ? (
            <div className="flex flex-col items-center sm:items-start md:items-end justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 gap-1 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Check className="w-4 h-4" />
                <span>You are Subscribed!</span>
              </div>
              <p className="text-[10px] text-emerald-400/80 text-center sm:text-left md:text-right">
                Daily alert notification engine active.
              </p>
              <button 
                onClick={() => setIsSubscribed(false)} 
                className="text-[10px] text-slate-400 hover:text-white underline mt-1.5 font-medium transition-colors"
              >
                Subscribe another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white rounded-lg text-xs font-bold shadow-md transition-all shrink-0 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Subscribe Alerts</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component refresh animation replacement if needed
function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
