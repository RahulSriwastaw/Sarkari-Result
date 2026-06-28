import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { getPosts } from '../../lib/supabase';
import { Post } from '../../lib/types';
import PostCard from '../../components/PostCard';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
    async function performSearch() {
      setLoading(true);
      try {
        // Fetch posts that match status 'published'
        const allPosts = await getPosts({ status: 'published' });
        
        let filtered = allPosts;
        
        if (query.trim()) {
          const lowerQuery = query.toLowerCase();
          filtered = filtered.filter(post => 
            post.title_en.toLowerCase().includes(lowerQuery) ||
            (post.title_hi && post.title_hi.toLowerCase().includes(lowerQuery)) ||
            post.post_name.toLowerCase().includes(lowerQuery) ||
            post.department.toLowerCase().includes(lowerQuery) ||
            post.short_info_en.toLowerCase().includes(lowerQuery) ||
            (post.short_info_hi && post.short_info_hi.toLowerCase().includes(lowerQuery))
          );
        }

        if (category) {
          filtered = filtered.filter(post => post.category_slug === category);
        }
        
        setPosts(filtered);
      } catch (err) {
        console.error('Error conducting job search:', err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
        <Link to="/" className="hover:text-primary flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary">Global Search</span>
      </nav>

      {/* Search Input Box */}
      <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <span>Search Recruitment Updates & Exams</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Enter job titles, exam boards, qualification requirements or departments below.</p>
          </div>

          <div className="flex gap-2 max-w-2xl">
            <input
              type="text"
              placeholder="Search e.g. SSC CGL, Railway, Bihar Police, 12th Pass..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input flex-1 focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {query ? `Search Results for "${query}"` : 'All Available Job Openings'}
        </h2>
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
          Found {posts.length} entries
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Searching updates index...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 card bg-white dark:bg-slate-900 max-w-lg mx-auto">
          <p className="text-2xl mb-2">🔍</p>
          <h3 className="font-bold text-slate-700 dark:text-white">No updates matched your criteria</h3>
          <p className="text-xs text-slate-400 mt-1">Try broadening your terms, using qualification keywords (e.g., "12th Pass"), or checking spelling.</p>
          <button 
            onClick={() => { setSearchInput(''); setSearchParams({}); }}
            className="btn btn-secondary btn-sm mt-4"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

    </div>
  );
}
