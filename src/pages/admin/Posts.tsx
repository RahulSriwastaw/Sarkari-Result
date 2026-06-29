import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getPosts, deletePost, updatePost, getCategories 
} from '../../lib/supabase';
import { Post, Category } from '../../lib/types';
import { 
  PlusCircle, Edit2, Trash2, Globe, FileText, 
  Search, RefreshCw, Eye, CheckCircle, Ban 
} from 'lucide-react';

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [allPosts, allCats] = await Promise.all([
        getPosts({}),
        getCategories()
      ]);
      setPosts(allPosts);
      setCategories(allCats);
    } catch (err) {
      console.error('Failed to load posts index:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you absolute sure you want to delete this recruitment posting? This cannot be undone.')) {
      return;
    }
    try {
      await deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      alert('Delete operation failed.');
      console.error('Delete error:', err);
    }
  };

  const handleToggleStatus = async (post: Post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await updatePost(post.id, { status: newStatus });
      setPosts(posts.map(p => p.id === post.id ? { ...p, status: updated.status } : p));
    } catch (err) {
      alert('Failed to transition publication status.');
      console.error('Status transition error:', err);
    }
  };

  // Filtering
  const filteredPosts = posts.filter(post => {
    const matchesQuery = 
      post.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.post_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category_slug === categoryFilter;

    return matchesQuery && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white uppercase tracking-tight">
            Government Job Postings Directory
          </h1>
          <p className="text-xs text-slate-400">Add, edit, structure, and publish announcements instantly.</p>
        </div>
        <Link to="/veda-admin-6721/posts/new" className="btn btn-primary btn-sm self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          <span>Create New Post</span>
        </Link>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="card p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bulletins by title, post, board..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 focus:border-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="select focus:border-primary"
          >
            <option value="all">All States</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select focus:border-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>{cat.title_en}</option>
            ))}
          </select>
        </div>

        {/* Sync Button */}
        <button 
          onClick={loadData}
          className="btn btn-secondary btn-icon self-stretch md:self-auto"
          aria-label="Synchronize database table"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Querying postings index...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="card text-center p-16 bg-white dark:bg-slate-900 max-w-md mx-auto">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 dark:text-white text-sm">No updates match your filters</h3>
          <p className="text-xs text-slate-400 mt-1">Try modifying your query or filters, or add a brand new bulletin now.</p>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white dark:bg-slate-900 shadow-sm rounded-xl">
          
          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="p-4 w-12 text-center">Preview</th>
                  <th className="p-4">Bulletin Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Vacancies</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    
                    {/* View Icon Column */}
                    <td className="p-4 text-center">
                      <a
                        href={`/posts/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                        title="View Public Post Page"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    </td>

                    {/* Job Details Column */}
                    <td className="p-4 max-w-sm">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-850 px-1 py-0.5 rounded">
                            {post.department}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                          {post.title_en}
                        </h4>
                        {post.title_hi && (
                          <p className="font-hindi text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {post.title_hi}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 dark:border-primary/30">
                        {post.category_slug}
                      </span>
                    </td>

                    {/* Vacancies Column */}
                    <td className="p-4 whitespace-nowrap font-semibold text-slate-600 dark:text-slate-350">
                      {post.vacancies || 'N/A'}
                    </td>

                    {/* Status Toggle Column */}
                    <td className="p-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                          post.status === 'published'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border-emerald-100 dark:border-emerald-900/40 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700/60 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-100'
                        }`}
                        title="Click to Toggle Status"
                      >
                        {post.status === 'published' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Live</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action Column */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/veda-admin-6721/posts/edit/${post.id}`}
                          className="btn btn-secondary btn-icon p-1.5"
                          title="Edit Recruitment Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Delete Bulletin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
