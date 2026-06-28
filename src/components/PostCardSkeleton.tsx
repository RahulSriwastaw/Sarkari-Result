import React from 'react';

export default function PostCardSkeleton() {
  return (
    <article className="card p-3 relative overflow-hidden flex flex-col justify-between dark:bg-[#111528] dark:border-[#1C2140] h-full min-h-[160px] animate-pulse">
      <div>
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
          <div className="flex gap-1">
            <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/80 rounded-sm"></div>
            <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800/80 rounded-sm"></div>
          </div>
          <div className="h-4 w-4 bg-slate-100 dark:bg-slate-800/80 rounded-full"></div>
        </div>
 
        {/* Content/Title with Logo */}
        <div className="flex gap-2 mb-2 items-start">
          <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 flex-shrink-0"></div>
          <div className="flex-1 space-y-1.5 mt-1">
            <div className="h-3 bg-slate-100 dark:bg-slate-800/80 rounded w-full"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800/80 rounded w-4/5"></div>
          </div>
        </div>
 
        {/* Details Grid */}
        <div className="space-y-1.5 mb-3 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full"></div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded w-24"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full"></div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded w-32"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full"></div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded w-20"></div>
          </div>
        </div>
      </div>
 
      {/* Footer / Meta */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
        <div className="h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded w-16"></div>
        <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800/80 rounded-md"></div>
      </div>
    </article>
  );
}
