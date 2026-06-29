import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, ShieldAlert, User, Languages } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../lib/LanguageContext';
import { getCategories } from '../lib/supabase';
import { Category } from '../lib/types';

export default function Header() {
  const { language, setLanguage } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getCategories().then(setCategories);


  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || selectedCategory) {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      navigate(`/search?${params.toString()}`);
      setSearchOpen(false);
      setSearchQuery('');
      setSelectedCategory('');
    }
  };

  // Keep navigation clean
  const visibleCategories = categories.filter(c => 
    ['ssc', 'railway', 'banking', 'upsc', 'police', 'defence'].includes(c.slug)
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: Brand/Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1.5 group">
              <span className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg text-white font-bold text-lg shadow-md shadow-primary/20 group-hover:bg-primary-hover transition-colors">
                R
              </span>
              <div className="leading-tight">
                <span className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-primary transition-colors">Result</span>
                <span className="font-bold text-lg text-primary">Veda</span>
                <span className="hidden sm:block text-[10px] text-gray-400 dark:text-slate-500 font-medium tracking-wider uppercase">Sarkari Result, Latest Jobs & Government Exam Updates</span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/" className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${location.pathname === '/' ? 'text-primary bg-primary/10' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
              Home
            </Link>
            <Link to="/results" className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${location.pathname === '/results' ? 'text-primary bg-primary/10' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
              Results
            </Link>
            <Link to="/admit-card" className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${location.pathname === '/admit-card' ? 'text-primary bg-primary/10' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
              Admit Card
            </Link>
            <Link to="/calendar" className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${location.pathname === '/calendar' ? 'text-primary bg-primary/10' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
              Calendar
            </Link>
            <Link to="/eligibility" className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${location.pathname === '/eligibility' ? 'text-primary bg-primary/10' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
              AI Eligibility
            </Link>
            <Link to="/expected-salary-calculator" className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${location.pathname === '/expected-salary-calculator' ? 'text-primary bg-primary/10' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
              Salary Calc
            </Link>
            <Link to="/veda-admin-6721" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-primary transition-colors flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Search jobs"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link 
              to="/profile" 
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="My Profile & Saved Jobs"
            >
              <User className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary transition-all group"
              title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
            >
              <Languages className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-tight">
                {language === 'en' ? 'Hindi' : 'English'}
              </span>
            </button>
            <ThemeToggle />
            

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Floating Inline Search Drawer */}
      {searchOpen && (
        <div className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-inner">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex gap-2">
            <select 
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary text-slate-800 dark:text-white"
            >
                <option value="">All Categories</option>
                {categories.map(cat => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="Search ResultVeda (e.g. SSC, RPF, Bank, etc.)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary dark:focus:border-primary text-slate-800 dark:text-white"
              autoFocus
            />
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Slide-in */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 max-w-xs h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-4 animate-in slide-in-from-left duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Pages</span>
              <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                Home
              </Link>
              <Link to="/results" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                Results
              </Link>
              <Link to="/admit-card" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                Admit Cards
              </Link>
              <Link to="/calendar" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                Exam Calendar
              </Link>
              <Link to="/eligibility" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                AI Eligibility
              </Link>
              <Link to="/expected-salary-calculator" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                Salary Calculator
              </Link>
              <Link to="/veda-admin-6721" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Panel</span>
              </Link>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Categories</span>
              {categories.map(cat => (
                <Link 
                  key={cat.id} 
                  to={`/category/${cat.slug}`} 
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg"
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
