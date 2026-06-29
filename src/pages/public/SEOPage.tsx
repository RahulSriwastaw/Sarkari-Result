import { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { ChevronRight, Home, LayoutGrid, FileText } from 'lucide-react';
import SEO from '../../components/SEO';
import PostCard from '../../components/PostCard';
import { getPosts } from '../../lib/supabase';
import { Post } from '../../lib/types';

export default function SEOPage() {
  const location = useLocation();
  const { exam } = useParams<{ exam?: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Normalize path to generate SEO metadata
  const pathParts = location.pathname.split('/').filter(Boolean);
  const basePath = pathParts[0] || ''; // e.g. 'results', 'latest-jobs'
  
  const generateTitle = () => {
    const formattedBase = basePath.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (exam) {
      const formattedExam = exam.toUpperCase().replace(/-/g, ' ');
      return `${formattedExam} ${formattedBase} 2026 - ResultVeda`;
    }
    return `Latest ${formattedBase} 2026 - ResultVeda`;
  };

  const generateDesc = () => {
    const formattedBase = basePath.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (exam) {
      const formattedExam = exam.toUpperCase().replace(/-/g, ' ');
      return `Get the latest ${formattedExam} ${formattedBase} updates. Download admit cards, check answer keys, and view syllabi at ResultVeda.`;
    }
    return `Check all the latest ${formattedBase} updates, notifications, and direct download links at ResultVeda.`;
  };

  const title = generateTitle();
  const description = generateDesc();
  const pageName = exam ? `${exam.toUpperCase().replace(/-/g, ' ')} ${basePath.replace(/-/g, ' ')}` : basePath.replace(/-/g, ' ');

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        // Here we could filter by specific category based on basePath, but for now we fetch all or recent
        const data = await getPosts();
        
        // Basic naive filtering based on path if it matches any category
        let filtered = data;
        if (exam) {
           filtered = data.filter(p => p.title.toLowerCase().includes(exam.replace(/-/g, ' ').toLowerCase()));
        } else {
           filtered = data.filter(p => p.category_id?.toLowerCase().includes(basePath.toLowerCase()) || p.title.toLowerCase().includes(basePath.toLowerCase()));
           if (filtered.length === 0) filtered = data.slice(0, 12); // Fallback
        }
        
        setPosts(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [basePath, exam]);

  const faqs = [
    {
      question: `What is the latest update for ${pageName}?`,
      answer: `The latest updates for ${pageName} are regularly published on ResultVeda. Please check the active posts below for exact dates and links.`
    },
    {
      question: `How can I download the ${pageName}?`,
      answer: `You can find the direct official download link for ${pageName} inside the respective job post below.`
    }
  ];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://resultveda.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": basePath.replace(/-/g, ' ').toUpperCase(),
        "item": `https://resultveda.com/${basePath}`
      },
      ...(exam ? [{
        "@type": "ListItem",
        "position": 3,
        "name": exam.toUpperCase().replace(/-/g, ' '),
        "item": `https://resultveda.com/${basePath}/${exam}`
      }] : [])
    ]
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": posts.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://resultveda.com/job/${post.slug}`,
      "name": post.title
    }))
  };

  return (
    <div className="space-y-8">
      <SEO 
        title={title} 
        description={description} 
        canonical={location.pathname} 
        schema={[breadcrumbSchema, itemListSchema]}
        faq={faqs}
      />
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none overflow-x-auto pb-2">
        <Link to="/" className="hover:text-primary flex items-center gap-1 whitespace-nowrap">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/${basePath}`} className="hover:text-primary whitespace-nowrap">
          <span className={exam ? "text-slate-600 dark:text-slate-300" : "text-primary"}>
            {basePath.replace(/-/g, ' ')}
          </span>
        </Link>
        {exam && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary whitespace-nowrap">{exam.replace(/-/g, ' ')}</span>
          </>
        )}
      </nav>

      {/* Hero Header (H1) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white capitalize tracking-tight mb-4">
          {title.split('-')[0]}
        </h1>
        <h2 className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {description}
        </h2>
      </div>

      {/* Table of Contents / Quick Links (H2) */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Table of Contents
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <li><a href="#latest-updates" className="text-primary hover:underline">1. Latest Updates</a></li>
          <li><a href="#faq" className="text-primary hover:underline">2. Frequently Asked Questions</a></li>
          <li><Link to="/latest-jobs" className="text-primary hover:underline">3. More Government Jobs</Link></li>
        </ul>
      </div>

      {/* Posts Grid */}
      <section id="latest-updates" className="space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <LayoutGrid className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize">Active {pageName} Updates</h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
             ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500">No active updates found for this category right now.</p>
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <section id="faq" className="space-y-4 pt-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{faq.question}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
