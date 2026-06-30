import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, Square, RefreshCw, Trash2, RotateCcw, CheckCircle2, 
  XCircle, Clock, Loader2, Globe, ArrowLeft, Plus
} from 'lucide-react';

interface QueueTask {
  id: string;
  url: string;
  status: 'pending' | 'scraping' | 'generating' | 'saving' | 'completed' | 'failed';
  error?: string;
  createdPostId?: string;
  createdPostTitle?: string;
  currentStep?: string;
  scrapedTextPreview?: string;
  scrapedTextLength?: number;
  generatedFields?: {
    title_en?: string;
    department?: string;
    vacancies?: number;
    advt_no?: string;
    start_date?: string;
    end_date?: string;
    apply_link?: string;
    notification_link?: string;
    official_website?: string;
    short_info_en?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface QueueStatus {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  isProcessing: boolean;
  lastUpdated: string;
  tasks: QueueTask[];
}

export default function BulkQueue() {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [urlsInput, setUrlsInput] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/queue/status');
      const data = await res.json();
      setStatus(data);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleAddUrls = async () => {
    const urls = urlsInput.split('\n').map(u => u.trim()).filter(u => u.length > 5);
    if (urls.length === 0) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, instructions })
      });
      const data = await res.json();
      setMessage(`✅ ${data.added} URLs added! Processing started in background.`);
      setUrlsInput('');
      fetchStatus();
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async (type: string) => {
    await fetch('/api/queue/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearType: type })
    });
    fetchStatus();
  };

  const handleRetryFailed = async () => {
    await fetch('/api/queue/retry-failed', { method: 'POST' });
    fetchStatus();
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'pending': return <Clock className="w-3.5 h-3.5 text-slate-400" />;
      case 'scraping': return <Globe className="w-3.5 h-3.5 text-blue-500 animate-pulse" />;
      case 'generating': return <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />;
      case 'saving': return <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'pending': return 'Queued';
      case 'scraping': return 'Scraping...';
      case 'generating': return 'AI Writing...';
      case 'saving': return 'Saving...';
      case 'completed': return 'Done';
      case 'failed': return 'Failed';
      default: return s;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/veda-admin-6721" className="btn btn-secondary btn-icon p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Background URL Queue</h1>
            <p className="text-xs text-slate-500">Add URLs → Server processes in background → Posts saved as drafts</p>
          </div>
        </div>
        {status?.isProcessing && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing...
          </span>
        )}
      </div>

      {/* Stats */}
      {status && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{status.total}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{status.pending}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Pending</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{status.processing}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Active</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{status.completed}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Done</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{status.failed}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Failed</div>
          </div>
        </div>
      )}

      {/* Add URLs */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Add URLs to Queue
        </h2>
        <textarea
          value={urlsInput}
          onChange={(e) => setUrlsInput(e.target.value)}
          placeholder="Paste URLs here (one per line)&#10;https://www.sarkariresult.com/railway/rrb-technician-cen-02-2026/&#10;https://www.sarkariresult.com/govt/isro-scientist-2026/&#10;..."
          rows={5}
          className="textarea text-xs font-mono"
        />
        <input
          type="text"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Optional instructions for AI (e.g., 'Focus on eligibility details')"
          className="input text-xs"
        />
        <div className="flex gap-2">
          <button onClick={handleAddUrls} disabled={loading || !urlsInput.trim()} className="btn btn-primary text-xs flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" />
            {loading ? 'Adding...' : 'Add & Start Processing'}
          </button>
          <button onClick={() => handleClear('completed')} className="btn btn-secondary text-xs flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            Clear Done
          </button>
          <button onClick={handleRetryFailed} className="btn btn-secondary text-xs flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Failed
          </button>
        </div>
        {message && <p className="text-xs font-semibold text-emerald-600">{message}</p>}
      </div>

      {/* Task List */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider">Queue Tasks</h3>
          <button onClick={fetchStatus} className="text-xs text-primary hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
          {status?.tasks.slice().reverse().map(task => (
            <div key={task.id} className="px-4 py-3 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b last:border-b-0">
              <div className="flex items-start gap-3">
                {getStatusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{task.url}</p>
                  {task.currentStep && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{task.currentStep}</p>
                  )}
                  {task.createdPostTitle && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">→ {task.createdPostTitle}</p>
                  )}
                  {task.error && (
                    <p className="text-[10px] text-red-500 mt-0.5">{task.error}</p>
                  )}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  task.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' :
                  task.status === 'failed' ? 'bg-red-50 text-red-600 dark:bg-red-950/30' :
                  task.status === 'pending' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' :
                  'bg-blue-50 text-blue-600 dark:bg-blue-950/30'
                }`}>
                  {getStatusLabel(task.status)}
                </span>
              </div>

              {task.scrapedTextLength && (
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Scraped size: {task.scrapedTextLength.toLocaleString()} chars</span>
                  <span>Updated: {new Date(task.updatedAt).toLocaleString()}</span>
                </div>
              )}

              {task.scrapedTextPreview && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-[10px] text-slate-600 dark:text-slate-300 font-mono overflow-x-auto">
                  {task.scrapedTextPreview}{task.scrapedTextLength && task.scrapedTextPreview.length < task.scrapedTextLength ? '...' : ''}
                </div>
              )}

              {task.generatedFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                  {task.generatedFields.title_en && <div><strong className="text-slate-700 dark:text-slate-200">Title:</strong> {task.generatedFields.title_en}</div>}
                  {task.generatedFields.department && <div><strong className="text-slate-700 dark:text-slate-200">Department:</strong> {task.generatedFields.department}</div>}
                  {typeof task.generatedFields.vacancies === 'number' && <div><strong className="text-slate-700 dark:text-slate-200">Vacancies:</strong> {task.generatedFields.vacancies}</div>}
                  {task.generatedFields.advt_no && <div><strong className="text-slate-700 dark:text-slate-200">Advt No:</strong> {task.generatedFields.advt_no}</div>}
                  {task.generatedFields.start_date && <div><strong className="text-slate-700 dark:text-slate-200">Start:</strong> {task.generatedFields.start_date}</div>}
                  {task.generatedFields.end_date && <div><strong className="text-slate-700 dark:text-slate-200">End:</strong> {task.generatedFields.end_date}</div>}
                  {task.generatedFields.apply_link && <div><strong className="text-slate-700 dark:text-slate-200">Apply:</strong> {task.generatedFields.apply_link}</div>}
                  {task.generatedFields.notification_link && <div><strong className="text-slate-700 dark:text-slate-200">Notification:</strong> {task.generatedFields.notification_link}</div>}
                </div>
              )}
            </div>
          ))}
          {(!status?.tasks || status.tasks.length === 0) && (
            <div className="px-4 py-8 text-center text-xs text-slate-400">
              No tasks in queue. Add URLs above to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
