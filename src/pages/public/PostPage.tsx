import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ChevronRight, Home, Calendar, Briefcase, GraduationCap, 
  Coins, Link2, Share2, ArrowLeft, CheckCircle2, ShieldCheck, 
  ExternalLink, AlertCircle, Bookmark, Eye, ThumbsUp, FileText, X
} from 'lucide-react';
import { getPostBySlug, getPosts, recordPostView, recordPostApplyClick } from '../../lib/supabase';
import { Post } from '../../lib/types';

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [appStatus, setAppStatus] = useState<'interested' | 'applied' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPostData() {
      if (!slug) return;
      try {
        setLoading(true);
        const fetchedPost = await getPostBySlug(slug);
        
        if (fetchedPost) {
          setPost(fetchedPost);
          
          // Increment views asynchronously
          recordPostView(fetchedPost.id);

          // Load related posts from same category
          if (fetchedPost.category_id) {
            const allRelated = await getPosts({ 
              category: fetchedPost.category?.slug, 
              status: 'published',
              limit: 4 
            });
            // Filter out current post
            setRelatedPosts(allRelated.filter(p => p.id !== fetchedPost.id).slice(0, 3));
          }

          // Load application status
          const savedApps = JSON.parse(localStorage.getItem('my_applications') || '{}');
          if (savedApps[fetchedPost.id]) {
            setAppStatus(savedApps[fetchedPost.id].status);
          }
        } else {
          setPost(null);
        }
      } catch (err) {
        console.error('Error loading post details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPostData();
  }, [slug]);

  const handleStatusChange = (status: 'interested' | 'applied' | null) => {
    if (!post) return;
    const savedApps = JSON.parse(localStorage.getItem('my_applications') || '{}');
    if (status) {
      savedApps[post.id] = { status, timestamp: Date.now() };
    } else {
      delete savedApps[post.id];
    }
    localStorage.setItem('my_applications', JSON.stringify(savedApps));
    setAppStatus(status);
  };

  const handleApplyClick = () => {
    if (post) {
      recordPostApplyClick(post.id);
      window.open(post.apply_link || '#', '_blank', 'noopener,noreferrer');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareText = () => {
    if (!post) return '';
    return encodeURIComponent(`${post.title_hindi || post.title} - ${post.total_vacancies ? `${post.total_vacancies.toLocaleString('en-IN')} Vacancies` : 'Apply Now'}. Details at: `);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-slate-500">Parsing sarkari bulletin...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16 card max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900">
        <p className="text-2xl">🔍</p>
        <h3 className="font-bold text-slate-800 dark:text-white">Recruitment Post Not Found</h3>
        <p className="text-xs text-slate-500">The job post you are looking for may have been archived or removed.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary btn-sm">Return to Home</button>
      </div>
    );
  }

  // Key details formatted
  const education = post.eligibility?.Education || post.eligibility?.education || 'Check Details';
  const ageLimit = post.eligibility?.['Age Limit'] || post.eligibility?.age_limit || 'Check Details';
  const lastDateItem = post.important_dates?.find(d => 
    d.event.toLowerCase().includes('last date') || d.event.toLowerCase().includes('close')
  );
  const lastDate = lastDateItem ? lastDateItem.date : 'Check Details';

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the age limit for the " + (post.title_hindi || post.title) + " recruitment?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ageLimit
        }
      },
      {
        "@type": "Question",
        "name": "What is the educational qualification required for " + (post.title_hindi || post.title) + "?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": education
        }
      },
      {
        "@type": "Question",
        "name": "What is the last date to apply for " + (post.title_hindi || post.title) + "?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": lastDate
        }
      },
      {
        "@type": "Question",
        "name": "How to apply for " + (post.title_hindi || post.title) + "?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can apply for the " + (post.title_hindi || post.title) + " job through the official recruitment notification link provided on this page."
        }
      }
    ]
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
      {/* Breadcrumb Row */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
        <Link to="/" className="hover:text-primary flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        {post.category && (
          <>
            <Link to={`/category/${post.category.slug}`} className="hover:text-primary">
              {post.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
          </>
        )}
        <span className="text-primary truncate max-w-[200px]" title={post.title}>
          {post.post_name || 'Details'}
        </span>
      </nav>

      {/* Main Grid Layout (Left: Content & Tables, Right: Sticky Summary Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (70%) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Post Header Banner */}
          <div className="card p-6 bg-white dark:bg-slate-900 relative overflow-hidden transition-all shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {post.category && (
                <span className="badge bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary-hover dark:border-primary/30 text-[10px] uppercase font-bold px-2 py-0.5">
                  {post.category.icon} {post.category.name}
                </span>
              )}
              <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5">
                {post.exam_type}
              </span>
              <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Govt Verified</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
              {post.official_logo_url ? (
                <img
                  src={post.official_logo_url}
                  alt="Official Agency Emblem"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 p-1.5 border border-slate-100 dark:border-slate-800/80 object-contain shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 flex items-center justify-center shrink-0">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
              )}
              
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-hindi font-bold tracking-tight text-slate-800 dark:text-white leading-snug">
                  {post.title_hindi || post.title}
                </h1>
                {post.title_hindi && (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {post.title}
                  </p>
                )}
              </div>
            </div>

            {/* View Stats Row */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/80 text-xs text-slate-400">
              <span>📅 Published: {post.published_at ? new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Draft'}</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{post.view_count || 120} views</span>
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5 text-primary" />
                <span>{post.click_apply || 25} clicks</span>
              </span>
            </div>
          </div>

          {/* Quick Info Box (highlighted dashboard) */}
          <div className="card bg-primary/5 dark:bg-primary/5 border border-primary/10 dark:border-primary/20 p-6 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-primary dark:text-primary-hover uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Vacancy Recruitment Dashboard</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Total Vacancies</p>
                  <p className="font-extrabold text-slate-800 dark:text-white text-base">
                    {post.total_vacancies ? post.total_vacancies.toLocaleString('en-IN') : 'Check Notification'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-500 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Apply Deadline</p>
                  <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                    {lastDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Eligibility Criteria</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[200px]" title={String(education)}>
                    {String(education)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Salary Scale</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[200px]" title={post.salary_range || 'As per norms'}>
                    {post.salary_range || 'As per norms'}
                  </p>
                </div>
              </div>

            </div>

            {/* Quick CTAs for Mobile View inside the box */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button 
                onClick={handleApplyClick}
                className="btn btn-primary flex-1 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
              >
                <span>Apply Online Direct Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              {post.notification_link && (
                <button 
                  onClick={() => setIsPdfModalOpen(true)}
                  className="btn btn-secondary flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 dark:border-slate-800"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Notification</span>
                </button>
              )}
              {post.official_site && !post.notification_link && (
                <a 
                  href={post.official_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 dark:border-slate-800"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            
            {/* My Applications Tracker */}
            <div className="pt-4 border-t border-primary/10 dark:border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Track your status:</p>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => handleStatusChange(appStatus === 'interested' ? null : 'interested')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${appStatus === 'interested' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  🤔 Interested
                </button>
                <button 
                  onClick={() => handleStatusChange(appStatus === 'applied' ? null : 'applied')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${appStatus === 'applied' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  ✅ Applied
                </button>
              </div>
            </div>
          </div>

          {/* Important Dates Table */}
          {post.important_dates && post.important_dates.length > 0 && (
            <div className="card p-5 space-y-3 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Important Dates Calendar</span>
              </h3>
              
              <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Exam Event</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Key Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {post.important_dates.map((d, index) => (
                      <tr key={index} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors odd:bg-white dark:odd:bg-slate-950/20">
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{d.event}</td>
                        <td className="p-3 font-extrabold text-primary">{d.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Post Content */}
          <div className="card p-6 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detailed Notification Details</h3>
            
            {/* Render SEO Blog Post / Quick Summary in place of duplicate Hindi Manual Bulletin */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
              <div className="flex items-center justify-between">
                <span className="badge bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] py-0.5 uppercase tracking-wider">
                  ⚡ SEO Quick Blog Post & Summary
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Fast-Loading & Mobile Optimized</span>
              </div>
              
              <div className="space-y-3.5">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
                  {post.title_hindi || post.title} - Full Recruitment Guide & Quick Blog Overview
                </h4>
                
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {post.short_info_en || `Exciting news for government job aspirants! The ${post.department || 'authority'} has officially published the recruitment bulletin for ${post.post_name || 'various vacancies'}. Candidates interested in this opportunity can review the eligibility guidelines and application dates below.`}
                </p>

                {post.short_info_hi && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-indigo-500/30 pl-3 italic">
                    {post.short_info_hi}
                  </p>
                )}

                {/* Quick Facts Sheet for Fast Indexing */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2.5">
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700/60 pb-1.5 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Department</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 text-right">{post.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700/60 pb-1.5 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Designation</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 text-right">{post.post_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700/60 pb-1.5 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Advt No.</span>
                      <span className="font-mono text-slate-700 dark:text-slate-200">{post.advt_no || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700/60 pb-1.5 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Total Vacancies</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {post.total_vacancies ? post.total_vacancies.toLocaleString('en-IN') : 'Check Notification'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700/60 pb-1.5 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Registration Open</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{post.start_date || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700/60 pb-1.5 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Last Date to Apply</span>
                      <span className="font-bold text-red-500">{post.end_date || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Bullet Points of Checklist / Why Apply */}
                <div className="space-y-2 pt-2">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span>How to Apply & Preparation Checklist:</span>
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Verify educational eligibility criteria ({education})</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Check age limits and relaxations ({ageLimit})</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Gather documents (ID proof, signature, photos)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Submit fees and download receipt before {lastDate}</span>
                    </li>
                  </ul>
                </div>

                {/* Visually Hidden Multilingual Keywords Badges at the bottom for SEO crawling & Google Bot indexation only */}
                {post.tags && post.tags.length > 0 && (
                  <div className="sr-only opacity-0 pointer-events-none select-none h-0 w-0 overflow-hidden absolute" aria-hidden="false">
                    <h2>🏷️ Regional Search, Keywords & Indexing Tags for Googlebot crawling:</h2>
                    <div>
                      {post.tags.map((tag, i) => (
                        <span key={i}>
                          {tag}, 
                        </span>
                      ))}
                      <span>sarkari naukri, </span>
                      <span>sarkari result, </span>
                      <span>job alert, </span>
                      <span>latest bharti, </span>
                      <span>government job notification, </span>
                      <span>recruitment application, </span>
                      <span>online apply link</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Render English Content */}
            {post.content_english && (
              <div className="space-y-2 pt-2">
                <span className="badge bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] py-0.5 uppercase tracking-wider">📋 OFFICIAL SPECIFICATION SHEET</span>
                <div 
                  className="prose dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed space-y-3"
                  dangerouslySetInnerHTML={{ __html: post.content_english }}
                />
              </div>
            )}
          </div>

          {/* Share Section */}
          <div className="card p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Share this Alert with Friends</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a 
                href={`https://api.whatsapp.com/send?text=${getShareText()}${window.location.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial btn btn-secondary text-xs font-semibold py-2 bg-emerald-500 hover:bg-emerald-600 border-none text-white flex items-center justify-center gap-1.5 rounded-lg"
              >
                <span>WhatsApp</span>
              </a>
              <a 
                href={`https://t.me/share/url?url=${window.location.href}&text=${getShareText()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial btn btn-secondary text-xs font-semibold py-2 bg-sky-500 hover:bg-sky-600 border-none text-white flex items-center justify-center gap-1.5 rounded-lg"
              >
                <span>Telegram</span>
              </a>
              <button 
                onClick={copyLink}
                className="flex-1 sm:flex-initial btn btn-secondary text-xs font-semibold py-2 flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Sticky Column (30%) - Desktop Only */}
        <div className="hidden lg:block space-y-6 lg:sticky lg:top-20">
          
          <div className="card p-5 bg-white dark:bg-slate-900 space-y-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Recruitment Overview</span>
            
            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80">
                <span className="font-medium text-slate-400">Exam Board</span>
                <span className="font-bold text-slate-800 dark:text-white">{post.exam_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80">
                <span className="font-medium text-slate-400">Posts Name</span>
                <span className="font-bold text-slate-800 dark:text-white truncate max-w-[130px]" title={post.post_name || ''}>{post.post_name || 'Various'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80">
                <span className="font-medium text-slate-400">Total Vacancy</span>
                <span className="font-bold text-primary-hover dark:text-primary font-display">
                  {post.total_vacancies ? post.total_vacancies.toLocaleString('en-IN') : 'Check Details'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80">
                <span className="font-medium text-slate-400">Age Range</span>
                <span className="font-bold text-slate-800 dark:text-white truncate max-w-[130px]" title={ageLimit}>{ageLimit}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium text-slate-400">State Location</span>
                <span className="font-bold text-slate-800 dark:text-white">{post.state?.join(', ') || 'All India'}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800/80">
              <button 
                onClick={handleApplyClick}
                className="btn btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
              >
                <span>Apply Online Direct Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              {post.notification_link && (
                <button 
                  onClick={() => setIsPdfModalOpen(true)}
                  className="btn btn-secondary w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 border-none hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Notification</span>
                </button>
              )}
              {post.official_site && !post.notification_link && (
                <a 
                  href={post.official_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 border-none hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <span>Visit Official Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg text-[10px] text-slate-400 leading-relaxed flex gap-1.5 items-start">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>SarkariCMS only lists verified notifications. Check eligibility before paying form fee.</span>
            </div>
          </div>

        </div>

      </div>

      {/* 7. Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ThumbsUp className="w-4 h-4 text-primary" />
            <span>Recommended Job Alerts in {post.category?.name}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedPosts.map((rp) => (
              <div key={rp.id} className="card p-4 bg-white dark:bg-slate-900 flex flex-col justify-between hover:-translate-y-0.5 duration-200">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 rounded">
                    {rp.exam_type}
                  </span>
                  <Link to={`/job/${rp.slug}`} className="block">
                    <h4 className="font-hindi font-bold text-sm text-slate-800 dark:text-white line-clamp-2 hover:text-primary transition-colors">
                      {rp.title_hindi || rp.title}
                    </h4>
                  </Link>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-4 pt-2 border-t border-slate-50 dark:border-slate-800/80">
                  <span>Vacancy: {rp.total_vacancies ? rp.total_vacancies.toLocaleString('en-IN') : 'Check details'}</span>
                  <Link to={`/job/${rp.slug}`} className="text-primary font-bold">Apply →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Mobile Sticky Apply Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-3 lg:hidden shadow-2xl flex justify-between items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
            {post.post_name || 'Govt Recruitment'}
          </p>
          <p className="font-extrabold text-primary text-xs truncate">
            {post.total_vacancies ? `${post.total_vacancies.toLocaleString('en-IN')} Vacancies` : 'Apply Now'}
          </p>
        </div>
        <button 
          onClick={handleApplyClick}
          className="btn btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-md shadow-primary/20"
        >
          <span>Apply Online Form</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* PDF Viewer Modal */}
      {isPdfModalOpen && post.notification_link && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-800 dark:text-white truncate max-w-md">
                  Official Notification - {post.post_name || 'Details'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href={post.notification_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </a>
                <button 
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Iframe */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative w-full h-full">
              <iframe 
                src={post.notification_link.includes('.pdf') && !post.notification_link.includes('google.com') ? `https://docs.google.com/gview?url=${encodeURIComponent(post.notification_link)}&embedded=true` : post.notification_link}
                className="absolute inset-0 w-full h-full border-0"
                title="Official Notification PDF"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
