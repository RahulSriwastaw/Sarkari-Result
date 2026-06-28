import React, { useState, useEffect } from 'react';
import { getPosts, getCurrentUser, getProfile } from '../../lib/supabase';
import { Post, Profile } from '../../lib/types';
import PostCard from '../../components/PostCard';
import ProfileForm from '../../components/ProfileForm';
import JobSuccessDashboard from '../../components/JobSuccessDashboard';
import { User, Bookmark, LogIn, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserProfilePage() {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [trackedPosts, setTrackedPosts] = useState<(Post & { appStatus: string, timestamp: number })[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        const profileData = await getProfile(currentUser.email);
        setProfile(profileData);
      }

      const savedIds = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      const trackedApps = JSON.parse(localStorage.getItem('my_applications') || '{}');
      const trackedIds = Object.keys(trackedApps);
      
      const allPosts = await getPosts();
      
      const filteredPosts = allPosts.filter(p => savedIds.includes(p.id));
      setSavedPosts(filteredPosts);

      const filteredTrackedPosts = allPosts
        .filter(p => trackedIds.includes(p.id))
        .map(p => ({
          ...p,
          appStatus: trackedApps[p.id].status,
          timestamp: trackedApps[p.id].timestamp
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setTrackedPosts(filteredTrackedPosts);

    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading your profile...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your eligibility profile and saved jobs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile settings */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Eligibility Profile
            </h2>
            
            {!user ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Log in to create your persistent eligibility profile and let AI find jobs for you.
                </p>
                <Link to="/admin/login" className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm transition-colors">
                  <LogIn className="w-4 h-4" />
                  Log In
                </Link>
              </div>
            ) : (
              <ProfileForm profile={profile} onUpdate={loadData} />
            )}
          </div>
        </div>

        {/* Right Column: Saved Jobs & Tracked Applications */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Job Success Dashboard */}
          {user && (
            <JobSuccessDashboard savedPosts={savedPosts} trackedPosts={trackedPosts} />
          )}

          {/* My Applications Section */}
          {user && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                My Applications
              </h2>
              
              {trackedPosts.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p>No applications tracked yet.</p>
                  <p className="text-xs mt-1">Mark jobs as 'Interested' or 'Applied' on their details page.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackedPosts.map(post => (
                    <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <Link to={`/job/${post.slug}`} className="font-bold text-slate-800 dark:text-white hover:text-primary transition-colors truncate block">
                          {post.title_hindi || post.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                           <span className="truncate">{post.organization || post.exam_type}</span>
                           <span>•</span>
                           <span>Updated {new Date(post.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {post.appStatus === 'applied' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                             <CheckCircle2 className="w-3 h-3" />
                             Applied
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                             <Clock className="w-3 h-3" />
                             Interested
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500" />
              Saved Jobs
            </h2>
            
            {savedPosts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p>No saved jobs yet.</p>
                <p className="text-sm mt-1">Jobs you bookmark will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedPosts.map(post => (
                  <PostCard key={post.id} post={post} profile={profile} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
