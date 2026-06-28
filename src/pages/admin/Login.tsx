import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { adminLogin } from '../../lib/supabase';
import { ShieldAlert, KeyRound, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both administrative credentials.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await adminLogin(email, password);
      if (response.success) {
        navigate(from, { replace: true });
      } else {
        setError(response.error || 'Incorrect administrator credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication system failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      
      {/* Outer Card container */}
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo and Back button */}
        <div className="flex justify-between items-center px-1">
          <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Site</span>
          </Link>
          <span className="text-[10px] font-mono text-slate-400">V1.0.0 Stable</span>
        </div>

        {/* Card Box */}
        <div className="card p-8 bg-white dark:bg-slate-900 shadow-lg rounded-2xl border border-slate-100 dark:border-slate-800/40">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl p-3.5 mb-2">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">
              Sarkari CMS Panel
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Protected authentication gateway. Unauthorized logins are monitored.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-2.5 mb-6 text-xs leading-relaxed animate-shake">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="label">Admin Email Account</label>
              <input
                type="email"
                placeholder="admin@sarkariprep.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="label">Secure Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input focus:border-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center h-10 mt-2 font-semibold"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying authorization...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate Access</span>
                </>
              )}
            </button>
          </form>

          {/* Seed accounts notice / disclaimer */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 leading-normal">
            <p>Demo Admin Credentials:</p>
            <p className="font-mono mt-0.5 text-slate-500 dark:text-slate-400 font-semibold selection:bg-primary/20">
              admin@sarkariprep.in / admin123
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
