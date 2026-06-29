import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  getPostBySlug, createPost, updatePost, getCategories, getPosts 
} from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { Category, Post } from '../../lib/types';
import { generatePostSlug, detectCategory } from '../../lib/postUtils';
import { 
  ArrowLeft, Save, Eye, Clipboard, HelpCircle, RefreshCw, FileCode,
  Sparkles, UploadCloud, Globe, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Trash2, RotateCcw, CheckCircle2, ShieldAlert, AlertTriangle, Upload
} from 'lucide-react';
import BilingualHtmlBlock from '../../components/BilingualHtmlBlock';

interface VerificationResult {
  is_valid_recruitment: boolean;
  confidence_score: number;
  verified_fields: {
    post_title: boolean;
    vacancy_count: boolean;
    eligibility_criteria: boolean;
    important_dates: boolean;
  };
  verification_summary: string;
  warning_message: string;
}

export default function PostForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  // AI Auto-Fill State
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiSourceType, setAiSourceType] = useState<'pdf' | 'url'>('pdf');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiExtractedText, setAiExtractedText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = React.useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleGenerateSlug = () => {
    if (!titleEn && !postName) return;
    const slug = generatePostSlug({
      post_name: postName,
      department: department,
      title_en: titleEn,
      advt_no: advtNo,
      start_date: startDate,
    });
    setSlug(slug);
  };

  const handleResetForm = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }

    // Reset all content states
    setCategorySlug(categories.length > 0 ? categories[0].slug : '');
    setSlug('');
    setTitleEn('');
    setTitleHi('');
    setPostName('');
    setDepartment('');
    setAdvtNo('');
    setVacancies(undefined);
    setStartDate('');
    setEndDate('');
    setAdmitCardDate('');
    setExamDate('');
    setResultDate('');
    setApplyLink('');
    setNotificationLink('');
    setAdmitCardLink('');
    setResultLink('');
    setOfficialWebsite('');
    setOfficialLogoUrl('');
    setShortInfoEn('');
    setShortInfoHi('');
    setBilingualHtml('');
    setStatus('draft');

    // Reset AI states
    setWebsiteUrl('');
    setAiInstructions('');
    setAiExtractedText('');
    setAiFile(null);
    setVerificationResult(null);
    setAiSuccessMessage('Form successfully cleared! You can now start writing a brand new post.');
    setAiErrorMessage(null);
    setAiStatusMessage('');
    setConfirmReset(false);

    // If in edit mode, navigate to the New Post route to write a fresh post
    if (isEditMode) {
      navigate('/veda-admin-6721/posts/new');
    }
  };

  const handleAiFileUpload = async (selectedFile: File) => {
    const lowerName = selectedFile.name.toLowerCase();
    const validExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.webp'];
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      setAiErrorMessage('Unsupported file type. Please upload a PDF, DOCX, or Image (PNG/JPG/WEBP).');
      return;
    }

    const isImage = ['.png', '.jpg', '.jpeg', '.webp'].some(ext => lowerName.endsWith(ext));

    setAiFile(selectedFile);
    setAiErrorMessage(null);
    setAiSuccessMessage(null);
    setAiLoading(true);
    setAiStatusMessage(isImage ? 'Reading screenshot with Gemini Vision AI...' : 'Uploading and extracting raw text from document...');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];

        let endpoint = '/api/parse-document';
        let body: any = {};

        if (isImage) {
          // Use Gemini Vision for images
          const mimeType = lowerName.endsWith('.png') ? 'image/png' 
            : lowerName.endsWith('.webp') ? 'image/webp' 
            : 'image/jpeg';
          endpoint = '/api/parse-image';
          body = { imageBase64: base64String, fileName: selectedFile.name, mimeType };
        } else {
          const fileType = lowerName.endsWith('.pdf') ? 'pdf' : 'docx';
          body = { fileBase64: base64String, fileName: selectedFile.name, fileType };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setAiExtractedText(data.text || '');
        setAiSuccessMessage(`Successfully extracted content from "${selectedFile.name}"! Scroll down to preview and run Gemini AI.`);
      } catch (err: any) {
        console.error(err);
        setAiErrorMessage(`Failed to extract text: ${err.message || err}`);
      } finally {
        setAiLoading(false);
        setAiStatusMessage('');
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleAiScrapeUrl = async () => {
    if (!websiteUrl) {
      setAiErrorMessage('Please enter a valid website URL first.');
      return;
    }

    setAiErrorMessage(null);
    setAiSuccessMessage(null);
    setAiLoading(true);
    setAiStatusMessage('Contacting commission website and extracting readable content...');

    try {
      const res = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl })
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiExtractedText(data.text || '');
      setAiSuccessMessage('Successfully scraped website content! Scroll down to review and run Gemini AI.');
    } catch (err: any) {
      console.error(err);
      setAiErrorMessage(`Failed to read website: ${err.message || err}`);
    } finally {
      setAiLoading(false);
      setAiStatusMessage('');
    }
  };

  const handleScrapeFromUrlAndPopulate = async () => {
    if (!websiteUrl) {
      setAiErrorMessage('Please enter a valid job portal or recruitment website URL first.');
      return;
    }

    setAiLoading(true);
    setAiErrorMessage(null);
    setAiSuccessMessage(null);
    setVerificationResult(null);
    setAiStatusMessage('Stage 1/3: Scraping and crawling job portal website content...');

    try {
      // Step 1: Scrape website
      const scrapeRes = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl })
      });

      const scrapeData = await scrapeRes.json();
      if (scrapeData.error) {
        throw new Error(scrapeData.error);
      }

      const text = scrapeData.text || '';
      setAiExtractedText(text);

      if (!text || text.trim().length === 0) {
        throw new Error('No readable text content could be extracted from this job portal website.');
      }

      // Step 2: Real-time AI Verification of Portal Content
      setAiStatusMessage('Stage 2/3: AI is performing real-time verification on scraped portal data...');
      
      const verifyRes = await fetch('/api/verify-scraped-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text, sourceUrl: websiteUrl })
      });

      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        setVerificationResult(verifyData);
        console.log('[Real-time Verification Report]:', verifyData);
      }

      // Step 3: Use AI agent to analyze crawled page and populate fields
      setAiStatusMessage('Stage 3/3: AI Agent is writing the post and auto-filling form fields with verified portal data...');

      const genRes = await fetch('/api/generate-bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: text,
          userInstructions: aiInstructions || 'Focus on extracting the post title, exact total vacancy count, and educational eligibility criteria.',
          sourceUrl: websiteUrl
        })
      });

      const genData = await genRes.json();
      if (genData.error) {
        throw new Error(genData.error);
      }

      // Populate fields!
      setTitleEn(genData.title_en || '');
      setTitleHi(genData.title_hi || '');
      setPostName(genData.post_name || '');
      setDepartment(genData.department || '');
      setAdvtNo(genData.advt_no || '');
      setVacancies(genData.vacancies ? Number(genData.vacancies) : undefined);
      
      setStartDate(genData.start_date || '');
      setEndDate(genData.end_date || '');
      setAdmitCardDate(genData.admit_card_date || '');
      setExamDate(genData.exam_date || '');
      setResultDate(genData.result_date || '');

      setApplyLink(genData.apply_link || '');
      setNotificationLink(genData.notification_link || '');
      setAdmitCardLink(genData.admit_card_link || '');
      setResultLink(genData.result_link || '');
      setOfficialWebsite(genData.official_website || '');

      setShortInfoEn(genData.short_info_en || '');
      setShortInfoHi(genData.short_info_hi || '');
      setBilingualHtml(genData.bilingual_html || '');

      // Autogenerate URL slug
      if (genData.title_en) {
        const formatted = generatePostSlug({
          post_name: genData.post_name,
          department: genData.department,
          title_en: genData.title_en,
          advt_no: genData.advt_no,
          start_date: genData.start_date,
        });
        setSlug(formatted);
      }

      // Auto-detect category
      const detectedCat = detectCategory(
        { department: genData.department, post_name: genData.post_name, title_en: genData.title_en, state: genData.state },
        categories
      );
      // Prefer AI-suggested category, then detectCategory fallback
      const aiSuggestedCat = genData.suggested_category;
      const finalCat = (aiSuggestedCat && categories.find(c => c.slug === aiSuggestedCat)) 
        ? aiSuggestedCat 
        : detectedCat;
      if (finalCat) {
        setCategorySlug(finalCat);
      }

      setAiSuccessMessage('🎉 Crawl and Auto-Fill Complete! The AI Agent crawled the portal page, extracted the recruitment metrics, and successfully populated the Post Title, Vacancies, and Eligibility Criteria fields.');
    } catch (err: any) {
      console.error(err);
      setAiErrorMessage(`Crawl and AI extraction failed: ${err.message || err}`);
    } finally {
      setAiLoading(false);
      setAiStatusMessage('');
    }
  };

  const handleAiGenerateBulletin = async () => {
    if (!aiExtractedText) {
      setAiErrorMessage('Please upload a PDF/DOCX or fetch a website URL first to extract context text.');
      return;
    }

    setAiLoading(true);
    setAiErrorMessage(null);
    setAiSuccessMessage(null);
    setAiStatusMessage('Analyzing text with Gemini 3.5 Flash... Writing bilingual titles, dates, fees matrix, and tables...');

    try {
      const res = await fetch('/api/generate-bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: aiExtractedText,
          userInstructions: aiInstructions,
          sourceUrl: websiteUrl
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Pre-fill all Form fields!
      setTitleEn(data.title_en || '');
      setTitleHi(data.title_hi || '');
      setPostName(data.post_name || '');
      setDepartment(data.department || '');
      setAdvtNo(data.advt_no || '');
      setVacancies(data.vacancies ? Number(data.vacancies) : undefined);
      
      setStartDate(data.start_date || '');
      setEndDate(data.end_date || '');
      setAdmitCardDate(data.admit_card_date || '');
      setExamDate(data.exam_date || '');
      setResultDate(data.result_date || '');

      setApplyLink(data.apply_link || '');
      setNotificationLink(data.notification_link || '');
      setAdmitCardLink(data.admit_card_link || '');
      setResultLink(data.result_link || '');
      setOfficialWebsite(data.official_website || '');

      setShortInfoEn(data.short_info_en || '');
      setShortInfoHi(data.short_info_hi || '');
      setBilingualHtml(data.bilingual_html || '');

      // Autogenerate URL slug
      if (data.title_en) {
        const formatted = generatePostSlug({
          post_name: data.post_name,
          department: data.department,
          title_en: data.title_en,
          advt_no: data.advt_no,
          start_date: data.start_date,
        });
        setSlug(formatted);
      }

      // Auto-detect category
      const detectedCat2 = detectCategory(
        { department: data.department, post_name: data.post_name, title_en: data.title_en, state: data.state },
        categories
      );
      const aiSuggestedCat2 = data.suggested_category;
      const finalCat2 = (aiSuggestedCat2 && categories.find(c => c.slug === aiSuggestedCat2))
        ? aiSuggestedCat2
        : detectedCat2;
      if (finalCat2) {
        setCategorySlug(finalCat2);
      }

      setAiSuccessMessage('🎉 Success! All form fields, dates, links, summaries and HTML matrices have been auto-filled by AI. Review and edit the fields below before saving.');
    } catch (err: any) {
      console.error(err);
      setAiErrorMessage(`AI Generation failed: ${err.message || err}`);
    } finally {
      setAiLoading(false);
      setAiStatusMessage('');
    }
  };

  // Form Fields
  const [categorySlug, setCategorySlug] = useState('');
  const [slug, setSlug] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [postName, setPostName] = useState('');
  const [department, setDepartment] = useState('');
  const [advtNo, setAdvtNo] = useState('');
  const [vacancies, setVacancies] = useState<number | undefined>(undefined);
  
  // Important Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [admitCardDate, setAdmitCardDate] = useState('');
  const [examDate, setExamDate] = useState('');
  const [resultDate, setResultDate] = useState('');

  // Important Links
  const [applyLink, setApplyLink] = useState('');
  const [notificationLink, setNotificationLink] = useState('');
  const [admitCardLink, setAdmitCardLink] = useState('');
  const [resultLink, setResultLink] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [officialLogoUrl, setOfficialLogoUrl] = useState('');

  // Descriptive details
  const [shortInfoEn, setShortInfoEn] = useState('');
  const [shortInfoHi, setShortInfoHi] = useState('');
  const [bilingualHtml, setBilingualHtml] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Load categories and existing post (if edit mode)
  useEffect(() => {
    async function initForm() {
      try {
        const cats = await getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setCategorySlug(cats[0].slug);
        }

        if (isEditMode && id) {
          // In our local storage / supabase helper, let's fetch the post by id.
          // Wait, getPostBySlug can fetch it, or getPosts can list them. Let's fetch all and filter or query.
          const allPosts = await getPosts({});
          const postToEdit = allPosts.find(p => p.id === id);
          
          if (postToEdit) {
            setCategorySlug(postToEdit.category_slug);
            setSlug(postToEdit.slug);
            setTitleEn(postToEdit.title_en);
            setTitleHi(postToEdit.title_hi || '');
            setPostName(postToEdit.post_name);
            setDepartment(postToEdit.department);
            setAdvtNo(postToEdit.advt_no || '');
            setVacancies(postToEdit.vacancies);
            
            // Format dates back for <input type="date" /> (YYYY-MM-DD)
            setStartDate(postToEdit.start_date || '');
            setEndDate(postToEdit.end_date || '');
            setAdmitCardDate(postToEdit.admit_card_date || '');
            setExamDate(postToEdit.exam_date || '');
            setResultDate(postToEdit.result_date || '');

            setApplyLink(postToEdit.apply_link || '');
            setNotificationLink(postToEdit.notification_link || '');
            setAdmitCardLink(postToEdit.admit_card_link || '');
            setResultLink(postToEdit.result_link || '');
            setOfficialWebsite(postToEdit.official_website || '');
            setOfficialLogoUrl(postToEdit.official_logo_url || '');

            setShortInfoEn(postToEdit.short_info_en || '');
            setShortInfoHi(postToEdit.short_info_hi || '');
            setBilingualHtml(postToEdit.bilingual_html || '');
            setStatus(postToEdit.status);
          } else {
            setError('Requested bulletin was not found in the database.');
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Error synchronizing CMS forms.');
      } finally {
        setFetching(false);
      }
    }
    initForm();
  }, [id, isEditMode]);

  const handleSupabasePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(`official-ads/${Date.now()}_${file.name}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      setNotificationLink(publicUrl);
      setAiSuccessMessage('PDF uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setAiErrorMessage('Failed to upload PDF.');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Pre-populate boilerplate HTML table
  const handleLoadBoilerplateTemplate = () => {
    const boilerplate = `<div class="space-y-6">
  <!-- Application Fee details -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="card p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 text-sm">
        💰 Application Fees
      </h3>
      <ul class="list-disc pl-4 mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
        <li><strong>General / OBC / EWS:</strong> ₹500/-</li>
        <li><strong>SC / ST / PH:</strong> ₹250/-</li>
        <li><strong>All Category Female:</strong> ₹250/-</li>
        <li><em>Pay through online debit card, credit card, netbanking, or UPI.</em></li>
      </ul>
    </div>

    <!-- Age Criteria -->
    <div class="card p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 text-sm">
        🕒 Age Limits (As of Cut-off Date)
      </h3>
      <ul class="list-disc pl-4 mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
        <li><strong>Minimum Age Limit:</strong> 18 Years</li>
        <li><strong>Maximum Age Limit:</strong> 27 - 30 Years (Post wise)</li>
        <li><em>Age relaxation is applicable as per official recruitment rules.</em></li>
      </ul>
    </div>
  </div>

  <!-- Eligibility Table -->
  <div class="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm">
    <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-850 pb-1.5 text-sm mb-3">
      🎓 Educational Qualification & Eligibility
    </h3>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-100 dark:bg-slate-950 font-bold border-b border-slate-200 dark:border-slate-800">
            <th class="p-2">Post Name</th>
            <th class="p-2">Total Vacancies</th>
            <th class="p-2">Required Qualification</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr>
            <td class="p-2 font-semibold">General Assistant</td>
            <td class="p-2">120 Posts</td>
            <td class="p-2">Bachelor Degree in any stream from recognized university in India.</td>
          </tr>
          <tr>
            <td class="p-2 font-semibold">Technical Operator</td>
            <td class="p-2">80 Posts</td>
            <td class="p-2">Class 12th (Intermediate) with Science & Math background, or ITI Diploma.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`;
    setBilingualHtml(boilerplate);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleEn || !postName || !department || !slug) {
      setError('Please fulfill English Title, Post Name, Department and Slug.');
      return;
    }

    setLoading(true);
    setError(null);

    const postData = {
      category_id: categories.find(c => c.slug === categorySlug)?.id,
      category_slug: categorySlug,
      slug: slug.trim(),
      title_en: titleEn.trim(),
      title_hi: titleHi.trim() || undefined,
      post_name: postName.trim(),
      department: department.trim(),
      advt_no: advtNo.trim() || undefined,
      vacancies: vacancies ? Number(vacancies) : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      admit_card_date: admitCardDate || undefined,
      exam_date: examDate || undefined,
      result_date: resultDate || undefined,
      apply_link: applyLink.trim() || undefined,
      notification_link: notificationLink.trim() || undefined,
      admit_card_link: admitCardLink.trim() || undefined,
      result_link: resultLink.trim() || undefined,
      official_website: officialWebsite.trim() || undefined,
      official_logo_url: officialLogoUrl.trim() || undefined,
      short_info_en: shortInfoEn.trim(),
      short_info_hi: shortInfoHi.trim() || undefined,
      bilingual_html: bilingualHtml.trim(),
      status,
    };

    try {
      if (isEditMode && id) {
        await updatePost(id, postData);
      } else {
        await createPost(postData);
      }
      navigate('/veda-admin-6721/posts');
    } catch (err: any) {
      console.error('Failed to save recruitment update:', err);
      setError(err?.message || 'Database transaction error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Retrieving bulletin schema from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-900 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link to="/veda-admin-6721/posts" className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {isEditMode ? 'Modify Bulletin Details' : 'Publish New Vacancy Bulletin'}
            </h1>
            <p className="text-xs text-slate-400">Ensure the dates and application links match the official commissions pdf.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetForm}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm border ${confirmReset ? 'bg-rose-600 hover:bg-rose-750 text-white border-rose-600 animate-pulse' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 border-rose-100 dark:border-rose-900/40'}`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{confirmReset ? 'Click to Confirm Reset' : 'Reset / Write New Post'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* AI AUTO-FILL ASSISTANT PANEL */}
      <div className="card border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/50 via-white to-cyan-50/20 dark:from-indigo-950/10 dark:via-slate-900/40 dark:to-cyan-950/10 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setAiPanelOpen(!aiPanelOpen)}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                AI Post Generator & Auto-Fill Assistant
                <span className="badge bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5">Gemini 3.5 Flash</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fill all English & Hindi fields, important dates, eligibility, and matrices automatically using official sources.</p>
            </div>
          </div>
          <button type="button" className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {aiPanelOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {aiPanelOpen && (
          <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-4">
            
            {/* Source selector & Reset Form Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-2 p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg w-max">
                <button
                  type="button"
                  onClick={() => setAiSourceType('pdf')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${aiSourceType === 'pdf' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload PDF/Image/Screenshot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiSourceType('url')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${aiSourceType === 'url' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Scrape from URL (Job Portal)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetForm}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${confirmReset ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 animate-pulse' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 border-rose-100 dark:border-rose-900/40'}`}
                title="Clear all fields, summaries, links and uploaded documents to write a brand new post"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmReset ? 'Confirm Reset?' : 'Reset Form'}</span>
              </button>
            </div>

            {/* Input Form based on selection */}
            {aiSourceType === 'pdf' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-indigo-200/60 dark:border-indigo-900/40 rounded-xl p-6 text-center hover:bg-indigo-50/10 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAiFileUpload(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload or drag & drop</p>
                      <p className="text-[10px] text-slate-400">PDF, DOCX, or Screenshot (PNG/JPG) — Max 15MB</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Uploaded File Details
                    </h4>
                    {aiFile ? (
                      <div className="text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1 mt-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{aiFile.name}</p>
                        <p className="text-[10px] text-slate-400">Size: {(aiFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-2">No notification file uploaded yet.</p>
                    )}
                  </div>
                  
                  {aiExtractedText && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>{aiExtractedText.length} characters of raw text extracted successfully!</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label">Job Portal / Recruitment Website URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="e.g. https://ssc.gov.in/notifications/1234"
                      className="input focus:border-indigo-400 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleScrapeFromUrlAndPopulate}
                      disabled={aiLoading}
                      className="btn btn-primary h-[34px] px-4 font-bold text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 border-none"
                    >
                      {aiLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>Fetch</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">The server-side AI Agent will crawl the job portal URL, extract text patterns, and instantly populate the Post Title, Vacancy count, and Eligibility structures.</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      Job Portal URL Source Information
                    </h4>
                    {websiteUrl ? (
                      <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 break-all bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 mt-2">
                        {websiteUrl}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-2">Enter any recruitment or job portal URL link above and click 'Fetch'.</p>
                    )}
                  </div>

                  {aiExtractedText && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>{aiExtractedText.length} characters of HTML content scraped and analyzed successfully!</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Real-time Verification Report Panel */}
            {verificationResult && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950 rounded-lg text-indigo-500">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Real-Time AI Verification Report</h4>
                      <p className="text-[10px] text-slate-400">Authenticity analysis on scraped portal document text</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-400">Confidence:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      verificationResult.confidence_score >= 75 ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                      verificationResult.confidence_score >= 50 ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                      'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                    }`}>
                      {verificationResult.confidence_score}%
                    </span>
                    <span className={`badge ${
                      verificationResult.is_valid_recruitment ? 'badge-success' : 'badge-error'
                    }`}>
                      {verificationResult.is_valid_recruitment ? '✓ Verified Recruitment' : '✗ Low Confidence Content'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Real-time Verified Parameters</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${verificationResult.verified_fields.post_title ? 'text-emerald-500' : 'text-slate-300'}`} />
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Post Title</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${verificationResult.verified_fields.vacancy_count ? 'text-emerald-500' : 'text-slate-300'}`} />
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Vacancy Count</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${verificationResult.verified_fields.eligibility_criteria ? 'text-emerald-500' : 'text-slate-300'}`} />
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Eligibility</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${verificationResult.verified_fields.important_dates ? 'text-emerald-500' : 'text-slate-300'}`} />
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Important Dates</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Extraction Insight & Warnings</span>
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 rounded-lg h-[62px] overflow-y-auto leading-relaxed text-slate-600 dark:text-slate-400 text-[11px]">
                      {verificationResult.verification_summary}
                      {verificationResult.warning_message && (
                        <p className="text-rose-500 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span>{verificationResult.warning_message}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Common parameters: extracted text preview, instructions & prompt trigger */}
            {aiExtractedText && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-850 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Text preview */}
                  <div>
                    <label className="label flex items-center justify-between">
                      <span>Source Text Extract Preview (Read-only)</span>
                      <span className="text-[10px] font-mono text-slate-400">First 800 chars</span>
                    </label>
                    <textarea
                      readOnly
                      value={aiExtractedText.slice(0, 800) + (aiExtractedText.length > 800 ? '...' : '')}
                      rows={5}
                      className="textarea font-mono text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-slate-300 text-slate-500 cursor-not-allowed leading-relaxed"
                    />
                  </div>

                  {/* Additional Instruction Hints */}
                  <div className="space-y-2">
                    <label className="label">Custom AI Writing Guidelines / User Hints (Optional)</label>
                    <textarea
                      value={aiInstructions}
                      onChange={(e) => setAiInstructions(e.target.value)}
                      placeholder="e.g. 'Extract only general category fee details', 'Highlight age relaxation is 5 years for SC/ST', 'Only write summaries in Hindi and English'"
                      rows={4}
                      className="textarea focus:border-indigo-400 text-xs"
                    />
                    <p className="text-[10px] text-slate-400">Any custom hint entered here will directly influence the final Gemini output parameters.</p>
                  </div>
                </div>

                {/* Big Generation Action Button */}
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={handleAiGenerateBulletin}
                    disabled={aiLoading}
                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm px-8 py-3 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    <span>🚀 GENERATE BULLETIN WITH GEMINI AI</span>
                  </button>
                </div>
              </div>
            )}

            {/* Inline Notifications */}
            {aiLoading && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/60 dark:border-indigo-900/30 rounded-xl flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Processing with VedaTool Agent Core</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{aiStatusMessage}</p>
                </div>
              </div>
            )}

            {aiSuccessMessage && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">{aiSuccessMessage}</p>
              </div>
            )}

            {aiErrorMessage && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">{aiErrorMessage}</p>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Main Multi-field Form */}
      <form onSubmit={handleSavePost} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Panel: 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4 rounded-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-1">
              General Identity Information
            </h3>

            {/* Category selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Primary Folder Category</label>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="select focus:border-primary"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.title_en}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Live URL Slug / Page Handle</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. ssc-cgl-recruitment-2026"
                    className="input focus:border-primary font-mono text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="btn btn-secondary btn-icon py-1.5"
                    title="Generate from English Title"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Titles */}
            <div className="space-y-4">
              <div>
                <label className="label">English Display Title (Main Headline)</label>
                <input
                  type="text"
                  placeholder="e.g. SSC CGL Online Form 2026 for 17000+ Vacancies"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="input focus:border-primary font-bold"
                  required
                />
              </div>

              <div>
                <label className="label">Hindi Display Title <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. एसएससी सीजीएल ऑनलाइन आवेदन फॉर्म 2026"
                  value={titleHi}
                  onChange={(e) => setTitleHi(e.target.value)}
                  className="input focus:border-primary font-hindi"
                />
              </div>
            </div>

            {/* Department / Post Name / Vacancies */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="label">Recruitment Board/Dept.</label>
                <input
                  type="text"
                  placeholder="e.g. Staff Selection Commission"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="input focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="label">Job Designation/Post</label>
                <input
                  type="text"
                  placeholder="e.g. Multiple Gradate Posts"
                  value={postName}
                  onChange={(e) => setPostName(e.target.value)}
                  className="input focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="label">Total vacancies</label>
                <input
                  type="number"
                  placeholder="e.g. 17727"
                  value={vacancies || ''}
                  onChange={(e) => setVacancies(e.target.value ? Number(e.target.value) : undefined)}
                  className="input focus:border-primary"
                />
              </div>
            </div>

            <div className="w-1/2">
              <label className="label">Advertisement/Notification No.</label>
              <input
                type="text"
                placeholder="e.g. Advt No. 03/2026-CGL"
                value={advtNo}
                onChange={(e) => setAdvtNo(e.target.value)}
                className="input focus:border-primary"
              />
            </div>
          </div>

          {/* Section 2: Important Dates */}
          <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4 rounded-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-1">
              Important Calendar Dates
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="label">Start Applying</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="label">End Applying</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="label">Admit Card Date</label>
                <input
                  type="date"
                  value={admitCardDate}
                  onChange={(e) => setAdmitCardDate(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="label">Scheduled Exam</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="label">Result Date</label>
                <input
                  type="date"
                  value={resultDate}
                  onChange={(e) => setResultDate(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Rich Details / Bilingual HTML markup */}
          <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4 rounded-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tabbed Bilingual HTML Block
              </h3>
              <button
                type="button"
                onClick={handleLoadBoilerplateTemplate}
                className="btn btn-secondary btn-sm"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Load Boilerplate Fee & Eligibility Matrix</span>
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal">
              You can insert HTML layout tables, alerts, lists, and headings. This blocks renders inside the job details card as custom structures. Keep classes consistent with Tailwind e.g. <code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-rose-500">grid</code>, <code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-rose-500">card</code>, etc.
            </p>

            <div>
              <BilingualHtmlBlock
                value={bilingualHtml}
                onChange={setBilingualHtml}
                placeholder="Insert HTML table matrix, fee matrix, eligibility guidelines, age relaxation cards..."
              />
            </div>
          </div>

        </div>

        {/* Right Form Sidebar Panel */}
        <div className="space-y-6">
          
          {/* Action publishing status card */}
          <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4 rounded-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-1">
              Publish Settings
            </h3>

            <div>
              <label className="label">Status</label>
              <div className="flex gap-4 mt-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="accent-primary"
                  />
                  <span>Save Draft</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                    className="accent-primary"
                  />
                  <span className="text-emerald-600">Publish Live</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center h-10 font-bold"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Writing to database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Bulletin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Descriptive English/Hindi Paragraph summaries */}
          <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4 rounded-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-1">
              Short Paragraph Summaries
            </h3>

            <div>
              <label className="label">Short Intro Info (English)</label>
              <textarea
                value={shortInfoEn}
                onChange={(e) => setShortInfoEn(e.target.value)}
                placeholder="Enter short 2-3 sentence overview of this government vacancy..."
                rows={4}
                className="textarea focus:border-primary text-xs"
                required
              />
            </div>

            <div>
              <label className="label">Short Intro Info (Hindi) <span className="text-slate-400 font-normal">(Optional)</span></label>
              <textarea
                value={shortInfoHi}
                onChange={(e) => setShortInfoHi(e.target.value)}
                placeholder="हिंदी में संक्षिप्त विवरण दर्ज करें..."
                rows={4}
                className="textarea focus:border-primary text-xs font-hindi"
              />
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4 rounded-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-1">
              Important Action Links
            </h3>

            <div className="space-y-3">
              <div>
                <label className="label">Apply Online URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={applyLink}
                  onChange={(e) => setApplyLink(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="label">Official Advertisement PDF</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={notificationLink}
                    onChange={(e) => setNotificationLink(e.target.value)}
                    className="input focus:border-primary text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="btn btn-secondary btn-icon"
                    title="Upload PDF directly"
                  >
                    {uploadingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    ref={pdfInputRef}
                    onChange={handleSupabasePdfUpload}
                  />
                </div>
              </div>

              <div>
                <label className="label">Admit Card Download Link</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={admitCardLink}
                  onChange={(e) => setAdmitCardLink(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="label">Result Download Link</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={resultLink}
                  onChange={(e) => setResultLink(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="label">Commission Website</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={officialWebsite}
                  onChange={(e) => setOfficialWebsite(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="label">Official Logo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={officialLogoUrl}
                  onChange={(e) => setOfficialLogoUrl(e.target.value)}
                  className="input focus:border-primary text-xs"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                  Leave blank to automatically derive from the website or apply URL.
                </span>
              </div>
            </div>
          </div>

        </div>

      </form>

    </div>
  );
}
