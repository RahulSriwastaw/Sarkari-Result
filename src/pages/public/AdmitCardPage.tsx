import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, RefreshCw, Ticket } from 'lucide-react';
import { getPosts } from '../../lib/supabase';
import { Post } from '../../lib/types';
import PostCard from '../../components/PostCard';

export default function AdmitCardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdmitCards() {
      try {
        setLoading(true);
        // Fetch posts matching 'admit-card' category
        const admitCards = await getPosts({ category: 'admit-card', status: 'published' });
        setPosts(admitCards);
      } catch (err) {
        console.error('Error fetching admit card posts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdmitCards();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
        <Link to="/" className="hover:text-primary flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary">Hall Tickets & Admit Cards</span>
      </nav>

      {/* Hero Header */}
      <div className="card p-6 border-l-4 border-l-cyan-500 rounded-xl bg-white dark:bg-slate-900 transition-all shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎫</span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            Admit Cards & Hall Tickets
            <span className="font-hindi text-lg font-bold text-slate-500 dark:text-slate-400 ml-2">(प्रवेश पत्र)</span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed mt-2">
          Download your official exam admit cards, hall tickets, and view scheduled test dates, test centers, and instructions for major upcoming state and national exams.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Retrieving call letters database...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 card bg-white dark:bg-slate-900 max-w-lg mx-auto">
          <p className="text-2xl mb-2">🎫</p>
          <h3 className="font-bold text-slate-700 dark:text-white">No active admit cards declared yet</h3>
          <p className="text-xs text-slate-400 mt-1">Sarkari CMS will list call letters here the moment exams are officially announced.</p>
          <Link to="/" className="btn btn-primary btn-sm mt-4">Browse Recruitment Jobs</Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Hall Tickets to Download</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
