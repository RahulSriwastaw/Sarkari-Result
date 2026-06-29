import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Briefcase, GraduationCap, ChevronRight, Share2, Bookmark, Loader2, IndianRupee } from 'lucide-react';
import { Post, Profile, isNewPost, isClosingSoonPost, isHighSalaryPost } from '../lib/types';
import { checkEligibility } from '../lib/eligibility';
import { toBlob } from 'html-to-image';
import { saveJob, unsaveJob, isJobSaved } from '../lib/supabase';

interface PostCardProps {
  key?: any;
  post: Post;
  profile?: Profile | null;
}

export default function PostCard({ post, profile }: PostCardProps) {
  const isNew = isNewPost(post);
  const isClosing = isClosingSoonPost(post);
  const isHighSalary = isHighSalaryPost(post);

  const [logoSrc, setLogoSrc] = useState(post.official_logo_url || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogoSrc(post.official_logo_url || '');
    if (profile) {
      isJobSaved(profile.id, post.id).then(res => {
        if (res.isSaved) setIsSaved(true);
      });
    } else {
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      setIsSaved(savedJobs.includes(post.id));
    }
  }, [post.official_logo_url, post.id, profile]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (profile) {
        if (isSaved) {
            await unsaveJob(profile.id, post.id);
            setIsSaved(false);
        } else {
            await saveJob(profile.id, post.id);
            setIsSaved(true);
        }
    } else {
        const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
        if (isSaved) {
        const newSaved = savedJobs.filter((id: string) => id !== post.id);
        localStorage.setItem('savedJobs', JSON.stringify(newSaved));
        setIsSaved(false);
        } else {
        savedJobs.push(post.id);
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
        setIsSaved(true);
        }
    }
  };

  // Extract eligibility parameters
  const education = post.eligibility?.Education || post.eligibility?.education || 'Check Details';
  const eligibility = profile ? checkEligibility(profile, post) : null;
  
  const ageLimit = post.eligibility?.age_limit || post.eligibility?.['Age Limit'] || post.eligibility?.age || null;
  const fee = post.eligibility?.application_fee || post.eligibility?.fee || post.eligibility?.['Application Fee'] || post.eligibility?.Fee || null;
  
  // Format last date dynamically
  const lastDateItem = post.important_dates?.find(d => 
    d.event.toLowerCase().includes('last date') || d.event.toLowerCase().includes('close')
  );
  const lastDate = lastDateItem ? lastDateItem.date : 'Check Details';

  const getDaysLeft = (post: Post) => {
    const dateStr = post.end_date || post.important_dates?.find(d => {
      if (!d || !d.event || typeof d.event !== 'string') return false;
      const evt = d.event.toLowerCase();
      return evt.includes('last date') || evt.includes('close') || evt.includes('end');
    })?.date;
    
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    // Check YYYY-MM-DD
    let match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
    if (match) {
      const parsedDate = new Date(match[0]);
      if (isNaN(parsedDate.getTime())) return null;
      const now = new Date();
      now.setHours(0, 0, 0, 0); 
      parsedDate.setHours(0, 0, 0, 0);
      const diffTime = parsedDate.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Some dates might be like "31/12/2026"
    const dmYMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmYMatch) {
       const [_, d, m, y] = dmYMatch;
       const parsedDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
       if (isNaN(parsedDate.getTime())) return null;
       const now = new Date();
       now.setHours(0, 0, 0, 0);
       parsedDate.setHours(0, 0, 0, 0);
       const diffTime = parsedDate.getTime() - now.getTime();
       return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return null;
  };
  
  const daysLeft = getDaysLeft(post);

  // Format relative time or display date
  const getRelativeTime = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hrs ago`;
    return `${diffDays} days ago`;
  };

  // Determine category badge colors
  const getCategoryColor = (slug: string | null | undefined) => {
    switch (slug) {
      case 'ssc': return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-hover dark:border-primary/30';
      case 'railway': return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
      case 'banking': return 'bg-green-100 text-green-600 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900';
      case 'upsc': return 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
      case 'police': return 'bg-teal-100 text-teal-600 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900';
      default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSharing) return;
    setIsSharing(true);
    let preloadedLogoSrc = '';

    try {
      // Pre-fetch image to avoid html-to-image console warnings
      if (logoSrc) {
        try {
          const res = await fetch(logoSrc, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            preloadedLogoSrc = URL.createObjectURL(blob);
          }
        } catch (fetchErr) {
          // Ignore fetch error, we just won't show the logo in the share image
          console.log('Skipping share image logo due to fetch error');
        }
      }
      
      // Update the DOM with the preloaded data URL if available
      if (shareRef.current) {
        const imgEl = shareRef.current.querySelector('#share-logo-img') as HTMLImageElement;
        if (imgEl) {
          if (preloadedLogoSrc) {
            imgEl.src = preloadedLogoSrc;
          } else {
            imgEl.style.display = 'none';
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 50)); // let React render the hidden div
      if (!shareRef.current) return;

      const blob = await toBlob(shareRef.current, {
        pixelRatio: 1, // 1080x1080
        backgroundColor: '#0f172a',
        skipFonts: true,
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // transparent 1x1 png
        style: {
          fontFamily: 'sans-serif'
        },
        filter: (node) => {
          // Filter out the image if we couldn't preload it, to prevent html-to-image from fetching it
          if (node.tagName === 'IMG' && node.id === 'share-logo-img' && !preloadedLogoSrc) {
            return false;
          }
          return true;
        }
      });

      if (!blob) throw new Error('Failed to create image blob');

      const file = new File([blob], `ResultVeda-${post.slug}.png`, { type: 'image/png' });
      const textMessage = `🚀 ${post.title_hindi || post.title}\n💼 Vacancies: ${post.total_vacancies || 'Check Notification'}\n📅 Last Date: ${lastDate}\n🎓 Eligibility: ${education}\n\nApply now at ResultVeda 👇\n`;
      const postUrl = `${window.location.origin}/job/${post.slug}`;

      const shareData = {
        title: post.title,
        text: textMessage,
        url: postUrl,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        // Fallback to sharing without file
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        });
      } else {
        // Fallback to clipboard
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          alert('Image copied to clipboard! You can paste it to share.');
        } else {
          alert('Sharing is not supported on this device.');
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing post:', err.message || err);
      }
    } finally {
      if (preloadedLogoSrc) {
        URL.revokeObjectURL(preloadedLogoSrc);
      }
      setIsSharing(false);
    }
  };

  return (
      <article className="card p-3 relative overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 hover:scale-[1.02] duration-200 dark:bg-[#111528] dark:border-[#1C2140]">
      <div>
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
          <div className="flex flex-wrap gap-1 items-center">
            {post.category && (
              <span className={`badge border text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 ${getCategoryColor(post.category.slug)}`}>
                {post.category.icon} {post.category.name}
              </span>
            )}
            <span className="badge bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] text-slate-600 dark:text-slate-400 font-medium px-1.5 py-0">
              {post.exam_type}
            </span>
            {isNew && (
              <span className="badge bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase px-1 py-0 animate-pulse">
                ✨ New
              </span>
            )}
            {daysLeft !== null && daysLeft >= 0 && (
              <span className={`badge border text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 ${
                daysLeft <= 3 
                  ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50 animate-pulse' 
                  : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50'
              }`}>
                {daysLeft === 0 ? 'Last Day' : `${daysLeft} Days Left`}
                {daysLeft <= 3 && ' ⏳ Urgent'}
              </span>
            )}
            {post.salary_range && (
              <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] font-bold px-1.5 py-0 flex items-center gap-0.5">
                <IndianRupee className="w-2.5 h-2.5" />
                {post.salary_range}
              </span>
            )}
            {eligibility && (
              <span className={`badge border text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 ${eligibility.eligible ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                {eligibility.eligible ? '✅ Eligible' : '❌ Not Eligible'}
              </span>
            )}
          </div>
          <button onClick={toggleSave} className={`p-1 rounded-full ${isSaved ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
 
        {/* Content/Title with Logo */}
        <div className="flex gap-2 mb-2 items-start">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Official Logo"
              referrerPolicy="no-referrer"
              onError={() => setLogoSrc('')}
              className="w-8 h-8 rounded-md bg-slate-50 dark:bg-slate-800 p-0.5 border border-slate-100 dark:border-slate-800 object-contain flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
          )}

          <Link to={`/job/${post.slug}`} className="block group flex-1 min-w-0">
            {post.title_hindi ? (
              <div className="space-y-0.5">
                <h2 className="font-hindi font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {post.title_hindi}
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                  {post.title}
                </p>
              </div>
            ) : (
              <h2 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {post.title}
              </h2>
            )}
          </Link>
        </div>
 
        {/* Details Grid */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
            <Briefcase className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">Vacancies:</span>
            <span className="bg-primary/10 text-primary px-1 py-0 rounded font-bold text-[10px]">
              {post.total_vacancies ? post.total_vacancies.toLocaleString('en-IN') : 'Check'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">Apply Till:</span>
            <span className="text-red-500 dark:text-red-400 font-bold">{lastDate}</span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/80 mt-auto">
        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {post.published_at ? getRelativeTime(post.published_at) : 'Draft'}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} disabled={isSharing} className={`p-1 rounded-full ${isSharing ? 'text-primary animate-pulse' : 'text-slate-400 hover:text-primary transition-colors'}`} title="Share Job">
            {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
          <Link 
            to={`/job/${post.slug}`}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover transition-colors group"
          >
            <span>Apply</span>
            <ChevronRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Hidden layout for sharing image (Rendered only when sharing to save memory/DOM elements) */}
      {isSharing && (
        <div className="fixed -left-[9999px] top-0">
          <div ref={shareRef} className="w-[1080px] h-[1080px] flex flex-col bg-[#0B1120] text-white p-14 justify-between" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-primary/30">
                  R
                </div>
                <div>
                  <h1 className="text-5xl font-extrabold text-white tracking-tight leading-none mb-1">Result<span className="text-primary">Veda</span></h1>
                  <p className="text-lg text-primary-300 font-semibold tracking-[0.2em] uppercase">Sabse Pehle</p>
                </div>
              </div>
              <div className="bg-primary text-white px-8 py-3 rounded-full text-3xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                {post.category?.name || 'Job Alert'}
              </div>
            </div>

            {/* Main Card */}
            <div className="flex-1 bg-[#151C2F] border-2 border-slate-700/50 rounded-[32px] p-12 flex flex-col shadow-2xl relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              
              <div className="flex items-start gap-8 mb-10 relative z-10">
                {logoSrc && (
                  <div className="w-28 h-28 shrink-0 bg-white rounded-2xl p-3 flex items-center justify-center shadow-lg border-4 border-slate-800">
                    <img id="share-logo-img" src={logoSrc} crossOrigin="anonymous" className="w-full h-full object-contain" alt="" />
                  </div>
                )}
                <div className="flex-1 pt-2">
                  <h2 className="text-[52px] font-bold text-white leading-[1.1] mb-4 line-clamp-3">
                    {post.title_hindi || post.title}
                  </h2>
                  {post.title_hindi && (
                    <p className="text-2xl text-slate-400 font-medium line-clamp-2 leading-snug">
                      {post.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-6 flex-1 mt-4 relative z-10">
                
                {/* Vacancies */}
                <div className="bg-[#1E263D] rounded-2xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3 text-primary-400">
                    <Briefcase className="w-8 h-8" />
                    <span className="text-xl font-bold uppercase tracking-wider text-slate-300">Total Vacancies</span>
                  </div>
                  <div className="text-[48px] leading-none font-extrabold text-white">
                    {post.total_vacancies ? post.total_vacancies.toLocaleString('en-IN') : 'Check Details'}
                  </div>
                </div>

                {/* Last Date */}
                <div className="bg-[#1E263D] rounded-2xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3 text-rose-400">
                    <Calendar className="w-8 h-8" />
                    <span className="text-xl font-bold uppercase tracking-wider text-slate-300">Apply Before</span>
                  </div>
                  <div className="text-[48px] leading-none font-extrabold text-rose-400">
                    {lastDate}
                  </div>
                </div>

                {/* Age Limit */}
                {ageLimit && (
                  <div className="bg-[#1E263D] rounded-2xl p-6 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2 text-amber-400">
                      <span className="text-xl font-bold uppercase tracking-wider text-slate-300">Age Limit</span>
                    </div>
                    <div className="text-[32px] font-bold text-white leading-tight line-clamp-2">
                      {ageLimit}
                    </div>
                  </div>
                )}

                {/* Application Fee */}
                {fee && (
                  <div className="bg-[#1E263D] rounded-2xl p-6 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2 text-emerald-400">
                      <span className="text-xl font-bold uppercase tracking-wider text-slate-300">Application Fee</span>
                    </div>
                    <div className="text-[32px] font-bold text-white leading-tight line-clamp-2">
                      {fee}
                    </div>
                  </div>
                )}
                
                {/* Eligibility */}
                <div className={`bg-[#1E263D] rounded-2xl p-6 border border-slate-700 flex flex-col justify-center ${(!ageLimit && !fee) || (ageLimit && fee) ? 'col-span-2' : ''}`}>
                  <div className="flex items-center gap-3 mb-2 text-primary-400">
                    <GraduationCap className="w-8 h-8" />
                    <span className="text-xl font-bold uppercase tracking-wider text-slate-300">Eligibility / Qualification</span>
                  </div>
                  <div className="text-[32px] font-semibold text-white leading-tight line-clamp-2">
                    {education}
                  </div>
                </div>

                {/* Extra Data row if missing fee/age */}
                {(!ageLimit || !fee) && (
                  <div className={`${(!ageLimit && !fee) ? 'col-span-2' : ''} flex items-center justify-center bg-primary/10 rounded-2xl p-4 border border-primary/20`}>
                      <p className="text-xl text-primary-200 font-medium text-center">
                        Read full notification for more details.
                      </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 flex justify-between items-center bg-[#151C2F] rounded-2xl p-8 border border-slate-800">
              <div className="flex items-center gap-5">
                <div className="bg-primary p-4 rounded-xl">
                  <Share2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <p className="text-2xl text-slate-400 font-medium mb-1">Apply Online & Get Updates at</p>
                  <p className="text-4xl font-extrabold text-white tracking-wide">
                    resultveda.com/job/<span className="text-primary">{post.slug}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/10 px-6 py-3 rounded-xl border border-white/20">
                  <span className="text-3xl font-bold text-white">Share Now 🚀</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
