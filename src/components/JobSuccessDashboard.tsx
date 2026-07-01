import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity } from 'lucide-react';
import { Post } from '../lib/types';

interface JobSuccessDashboardProps {
  savedPosts: Post[];
  trackedPosts: (Post & { appStatus: string, timestamp: number })[];
}

export default function JobSuccessDashboard({ savedPosts, trackedPosts }: JobSuccessDashboardProps) {
  const stats = useMemo(() => {
    const savedCount = savedPosts.length;
    
    // Calculate approaching deadlines (within 7 days)
    let approachingCount = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const getDaysLeft = (post: Post) => {
      const dateStr = post.end_date || post.important_dates?.find(d => {
        if (!d || !d.event || typeof d.event !== 'string') return false;
        const evt = d.event.toLowerCase();
        return evt.includes('last date') || evt.includes('close') || evt.includes('end');
      })?.date;
      
      if (!dateStr || typeof dateStr !== 'string') return null;
      
      let match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
      if (match) {
        const parsedDate = new Date(match[0]);
        if (isNaN(parsedDate.getTime())) return null;
        parsedDate.setHours(0, 0, 0, 0);
        const diffTime = parsedDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      const dmYMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dmYMatch) {
         const [_, d, m, y] = dmYMatch;
         const parsedDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
         if (isNaN(parsedDate.getTime())) return null;
         parsedDate.setHours(0, 0, 0, 0);
         const diffTime = parsedDate.getTime() - now.getTime();
         return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return null;
    };

    [...savedPosts, ...trackedPosts].forEach(post => {
      const daysLeft = getDaysLeft(post);
      if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) {
        approachingCount++;
      }
    });

    // Follow-ups needed (applied more than 7 days ago, or just 'interested' status)
    let followUpCount = 0;
    trackedPosts.forEach(post => {
      if (post.appStatus === 'applied') {
        const diffTime = now.getTime() - post.timestamp;
        const daysSinceApplied = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysSinceApplied > 7) followUpCount++;
      } else if (post.appStatus === 'interested') {
        followUpCount++;
      }
    });

    return [
      { name: 'Saved', count: savedCount, color: '#3b82f6' },
      { name: 'Deadlines', count: approachingCount, color: '#ef4444' },
      { name: 'Follow-ups', count: followUpCount, color: '#f59e0b' },
    ];
  }, [savedPosts, trackedPosts]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-indigo-500" />
        Job Success Dashboard
      </h2>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stats}
            margin={{
              top: 5,
              right: 10,
              left: -20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {stats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
