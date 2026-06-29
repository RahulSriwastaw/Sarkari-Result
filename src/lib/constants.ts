import { Category, Post } from './types';

export const DEFAULT_CATEGORIES: any[] = [
  { id: 'cat-latest-jobs', name: 'Latest Jobs', name_hindi: 'नवीनतम नौकरियां', slug: 'latest-jobs', order_index: 0, icon: 'Briefcase', color: '#2563eb' },
  { id: 'cat-results', name: 'Results', name_hindi: 'परीक्षा परिणाम', slug: 'results', order_index: 1, icon: 'FileCheck', color: '#10b981' },
  { id: 'cat-admit-card', name: 'Admit Card', name_hindi: 'प्रवेश पत्र', slug: 'admit-card', order_index: 2, icon: 'CreditCard', color: '#f59e0b' },
  { id: 'cat-answer-key', name: 'Answer Key', name_hindi: 'उत्तर कुंजी', slug: 'answer-key', order_index: 3, icon: 'Key', color: '#6366f1' },
  { id: 'cat-syllabus', name: 'Syllabus', name_hindi: 'पाठ्यक्रम', slug: 'syllabus', order_index: 4, icon: 'BookOpen', color: '#ec4899' },
  { id: 'cat-admission', name: 'Admission', name_hindi: 'प्रवेश', slug: 'admission', order_index: 5, icon: 'GraduationCap', color: '#8b5cf6' }
];

export const DEFAULT_POSTS: any[] = [
  {
    id: 'ssc-cgl-2026',
    title: 'SSC CGL 2026 Notification Out',
    title_hindi: 'एसएससी सीजीएल 2026 नोटिफिकेशन जारी',
    slug: 'ssc-cgl-2026-notification',
    category_id: 'cat-latest-jobs',
    status: 'published',
    total_vacancies: 15000,
    important_dates: [
      { event: 'Application Start', date: '2026-06-20' },
      { event: 'Last Date', date: '2026-07-20' }
    ],
    eligibility: {
      education: 'Bachelor Degree in any stream from a recognized university.',
      age_limit: '18-30 Years (Post wise)'
    }
  },
  {
    id: 'upsc-civil-services-result-2025',
    title: 'UPSC Civil Services Final Result 2025',
    title_hindi: 'यूपीएससी सिविल सेवा फाइनल रिजल्ट 2025',
    slug: 'upsc-civil-services-result-2025',
    category_id: 'cat-results',
    status: 'published'
  }
];
