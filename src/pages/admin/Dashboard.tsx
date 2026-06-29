import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, getCategories, migrateFromFirestore } from '../../lib/supabase';
import { Post, Category } from '../../lib/types';
import { 
  FileText, CheckCircle, Clock, Folder, 
  PlusCircle, RefreshCw, ChevronRight, AlertCircle, ShieldAlert,
  Database, ArrowRightLeft, Check
} from 'lucide-react';

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{success?: boolean, error?: string, count?: {posts: number, cats: number}} | null>(null);

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

  const handleMigration = async () => {
    if (!window.confirm('This will copy all data from Firestore to Supabase. Continue?')) return;
    
    setMigrating(true);
    setMigrationStatus(null);
    try {
      const result = await migrateFromFirestore();
      if (result.success) {
        setMigrationStatus({ 
          success: true, 
          count: { posts: (result as any).posts || 0, cats: (result as any).categories || 0 } 
        });
        loadDashboardData();
      } else {
        setMigrationStatus({ success: false, error: result.error });
      }
    } catch (err: any) {
      setMigrationStatus({ success: false, error: err.message });
    } finally {
      setMigrating(false);
    }
  };

  // Compute key stats
  const totalPosts = posts.length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const totalCategories = categories.length;
  
  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://kvyeumipuyooaprxlsah.supabase.co';
  const isSupabaseConfigured = !!supabaseUrl && supabaseUrl !== '';

  const isDatabaseSetupNeeded = isSupabaseConfigured && totalCategories === 0 && totalPosts === 0;

  const recentPosts = posts.slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Configuration Warnings */}
      <div className="space-y-3">
        {!isSupabaseConfigured && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-start gap-4">
            <div className="bg-rose-100 dark:bg-rose-900/40 p-2 rounded-lg text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-200">Supabase Credentials Missing</h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
                Your application is not connected to Supabase. Detected URL: <code className="bg-rose-100 dark:bg-rose-900/60 px-1 rounded">{supabaseUrl || 'None'}</code>. 
                Please add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your environment variables or secrets.
              </p>
            </div>
          </div>
        )}

        {/* Migration Tool */}
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Data Migration Utility</h3>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
              Move your existing data from Firestore to Supabase in one click. Use this if your "previous posts" are not showing up.
            </p>
            {migrationStatus && (
              <div className={`mt-2 text-xs font-medium flex items-center gap-1.5 ${migrationStatus.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                {migrationStatus.success ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Migrated {migrationStatus.count?.posts} posts and {migrationStatus.count?.cats} categories!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>Migration failed: {migrationStatus.error}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={handleMigration}
            disabled={migrating || !isSupabaseConfigured}
            className={`btn btn-sm ${migrating ? 'loading' : ''} bg-indigo-600 hover:bg-indigo-700 text-white border-none`}
          >
            {migrating ? 'Migrating...' : 'Start Migration'}
          </button>
        </div>

        {/* Database Setup Notice */}
        {isDatabaseSetupNeeded && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">Database Schema Required</h3>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                Connection established, but no tables found. Please execute the SQL schema in your Supabase SQL Editor.
              </p>
            </div>
            <a 
              href="/supabase_schema.sql" 
              target="_blank" 
              className="btn bg-amber-600 hover:bg-amber-700 text-white border-none btn-sm"
            >
              View SQL Schema
            </a>
          </div>
        )}
      </div>
      
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
          <Link to="/veda-admin-6721/posts/new" className="btn btn-primary btn-sm">
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
                <Link to="/veda-admin-6721/posts" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
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
                          to={`/veda-admin-6721/posts/edit/${post.id}`}
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
