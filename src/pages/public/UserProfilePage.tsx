import React, { useState, useEffect } from 'react';
import { getPosts, getCurrentUser, getProfile, candidateLogin, registerUser, adminLogout, getSavedJobs } from '../../lib/supabase';
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

  // Auth state for standard candidates
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password) {
      setAuthError('Please fill in all fields.');
      return;
    }

    if (authTab === 'register' && password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    try {
      if (authTab === 'login') {
        const res = await candidateLogin(email, password);
        if (res.success) {
          await loadData();
          setEmail('');
          setPassword('');
        } else {
          setAuthError(res.error || 'Incorrect login credentials.');
        }
      } else {
        const res = await registerUser(email, password);
        if (res.success) {
          await loadData();
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        } else {
          setAuthError(res.error || 'Registration failed.');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      setUser(null);
      setProfile(null);
      await loadData();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const profileId = currentUser.uid || currentUser.email;
        if (profileId) {
          const profileData = await getProfile(profileId);
          setProfile(profileData);
        }
      }

      const trackedApps = JSON.parse(localStorage.getItem('my_applications') || '{}');
      const trackedIds = Object.keys(trackedApps);
      
      const allPosts = await getPosts({});
      
      let savedPostsData: Post[] = [];
      if (currentUser) {
        const profileId = currentUser.uid || currentUser.email;
        if (profileId) {
          const { data } = await getSavedJobs(profileId);
          if (data) {
            savedPostsData = data.map(item => item.posts as unknown as Post);
          }
        }
      } else {
        const savedIds = JSON.parse(localStorage.getItem('savedJobs') || '[]');
        savedPostsData = allPosts.filter(p => savedIds.includes(p.id));
      }
      setSavedPosts(savedPostsData);

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
              <div className="space-y-4">
                <div className="flex border-b border-slate-150 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setAuthError(null); }}
                    className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${authTab === 'login' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                  >
                    Candidate Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setAuthError(null); }}
                    className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${authTab === 'register' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                  >
                    New Registration
                  </button>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs leading-normal">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="input focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input focus:border-primary"
                      required
                    />
                  </div>

                  {authTab === 'register' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input focus:border-primary"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn btn-primary w-full justify-center h-9 font-semibold text-xs uppercase tracking-wider mt-2"
                  >
                    {authLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Authenticating...
                      </span>
                    ) : (
                      authTab === 'login' ? 'Log In' : 'Create Account'
                    )}
                  </button>
                </form>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-normal">
                  {authTab === 'login' 
                    ? "Candidates can log in to persistently sync their qualifications profile with ourGovernment Exam Eligibility Engine."
                    : "Create a free profile to persistently save your criteria & automatically match with government job posts."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50 mb-4">
                  <div className="truncate pr-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Signed In As</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
                <ProfileForm profile={profile} onUpdate={loadData} />
              </div>
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
