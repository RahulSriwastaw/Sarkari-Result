import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getPosts, deletePost, updatePost, getCategories 
} from '../../lib/supabase';
import { Post, Category } from '../../lib/types';
import { 
  PlusCircle, Edit2, Trash2, FileText, 
  Search, RefreshCw, Eye, CheckCircle, Ban, Clock3, CheckSquare, Square
} from 'lucide-react';

const BULK_DELETE_ENDPOINT = '/api/admin/posts/bulk-delete';

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [bulkScheduledAt, setBulkScheduledAt] = useState('');
  const [clockTick, setClockTick] = useState(Date.now());

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const formatCountdown = (scheduledAt?: string | null) => {
    if (!scheduledAt) return 'No time set';

    const targetTime = new Date(scheduledAt).getTime();
    const diffMs = targetTime - clockTick;

    if (diffMs <= 0) {
      return 'Publishing now';
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || parts.length > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return `Starts in ${parts.join(' ')}`;
  };

  const handleSelectAll = () => {
    if (selectedPostIds.length === filteredPosts.length) {
      setSelectedPostIds([]);
      return;
    }
    setSelectedPostIds(filteredPosts.map(post => post.id));
  };

  const handleTogglePostSelection = (id: string) => {
    setSelectedPostIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleBulkApply = async () => {
    if (selectedPostIds.length === 0) return;

    try {
      await Promise.all(selectedPostIds.map(id => updatePost(id, {
        status: bulkAction,
        scheduled_at: bulkAction === 'scheduled' ? (bulkScheduledAt ? new Date(bulkScheduledAt).toISOString() : null) : null,
      })));
      await loadData();
      setSelectedPostIds([]);
      setBulkScheduledAt('');
    } catch (err) {
      console.error('Bulk update failed:', err);
      alert('Bulk update failed.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPostIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedPostIds.length} selected posts? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(BULK_DELETE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds: selectedPostIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk delete failed');
      await loadData();
      setSelectedPostIds([]);
    } catch (err: any) {
      alert(err.message || 'Bulk delete failed');
    }
  };

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
    // Determine new status: draft ↔ published; scheduled → published
    const currentStatus = post.status ?? 'draft';
    let newStatus: 'draft' | 'published';
    if (currentStatus === 'draft') {
      newStatus = 'published';
    } else {
      newStatus = 'draft';
    }
    try {
      await updatePost(post.id, { 
        status: newStatus,
        scheduled_at: null,
      });
      // Optimistic update
      setPosts(posts.map(p => p.id === post.id ? { 
        ...p, 
        status: newStatus as any, 
        scheduled_at: null 
      } : p));
    } catch (err) {
      alert('Failed to transition publication status.');
      console.error('Status transition error:', err);
    }
  };

  // Filtering
  const filteredPosts = posts.filter(post => {
    const matchesQuery = 
      post.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.department ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.post_name ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    
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
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="scheduled">Scheduled</option>
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
          <div className="border-b border-slate-100 dark:border-slate-800 p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <button type="button" onClick={handleSelectAll} className="btn btn-secondary btn-sm">
                {selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0 ? 'Clear Selection' : 'Select All'}
              </button>
              <span>{selectedPostIds.length > 0 ? `${selectedPostIds.length} selected` : 'No posts selected'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value as 'draft' | 'published' | 'scheduled')} className="select text-xs py-1.5 h-auto">
                <option value="draft">Set Draft</option>
                <option value="published">Publish Now</option>
                <option value="scheduled">Schedule</option>
              </select>
              {bulkAction === 'scheduled' && (
                <input type="datetime-local" value={bulkScheduledAt} onChange={(e) => setBulkScheduledAt(e.target.value)} className="input text-xs py-1.5 h-auto" />
              )}
              <button type="button" onClick={handleBulkApply} disabled={selectedPostIds.length === 0} className="btn btn-primary btn-sm">
                Apply
              </button>
              {selectedPostIds.length > 0 && (
                <button type="button" onClick={handleBulkDelete} className="btn btn-error btn-sm flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
              )}
            </div>
          </div>
          
          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <button type="button" onClick={handleSelectAll} className="text-slate-400 hover:text-primary">
                      {selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
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
                    <td className="p-4 text-center">
                      <button type="button" onClick={() => handleTogglePostSelection(post.id)} className="text-slate-400 hover:text-primary">
                        {selectedPostIds.includes(post.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    
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
                      <div className="flex flex-col items-start gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(post)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                            post.status === 'published'
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border-emerald-100 dark:border-emerald-900/40 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100'
                              : post.status === 'scheduled'
                                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-100'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700/60 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-100'
                          }`}
                          title="Click to Toggle Status"
                        >
                          {post.status === 'published' ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Published</span>
                            </>
                          ) : post.status === 'scheduled' ? (
                            <>
                              <Clock3 className="w-3 h-3" />
                              <span>Scheduled</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                        {post.status === 'scheduled' && post.scheduled_at && (
                          <div className="space-y-0.5">
                            {(() => {
                              const diffMs = new Date(post.scheduled_at!).getTime() - clockTick;
                              const totalSeconds = Math.floor(diffMs / 1000);
                              const days = Math.floor(totalSeconds / 86400);
                              const hours = Math.floor((totalSeconds % 86400) / 3600);
                              
                              // Gradient: green (far away) → amber (hours left) → red (minutes left)
                              let gradientClass = 'text-emerald-600 dark:text-emerald-400';
                              let badgeClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30';
                              if (diffMs <= 0) {
                                gradientClass = 'text-rose-600 dark:text-rose-400';
                                badgeClass = 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30';
                              } else if (days === 0 && hours < 1) {
                                gradientClass = 'text-amber-600 dark:text-amber-400';
                                badgeClass = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30';
                              } else if (days === 0 && hours < 6) {
                                gradientClass = 'text-amber-600 dark:text-amber-400';
                                badgeClass = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30';
                              }
                              
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass} ${gradientClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    diffMs <= 0 ? 'bg-rose-500 animate-ping' : 
                                    days === 0 && hours < 1 ? 'bg-amber-500 animate-pulse' : 
                                    'bg-emerald-500'
                                  }`} />
                                  {formatCountdown(post.scheduled_at)}
                                </span>
                              );
                            })()}
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                              {new Date(post.scheduled_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
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
