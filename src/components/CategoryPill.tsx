import { Link } from 'react-router-dom';
import { Category } from '../lib/types';

interface CategoryPillProps {
  key?: any;
  category: Category;
  isActive: boolean;
}

export default function CategoryPill({ category, isActive }: CategoryPillProps) {
  // Map category slugs to Tailwind visual styles
  const getPillStyle = (slug: string) => {
    if (isActive) {
      return 'bg-primary text-white border-primary shadow-sm shadow-primary/20';
    }
    
    switch (slug) {
      case 'ssc':
        return 'bg-white hover:bg-primary/5 text-slate-700 hover:text-primary-hover border-gray-200 hover:border-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-primary/10 dark:hover:text-primary-hover';
      case 'railway':
        return 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-gray-200 hover:border-blue-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-950/20 dark:hover:text-blue-400';
      case 'banking':
        return 'bg-white hover:bg-green-50 text-slate-700 hover:text-green-600 border-gray-200 hover:border-green-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-green-950/20 dark:hover:text-green-400';
      case 'upsc':
        return 'bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-600 border-gray-200 hover:border-purple-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-purple-950/20 dark:hover:text-purple-400';
      default:
        return 'bg-white hover:bg-slate-50 text-slate-700 hover:text-primary border-gray-200 hover:border-primary/10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700';
    }
  };

  return (
    <Link
      to={`/category/${category.slug}`}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all duration-150 shrink-0 ${getPillStyle(category.slug)}`}
    >
      <span className="text-sm select-none">{category.icon}</span>
      <span>{category.name}</span>
      {category.post_count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.25 rounded-full ${isActive ? 'bg-primary-hover text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
          {category.post_count}
        </span>
      )}
    </Link>
  );
}
