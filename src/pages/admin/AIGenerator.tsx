import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, createPost } from '../../lib/supabase';
import { Category, Post } from '../../lib/types';
import { 
  Sparkles, Upload, FileText, CheckCircle2, RefreshCw, Eye, 
  ArrowRight, Info, Save, Trash2, FileCode, Check, AlertTriangle, 
  AlignLeft, ChevronLeft, ChevronRight, Copy, ExternalLink,
  Link, Play, Pause, XCircle, Clock, CheckSquare, ListPlus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BilingualHtmlBlock from '../../components/BilingualHtmlBlock';

interface BulkUrlTask {
  id: string;
  url: string;
  status: 'pending' | 'scraping' | 'generating' | 'saving' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  createdPostTitle?: string;
  createdPostId?: string;
}

export default function AIGenerator() {
  const navigate = useNavigate();

  // Panels States
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [rightTab, setRightTab] = useState<'source' | 'preview'>('source');

  // Tab mode within Left Panel
  const [leftTabMode, setLeftTabMode] = useState<'file' | 'bulkUrl'>('file');

  // Bulk URL Processing States
  const [bulkUrlsInput, setBulkUrlsInput] = useState<string>('');
  const [bulkTasks, setBulkTasks] = useState<BulkUrlTask[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState<boolean>(false);
  const [bulkInstructions, setBulkInstructions] = useState<string>(
    'Identify the main post title, application timelines, total vacancy count, and educational eligibility criteria.'
  );
  const [bulkLogs, setBulkLogs] = useState<string[]>([]);
  const cancelBulkRef = useRef<boolean>(false);

  // Core App States
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [parsedText, setParsedText] = useState<string>('');
  const [userInstructions, setUserInstructions] = useState<string>('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Generated Fields State
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [slug, setSlug] = useState('');
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

  // Summary descriptions
  const [shortInfoEn, setShortInfoEn] = useState('');
  const [shortInfoHi, setShortInfoHi] = useState('');
  const [bilingualHtml, setBilingualHtml] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetForm = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }

    // Reset all generated fields
    setTitleEn('');
    setTitleHi('');
    setSlug('');
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
    setShortInfoEn('');
    setShortInfoHi('');
    setBilingualHtml('');
    setStatus('draft');

    // Reset files/instructions/raw content
    setFile(null);
    setFileBase64(null);
    setParsedText('');
    setUserInstructions('');
    
    setConfirmReset(false);
    setSuccess('AI Content Desk successfully reset! Ready to parse and generate a new post.');
    setError(null);
  };

  // Load category list on mount
  useEffect(() => {
    async function initCategories() {
      try {
        const cats = await getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0].slug);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }

    // Load panels states from localStorage
    const savedState = localStorage.getItem('vedatool_generator_panels');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.leftCollapsed !== undefined) setLeftCollapsed(parsed.leftCollapsed);
        if (parsed.rightCollapsed !== undefined) setRightCollapsed(parsed.rightCollapsed);
      } catch (e) {
        console.error(e);
      }
    }

    initCategories();
  }, []);

  // Sync panels state to localStorage
  const handleToggleLeftPanel = () => {
    const nextVal = !leftCollapsed;
    setLeftCollapsed(nextVal);
    localStorage.setItem(
      'vedatool_generator_panels',
      JSON.stringify({ leftCollapsed: nextVal, rightCollapsed })
    );
  };

  const handleToggleRightPanel = () => {
    const nextVal = !rightCollapsed;
    setRightCollapsed(nextVal);
    localStorage.setItem(
      'vedatool_generator_panels',
      JSON.stringify({ leftCollapsed, rightCollapsed: nextVal })
    );
  };

  // Convert uploaded file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    loadSelectedFile(selectedFile);
  };

  const loadSelectedFile = (selectedFile: File) => {
    const validExtensions = ['.pdf', '.docx'];
    const lowerName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      setError('Unsupported file type. Please upload a valid PDF or DOCX notification.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        setFileBase64(base64String);

        // Send base64 to backend parser
        const fileType = lowerName.endsWith('.pdf') ? 'pdf' : 'docx';
        const res = await fetch('/api/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64String,
            fileName: selectedFile.name,
            fileType
          })
        });

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setParsedText(data.text || '');
        setSuccess(`Successfully parsed ${selectedFile.name}! Document source desk populated.`);
        
        // Auto-focus instructions
        setRightTab('source');
      } catch (err: any) {
        console.error(err);
        setError(`Failed to extract text: ${err.message || err}`);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      loadSelectedFile(droppedFile);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
    setFileBase64(null);
    setParsedText('');
    setSuccess(null);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setSuccess('PDF uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setError('Failed to upload PDF.');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Auto Generate Slug
  const handleGenerateSlug = () => {
    if (!titleEn) return;
    const formatted = titleEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setSlug(formatted);
  };

  // Call Gemini to analyze parsed notification text
  const handleGenerateBulletin = async () => {
    if (!parsedText) {
      setError('Please upload and parse a government recruitment notification first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/generate-bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: parsedText,
          userInstructions: userInstructions
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Populate form fields with extracted content
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

      // Autogenerate slug
      const formattedSlug = (data.title_en || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(formattedSlug);

      setSuccess('Gemini AI successfully processed the notification! Scroll the center editor to inspect extracted results.');
      setRightTab('preview'); // Switch right panel to live render
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gemini processing failed. Please check your API key and retry.');
    } finally {
      setLoading(false);
    }
  };

  // Save the complete bulletin to Supabase / Local Storage
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleEn || !postName || !department || !slug) {
      setError('Missing critical bulletin identifiers. Title, Post Name, Department, and Slug are mandatory.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const postData = {
      category_id: categories.find(c => c.slug === selectedCategory)?.id,
      category_slug: selectedCategory,
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
      short_info_en: shortInfoEn.trim(),
      short_info_hi: shortInfoHi.trim() || undefined,
      bilingual_html: bilingualHtml.trim(),
      status,
    };

    try {
      await createPost(postData);
      setSuccess('ResultVeda Vacancy Bulletin saved and registered successfully!');
      setTimeout(() => {
        navigate('/veda-admin-6721/posts');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err?.message || 'Database transaction error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize bulk tasks from textarea
  const handleInitBulkTasks = () => {
    if (!bulkUrlsInput.trim()) {
      setError('Please enter at least one valid URL.');
      return;
    }

    const lines = bulkUrlsInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      setError('No valid URLs found in the input.');
      return;
    }

    // Validate URLs basic structure
    const tasks: BulkUrlTask[] = lines.map((url, index) => {
      let targetUrl = url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      return {
        id: `task-${Date.now()}-${index}`,
        url: targetUrl,
        status: 'pending'
      };
    });

    setBulkTasks(tasks);
    setBulkLogs([`Initialized queue with ${tasks.length} URL tasks.`]);
    cancelBulkRef.current = false;
    setError(null);
    setSuccess(null);
  };

  // Run the queue
  const handleRunBulkQueue = async () => {
    if (bulkTasks.length === 0) return;
    
    setBulkProcessing(true);
    cancelBulkRef.current = false;
    setError(null);
    setSuccess(null);

    // Find the first task that is 'pending' or 'failed' or 'cancelled' to resume
    let startIndex = bulkTasks.findIndex(t => t.status === 'pending' || t.status === 'failed' || t.status === 'cancelled');
    if (startIndex === -1) {
      startIndex = 0;
    }

    // Clone tasks to update state
    const updatedTasks = [...bulkTasks];
    
    setBulkLogs(prev => [...prev, `Starting bulk scanner at task index ${startIndex + 1}...`]);

    for (let i = startIndex; i < updatedTasks.length; i++) {
      if (cancelBulkRef.current) {
        // Mark remaining tasks as cancelled if they are not already done/failed
        for (let j = i; j < updatedTasks.length; j++) {
          if (updatedTasks[j].status === 'pending') {
            updatedTasks[j].status = 'cancelled';
          }
        }
        setBulkTasks([...updatedTasks]);
        setBulkLogs(prev => [...prev, `⛔ Bulk processing task queue paused by user.`]);
        setBulkProcessing(false);
        return;
      }

      const task = updatedTasks[i];
      setBulkLogs(prev => [...prev, `\n[Task ${i + 1}/${updatedTasks.length}] Processing URL: ${task.url}`]);

      try {
        // 1. Scraping Phase
        task.status = 'scraping';
        setBulkTasks([...updatedTasks]);
        setBulkLogs(prev => [...prev, `   ↳ [Step 1] Crawling commission website markup...`]);

        const scrapeRes = await fetch('/api/scrape-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: task.url })
        });

        const scrapeContentType = scrapeRes.headers.get('content-type') || '';
        if (!scrapeRes.ok) {
          let errorMessage = `Scraping endpoint failed with status ${scrapeRes.status}`;
          
          if (scrapeContentType.includes('application/json')) {
            const errorData = await scrapeRes.json().catch(() => ({}));
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await scrapeRes.text().catch(() => '');
            if (text.includes('<!doctype') || text.includes('<!DOCTYPE')) {
              errorMessage = `Scraping server error (returned HTML instead of JSON). Status: ${scrapeRes.status}`;
            }
          }
          throw new Error(errorMessage);
        }

        if (!scrapeContentType.includes('application/json')) {
          const text = await scrapeRes.text().catch(() => '');
          if (text.includes('<!doctype') || text.includes('<!DOCTYPE')) {
            throw new Error(`Scraping server returned HTML instead of JSON. Check if the server is running correctly.`);
          }
          throw new Error(`Scraping server returned non-JSON response: ${text.slice(0, 100)}`);
        }

        const scrapeData = await scrapeRes.json();
        if (scrapeData.error) {
          throw new Error(scrapeData.error);
        }

        const rawText = scrapeData.text || '';
        if (!rawText.trim()) {
          throw new Error('No readable text content found on this portal page.');
        }

        setBulkLogs(prev => [...prev, `   ↳ [Step 1] Successfully scraped ${rawText.length} characters.`]);

        // 2. AI Generation Phase
        task.status = 'generating';
        setBulkTasks([...updatedTasks]);
        setBulkLogs(prev => [...prev, `   ↳ [Step 2] Sending crawled text to Gemini Flash for structuring...`]);

        const genRes = await fetch('/api/generate-bulletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentText: rawText,
            userInstructions: bulkInstructions,
            sourceUrl: task.url
          })
        });

        const genContentType = genRes.headers.get('content-type') || '';
        if (!genRes.ok) {
          let errorMessage = `AI generation endpoint failed with status ${genRes.status}`;
          
          if (genContentType.includes('application/json')) {
            const errorData = await genRes.json().catch(() => ({}));
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await genRes.text().catch(() => '');
            if (text.includes('<!doctype') || text.includes('<!DOCTYPE')) {
              errorMessage = `AI generation server error (HTML returned). Status: ${genRes.status}`;
            }
          }
          throw new Error(errorMessage);
        }

        if (!genContentType.includes('application/json')) {
          const text = await genRes.text().catch(() => '');
          throw new Error(`AI generation server returned non-JSON response (possibly HTML).`);
        }

        const genData = await genRes.json();
        if (genData.error) {
          throw new Error(genData.error);
        }

        setBulkLogs(prev => [...prev, `   ↳ [Step 2] AI extraction complete! Job title: "${genData.title_en || 'Untitled'}"`]);

        // 3. Database Insertion Phase
        task.status = 'saving';
        setBulkTasks([...updatedTasks]);
        setBulkLogs(prev => [...prev, `   ↳ [Step 3] Storing styled job bulletin to database as draft...`]);

        // Auto format slug
        const taskSlug = (genData.title_en || `bulk-draft-${Date.now()}-${i}`)
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');

        const postData = {
          category_id: categories.find(c => c.slug === selectedCategory)?.id,
          category_slug: selectedCategory,
          slug: taskSlug,
          title_en: genData.title_en || `Draft Bulletin from URL`,
          title_hi: genData.title_hi || '',
          post_name: genData.post_name || 'Recruitment Notice',
          department: genData.department || 'Government Recruitment',
          advt_no: genData.advt_no || '',
          vacancies: genData.vacancies ? Number(genData.vacancies) : undefined,
          start_date: genData.start_date || undefined,
          end_date: genData.end_date || undefined,
          admit_card_date: genData.admit_card_date || undefined,
          exam_date: genData.exam_date || undefined,
          result_date: genData.result_date || undefined,
          apply_link: genData.apply_link || task.url,
          notification_link: genData.notification_link || task.url,
          admit_card_link: genData.admit_card_link || undefined,
          result_link: genData.result_link || undefined,
          official_website: genData.official_website || undefined,
          short_info_en: genData.short_info_en || 'Draft automatically generated from portal URL scraping.',
          short_info_hi: genData.short_info_hi || '',
          bilingual_html: genData.bilingual_html || `<p>Draft automatically generated from scraped page content: <a href="${task.url}" target="_blank">${task.url}</a></p>`,
          status: 'draft' as const,
          state: genData.state || [],
          eligibility: genData.eligibility_criteria || {},
          tags: [...(genData.tags || []), genData.level ? `level:${genData.level}` : 'level:National'],
        };

        const createdPost = await createPost(postData);

        task.status = 'completed';
        task.createdPostTitle = postData.title_en;
        task.createdPostId = createdPost?.id || `draft-${taskSlug}`;
        setBulkTasks([...updatedTasks]);
        setBulkLogs(prev => [...prev, `   ↳ [Step 3] Draft saved successfully! Post slug: ${taskSlug}`]);

      } catch (err: any) {
        console.error(`Bulk URL failed at index ${i}:`, err);
        task.status = 'failed';
        task.error = err.message || 'Unknown processing error';
        setBulkTasks([...updatedTasks]);
        setBulkLogs(prev => [...prev, `   ❌ [Failed] Error: ${task.error}`]);
      }
    }

    setBulkProcessing(false);
    setBulkLogs(prev => [...prev, `\n✅ Queue processing completed! Check your Posts dashboard for generated drafts.`]);
    setSuccess('Multi-URL queue processing finished successfully! All extracted pages have been drafted.');
  };

  const handleCancelBulkProcess = () => {
    cancelBulkRef.current = true;
    setBulkLogs(prev => [...prev, `🛑 Cancellation requested... Waiting for current task to complete/stop.`]);
  };

  const handleResetBulkQueue = () => {
    setBulkTasks([]);
    setBulkUrlsInput('');
    setBulkLogs([]);
    setBulkProcessing(false);
    cancelBulkRef.current = false;
    setError(null);
    setSuccess(null);
  };

  // Helper copy content action
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied HTML markup directly to clipboard!');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden w-full h-full">
      
      {/* 3-Panel Tool Workspace Header */}
      <div className="workspace-modebar">
        <div className="workspace-modebar-left">
          <span className="workspace-mode-badge flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
            AI Content Desk
          </span>
          <span className="workspace-id">v3.0</span>
          <h1 className="workspace-name text-slate-800 dark:text-white font-bold text-sm">
            AI-Driven ResultVeda Notification Digitizer
          </h1>
        </div>

        <div className="workspace-modebar-actions">
          {parsedText && (
            <button
              onClick={handleGenerateBulletin}
              disabled={loading}
              className="btn btn-ghost text-xs flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Regenerate AI</span>
            </button>
          )}

          <button
            onClick={handleSavePost}
            disabled={loading || !titleEn}
            className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Bulletin</span>
          </button>
        </div>
      </div>

      {/* Notifications & Success Banners */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-4 mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* THREE PANEL WORKSPACE BODY */}
      <div className="flex flex-1 overflow-hidden mt-2">
        
        {/* ================= LEFT PANEL: FILE UPLOAD & BULK URL DESK ================= */}
        <aside className={`panel-left flex flex-col ${leftCollapsed ? 'collapsed' : ''}`}>
          <div className="panel-left-header">
            {!leftCollapsed && <span className="panel-left-title">AI Content Desk</span>}
            <button 
              onClick={handleToggleLeftPanel}
              className="panel-collapse-btn"
              title={leftCollapsed ? "Expand left desk" : "Collapse left desk"}
            >
              {leftCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {!leftCollapsed && (
            <>
              {/* Tab Selector */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setLeftTabMode('file')}
                  className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                    leftTabMode === 'file'
                      ? 'border-indigo-500 text-indigo-500'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📄 File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTabMode('bulkUrl')}
                  className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                    leftTabMode === 'bulkUrl'
                      ? 'border-indigo-500 text-indigo-500'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🔗 Multi-URL Queue
                </button>
              </div>

              {leftTabMode === 'file' ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Upload official recruitment PDF or Word notification. The system will extract the raw text and parse it into structured databases.
                  </p>

                  {/* Upload Drop Zone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`dropzone cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${
                      file ? 'border-emerald-200 bg-emerald-50/10 dark:border-emerald-900/20' : 'border-slate-200 hover:border-indigo-400 dark:border-slate-800'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".pdf,.docx" 
                    />
                    
                    {parsing ? (
                      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                    ) : file ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
                    )}

                    <span className="dropzone-title text-xs font-bold text-slate-700 dark:text-slate-300">
                      {parsing ? 'Parsing Text...' : file ? 'Document Ready' : 'Upload Commission PDF'}
                    </span>
                    
                    <span className="dropzone-sub text-[9px] text-slate-400 mt-1">
                      {file ? file.name : 'Supports PDF & DOCX up to 10MB'}
                    </span>
                  </div>

                  {/* File details & control */}
                  {file && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs">
                      <div className="flex items-center gap-1.5 min-width-0">
                        <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span className="truncate font-mono font-medium max-w-[120px] text-[10px] text-slate-600 dark:text-slate-300">
                          {file.name}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={clearFile}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-rose-500"
                        title="Remove File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* AI Guidance Notes / Specific User hints */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      AI Guidance Instructions
                    </label>
                    <textarea
                      value={userInstructions}
                      onChange={(e) => setUserInstructions(e.target.value)}
                      placeholder="e.g. Only extract Graduate Level vacancy codes. Add specific heights eligibility rules for defense police..."
                      rows={4}
                      className="textarea text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                    />
                  </div>

                  {/* Generate Trigger Button */}
                  <button
                    type="button"
                    onClick={handleGenerateBulletin}
                    disabled={loading || parsing || !parsedText}
                    className="btn btn-primary w-full justify-center h-10 font-bold flex items-center gap-2 text-xs"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing Notification...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Generate Structured Bulletin</span>
                      </>
                    )}
                  </button>

                  {parsedText && (
                    <div className="p-3 bg-indigo-50/20 border border-indigo-100/10 dark:bg-indigo-950/10 dark:border-indigo-900/10 rounded-xl text-[10px] text-slate-500 leading-normal flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span>
                        Text extracted. Click above button to prompt Gemini 3.5 Flash into populating your bulletin forms.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col h-full">
                  {bulkTasks.length === 0 ? (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Batch process multiple web portal or recruitment links. Enter one URL per line. The AI will scrape, write posts and register drafts in the background.
                      </p>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Select Target Category
                        </label>
                        <select
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="select border-slate-200 dark:border-slate-800 text-xs py-1.5 h-auto"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>{cat.title_en}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 flex flex-col min-h-[150px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Recruitment Portal URLs (One per line)
                        </label>
                        <textarea
                          value={bulkUrlsInput}
                          onChange={(e) => setBulkUrlsInput(e.target.value)}
                          placeholder="https://example.com/notification-1&#10;https://example.com/notification-2"
                          className="textarea flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 font-mono resize-none p-3"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          AI Extraction Instructions
                        </label>
                        <textarea
                          value={bulkInstructions}
                          onChange={(e) => setBulkInstructions(e.target.value)}
                          placeholder="e.g. Focus on vacancy count and qualification details..."
                          rows={3}
                          className="textarea text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleInitBulkTasks}
                        className="btn btn-primary w-full justify-center h-10 font-bold flex items-center gap-1.5 text-xs shrink-0 mt-auto"
                      >
                        <ListPlus className="w-4 h-4" />
                        <span>Initialize Bulk Task Queue</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1 flex flex-col overflow-hidden h-full">
                      {/* Queue Header & Stats */}
                      <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-2 shrink-0">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>BULK TASK SCANNER</span>
                          <span className={`${bulkProcessing ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`}>
                            {bulkProcessing ? '● ACTIVE' : '■ PAUSED'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="progress-bar-wrap">
                            <div 
                              className="progress-bar-fill"
                              style={{ 
                                width: `${(bulkTasks.filter(t => t.status === 'completed').length / bulkTasks.length) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400">
                            <span>{bulkTasks.filter(t => t.status === 'completed').length} of {bulkTasks.length} Done</span>
                            <span>{Math.round((bulkTasks.filter(t => t.status === 'completed').length / bulkTasks.length) * 100)}%</span>
                          </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                          <div className="p-1 bg-white dark:bg-slate-800 rounded">
                            <div className="text-[9px] text-slate-400 font-medium">Tasks</div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{bulkTasks.length}</div>
                          </div>
                          <div className="p-1 bg-emerald-50 dark:bg-emerald-950/20 rounded">
                            <div className="text-[9px] text-emerald-600 font-medium">Done</div>
                            <div className="text-xs font-bold text-emerald-600">{bulkTasks.filter(t => t.status === 'completed').length}</div>
                          </div>
                          <div className="p-1 bg-rose-50 dark:bg-rose-950/20 rounded">
                            <div className="text-[9px] text-rose-600 font-medium">Fail</div>
                            <div className="text-xs font-bold text-rose-600">{bulkTasks.filter(t => t.status === 'failed').length}</div>
                          </div>
                          <div className="p-1 bg-amber-50 dark:bg-amber-950/20 rounded">
                            <div className="text-[9px] text-amber-600 font-medium">Pend</div>
                            <div className="text-xs font-bold text-amber-600">{bulkTasks.filter(t => t.status === 'pending' || t.status === 'cancelled').length}</div>
                          </div>
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex gap-2 shrink-0">
                        {bulkProcessing ? (
                          <button
                            type="button"
                            onClick={handleCancelBulkProcess}
                            className="btn btn-danger flex-1 justify-center py-1.5 text-xs font-bold flex items-center gap-1.5"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Scanner</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRunBulkQueue}
                            className="btn btn-primary flex-1 justify-center py-1.5 text-xs font-bold flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start / Resume</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleResetBulkQueue}
                          disabled={bulkProcessing}
                          className="btn btn-secondary py-1.5 text-xs font-bold hover:text-rose-500"
                          title="Reset and start fresh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Active Tasks Queue List */}
                      <div className="flex-1 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-2 space-y-2 max-h-[220px]">
                        {bulkTasks.map((task, idx) => (
                          <div key={task.id} className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-lg space-y-1.5">
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-bold text-slate-400 font-mono block">TASK #{idx+1}</span>
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono truncate block hover:underline" title={task.url}>
                                  {task.url}
                                </span>
                              </div>
                              <span className="shrink-0">
                                {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                {task.status === 'failed' && <XCircle className="w-4 h-4 text-rose-500" />}
                                {task.status === 'pending' && <Clock className="w-4 h-4 text-slate-300" />}
                                {task.status === 'cancelled' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                {['scraping', 'generating', 'saving'].includes(task.status) && (
                                  <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                                )}
                              </span>
                            </div>

                            {/* Task Status Meta */}
                            <div className="flex justify-between text-[9px] text-slate-400 items-center">
                              <span className="uppercase font-bold text-[8px] px-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 font-mono">
                                {task.status}
                              </span>
                              {task.createdPostId && (
                                <span className="text-indigo-500 hover:underline cursor-pointer flex items-center gap-0.5 font-bold" onClick={() => navigate('/veda-admin-6721/posts')}>
                                  Created Draft <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>

                            {task.error && (
                              <p className="text-[9px] text-rose-500 leading-normal bg-rose-50/50 dark:bg-rose-950/10 p-1.5 rounded border border-rose-100/50 dark:border-rose-900/10 break-all font-mono">
                                {task.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Realtime Status Logger */}
                      <div className="h-[120px] bg-slate-950 text-slate-300 rounded-xl p-2.5 font-mono text-[9px] overflow-y-auto border border-slate-800 flex flex-col gap-1 select-text shrink-0">
                        <div className="text-slate-500 border-b border-slate-900 pb-1 font-bold flex justify-between">
                          <span>SYSTEM REALTIME LOGS</span>
                          <span className="animate-pulse text-emerald-500">● LIVE</span>
                        </div>
                        {bulkLogs.map((log, i) => (
                          <div key={i} className="whitespace-pre-wrap leading-relaxed text-slate-400">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </aside>

         {/* ================= CENTER PANEL: BILINGUAL SCHEMAS EDITOR ================= */}
        <section className="panel-center flex flex-col flex-1 overflow-hidden">
          <div className="panel-center-header flex items-center justify-between px-4 h-[44px] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                CMS Interactive Form Workdesk
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                ({titleEn ? 'Form Populated' : 'Awaiting Notification Digitization'})
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleResetForm}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${confirmReset ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 animate-pulse' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 border-rose-100 dark:border-rose-900/40'}`}
              title="Clear all fields and generated details to start fresh"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmReset ? 'Confirm Reset?' : 'Reset Form'}</span>
            </button>
          </div>

          <div className="panel-center-body flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
            {!titleEn && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-full text-indigo-500 animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    CMS Workspace Empty
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-normal">
                    Please upload an official commission PDF/DOCX notification on the Left Desk and trigger AI Extraction to generate styled bulletin schemas.
                  </p>
                </div>
              </div>
            )}

            {loading && !titleEn && (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                <div>
                  <span className="text-sm font-bold text-indigo-500 uppercase tracking-tight">Gemini 3.5 Flash Digitizing Notification...</span>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm leading-normal">
                    We are reading the multi-page notification text, extracting fees, criteria age bounds, schedules, and converting them to bilingual structures.
                  </p>
                </div>
              </div>
            )}

            {(titleEn || loading) && (
              <form onSubmit={handleSavePost} className="space-y-6">
                {/* Block 1: Identifiers */}
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4 rounded-xl">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    1. Identity Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Primary Folder Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="select border-slate-200 dark:border-slate-800"
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
                          className="input font-mono text-xs border-slate-200 dark:border-slate-800"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleGenerateSlug}
                          className="btn btn-secondary btn-icon"
                          title="Generate from English Title"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="label">English Display Title (Headline)</label>
                      <input
                        type="text"
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                        className="input font-bold border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                        placeholder="e.g. SSC CGL Online Form 2026 for 17000+ Vacancies"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Hindi Display Title (Optional)</label>
                      <input
                        type="text"
                        value={titleHi}
                        onChange={(e) => setTitleHi(e.target.value)}
                        className="input font-hindi border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                        placeholder="e.g. एसएससी सीजीएल ऑनलाइन आवेदन फॉर्म 2026"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="label">Recruitment Board/Dept.</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="input border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                        placeholder="e.g. Staff Selection Commission"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Job Designation/Post Name</label>
                      <input
                        type="text"
                        value={postName}
                        onChange={(e) => setPostName(e.target.value)}
                        className="input border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                        placeholder="e.g. Multiple Graduate Posts"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Total Vacancies</label>
                      <input
                        type="number"
                        value={vacancies || ''}
                        onChange={(e) => setVacancies(e.target.value ? Number(e.target.value) : undefined)}
                        className="input border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                        placeholder="e.g. 17727"
                      />
                    </div>
                  </div>

                  <div className="w-1/2">
                    <label className="label">Advertisement/Notification No.</label>
                    <input
                      type="text"
                      value={advtNo}
                      onChange={(e) => setAdvtNo(e.target.value)}
                      className="input border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                      placeholder="e.g. Advt No. 03/2026-CGL"
                    />
                  </div>
                </div>

                {/* Block 2: Dates */}
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4 rounded-xl">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    2. Important Calendar Dates (YYYY-MM-DD)
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="label text-[11px]">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input text-xs border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="label text-[11px]">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input text-xs border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="label text-[11px]">Admit Card</label>
                      <input
                        type="date"
                        value={admitCardDate}
                        onChange={(e) => setAdmitCardDate(e.target.value)}
                        className="input text-xs border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="label text-[11px]">Exam Date</label>
                      <input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="input text-xs border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="label text-[11px]">Result Date</label>
                      <input
                        type="date"
                        value={resultDate}
                        onChange={(e) => setResultDate(e.target.value)}
                        className="input text-xs border-slate-200 dark:border-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Block 3: Bilingual Summary Paragraphs */}
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4 rounded-xl">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    3. Overview Descriptive Summaries
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Short Intro Info (English)</label>
                      <textarea
                        value={shortInfoEn}
                        onChange={(e) => setShortInfoEn(e.target.value)}
                        rows={4}
                        className="textarea text-xs border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                        placeholder="Brief overview in English..."
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Short Intro Info (Hindi)</label>
                      <textarea
                        value={shortInfoHi}
                        onChange={(e) => setShortInfoHi(e.target.value)}
                        rows={4}
                        className="textarea text-xs font-hindi border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                        placeholder="हिंदी में संक्षिप्त विवरण..."
                      />
                    </div>
                  </div>
                </div>

                {/* Block 4: Official Action Links */}
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4 rounded-xl">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    4. Official Links
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Apply Online Link</label>
                      <input
                        type="url"
                        value={applyLink}
                        onChange={(e) => setApplyLink(e.target.value)}
                        className="input text-xs border-slate-200 dark:border-slate-800"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="label">Official Advertisement PDF</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={notificationLink}
                          onChange={(e) => setNotificationLink(e.target.value)}
                          className="input text-xs border-slate-200 dark:border-slate-800"
                          placeholder="https://..."
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
                          onChange={handlePdfUpload}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Commission website</label>
                      <input
                        type="url"
                        value={officialWebsite}
                        onChange={(e) => setOfficialWebsite(e.target.value)}
                        className="input text-xs border-slate-200 dark:border-slate-800"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Admit Card Link (Optional)</label>
                      <input
                        type="url"
                        value={admitCardLink}
                        onChange={(e) => setAdmitCardLink(e.target.value)}
                        className="input text-xs border-slate-200 dark:border-slate-800"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="label">Result Link (Optional)</label>
                      <input
                        type="url"
                        value={resultLink}
                        onChange={(e) => setResultLink(e.target.value)}
                        className="input text-xs border-slate-200 dark:border-slate-800"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Block 5: Tabbed Bilingual HTML markup */}
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4 rounded-xl">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      5. Tabbed Bilingual HTML Block
                    </h4>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    This block will render inside the job card on the live public portal. You can manually tweak the qualifications, fees, or table column details below.
                  </p>

                  <BilingualHtmlBlock
                    value={bilingualHtml}
                    onChange={setBilingualHtml}
                    placeholder="Insert HTML table matrix, fee matrix, eligibility guidelines, age relaxation cards..."
                  />
                </div>

                {/* Block 6: Save & Status Controls */}
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl">
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Publish Settings:
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={status === 'draft'}
                          onChange={() => setStatus('draft')}
                          className="accent-indigo-600"
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
                          className="accent-indigo-600"
                        />
                        <span className="text-emerald-600">Publish Live</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary px-8 h-10 font-bold text-xs"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Bulletin...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 animate-pulse" />
                        <span>Save and Register Bulletin</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ================= RIGHT PANEL: SOURCE DESK & LIVE RENDER ================= */}
        <aside className={`panel-right flex flex-col ${rightCollapsed ? 'collapsed' : ''}`}>
          <div className="panel-right-header">
            {!rightCollapsed ? (
              <div className="flex items-center gap-1.5 border-b-0">
                <button
                  onClick={() => setRightTab('source')}
                  className={`px-2 py-1 text-[11px] font-bold rounded uppercase tracking-wider transition-colors ${
                    rightTab === 'source' ? 'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Source Document
                </button>
                <button
                  onClick={() => setRightTab('preview')}
                  className={`px-2 py-1 text-[11px] font-bold rounded uppercase tracking-wider transition-colors ${
                    rightTab === 'preview' ? 'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Live Render Preview
                </button>
              </div>
            ) : null}
            
            <button 
              onClick={handleToggleRightPanel}
              className="panel-collapse-btn"
              title={rightCollapsed ? "Expand preview desk" : "Collapse preview desk"}
            >
              {rightCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {!rightCollapsed && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/40">
              
              {/* Tab 1: Source Raw Document Text */}
              {rightTab === 'source' && (
                <div className="h-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Extracted notification text
                    </span>
                    {parsedText && (
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                        {parsedText.length} Chars
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-3 overflow-y-auto max-h-[500px]">
                    {parsedText ? (
                      <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed select-text selection:bg-indigo-200">
                        {parsedText}
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-20 text-center text-slate-400 text-xs">
                        <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                        <span>Awaiting Document Upload...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Live HTML rendered visual layout */}
              {rightTab === 'preview' && (
                <div className="h-full flex flex-col space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Portal Real-time Visual Matrix
                  </span>
                  
                  <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-4 overflow-y-auto max-h-[500px]">
                    {bilingualHtml ? (
                      <div className="space-y-6">
                        {/* Title English Header simulator */}
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                          <span className="text-[9px] font-mono text-indigo-500 uppercase font-bold">Simulator Page View</span>
                          <h2 className="text-sm font-black text-slate-800 dark:text-white leading-snug mt-1">
                            {titleEn}
                          </h2>
                          {titleHi && (
                            <h3 className="text-xs font-hindi text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                              {titleHi}
                            </h3>
                          )}
                          <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
                            <span><strong>Board:</strong> {department}</span>
                            <span><strong>Post Name:</strong> {postName}</span>
                          </div>
                        </div>

                        {/* Renders bilingualHtml */}
                        <div 
                          className="space-y-4 text-xs font-sans"
                          dangerouslySetInnerHTML={{ __html: bilingualHtml }}
                        />
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-20 text-center text-slate-400 text-xs">
                        <Eye className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <span>Awaiting AI Form Generation...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
