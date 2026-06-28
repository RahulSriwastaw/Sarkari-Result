import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isFullViewportPage = location.pathname === '/admin/ai-generator';

  return (
    <div className={`app-shell bg-slate-50 dark:bg-slate-950 flex flex-col ${isFullViewportPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      
      {/* Mobile Top Header */}
      <header className="lg:hidden h-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            aria-label="Toggle admin sidebar"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/admin" className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-tight text-slate-800 dark:text-white">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span>Sarkari Admin</span>
          </Link>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Container Shell */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Desktop Component */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Drawer Navigation Backdrop */}
        {mobileOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity" 
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile Drawer Navigation Content */}
        <div className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 z-50 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out`}>
          <div className="flex flex-col h-full" onClick={() => setMobileOpen(false)}>
            <Sidebar />
          </div>
        </div>

        {/* Admin Contents Pane */}
        {isFullViewportPage ? (
          <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Desktop Panel Header */}
              <div className="hidden lg:flex justify-end items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 font-mono">System Status: Active</span>
                  <ThemeToggle />
                </div>
              </div>

              <Outlet />
            </div>
          </main>
        )}
      </div>

    </div>
  );
}
