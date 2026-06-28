import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, getCategories } from '../../lib/supabase';
import { Post, Category } from '../../lib/types';
import { 
  FileText, CheckCircle, Clock, Folder, 
  PlusCircle, RefreshCw, ChevronRight, AlertCircle 
} from 'lucide-react';

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [allPosts, allCats] = await Promise.all([
        getPosts({}),
        getCategories()
      ]);
      setPosts(allPosts);
      setCategories(allCats);
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute key stats
  const totalPosts = posts.length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const totalCategories = categories.length;

  const recentPosts = posts.slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Title Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Admin Workspace Control Center
          </h1>
          <p className="text-xs text-slate-400">Manage real-time government jobs, call letters, results, and notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadDashboardData}
            className="btn btn-secondary btn-sm"
            aria-label="Refresh stats dashboard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Stats</span>
          </button>
          <Link to="/admin/posts/new" className="btn btn-primary btn-sm">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Job Post</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Querying live metrics...</span>
        </div>
      ) : (
        <>
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Metric 1 */}
            <div className="card p-5 bg-white dark:bg-slate-900 border-l-4 border-l-primary shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bulletins</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalPosts}</h3>
              </div>
              <div className="bg-primary/10 dark:bg-primary/20 text-primary p-2.5 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="card p-5 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live & Active</p>
                <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-1 text-emerald-600 dark:text-emerald-450">{publishedCount}</h3>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 p-2.5 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 3 */}
            <div className="card p-5 bg-white dark:bg-slate-900 border-l-4 border-l-slate-400 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft Bulletins</p>
                <h3 className="text-2xl font-black text-slate-700 dark:text-white mt-1">{draftCount}</h3>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 p-2.5 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 4 */}
            <div className="card p-5 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Categories</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalCategories}</h3>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 p-2.5 rounded-xl">
                <Folder className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Quick Actions Dashboard split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Posts Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-900">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chronological Updates</h2>
                <Link to="/admin/posts" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  <span>View Full Directory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentPosts.length === 0 ? (
                <div className="card p-8 text-center bg-white dark:bg-slate-900">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No postings recorded yet. Click 'New Job Post' to publish your first update!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <div 
                      key={post.id}
                      className="card p-4 bg-white dark:bg-slate-900 shadow-sm hover:translate-y-0 transition-none flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            post.status === 'published' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900/40' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700/60'
                          }`}>
                            {post.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ID: {post.id.slice(0, 8)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100 line-clamp-1">
                          {post.title_en}
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
                          {post.department} • Vacancies: {post.vacancies || 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link 
                          to={`/admin/posts/edit/${post.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Configure
                        </Link>
                        <a 
                          href={`/posts/${post.slug}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          Live preview
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions / Helpers Column */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-900">
                Administrative Helpers
              </h2>

              <div className="card p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Hindi Translation Quick Guide</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We maintain bilingual support for transparency. If you need assistance with Hindi headlines, please translate manually. For example:
                </p>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-900 text-[11px] space-y-1.5 leading-normal">
                  <p className="text-slate-500"><strong className="text-slate-600 dark:text-slate-300">English:</strong> Admit Card Published</p>
                  <p className="text-slate-500"><strong className="text-slate-600 dark:text-slate-300">Hindi:</strong> एडमिट कार्ड जारी</p>
                  <div className="h-px bg-slate-100 dark:bg-slate-900 my-1.5" />
                  <p className="text-slate-500"><strong className="text-slate-600 dark:text-slate-300">English:</strong> Apply Online</p>
                  <p className="text-slate-500"><strong className="text-slate-600 dark:text-slate-300">Hindi:</strong> ऑनलाइन आवेदन करें</p>
                </div>
              </div>

              <div className="card p-5 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Data Integrity Warning</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Avoid publishing duplicate posts. Always verify whether a commission notification has already been listed in the database to prevent student confusion.
                </p>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
