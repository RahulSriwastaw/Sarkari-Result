import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../lib/supabase';
import { RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        setAuthenticated(!!user);
      } catch (err) {
        console.error('Auth verification failed:', err);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [location]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Verifying session authority...</span>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
