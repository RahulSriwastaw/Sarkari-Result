import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCategories = async () => [];
export const createPost = async (post: any) => ({ success: true, id: 'mock-post-id', error: null });
export const updatePost = async (id: string, post: any) => ({ success: true, error: null, ...post });
export const getPosts = async (options?: any) => [];
export const migrateFromFirestore = async () => ({ success: true, error: null });
export const adminLogin = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.success) {
      localStorage.setItem('admin_session', JSON.stringify(data.user));
      return { success: true, role: 'admin', error: null };
    }
    return { success: false, error: data.error || 'Incorrect administrator credentials.' };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: 'Authentication service unavailable.' };
  }
};
export const getCurrentUser = async () => {
  const session = localStorage.getItem('admin_session');
  if (session) {
    return JSON.parse(session);
  }
  return null;
};
export const getProfile = async (id: string) => ({ id, qualification: '', dob: '', category: '' });
export const getPostBySlug = async (slug: string) => null;
export const recordPostView = async (slug: string) => {};
export const recordPostApplyClick = async (slug: string) => {};
export const candidateLogin = async (email: string, password?: string) => ({ success: true, error: null });
export const registerUser = async (email: string, password?: string) => ({ success: true, error: null });
export const adminLogout = async () => {
  localStorage.removeItem('admin_session');
  return { success: true };
};
export const updateProfile = async (id: string, profile: any) => ({ success: true, error: null });
export const seedSupabaseDatabase = async () => {};
export const testSupabaseConnection = async () => ({ success: true, error: null });
export const createCategory = async (category: any) => ({ success: true, id: 'cat-id', error: null });
export const updateCategory = async (id: string, category: any) => ({ success: true, error: null });
export const deleteCategory = async (id: string) => ({ success: true, error: null });
export const deletePost = async (id: string) => ({ success: true, error: null, status: 200 });

export const saveJob = async (userId: string, postId: string) => {
  const { error } = await supabase.from('saved_jobs').insert({ user_id: userId, post_id: postId });
  return { error };
};

export const unsaveJob = async (userId: string, postId: string) => {
  const { error } = await supabase.from('saved_jobs').delete().eq('user_id', userId).eq('post_id', postId);
  return { error };
};

export const isJobSaved = async (userId: string, postId: string) => {
  const { data, error } = await supabase.from('saved_jobs').select('*').eq('user_id', userId).eq('post_id', postId).maybeSingle();
  return { isSaved: !!data, error };
};

export const getSavedJobs = async (userId: string) => {
  const { data, error } = await supabase.from('saved_jobs').select('post_id, posts(*)').eq('user_id', userId);
  return { data, error };
};
