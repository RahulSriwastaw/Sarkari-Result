import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Megaphone, RefreshCw, Layers, Sparkles, SlidersHorizontal, Search } from 'lucide-react';
import { getPosts, getCategories, isDemoMode, getCurrentUser, getProfile } from '../../lib/supabase';
import { Post, Category, Profile, isNewPost, isClosingSoonPost, isHighSalaryPost } from '../../lib/types';
import PostCard from '../../components/PostCard';
import PostCardSkeleton from '../../components/PostCardSkeleton';
import NewsletterSubscription from '../../components/NewsletterSubscription';
import CategoryPill from '../../components/CategoryPill';
import ProfileSetupModal from '../../components/ProfileSetupModal';
import FAQ from '../../components/FAQ';
import SalaryCalculator from '../../components/SalaryCalculator';

export default function Homepage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [tickerPosts, setTickerPosts] = useState<Post[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'closing' | 'salary'>('all');
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    setVisibleCount(6);
  }, [activeFilter]);


  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch published posts
        const allPosts = await getPosts({ status: 'published' });
        setPosts(allPosts);
        
        // Take latest 5 for ticker
        setTickerPosts(allPosts.slice(0, 5));
        
        // Fetch categories
        const allCats = await getCategories();
        setCategories(allCats);
        
        // Fetch profile
        const user = getCurrentUser();
        if (user) {
          const profileData = await getProfile(user.email); 
          setProfile(profileData);
          if (profileData && (!profileData.qualification || !profileData.dob || !profileData.category)) {
            setShowProfileModal(true);
          }
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  const countAll = remainingPosts.length;
  const countNew = remainingPosts.filter(isNewPost).length;
  const countClosing = remainingPosts.filter(isClosingSoonPost).length;
  const countSalary = remainingPosts.filter(isHighSalaryPost).length;

  const filteredRemainingPosts = remainingPosts.filter((post) => {
    if (activeFilter === 'new') return isNewPost(post);
    if (activeFilter === 'closing') return isClosingSoonPost(post);
    if (activeFilter === 'salary') return isHighSalaryPost(post);
    return true;
  });


  return (
    <div className="space-y-6">
      <Helmet>
        <title>SarkariCMS - Latest Government Job Alerts & Recruitment</title>
        <meta name="description" content="Find the latest Sarkari Naukri, exam admit cards, results, and answer keys. Get authentic government job alerts simplified." />
      </Helmet>
      
      {/* 1. Breaking Ticker / Marquee */}
      {tickerPosts.length > 0 && (
        <div className="w-full bg-[var(--accent)] text-white text-xs py-2 px-4 rounded-lg shadow-sm flex items-center overflow-hidden gap-3 font-semibold select-none">
          <div className="flex items-center gap-1.5 shrink-0 bg-[var(--accent-hover)] px-2 py-1 rounded text-[10px] uppercase tracking-wider font-extrabold animate-pulse">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Latest Alerts</span>
          </div>
          <div className="relative flex-1 overflow-hidden h-4">
            <div className="absolute flex whitespace-nowrap gap-12 animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused] cursor-pointer">
              {tickerPosts.map((tp) => (
                <Link key={tp.id} to={`/job/${tp.slug}`} className="hover:underline flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  <span>{tp.title_hindi || tp.title} ({tp.total_vacancies ? `${tp.total_vacancies.toLocaleString('en-IN')} Posts` : 'Apply Now'})</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-3.5 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-bold">Running in Sandbox Mode (Local Storage & Pre-seeded Jobs)</p>
              <p className="text-blue-600/80 dark:text-blue-400/80 mt-0.5">Connect your Supabase Database credentials in Secrets to sync to PostgreSQL in real-time!</p>
            </div>
          </div>
          <Link to="/admin" className="shrink-0 px-2.5 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/60 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded font-semibold transition-colors">
            Try Admin Panel
          </Link>
        </div>
      )}

      {/* 2. Hero Banner (Anti-AI-Slop & Humanized Layout) */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        
        <div className="max-w-2xl relative z-10 space-y-4">
          <span className="badge bg-[var(--accent)]/10 text-[var(--accent-text)] border border-[var(--accent)]/20 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded">
            🔥 #1 Sarkari Alerts Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            Sarkari Naukri, Sabse Pehle.<br />
            <span className="text-[var(--accent-text)] font-hindi">सरकारी भर्ती की जानकारी हिंदी और इंग्लिश में</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            SarkariCMS aggregates and simplifies government exam advertisements directly from authentic gazettes, saving you from complex PDF jargon. Get direct application links instantly.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>Fully Verified Ads</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>No Forced Popup Ads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Subscription Section */}
      <NewsletterSubscription />

      {/* 3. Horizontal Swipable Category Filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-[var(--accent-text)]" />
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Browse by Categories</h2>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, showAllCategories ? categories.length : 8).map((cat) => (
            <CategoryPill key={cat.id} category={cat} isActive={false} />
          ))}
          {categories.length > 8 && (
            <button 
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="text-[11px] font-bold text-slate-500 hover:text-primary px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
            >
              {showAllCategories ? 'Collapse' : `+${categories.length - 8} More`}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Tool Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/calendar" className="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/40 transition-all flex items-center justify-between group shadow-sm">
          <div className="space-y-1">
            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              📅 EXAM TRACKER
            </span>
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white group-hover:text-primary transition-colors">
              Sarkari Exam Calendar 2026
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Track active direct apply end dates, CBT tests, & admit card releases.
            </p>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition-transform">➡️</span>
        </Link>

        <Link to="/eligibility" className="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/40 transition-all flex items-center justify-between group shadow-sm">
          <div className="space-y-1">
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              🤖 AI MATCHMAKER
            </span>
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white group-hover:text-primary transition-colors">
              Gemini AI Eligibility Checker
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Input your age, education, & category to match with vacancies instantly.
            </p>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition-transform">➡️</span>
        </Link>
      </div>

      <SalaryCalculator />

      <FAQ />

      {loading ? (
        <div className="space-y-8">
          {[
            { title: 'Latest Jobs', icon: '💼' },
            { title: 'Results', icon: '🏆' },
            { title: 'Admit Cards', icon: '🎟️' },
            { title: 'Answer Key', icon: '🔑' },
            { title: 'Documents', icon: '📄' },
            { title: 'Admission', icon: '🎓' },
          ].map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {section.icon} {section.title}
                </h2>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="flex flex-row gap-3 overflow-x-auto pb-4 scrollbar-none">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="min-w-[220px] w-[220px]">
                    <PostCardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 card max-w-md mx-auto space-y-3">
          <p className="text-2xl">🔍</p>
          <h3 className="font-bold text-slate-800 dark:text-white">No job postings found</h3>
          <p className="text-xs text-slate-500">Log into the Admin Panel at the top right to create your first manual job post!</p>
          <Link to="/admin" className="btn btn-primary btn-sm">Go to Admin Login</Link>
        </div>
      ) : (
        <div className="space-y-8">
          
      {/* 4. Category Sections */}
      {[
        { title: 'Latest Jobs', filter: 'all', icon: '💼' },
        { title: 'Results', filter: 'results', icon: '🏆' },
        { title: 'Admit Cards', filter: 'admit_card', icon: '🎟️' },
        { title: 'Answer Key', filter: 'answer_key', icon: '🔑' },
        { title: 'Documents', filter: 'documents', icon: '📄' },
        { title: 'Admission', filter: 'admission', icon: '🎓' },
      ].map((section) => (
        <div key={section.title} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {section.icon} {section.title}
            </h2>
            <Link to={`/category/${section.filter}`} className="text-xs font-bold text-primary hover:text-primary-hover">
              View More
            </Link>
          </div>
          <div className="flex flex-row gap-3 overflow-x-auto pb-4">
            {posts.filter(p => p.category?.slug === section.filter || section.filter === 'all').slice(0, 10).map(post => (
              <div key={post.id} className="min-w-[220px] w-[220px]">
                <PostCard post={post} profile={profile} />
              </div>
            ))}
          </div>
        </div>
      ))}

        </div>
      )}

      <ProfileSetupModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        profile={profile} 
      />

      {/* Marquee Animation styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  );
}
