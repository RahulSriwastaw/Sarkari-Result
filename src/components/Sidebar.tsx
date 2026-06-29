import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, FolderTree, ExternalLink, LogOut, ShieldAlert, Sparkles } from 'lucide-react';
import { adminLogout } from '../lib/supabase';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await adminLogout();
      navigate('/veda-admin-6721/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <aside className="sidebar flex flex-col justify-between">
      <div>
        {/* Logo / Title Block */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="bg-primary text-white rounded p-1.5 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-tight text-slate-800 dark:text-white uppercase">ResultVeda Admin</h2>
            <p className="text-[9px] text-slate-400 font-semibold font-mono">PORTAL MANAGEMENT</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="py-4">
          <p className="nav-section-label">Core Updates</p>
          <nav className="space-y-0.5">
            <NavLink
              to="/veda-admin-6721"
              end
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard />
              <span className="nav-label">Dashboard</span>
            </NavLink>

            <NavLink
              to="/veda-admin-6721/posts"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FileText />
              <span className="nav-label">All Post Updates</span>
            </NavLink>

            <NavLink
              to="/veda-admin-6721/categories"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FolderTree />
              <span className="nav-label">Categories</span>
            </NavLink>

            <NavLink
              to="/veda-admin-6721/ai-generator"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Sparkles />
              <span className="nav-label">AI Content Desk</span>
            </NavLink>
          </nav>

          <p className="nav-section-label mt-4">Public Portal</p>
          <nav className="space-y-0.5">
            <NavLink
              to="/"
              className="nav-item"
            >
              <ExternalLink />
              <span className="nav-label">Launch Live Site</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Panel</span>
        </button>
      </div>
    </aside>
  );
}
