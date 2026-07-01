import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Home, LayoutGrid, RefreshCw } from 'lucide-react';
import { getPosts, getCategories } from '../../lib/supabase';
import { Post, Category } from '../../lib/types';
import PostCard from '../../components/PostCard';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryData() {
      if (!slug) return;
      try {
        setLoading(true);
        if (slug === 'all') {
            setCategory({ name: 'All Jobs', slug: 'all', icon: '🌐', description: 'Browse all active job recruitments', color: '#6366F1' } as any);
            const allPosts = await getPosts();
            setPosts(allPosts);
        } else {
            // Load category info
            const allCats = await getCategories();
            const foundCat = allCats.find(c => c.slug === slug);
            setCategory(foundCat || null);

            // Load posts for this category
            const filteredPosts = await getPosts({ category: slug, status: 'published' });
            setPosts(filteredPosts);
        }
      } catch (err) {
        console.error('Error loading category posts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategoryData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Filtering alerts...</span>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-16 card max-w-md mx-auto space-y-4">
        <p className="text-2xl">⚠️</p>
        <h3 className="font-bold text-slate-800 dark:text-white">Category Not Found</h3>
        <p className="text-xs text-slate-500">The requested category does not exist in our system.</p>
        <Link to="/" className="btn btn-primary btn-sm">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Breadcrumb Header */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
        <Link to="/" className="hover:text-primary flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600 dark:text-slate-300">Category</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary">{category.name}</span>
      </nav>

      {/* Category Banner */}
      <div 
        className="card p-6 border-l-4 rounded-xl flex flex-col justify-center space-y-2 bg-white dark:bg-slate-900 transition-all shadow-sm"
        style={{ borderLeftColor: category.color }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.icon || '💼'}</span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-sans">
            {category.name} Alerts Portal 
            {category.name_hindi && <span className="font-hindi text-lg font-bold text-slate-500 dark:text-slate-400 ml-2">({category.name_hindi})</span>}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          {category.description || `Get instant updates, syllabi, admit cards, and final exam results published by ${category.name}, verified and indexed in real-time.`}
        </p>
        <div className="pt-1">
          <span className="badge bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5">
            📋 {posts.length} Active Posts Available
          </span>
        </div>
      </div>

      {/* Grid List */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Posts listed under {category.name}</h2>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 card bg-white dark:bg-slate-900">
            <p className="text-xl mb-2">📢</p>
            <h3 className="font-bold text-slate-700 dark:text-white">No active job listings under {category.name}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Please check back later or explore other live exam categories from the navbar.</p>
            <Link to="/" className="btn btn-secondary btn-sm mt-4">Browse Other Jobs</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
