export interface Category {
  id: string;
  name?: string;
  name_hindi?: string | null;
  title_en: string; // Compatibility alias for admin panel
  title_hi: string | null; // Compatibility alias for admin panel
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string;
  post_count: number;
  order_index: number;
  created_at: string;
}

export interface ImportantDate {
  event: string;
  date: string;
}

export interface VacancyDetail {
  category: string;
  count: number;
}

export interface Post {
  id: string;
  slug: string;
  
  // Public-facing fields (populated by mapPost helper at runtime, optional for admin-panel Omit structures)
  title?: string;
  title_hindi?: string | null;
  content_hindi?: string;
  content_english?: string | null;
  excerpt?: string | null;
  total_vacancies?: number | null;
  vacancy_details?: VacancyDetail[];
  eligibility?: Record<string, string>; // e.g. { age_limit: "18-27 Years", education: "10th Pass" }
  important_dates?: ImportantDate[];
  salary_range?: string | null;
  apply_link?: string | null;
  official_site?: string | null;
  category_id?: string | null;
  category?: Category;
  tags?: string[];
  state?: string[];
  exam_type?: string;
  source_type?: 'manual' | 'pdf' | 'url' | 'prompt';
  source_url?: string | null;
  ai_confidence?: number;
  conflicts?: Conflict[];
  conflict_count?: number;
  meta_title?: string | null;
  meta_description?: string | null;
  focus_keyword?: string | null;
  keywords?: string[];
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at?: string | null;
  scheduled_at?: string | null;
  created_at?: string;
  updated_at?: string;
  shared_telegram?: boolean;
  view_count?: number;
  click_apply?: number;

  // Admin-facing & compatibility fields
  title_en: string;
  title_hi: string | null;
  post_name: string | null;
  category_slug: string | null;
  department: string | null;
  advt_no: string | null;
  vacancies: number;
  start_date: string | null;
  end_date: string | null;
  admit_card_date: string | null;
  exam_date: string | null;
  result_date: string | null;
  notification_link: string | null;
  admit_card_link: string | null;
  result_link: string | null;
  official_website: string | null;
  official_logo_url?: string | null;
  short_info_en: string | null;
  short_info_hi: string | null;
  bilingual_html: string;
}

export interface Conflict {
  id: string;
  post_id: string;
  field_name: string;
  field_label: string;
  pdf_value: string | null;
  web_value: string | null;
  web_sources: string[];
  severity: 'warning' | 'critical';
  is_resolved: boolean;
  resolved_to: string | null;
}

export interface AIJob {
  id: string;
  input_type: 'pdf' | 'url' | 'prompt';
  input_content: string | null;
  input_pdf_path: string | null;
  instructions: string | null;
  language: 'hindi' | 'english' | 'bilingual';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_step: string | null;
  result_post_id: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export function isNewPost(post: Post): boolean {
  if (!post.published_at) return false;
  const publishedDate = new Date(post.published_at);
  if (isNaN(publishedDate.getTime())) return false;
  const now = new Date();
  const diffTime = now.getTime() - publishedDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= 7; // Published within 7 days
}

export function isClosingSoonPost(post: Post): boolean {
  const dateStr = post.end_date || post.important_dates?.find(d => {
    if (!d || !d.event || typeof d.event !== 'string') return false;
    const evt = d.event.toLowerCase();
    return evt.includes('last date') || evt.includes('close') || evt.includes('end');
  })?.date;
  
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
  if (match) {
    const parsedDate = new Date(match[0]);
    if (isNaN(parsedDate.getTime())) return false;
    const now = new Date();
    const diffTime = parsedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= -1 && diffDays <= 20; // Closes in next 20 days (inclusive of today)
  }
  return dateStr.toLowerCase().includes('soon') || dateStr.toLowerCase().includes('closing');
}

export function isHighSalaryPost(post: Post): boolean {
  if (!post.salary_range || typeof post.salary_range !== 'string') return false;
  const clean = post.salary_range.replace(/,/g, '');
  const numbers = clean.match(/\d+/g);
  if (!numbers) return false;
  return numbers.some(n => {
    const val = parseInt(n, 10);
    return val >= 35000 && val < 500000; // Salary >= 35,000 and exclude level/year numbers
  });
}

export interface Profile {
  id: string;
  name: string | null;
  dob: string | null;
  qualification: string | null;
  category: string | null;
  state: string | null;
  role?: 'admin' | 'user';
  profile_completion_percentage: number;
  updated_at: string;
}

