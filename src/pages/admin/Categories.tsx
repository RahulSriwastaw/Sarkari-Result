import React, { useState, useEffect } from 'react';
import { 
  getCategories, createCategory, updateCategory, deleteCategory 
} from '../../lib/supabase';
import { Category } from '../../lib/types';
import { 
  PlusCircle, Edit2, Trash2, Folder, Save, RefreshCw, AlertTriangle 
} from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [slug, setSlug] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to pull portal categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEditClick = (cat: Category) => {
    setEditingId(cat.id);
    setTitleEn(cat.title_en);
    setTitleHi(cat.title_hi || '');
    setSlug(cat.slug);
    setOrderIndex(cat.order_index);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitleEn('');
    setTitleHi('');
    setSlug('');
    setOrderIndex(0);
    setError(null);
  };

  const handleGenerateSlug = () => {
    if (!titleEn) return;
    setSlug(titleEn.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn || !slug) {
      setError('Please provide at least an English Title and a clean Slug.');
      return;
    }

    setFormLoading(true);
    setError(null);

    const categoryPayload = {
      title_en: titleEn.trim(),
      title_hi: titleHi.trim() || undefined,
      slug: slug.trim(),
      order_index: Number(orderIndex),
    };

    try {
      if (editingId) {
        await updateCategory(editingId, categoryPayload);
      } else {
        await createCategory(categoryPayload);
      }
      // Reload categories list
      await loadCategories();
      // Reset form
      handleCancelEdit();
    } catch (err: any) {
      console.error('Save category error:', err);
      setError(err?.message || 'Failed to save category item.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, slugName: string) => {
    const isProtected = ['latest-jobs', 'admit-card', 'results'].includes(slugName);
    if (isProtected) {
      alert('The core system folders ("latest-jobs", "admit-card", "results") are protected and cannot be deleted.');
      return;
    }

    if (!window.confirm('Delete this category? Any job bulletins associated with this category slug will lose their binding.')) {
      return;
    }

    try {
      await deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete category failure:', err);
      alert('Failed to delete selected category.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Heading */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
          Portal Categories & Folders
        </h1>
        <p className="text-xs text-slate-400">Classify recruitment drives and configure the navigation display order.</p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid container with Form & Table Side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Form panel */}
        <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm rounded-xl space-y-4 self-start">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-1.5 flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-primary" />
            <span>{editingId ? 'Modify Folder Node' : 'Register New Folder'}</span>
          </h3>

          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="label">English Folder Name</label>
              <input
                type="text"
                placeholder="e.g. Police Jobs"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="input focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="label">Hindi Folder Name <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input
                type="text"
                placeholder="e.g. पुलिस नौकरियां"
                value={titleHi}
                onChange={(e) => setTitleHi(e.target.value)}
                className="input focus:border-primary font-hindi"
              />
            </div>

            <div>
              <label className="label">Category URL Slug</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. police-jobs"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="input focus:border-primary font-mono text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="btn btn-secondary btn-icon py-1.5"
                  title="Generate from English title"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="label">Render Order Index</label>
              <input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                className="input focus:border-primary"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Determines visual priority in home tabs and header menus. Lower numbers render first.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={formLoading}
                className="btn btn-primary flex-1 justify-center h-9 font-semibold"
              >
                {formLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Node</span>
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-secondary h-9"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Table panel */}
        <div className="md:col-span-2 card p-4 bg-white dark:bg-slate-900 shadow-sm rounded-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Portal Category Nodes</h3>
            <button 
              onClick={loadCategories} 
              className="btn btn-ghost btn-icon p-1"
              aria-label="Refresh categories"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs font-semibold text-slate-500">Querying categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No categories found in current database namespace.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase text-slate-400 tracking-wider">
                    <th className="p-3 w-12 text-center">Order</th>
                    <th className="p-3">English Name</th>
                    <th className="p-3">Hindi Name</th>
                    <th className="p-3">Slug Handle</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categories.map((cat) => {
                    const isProtected = ['latest-jobs', 'admit-card', 'results'].includes(cat.slug);
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/15 transition-colors">
                        <td className="p-3 text-center font-mono font-semibold text-slate-500">{cat.order_index}</td>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-100">{cat.title_en}</td>
                        <td className="p-3 font-hindi text-slate-600 dark:text-slate-350">{cat.title_hi || '—'}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-400">{cat.slug}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditClick(cat)}
                              className="btn btn-secondary btn-icon p-1.5"
                              title="Edit folder"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id, cat.slug)}
                              disabled={isProtected}
                              className={`p-1.5 rounded transition-colors ${
                                isProtected 
                                  ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' 
                                  : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                              }`}
                              title={isProtected ? 'Protected folder node' : 'Delete Category'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
