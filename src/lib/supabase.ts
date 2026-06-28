import { createClient } from '@supabase/supabase-js';
import { Post, Category, Profile } from './types';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Detect if we should run in local Demo Mode (fallback to localStorage)
export const isDemoMode = !supabaseUrl || supabaseUrl === 'your_supabase_url' || !supabaseKey || supabaseKey === 'your_anon_key';

// Initialize Supabase Client if credentials are valid
export const supabase = !isDemoMode ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to map and sanitize Category structures (guarantees both admin/public fields coexist)
export function mapCategory(cat: any): Category {
  if (!cat) return cat;
  return {
    ...cat,
    title_en: cat.title_en || cat.name || '',
    title_hi: cat.title_hi || cat.name_hindi || null,
    name: cat.name || cat.title_en || '',
    name_hindi: cat.name_hindi || cat.title_hi || null,
    order_index: cat.order_index !== undefined ? cat.order_index : 99,
    description: cat.description || null,
    icon: cat.icon || null,
    color: cat.color || '#FF6B2B',
    post_count: cat.post_count || 0,
    created_at: cat.created_at || new Date().toISOString()
  };
}

// Helper to map and sanitize Post structures (guarantees both admin/public fields coexist)
export function mapPost(post: any): Post {
  if (!post) return post;
  
  let autoLogo: string | null = null;
  const siteUrl = post.official_website || post.official_site || post.apply_link;
  if (siteUrl && typeof siteUrl === 'string') {
    try {
      const cleanUrl = siteUrl.trim().startsWith('http') ? siteUrl.trim() : `https://${siteUrl.trim()}`;
      const domain = new URL(cleanUrl).hostname.replace('www.', '');
      if (domain) {
        autoLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }
    } catch (e) {
      // ignore parsing errors
    }
  }

  const mappedPost: any = {
    ...post,
    title: post.title || post.title_en || '',
    title_hindi: post.title_hindi || post.title_hi || null,
    title_en: post.title_en || post.title || '',
    title_hi: post.title_hi || post.title_hindi || null,
    
    post_name: post.post_name || null,
    category_slug: post.category_slug || post.category?.slug || null,
    department: post.department || null,
    advt_no: post.advt_no || null,
    
    total_vacancies: post.total_vacancies !== undefined ? post.total_vacancies : (post.vacancies !== undefined ? post.vacancies : null),
    vacancies: post.vacancies !== undefined ? post.vacancies : (post.total_vacancies !== undefined ? Number(post.total_vacancies) : 0),
    
    start_date: post.start_date || null,
    end_date: post.end_date || null,
    admit_card_date: post.admit_card_date || null,
    exam_date: post.exam_date || null,
    result_date: post.result_date || null,
    
    apply_link: post.apply_link || null,
    official_site: post.official_site || post.official_website || null,
    official_website: post.official_website || post.official_site || null,
    official_logo_url: post.official_logo_url || autoLogo || null,
    
    notification_link: post.notification_link || null,
    admit_card_link: post.admit_card_link || null,
    result_link: post.result_link || null,
    
    short_info_en: post.short_info_en || post.excerpt || null,
    excerpt: post.excerpt || post.short_info_en || null,
    short_info_hi: post.short_info_hi || null,
    
    bilingual_html: post.bilingual_html || post.content_hindi || post.content_english || '',
    content_hindi: post.content_hindi || post.bilingual_html || '',
    content_english: post.content_english || post.bilingual_html || '',
    
    eligibility: post.eligibility || {},
    important_dates: post.important_dates || [],
    vacancy_details: post.vacancy_details || [],
    tags: post.tags || [],
    state: post.state || [],
    exam_type: post.exam_type || 'Other',
    status: post.status || 'draft',
    view_count: post.view_count || 0,
    click_apply: post.click_apply || 0
  };

  if (post.categories) {
    mappedPost.category = mapCategory(post.categories);
    mappedPost.category_slug = mappedPost.category.slug;
  } else if (post.category) {
    mappedPost.category = mapCategory(post.category);
    mappedPost.category_slug = mappedPost.category.slug;
  }
  
  return mappedPost as Post;
}

// Initial Seed Data for offline mode
const RAW_CATEGORIES = [
  { id: 'cat-1', name: 'SSC', name_hindi: 'एसएससी', slug: 'ssc', description: 'Staff Selection Commission Jobs', icon: '📋', color: '#FF6B2B', order_index: 1 },
  { id: 'cat-2', name: 'Railway', name_hindi: 'रेलवे', slug: 'railway', description: 'Indian Railway Recruitment', icon: '🚂', color: '#1E88E5', order_index: 2 },
  { id: 'cat-3', name: 'Banking', name_hindi: 'बैंकिंग', slug: 'banking', description: 'Bank PO, Clerk, Specialist Officers', icon: '🏦', color: '#43A047', order_index: 3 },
  { id: 'cat-4', name: 'UPSC', name_hindi: 'यूपीएससी', slug: 'upsc', description: 'Union Public Service Commission', icon: '🏛️', color: '#8E24AA', order_index: 4 },
  { id: 'cat-5', name: 'State PSC', name_hindi: 'राज्य लोक सेवा', slug: 'state-psc', description: 'State Public Service Commission Jobs', icon: '🏢', color: '#F4511E', order_index: 5 },
  { id: 'cat-6', name: 'Defence', name_hindi: 'डिफेन्स', slug: 'defence', description: 'Army, Navy, Airforce Recruitment', icon: '🪖', color: '#6D4C41', order_index: 6 },
  { id: 'cat-7', name: 'Police', name_hindi: 'पुलिस', slug: 'police', description: 'State Police, Sub-Inspector, Constable', icon: '👮', color: '#00897B', order_index: 7 },
  { id: 'cat-8', name: 'Teaching', name_hindi: 'शिक्षक भर्ती', slug: 'teaching', description: 'TGT, PGT, Primary Teachers', icon: '📚', color: '#039BE5', order_index: 8 },
  { id: 'cat-9', name: 'Results', name_hindi: 'परिणाम', slug: 'results', description: 'Government Exam Results', icon: '📊', color: '#E53935', order_index: 9 },
  { id: 'cat-10', name: 'Admit Card', name_hindi: 'प्रवेश पत्र', slug: 'admit-card', description: 'Download Exam Hall Tickets', icon: '🎫', color: '#FB8C00', order_index: 10 },
  { id: 'cat-11', name: 'Answer Key', name_hindi: 'उत्तर कुंजी', slug: 'answer-key', description: 'Official Exam Answer Keys', icon: '🔑', color: '#00ACC1', order_index: 11 },
  { id: 'cat-12', name: 'Syllabus', name_hindi: 'पाठ्यक्रम', slug: 'syllabus', description: 'Exam Syllabi & Schemes', icon: '📝', color: '#5E35B1', order_index: 12 },
];

const DEFAULT_CATEGORIES: Category[] = RAW_CATEGORIES.map(mapCategory);

const RAW_DEFAULT_POSTS = [
  {
    id: 'post-1',
    title: 'SSC GD Constable Online Form 2026',
    title_hindi: 'एसएससी जीडी कांस्टेबल भर्ती 2026 ऑनलाइन फॉर्म',
    slug: 'ssc-gd-constable-recruitment-2026',
    content_hindi: `<p>एसएससी (Staff Selection Commission) द्वारा जीडी कांस्टेबल (GD Constable) के रिक्त पदों पर भर्ती के लिए आधिकारिक अधिसूचना जारी कर दी गई है। पात्र उम्मीदवार निर्धारित तिथियों में ऑनलाइन आवेदन कर सकते हैं।</p>
    <h3>महत्वपूर्ण निर्देश:</h3>
    <ul>
      <li>केवल ऑनलाइन आवेदन ही स्वीकार किए जाएंगे।</li>
      <li>आवेदन करने से पहले कृपया आधिकारिक अधिसूचना को ध्यानपूर्वक पढ़ें।</li>
      <li>अपनी शैक्षणिक योग्यता और आयु सीमा की जांच अवश्य करें।</li>
    </ul>`,
    content_english: `<p>Staff Selection Commission (SSC) has released the recruitment notification for General Duty (GD) Constable in BSF, CISF, ITBP, CRPF, SSB, AR, and SSF. Eligible candidates can apply online through the official portal.</p>`,
    excerpt: 'SSC GD Constable Recruitment 2026 Notification out for various paramilitary forces. Apply Online.',
    post_name: 'Constable (General Duty)',
    total_vacancies: 39481,
    vacancy_details: [
      { category: 'General', count: 16500 },
      { category: 'OBC', count: 9800 },
      { category: 'EWS', count: 3900 },
      { category: 'SC', count: 5800 },
      { category: 'ST', count: 3481 }
    ],
    eligibility: {
      'Age Limit': '18 to 23 Years (Age relaxation applicable as per rules)',
      'Education': '10th Class (Matriculation) Pass from any recognized board in India.',
      'Physical Standards': 'Male Height: 170 Cms, Female Height: 157 Cms'
    },
    important_dates: [
      { event: 'Application Start Date', date: '2026-06-01' },
      { event: 'Last Date to Apply Online', date: '2026-07-15' },
      { event: 'Last Date for Fee Payment', date: '2026-07-16' },
      { event: 'CBT Exam Date', date: 'September-October 2026' }
    ],
    salary_range: '₹21,700 - ₹69,100 (Pay Level 3)',
    apply_link: 'https://ssc.gov.in',
    official_site: 'https://ssc.gov.in',
    category_id: 'cat-1',
    tags: ['SSC', 'Constable', 'GD', 'Defense Jobs'],
    state: ['All India'],
    exam_type: 'SSC',
    source_type: 'manual',
    source_url: null,
    ai_confidence: 1.0,
    conflicts: [],
    conflict_count: 0,
    meta_title: 'SSC GD Constable Online Form 2026 - Apply For 39,481 Posts',
    meta_description: 'Staff Selection Commission SSC GD Constable Recruitment 2026. Online registration dates, eligibility, age limit, notification pdf.',
    focus_keyword: 'ssc gd constable online form 2026',
    keywords: ['ssc gd', 'constable online form', 'ssc jobs'],
    status: 'published',
    published_at: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    shared_telegram: true,
    view_count: 1420,
    click_apply: 350
  },
  {
    id: 'post-2',
    title: 'RRB RPF Sub Inspector (SI) Recruitment 2026',
    title_hindi: 'रेलवे आरपीएफ सब इंस्पेक्टर भर्ती 2026',
    slug: 'rrb-rpf-sub-inspector-si-recruitment-2026',
    content_hindi: `<p>रेलवे सुरक्षा बल (RPF) में सब इंस्पेक्टर (SI) के रिक्त पदों की भर्ती के लिए रेलवे भर्ती बोर्ड (RRB) द्वारा अधिसूचना जारी कर दी गई है। स्नातक डिग्री धारक उम्मीदवार इसके लिए आवेदन कर सकते हैं।</p>`,
    content_english: `<p>Railway Recruitment Board (RRB) is inviting online applications for the post of Sub Inspector (SI) in Railway Protection Force (RPF). Candidates with a graduation degree can apply.</p>`,
    excerpt: 'Railway Protection Force Sub Inspector Recruitment 2026. Online registration start dates and vacancy breakdown.',
    post_name: 'Sub Inspector (SI)',
    total_vacancies: 452,
    vacancy_details: [
      { category: 'UR', count: 185 },
      { category: 'OBC', count: 120 },
      { category: 'SC', count: 65 },
      { category: 'ST', count: 35 },
      { category: 'EWS', count: 47 }
    ],
    eligibility: {
      'Age Limit': '20 to 28 Years (Age relaxation rules apply)',
      'Education': 'Bachelor\'s Degree in any stream from a recognized University.',
      'Selection Process': 'Computer Based Test (CBT), Physical Efficiency Test (PET) & Physical Measurement Test (PMT).'
    },
    important_dates: [
      { event: 'Application Start Date', date: '2026-05-15' },
      { event: 'Last Date to Apply Online', date: '2026-06-25' },
      { event: 'Correction Window', date: '2026-06-26 to 2026-07-05' },
      { event: 'Exam Date', date: 'December 2026' }
    ],
    salary_range: '₹35,400 (Pay Level 6) plus allowances',
    apply_link: 'https://www.rlyestt.gov.in',
    official_site: 'https://indianrailways.gov.in',
    category_id: 'cat-2',
    tags: ['RPF', 'Railway SI', 'RRB Jobs', 'Sub Inspector'],
    state: ['All India'],
    exam_type: 'Railway',
    source_type: 'manual',
    source_url: null,
    ai_confidence: 1.0,
    conflicts: [],
    conflict_count: 0,
    meta_title: 'RRB RPF Sub Inspector Recruitment 2026 - Apply Online for 452 Posts',
    meta_description: 'Railway Recruitment Board RPF Sub Inspector (SI) Online Application 2026. Eligibility criteria, selection process, important dates.',
    focus_keyword: 'rpf si online form 2026',
    keywords: ['rpf si', 'railway recruitment', 'rrb jobs'],
    status: 'published',
    published_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    shared_telegram: true,
    view_count: 850,
    click_apply: 120
  },
  {
    id: 'post-3',
    title: 'IBPS Clerk Recruitment 2026',
    title_hindi: 'आईबीपीएस क्लर्क भर्ती 2400+ पद',
    slug: 'ibps-clerk-recruitment-2400-posts-2026',
    content_hindi: `<p>इंस्टीट्यूट ऑफ बैंकिंग पर्सनेल सिलेक्शन (IBPS) द्वारा विभिन्न सार्वजनिक क्षेत्र के बैंकों में क्लर्क के रिक्त पदों पर भर्ती के लिए ऑनलाइन आवेदन आमंत्रित किए गए हैं।</p>`,
    content_english: `<p>Institute of Banking Personnel Selection (IBPS) has released the notification for Common Recruitment Process (CRP Clerks-XVI) for recruitment of clerks in participating banks.</p>`,
    excerpt: 'IBPS Clerk Recruitment 2026 CRP CRP-XVI. Check educational qualification, age limit, selection process and direct apply link.',
    post_name: 'Clerical Cadre',
    total_vacancies: 6128,
    vacancy_details: [],
    eligibility: {
      'Age Limit': '20 to 28 Years',
      'Education': 'A Degree (Graduation) in any discipline from a recognized University.'
    },
    important_dates: [
      { event: 'Notification Date', date: '2026-06-10' },
      { event: 'Apply Online Start', date: '2026-06-15' },
      { event: 'Last Date to Apply Online', date: '2026-07-05' }
    ],
    salary_range: '₹19,900 - ₹47,920 plus allowances',
    apply_link: 'https://www.ibps.in',
    official_site: 'https://www.ibps.in',
    category_id: 'cat-3',
    tags: ['IBPS', 'Bank Clerk', 'CRP XVI', 'Bank Jobs'],
    state: ['All India'],
    exam_type: 'Banking',
    source_type: 'manual',
    source_url: null,
    ai_confidence: 1.0,
    conflicts: [],
    conflict_count: 0,
    meta_title: 'IBPS CRP XVI Clerk Recruitment 2026 Online Form',
    meta_description: 'Apply online for 6128 Banking Clerk posts in participating banks through IBPS portal. Step-by-step apply guide.',
    focus_keyword: 'ibps clerk recruitment 2026',
    keywords: ['ibps clerk', 'bank jobs', 'clerk recruitment'],
    status: 'published',
    published_at: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    shared_telegram: false,
    view_count: 1205,
    click_apply: 410
  },
  {
    id: 'post-4',
    title: 'UPSC Civil Services Prelims Exam 2026',
    title_hindi: 'यूपीएससी सिविल सेवा प्रारंभिक परीक्षा 2026',
    slug: 'upsc-civil-services-prelims-exam-2026',
    content_hindi: `<p>संघ लोक सेवा आयोग (UPSC) द्वारा आईएएस, आईपीएस और अन्य केंद्रीय सेवाओं की भर्ती के लिए सिविल सेवा प्रारंभिक परीक्षा 2026 की घोषणा कर दी गई है।</p>`,
    content_english: `<p>Union Public Service Commission (UPSC) has released the notification for Civil Services Examination (CSE) 2026. Eligible candidates can register online.</p>`,
    excerpt: 'UPSC Civil Services Examination (Prelims) 2026 Official Notification is out for IAS, IPS, IFS. Register Online.',
    post_name: 'Civil Services IAS/IPS',
    total_vacancies: 1056,
    vacancy_details: [],
    eligibility: {
      'Age Limit': '21 to 32 Years',
      'Education': 'Degree from any recognized university or equivalent.'
    },
    important_dates: [
      { event: 'Notification Released', date: '2026-02-15' },
      { event: 'Online Apply Ends', date: '2026-03-10' },
      { event: 'Prelims Exam Date', date: '2026-05-24' }
    ],
    salary_range: 'Level 10 (₹56,100 base) of 7th CPC pay matrix',
    apply_link: 'https://upsconline.nic.in',
    official_site: 'https://www.upsc.gov.in',
    category_id: 'cat-4',
    tags: ['UPSC', 'IAS', 'IPS', 'Civil Services', 'Government Jobs'],
    state: ['All India'],
    exam_type: 'UPSC',
    source_type: 'manual',
    source_url: null,
    ai_confidence: 1.0,
    conflicts: [],
    conflict_count: 0,
    meta_title: 'UPSC CSE (Civil Services IAS) 2026 - Direct Registration Link',
    meta_description: 'UPSC IAS Exam notification 2026. Check the official selection criteria, syllabus overview, and vacancy structure.',
    focus_keyword: 'upsc prelims online form 2026',
    keywords: ['upsc', 'ias exam', 'civil services prelims'],
    status: 'published',
    published_at: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    shared_telegram: false,
    view_count: 2400,
    click_apply: 190
  },
  {
    id: 'post-5',
    title: 'SSC MTS & Havaldar Online Form 2026',
    title_hindi: 'एसएससी एमटीएस और हवलदार भर्ती 2026 ऑनलाइन फॉर्म',
    slug: 'ssc-mts-havaldar-online-form-2026',
    content_hindi: `<p>स्टाफ सिलेक्शन कमीशन (SSC) द्वारा मल्टी टास्किंग स्टाफ (MTS) और हवलदार (सीबीआईसी एवं सीबीएन) परीक्षा 2026 के लिए अधिसूचना जारी कर दी गई है।</p>`,
    content_english: `<p>Staff Selection Commission (SSC) will recruit multi-tasking staff and havaldar in CBIC and CBN. 10th Class pass students are eligible to apply.</p>`,
    excerpt: 'SSC Multi Tasking Staff (MTS) and Havaldar recruitment 2026. Eligibility criteria, fee layout, and registration guidelines.',
    post_name: 'MTS & Havaldar',
    total_vacancies: 8230,
    vacancy_details: [],
    eligibility: {
      'Age Limit': '18 to 25 Years or 27 Years (Depending on department)',
      'Education': '10th Class (Matriculation) Passed or equivalent.'
    },
    important_dates: [
      { event: 'Notification Released', date: '2026-06-15' },
      { event: 'Online Apply Starts', date: '2026-06-20' },
      { event: 'Last Date to Apply Online', date: '2026-07-20' }
    ],
    salary_range: '₹18,000 - ₹22,000 (Pay Level 1 as per 7th CPC)',
    apply_link: 'https://ssc.gov.in',
    official_site: 'https://ssc.gov.in',
    category_id: 'cat-1',
    tags: ['SSC', 'MTS', 'Havaldar', '10th Pass Jobs'],
    state: ['All India'],
    exam_type: 'SSC',
    source_type: 'manual',
    source_url: null,
    ai_confidence: 1.0,
    conflicts: [],
    conflict_count: 0,
    meta_title: 'SSC MTS & Havaldar Exam 2026 - Apply Online for 8200 Posts',
    meta_description: 'Apply online for SSC MTS (Multi Tasking Staff) and Havaldar recruitment 2026. Educational qualification, age criteria, and how to apply.',
    focus_keyword: 'ssc mts online form 2026',
    keywords: ['ssc mts', 'mts recruitment', 'havaldar online form'],
    status: 'draft', // Draft post
    published_at: null,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    shared_telegram: false,
    view_count: 45,
    click_apply: 0
  }
];

const DEFAULT_POSTS: Post[] = RAW_DEFAULT_POSTS.map(mapPost);

// Seed databases in localStorage if empty
if (localStorage.getItem('vedatool_categories') === null) {
  localStorage.setItem('vedatool_categories', JSON.stringify(DEFAULT_CATEGORIES));
}
if (localStorage.getItem('vedatool_posts') === null) {
  localStorage.setItem('vedatool_posts', JSON.stringify(DEFAULT_POSTS));
}
if (localStorage.getItem('vedatool_settings') === null) {
  const settings = {
    site_name: 'SarkariCMS',
    site_tagline: 'Sarkari Naukri, Sabse Pehle',
    telegram_channel: 'sarkariprep_telegram',
    auto_share_telegram: 'false',
    posts_per_page: '20'
  };
  localStorage.setItem('vedatool_settings', JSON.stringify(settings));
}

// ───────────────────────────────────────────────────────────────────────────
// DATABASE OPERATIONS (With seamless direct Supabase vs. Offline fallback)
// ───────────────────────────────────────────────────────────────────────────

// Categories Operations
export async function getCategories(): Promise<Category[]> {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) {
      return data.map(mapCategory);
    }
  }

  // Fallback to local
  const cats = JSON.parse(localStorage.getItem('vedatool_categories') || '[]');
  const posts = JSON.parse(localStorage.getItem('vedatool_posts') || '[]');
  
  // Calculate dynamic post counts
  return cats.map((cat: any) => mapCategory({
    ...cat,
    post_count: posts.filter((p: any) => p.category_id === cat.id && p.status === 'published').length
  }));
}

export async function createCategory(cat: Omit<Category, 'id' | 'created_at' | 'post_count'>): Promise<Category> {
  const mappedInput = mapCategory(cat);
  const newCat: Category = {
    ...mappedInput,
    id: `cat-${Date.now()}`,
    post_count: 0,
    created_at: new Date().toISOString()
  };

  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .insert([newCat])
      .select()
      .single();
    if (!error && data) return mapCategory(data);
  }

  const cats = JSON.parse(localStorage.getItem('vedatool_categories') || '[]');
  cats.push(newCat);
  localStorage.setItem('vedatool_categories', JSON.stringify(cats));
  return newCat;
}

export async function updateCategory(id: string, catUpdates: Partial<Category>): Promise<Category> {
  const mappedUpdates = { ...catUpdates };
  if (mappedUpdates.title_en) {
    mappedUpdates.name = mappedUpdates.title_en;
  }
  if (mappedUpdates.title_hi) {
    mappedUpdates.name_hindi = mappedUpdates.title_hi;
  }

  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .update(mappedUpdates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return mapCategory(data);
  }

  const cats = JSON.parse(localStorage.getItem('vedatool_categories') || '[]');
  const idx = cats.findIndex((c: any) => c.id === id);
  if (idx !== -1) {
    cats[idx] = mapCategory({ ...cats[idx], ...mappedUpdates });
    localStorage.setItem('vedatool_categories', JSON.stringify(cats));
    return cats[idx];
  }
  throw new Error('Category not found');
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (!isDemoMode && supabase) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (!error) return true;
  }

  const cats = JSON.parse(localStorage.getItem('vedatool_categories') || '[]');
  const filtered = cats.filter((c: any) => c.id !== id);
  localStorage.setItem('vedatool_categories', JSON.stringify(filtered));
  return true;
}

// Posts Operations
export async function getPosts(options?: {
  status?: string;
  category?: string;
  limit?: number;
  search?: string;
}): Promise<Post[]> {
  if (!isDemoMode && supabase) {
    let query = supabase
      .from('posts')
      .select('*, categories(*)');

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.category) {
      query = query.eq('category_id', options.category);
    }
    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,title_hindi.ilike.%${options.search}%`);
    }

    query = query.order('published_at', { ascending: false, nullsFirst: false })
                 .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (!error && data) {
      // Map relations standardly
      return data.map((d: any) => mapPost({
        ...d,
        category: d.categories
      }));
    }
  }

  // Offline Fallback
  let posts: any[] = JSON.parse(localStorage.getItem('vedatool_posts') || '[]');
  const cats: Category[] = JSON.parse(localStorage.getItem('vedatool_categories') || '[]');

  // Map Category object to post
  posts = posts.map(post => mapPost({
    ...post,
    category: cats.find(c => c.id === post.category_id)
  }));

  // Apply filters
  if (options?.status) {
    posts = posts.filter(p => p.status === options.status);
  }
  if (options?.category) {
    posts = posts.filter(p => p.category_id === options.category || (p.category && p.category.slug === options.category));
  }
  if (options?.search) {
    const term = options.search.toLowerCase();
    posts = posts.filter(p => 
      p.title.toLowerCase().includes(term) || 
      (p.title_hindi && p.title_hindi.toLowerCase().includes(term)) ||
      (p.post_name && p.post_name.toLowerCase().includes(term))
    );
  }

  // Sort: Published descending first, then created descending
  posts.sort((a, b) => {
    if (a.status === 'published' && b.status === 'published') {
      return new Date(b.published_at || '').getTime() - new Date(a.published_at || '').getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (options?.limit) {
    posts = posts.slice(0, options.limit);
  }

  return posts as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('posts')
      .select('*, categories(*)')
      .eq('slug', slug)
      .single();
    if (!error && data) {
      return mapPost({ ...data, category: data.categories });
    }
  }

  const posts: any[] = JSON.parse(localStorage.getItem('vedatool_posts') || '[]');
  const cats: Category[] = JSON.parse(localStorage.getItem('vedatool_categories') || '[]');
  const post = posts.find(p => p.slug === slug);
  if (post) {
    return mapPost({
      ...post,
      category: cats.find(c => c.id === post.category_id)
    });
  }
  return null;
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('posts')
      .select('*, categories(*)')
      .eq('id', id)
      .single();
    if (!error && data) {
      return mapPost({ ...data, category: data.categories });
    }
  }

  const posts: any[] = JSON.parse(localStorage.getItem('vedatool_posts') || '[]');
  const cats: Category[] = JSON.parse(localStorage.getItem('vedatool_categories') || '[]');
  const post = posts.find(p => p.id === id);
  if (post) {
    return mapPost({
      ...post,
      category: cats.find(c => c.id === post.category_id)
    });
  }
  return null;
}

export async function createPost(postData: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'click_apply'>): Promise<Post> {
  const mappedData = mapPost(postData);
  const newPost: Post = {
    ...mappedData,
    id: `post-${Date.now()}`,
    view_count: 0,
    click_apply: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (newPost.status === 'published' && !newPost.published_at) {
    newPost.published_at = new Date().toISOString();
  }

  if (!isDemoMode && supabase) {
    // Delete custom joined category property before insert to match schema
    const { category, category_slug, title_en, title_hi, vacancies, start_date, end_date, admit_card_date, exam_date, result_date, notification_link, admit_card_link, result_link, official_website, official_logo_url, short_info_en, short_info_hi, bilingual_html, eligibility, state, ...cleanPost } = newPost as any;
    const { data, error } = await supabase
      .from('posts')
      .insert([cleanPost])
      .select()
      .single();
    if (!error && data) return mapPost(data);
    console.error('Supabase Create Post error:', error);
  }

  const posts = JSON.parse(localStorage.getItem('vedatool_posts') || '[]');
  posts.push(newPost);
  localStorage.setItem('vedatool_posts', JSON.stringify(posts));
  return newPost;
}

export async function updatePost(id: string, postUpdates: Partial<Post>): Promise<Post> {
  const updatedTime = new Date().toISOString();
  const mappedUpdates = mapPost(postUpdates);
  
  if (mappedUpdates.status === 'published' && !mappedUpdates.published_at) {
    mappedUpdates.published_at = new Date().toISOString();
  }

  if (!isDemoMode && supabase) {
    const { category, category_slug, title_en, title_hi, vacancies, start_date, end_date, admit_card_date, exam_date, result_date, notification_link, admit_card_link, result_link, official_website, official_logo_url, short_info_en, short_info_hi, bilingual_html, ...cleanUpdates } = mappedUpdates as any;
    const { data, error } = await supabase
      .from('posts')
      .update({ ...cleanUpdates, eligibility: mappedUpdates.eligibility, state: mappedUpdates.state, updated_at: updatedTime })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return mapPost(data);
    console.error('Supabase Update Post error:', JSON.stringify(error, null, 2));
  }

  const posts = JSON.parse(localStorage.getItem('vedatool_posts') || '[]');
  const idx = posts.findIndex((p: any) => p.id === id);
  if (idx !== -1) {
    posts[idx] = mapPost({ ...posts[idx], ...mappedUpdates, updated_at: updatedTime });
    localStorage.setItem('vedatool_posts', JSON.stringify(posts));
    return posts[idx];
  }
  throw new Error('Post not found');
}

export async function deletePost(id: string): Promise<boolean> {
  if (!isDemoMode && supabase) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    if (!error) return true;
  }

  const posts = JSON.parse(localStorage.getItem('vedatool_posts') || '[]');
  const filtered = posts.filter((p: any) => p.id !== id);
  localStorage.setItem('vedatool_posts', JSON.stringify(filtered));
  return true;
}

// Increment statistics
export async function recordPostView(id: string): Promise<void> {
  if (!isDemoMode && supabase) {
    try {
      await supabase.rpc('increment_view_count', { post_id: id });
    } catch (e) {
      // Silent error
    }
  }
  
  const posts = JSON.parse(localStorage.getItem('vedatool_posts') || '[]');
  const idx = posts.findIndex((p: any) => p.id === id);
  if (idx !== -1) {
    posts[idx].view_count = (posts[idx].view_count || 0) + 1;
    localStorage.setItem('vedatool_posts', JSON.stringify(posts));
  }
}

export async function recordPostApplyClick(id: string): Promise<void> {
  if (!isDemoMode && supabase) {
    try {
      await supabase.rpc('increment_apply_click', { post_id: id });
    } catch (e) {
      // Silent error
    }
  }
  
  const posts = JSON.parse(localStorage.getItem('vedatool_posts') || '[]');
  const idx = posts.findIndex((p: any) => p.id === id);
  if (idx !== -1) {
    posts[idx].click_apply = (posts[idx].click_apply || 0) + 1;
    localStorage.setItem('vedatool_posts', JSON.stringify(posts));
  }
}

// Admin settings
export async function getSettings(): Promise<Record<string, string>> {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('settings')
      .select('*');
    if (!error && data) {
      const res: Record<string, string> = {};
      data.forEach((item: any) => {
        res[item.key] = item.value;
      });
      return res;
    }
  }

  return JSON.parse(localStorage.getItem('vedatool_settings') || '{}');
}

export async function updateSetting(key: string, value: string): Promise<void> {
  if (!isDemoMode && supabase) {
    await supabase
      .from('settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);
  }

  const settings = JSON.parse(localStorage.getItem('vedatool_settings') || '{}');
  settings[key] = value;
  localStorage.setItem('vedatool_settings', JSON.stringify(settings));
}

// Auth simulation / real Supabase integration
export async function adminLogin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  // Always allow demo credentials for preview purposes
  if (email === 'admin@sarkariprep.in' && password === 'admin123') {
    localStorage.setItem('vedatool_auth_user', JSON.stringify({ email, role: 'admin' }));
    return { success: true };
  }

  if (!isDemoMode && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { success: false, error: error.message };
    localStorage.setItem('vedatool_auth_user', JSON.stringify({ email, role: 'admin' }));
    return { success: true };
  }

  return { success: false, error: 'Invalid admin credentials! Hint: Use admin@sarkariprep.in with password admin123 for demo mode.' };
}export async function adminLogout(): Promise<void> {
  if (!isDemoMode && supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('vedatool_auth_user');
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) return data as Profile;
  }
  return null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  if (!isDemoMode && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (!error && data) return data as Profile;
    throw error;
  }
  throw new Error('Demo mode not supported for profile updates');
}

export function getCurrentUser(): { email: string; role: string } | null {
  const userStr = localStorage.getItem('vedatool_auth_user');
  if (userStr) return JSON.parse(userStr);
  return null;
}
