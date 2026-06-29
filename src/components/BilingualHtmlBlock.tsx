import React, { useState, useRef } from 'react';
import { Eye, Code, Copy, Check, FileText, Calendar, DollarSign, Award, HelpCircle } from 'lucide-react';

interface BilingualHtmlBlockProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function BilingualHtmlBlock({
  value,
  onChange,
  placeholder = "Insert HTML here...",
  rows = 14
}: BilingualHtmlBlockProps) {
  const [activeTab, setActiveTab] = useState<'normal' | 'code'>('normal');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertSnippet = (snippetType: 'fees' | 'dates' | 'eligibility' | 'banner') => {
    let snippet = '';

    if (snippetType === 'fees') {
      snippet = `<!-- APPLICATON FEE TABLE -->
<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm my-4">
  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
    <thead className="bg-slate-50 dark:bg-slate-950">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reservation Category / वर्ग</th>
        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Application Fee / शुल्क</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
      <tr>
        <td className="px-4 py-3 font-medium">General / OBC / EWS (सामान्य / अन्य पिछड़ा वर्ग)</td>
        <td className="px-4 py-3 text-right font-bold text-indigo-600">₹750.00</td>
      </tr>
      <tr>
        <td className="px-4 py-3 font-medium">SC / ST / Physical Handicapped (अनुसूचित जाति / जनजाति / दिव्यांग)</td>
        <td className="px-4 py-3 text-right font-bold text-indigo-600">₹150.00</td>
      </tr>
      <tr>
        <td className="px-4 py-3 font-medium">Female Candidates (All Categories) / महिला उम्मीदवार</td>
        <td className="px-4 py-3 text-right font-bold text-indigo-600">₹0.00 (Exempted)</td>
      </tr>
    </tbody>
  </table>
</div>`;
    } else if (snippetType === 'dates') {
      snippet = `<!-- IMPORTANT TIMELINE -->
<div className="my-4 p-5 bg-gradient-to-r from-indigo-50/40 to-cyan-50/20 dark:from-indigo-950/20 dark:to-cyan-950/10 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/40 space-y-3.5">
  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
    <span>📅 Key Recruitment Schedule / महत्वपूर्ण तिथियां</span>
  </h4>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Registration Opens / प्रारंभ तिथि</p>
      <p className="font-extrabold text-slate-800 dark:text-white mt-1">July 01, 2026</p>
    </div>
    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Submission Deadline / अंतिम तिथि</p>
      <p className="font-extrabold text-rose-600 dark:text-rose-400 mt-1">July 31, 2026</p>
    </div>
  </div>
</div>`;
    } else if (snippetType === 'eligibility') {
      snippet = `<!-- ELIGIBILITY CONDITIONS -->
<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm my-4">
  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
    <thead className="bg-slate-50 dark:bg-slate-950">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Designation / पद का नाम</th>
        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Required Qualifications / शैक्षणिक योग्यता</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
      <tr>
        <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">Assistant Engineer (AE)</td>
        <td className="px-4 py-3 leading-relaxed">
          <strong>B.E. / B.Tech</strong> Degree in Civil / Mechanical / Electrical Engineering from any recognized university with minimum 60% marks.
        </td>
      </tr>
      <tr>
        <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">Junior Draftsman</td>
        <td className="px-4 py-3 leading-relaxed">
          <strong>Diploma in Architecture</strong> or Draftsmanship from recognized technical board with 2 years of active workflow experience.
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
    } else if (snippetType === 'banner') {
      snippet = `<!-- ADVISORY INFO BANNER -->
<div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl my-4 text-xs text-amber-800 dark:text-amber-400 leading-relaxed flex gap-3">
  <span className="text-lg">⚠️</span>
  <div>
    <p className="font-bold">Important Notice / महत्वपूर्ण सूचना:</p>
    <p className="mt-1">Candidates must satisfy age eligibility conditions as of August 01, 2026. Age relaxations of 5 years apply to SC/ST and 3 years for OBC candidates under state reservation codes.</p>
  </div>
</div>`;
    }

    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const text = value;
      const newValue = text.substring(0, startPos) + snippet + text.substring(endPos, text.length);
      onChange(newValue);
      
      // Reset cursor position to right after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = startPos + snippet.length;
        textarea.selectionEnd = startPos + snippet.length;
      }, 50);
    } else {
      onChange(value ? `${value}\n\n${snippet}` : snippet);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      
      {/* Tab bar header */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        
        {/* Toggle tabs */}
        <div className="flex bg-slate-200/60 dark:bg-slate-800/60 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('normal')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'normal'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visual Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'code'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML Source Code</span>
          </button>
        </div>

        {/* Copy / Actions buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-secondary btn-sm h-8 flex items-center gap-1 px-2.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
            title="Copy compiled HTML to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[10px]">Copy HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Snippet insertion shortcuts bar (Only show if in code edit tab or always as helper) */}
      <div className="bg-slate-100/40 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Quick Templates:</span>
        <button
          type="button"
          onClick={() => insertSnippet('fees')}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 rounded-lg transition-colors border border-indigo-100/30 dark:border-indigo-900/20"
        >
          <DollarSign className="w-3 h-3" />
          <span>Application Fee Table</span>
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('dates')}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/50 rounded-lg transition-colors border border-cyan-100/30 dark:border-cyan-900/20"
        >
          <Calendar className="w-3 h-3" />
          <span>Timeline Schedule</span>
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('eligibility')}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 rounded-lg transition-colors border border-emerald-100/30 dark:border-emerald-900/20"
        >
          <Award className="w-3 h-3" />
          <span>Eligibility Criteria Table</span>
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('banner')}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 rounded-lg transition-colors border border-amber-100/30 dark:border-amber-900/20"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Advisory Banner</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="bg-slate-50/20 dark:bg-slate-950/20">
        
        {activeTab === 'normal' ? (
          <div className="p-4 sm:p-6 min-h-[300px] max-h-[500px] overflow-y-auto">
            {value.trim() ? (
              <div 
                className="prose dark:prose-invert max-w-none text-xs leading-relaxed font-sans space-y-4"
                dangerouslySetInnerHTML={{ 
                  __html: value
                    .replace(/class=/g, 'class=') // Handle standard HTML string safely
                    .replace(/className=/g, 'class=') // Fallback if react template syntax gets inserted
                }}
              />
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 text-xs">
                <Eye className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="font-medium">No layout defined</p>
                <p className="text-[10px] text-slate-400 mt-1">Switch to "HTML Source Code" or load a boilerplate template to begin.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={rows}
              className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-950 text-emerald-400 border-none focus:ring-0 focus:outline-none resize-y selection:bg-slate-800"
              style={{ minHeight: '300px' }}
            />
            <div className="absolute bottom-2 right-3 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-500 font-mono">
              HTML Core View
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
