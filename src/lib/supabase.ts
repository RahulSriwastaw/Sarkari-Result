import { createClient } from '@supabase/supabase-js';
import { Category, Post } from './types';

const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== CATEGORIES ====================

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return (data || []).map((cat: any) => ({
    ...cat,
    title_en: cat.name || '',
    title_hi: cat.name_hindi || null,
    post_count: cat.post_count || 0,
  }));
};

export const createCategory = async (category: any) => {
  const id = category.id || `cat-${Date.now()}`;
  const { data, error } = await supabase
    .from('categories')
    .insert({
      id,
      name: category.name || category.title_en || '',
      name_hindi: category.name_hindi || category.title_hi || null,
      slug: category.slug || '',
      description: category.description || null,
      icon: category.icon || '📋',
      color: category.color || '#6366F1',
      order_index: category.order_index || 99,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return { success: false, id: null, error: error.message };
  }
  return { success: true, id: data?.id || id, error: null };
};

export const updateCategory = async (id: string, category: any) => {
  const { error } = await supabase
    .from('categories')
    .update({
      name: category.name || category.title_en,
      name_hindi: category.name_hindi || category.title_hi,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      color: category.color,
      order_index: category.order_index,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
};

// ==================== POSTS ====================

export const createPost = async (post: any) => {
  const slug = post.slug || post.title_en?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') || `post-${Date.now()}`;

  // Ensure category_id is a valid category ID (not a slug)
  let categoryId = post.category_id || null;
  if (categoryId && typeof categoryId === 'string' && !categoryId.startsWith('cat-')) {
    // Might be a slug passed by mistake, skip it
    categoryId = null;
  }

  // Helper: convert empty/invalid strings to null for DATE columns
  const toDate = (val: any): string | null => {
    if (!val || typeof val !== 'string' || val.trim() === '') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) return val.trim();
    return null;
  };

  // Helper: ensure integer or null
  const toInt = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseInt(String(val), 10);
    return isNaN(num) ? null : num;
  };

  const insertData: any = {
    slug,
    title: post.title_en || post.title || 'Untitled Post',
    title_hindi: post.title_hi || post.title_hindi || null,
    content_hindi: post.content_hindi || null,
    content_english: post.content_english || null,
    excerpt: post.short_info_en || post.excerpt || null,
    post_name: post.post_name || null,
    department: post.department || null,
    advt_no: post.advt_no || null,
    total_vacancies: toInt(post.vacancies || post.total_vacancies),
    vacancies: toInt(post.vacancies || post.total_vacancies),
    vacancy_details: Array.isArray(post.vacancy_details) ? post.vacancy_details : [],
    eligibility: (post.eligibility_criteria && typeof post.eligibility_criteria === 'object')
      ? post.eligibility_criteria
      : (post.eligibility && typeof post.eligibility === 'object' ? post.eligibility : {}),
    important_dates: Array.isArray(post.important_dates) ? post.important_dates : [],
    start_date: toDate(post.start_date),
    end_date: toDate(post.end_date),
    admit_card_date: toDate(post.admit_card_date),
    exam_date: toDate(post.exam_date),
    result_date: toDate(post.result_date),
    salary_range: post.salary_range || null,
    apply_link: post.apply_link || null,
    notification_link: post.notification_link || null,
    admit_card_link: post.admit_card_link || null,
    result_link: post.result_link || null,
    official_site: post.official_website || post.official_site || null,
    official_website: post.official_website || post.official_site || null,
    official_logo_url: post.official_logo_url || null,
    bilingual_html: post.bilingual_html || '',
    short_info_en: post.short_info_en || null,
    short_info_hi: post.short_info_hi || null,
    category_id: categoryId,
    tags: Array.isArray(post.tags) ? post.tags : [],
    state: Array.isArray(post.state) ? post.state : [],
    exam_type: post.exam_type || 'Other',
    source_type: post.source_type || 'url',
    source_url: post.source_url || null,
    ai_confidence: typeof post.ai_confidence === 'number' ? post.ai_confidence : 1.0,
    meta_title: post.meta_title || post.title_en || null,
    meta_description: post.meta_description || post.short_info_en || null,
    focus_keyword: post.focus_keyword || null,
    keywords: Array.isArray(post.keywords) ? post.keywords : [],
    status: post.status || 'draft',
    published_at: post.status === 'published' ? new Date().toISOString() : null,
  };

  // Remove any undefined values (Supabase rejects undefined)
  Object.keys(insertData).forEach(key => {
    if (insertData[key] === undefined) {
      insertData[key] = null;
    }
  });

  // Remove null fields that are optional to minimize potential column-not-found errors
  const cleanData = { ...insertData };
  const optionalNullFields = [
    'title_hindi', 'content_hindi', 'content_english', 'excerpt',
    'post_name', 'department', 'advt_no', 'salary_range',
    'apply_link', 'notification_link', 'admit_card_link', 'result_link',
    'official_site', 'official_website', 'official_logo_url',
    'short_info_hi', 'category_id', 'source_url',
    'meta_title', 'meta_description', 'focus_keyword',
    'admit_card_date', 'exam_date', 'result_date'
  ];
  optionalNullFields.forEach(field => {
    if (cleanData[field] === null || cleanData[field] === '') {
      delete cleanData[field];
    }
  });

  console.log('[createPost] Inserting post:', slug, '| category_id:', categoryId);

  const { data, error } = await supabase
    .from('posts')
    .insert(cleanData)
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return { success: false, id: null, error: error.message };
  }
  return { success: true, id: data?.id || slug, error: null };
};

export const updatePost = async (id: string, post: any) => {
  const updateData: any = {};

  if (post.title_en !== undefined) updateData.title = post.title_en;
  if (post.title_hi !== undefined) updateData.title_hindi = post.title_hi;
  if (post.slug !== undefined) updateData.slug = post.slug;
  if (post.content_hindi !== undefined) updateData.content_hindi = post.content_hindi;
  if (post.content_english !== undefined) updateData.content_english = post.content_english;
  if (post.short_info_en !== undefined) { updateData.short_info_en = post.short_info_en; updateData.excerpt = post.short_info_en; }
  if (post.short_info_hi !== undefined) updateData.short_info_hi = post.short_info_hi;
  if (post.post_name !== undefined) updateData.post_name = post.post_name;
  if (post.department !== undefined) updateData.department = post.department;
  if (post.advt_no !== undefined) updateData.advt_no = post.advt_no;
  if (post.vacancies !== undefined) { updateData.vacancies = post.vacancies; updateData.total_vacancies = post.vacancies; }
  if (post.start_date !== undefined) updateData.start_date = post.start_date || null;
  if (post.end_date !== undefined) updateData.end_date = post.end_date || null;
  if (post.admit_card_date !== undefined) updateData.admit_card_date = post.admit_card_date || null;
  if (post.exam_date !== undefined) updateData.exam_date = post.exam_date || null;
  if (post.result_date !== undefined) updateData.result_date = post.result_date || null;
  if (post.apply_link !== undefined) updateData.apply_link = post.apply_link;
  if (post.notification_link !== undefined) updateData.notification_link = post.notification_link;
  if (post.admit_card_link !== undefined) updateData.admit_card_link = post.admit_card_link;
  if (post.result_link !== undefined) updateData.result_link = post.result_link;
  if (post.official_website !== undefined) { updateData.official_website = post.official_website; updateData.official_site = post.official_website; }
  if (post.official_logo_url !== undefined) updateData.official_logo_url = post.official_logo_url;
  if (post.bilingual_html !== undefined) updateData.bilingual_html = post.bilingual_html;
  if (post.category_id !== undefined) updateData.category_id = post.category_id;
  if (post.tags !== undefined) updateData.tags = post.tags;
  if (post.state !== undefined) updateData.state = post.state;
  if (post.eligibility_criteria !== undefined) updateData.eligibility = post.eligibility_criteria;
  if (post.status !== undefined) {
    updateData.status = post.status;
    if (post.status === 'published') updateData.published_at = new Date().toISOString();
  }
  if (post.meta_title !== undefined) updateData.meta_title = post.meta_title;
  if (post.meta_description !== undefined) updateData.meta_description = post.meta_description;
  if (post.focus_keyword !== undefined) updateData.focus_keyword = post.focus_keyword;
  if (post.keywords !== undefined) updateData.keywords = post.keywords;
  if (post.source_type !== undefined) updateData.source_type = post.source_type;
  if (post.source_url !== undefined) updateData.source_url = post.source_url;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating post:', error);
    return { success: false, error: error.message };
  }
  return { success: true, error: null, ...data };
};

export const deletePost = async (id: string) => {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: error.message, status: 500 };
  }
  return { success: true, error: null, status: 200 };
};

export const getPosts = async (options?: any): Promise<Post[]> => {
  let query = supabase
    .from('posts')
    .select('*, categories(*)');

  if (options?.category_id) {
    query = query.eq('category_id', options.category_id);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,department.ilike.%${options.search}%,post_name.ilike.%${options.search}%`);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }

  return (data || []).map((post: any) => ({
    ...post,
    title_en: post.title || '',
    title_hi: post.title_hindi || null,
    category_slug: post.categories?.slug || null,
    category: post.categories || null,
  }));
};

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  if (!slug) return null;

  const { data, error } = await supabase
    .from('posts')
    .select('*, categories(*)')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error('Error fetching post by slug:', error);
    return null;
  }

  return {
    ...data,
    title_en: data.title || '',
    title_hi: data.title_hindi || null,
    category_slug: data.categories?.slug || null,
    category: data.categories || null,
  };
};

export const recordPostView = async (slug: string) => {
  try {
    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (data?.id) {
      await supabase.rpc('increment_view_count', { post_id: data.id });
    }
  } catch (err) {
    console.error('Error recording view:', err);
  }
};

export const recordPostApplyClick = async (slug: string) => {
  try {
    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (data?.id) {
      await supabase.rpc('increment_apply_click', { post_id: data.id });
    }
  } catch (err) {
    console.error('Error recording click:', err);
  }
};

// ==================== AUTH & ADMIN ====================

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

export const adminLogout = async () => {
  localStorage.removeItem('admin_session');
  return { success: true };
};

export const getProfile = async (id: string) => {
  // profiles table may not exist in basic setup — return default
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return { id, qualification: '', dob: '', category: '' };
    }
    return data;
  } catch {
    return { id, qualification: '', dob: '', category: '' };
  }
};

export const updateProfile = async (id: string, profile: any) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id, ...profile, updated_at: new Date().toISOString() });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
};

export const candidateLogin = async (email: string, password?: string) => {
  return { success: true, error: null };
};

export const registerUser = async (email: string, password?: string) => {
  return { success: true, error: null };
};

// ==================== MIGRATION & TESTING ====================

export const migrateFromFirestore = async () => {
  return { success: true, error: null };
};

export const seedSupabaseDatabase = async () => {
  // This is handled by running the SQL schema directly
  console.log('Database seeding should be done via SQL Editor.');
};

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('categories').select('id').limit(1);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// ==================== SAVED JOBS ====================

export const saveJob = async (userId: string, postId: string) => {
  try {
    const { error } = await supabase.from('saved_jobs').insert({ user_id: userId, post_id: postId });
    return { error };
  } catch (err: any) {
    return { error: err };
  }
};

export const unsaveJob = async (userId: string, postId: string) => {
  try {
    const { error } = await supabase.from('saved_jobs').delete().eq('user_id', userId).eq('post_id', postId);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
};

export const isJobSaved = async (userId: string, postId: string) => {
  try {
    const { data, error } = await supabase.from('saved_jobs').select('*').eq('user_id', userId).eq('post_id', postId).maybeSingle();
    if (error) return { isSaved: false, error: null };
    return { isSaved: !!data, error: null };
  } catch {
    return { isSaved: false, error: null };
  }
};

export const getSavedJobs = async (userId: string) => {
  try {
    const { data, error } = await supabase.from('saved_jobs').select('post_id, posts(*)').eq('user_id', userId);
    if (error) return { data: [], error: null };
    return { data, error: null };
  } catch {
    return { data: [], error: null };
  }
};
