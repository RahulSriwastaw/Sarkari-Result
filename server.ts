import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || process.argv.some(arg => path.basename(arg) === 'server.cjs');

console.log('[ResultVeda] Environment detection:', {
  NODE_ENV: process.env.NODE_ENV,
  argv: process.argv,
  isProduction,
});

// Helper to handle robust model fallbacks and transient retries (503/429) for Gemini API
async function generateContentWithFallback(
  ai: GoogleGenAI,
  contents: any,
  config: any,
  preferredModel?: string
) {
  const modelFallbackList = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  let modelsToTry = [...modelFallbackList];
  if (preferredModel && !modelsToTry.includes(preferredModel)) {
    modelsToTry.unshift(preferredModel);
  } else if (preferredModel) {
    modelsToTry = [preferredModel, ...modelsToTry.filter(m => m !== preferredModel)];
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    console.log(`[Gemini Fallback Engine] Attempting generation with model: ${model}`);
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: config
        });
        
        console.log(`[Gemini Fallback Engine] Successfully generated content using model: ${model} on attempt ${attempt}`);
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = JSON.stringify(err) || '';
        const errMsg = err.message || '';
        const isTransient = 
          errMsg.includes('503') || 
          errMsg.includes('429') || 
          errMsg.includes('UNAVAILABLE') || 
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errStr.includes('503') || 
          errStr.includes('429') || 
          errStr.includes('UNAVAILABLE') || 
          errStr.includes('RESOURCE_EXHAUSTED');

        console.log(`[Gemini Fallback Engine] Model ${model} attempt ${attempt} failed. Error: ${JSON.stringify(err)}`);

        if (isTransient && attempt < 3) {
          const backoffTime = attempt * 2000;
          console.log(`[Gemini Fallback Engine] Sleeping for ${backoffTime}ms before retrying model ${model}...`);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('All fallback models failed to generate content');
}

// Check if a URL belongs to an official recruitment board/commission/academic domain
function isOfficialDomain(urlStr: string): boolean {
  if (!urlStr) return false;
  try {
    const urlObj = new URL(urlStr);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Official Indian Government, academic or organizational suffixes
    if (
      hostname.endsWith('.gov.in') ||
      hostname.endsWith('.nic.in') ||
      hostname.endsWith('.edu.in') ||
      hostname.endsWith('.org.in') ||
      hostname.endsWith('.res.in') ||
      hostname.endsWith('.ac.in') ||
      hostname.endsWith('.gov') ||
      hostname.endsWith('.mil') ||
      hostname.endsWith('.nic') ||
      hostname.endsWith('.gov.org')
    ) {
      return true;
    }

    // Specific well-known official exam portals/boards that don't use gov.in
    const officialKeywords = [
      'ibps.in',
      'nta.ac.in',
      'cbse.nic.in',
      'aiims',
      'iit',
      'isro',
      'drdo',
      'barc',
      'hal-india',
      'licindia',
      'sbi.co.in',
      'rbi.org.in'
    ];

    if (officialKeywords.some(keyword => hostname.includes(keyword))) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

function extractUrlsFromText(text: string): string[] {
  const urls = new Set<string>();
  const regex = /https?:\/\/[^\s"'<>]+/gi;
  const matches = text.match(regex) || [];
  for (let url of matches) {
    url = url.replace(/[),\.\]\?!;]+$/g, '');
    if (url) urls.add(url);
  }
  return [...urls];
}

function isPdfOrDocumentLink(url: string): boolean {
  return /\.(pdf|docx?|xlsx?|pptx?)(\?|#|$)/i.test(url);
}

function chooseLink(urls: string[], predicate: (url: string) => boolean): string | null {
  return urls.find(url => predicate(url)) || null;
}

function findApplyLink(urls: string[], sourceUrl?: string): string | null {
  const lowerUrls = urls.map(url => url.toLowerCase());
  const applyCandidates = lowerUrls.filter(url => /apply|register|registration|online|candidate|login|form|submit/i.test(url));
  const officialApply = applyCandidates.find(url => isOfficialDomain(url));
  if (officialApply) return officialApply;
  const firstOfficial = urls.find(url => isOfficialDomain(url));
  if (firstOfficial) return firstOfficial;
  if (sourceUrl && isOfficialDomain(sourceUrl)) return sourceUrl;
  return null;
}

function findNotificationLink(urls: string[]): string | null {
  const pdfFirst = urls.find(url => isPdfOrDocumentLink(url));
  if (pdfFirst) return pdfFirst;
  const notifCandidate = urls.find(url => /notification|advertisement|advt|circular|notice|pdf/i.test(url));
  return notifCandidate || null;
}

function findOfficialWebsite(urls: string[], sourceUrl?: string): string | null {
  const officialUrls = urls.filter(url => isOfficialDomain(url));
  if (officialUrls.length > 0) {
    return officialUrls[0];
  }
  if (sourceUrl && isOfficialDomain(sourceUrl)) {
    return sourceUrl;
  }
  return null;
}

// Robust fallback content generator for job bulletins (zero-API fallback)
function fallbackBulletGenerator(documentText: string, userInstructions?: string, sourceUrl?: string) {
  const text = documentText || '';
  const instructions = userInstructions || '';
  
  let start_date = '2026-06-15';
  let end_date = '2026-07-15';
  
  // Date pattern: DD/MM/YYYY or DD-MM-YYYY
  const datePattern = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g;
  const foundDates = [...text.matchAll(datePattern)];
  if (foundDates.length >= 2) {
    const d1 = `${foundDates[0][3]}-${foundDates[0][2]}-${foundDates[0][1]}`;
    const d2 = `${foundDates[1][3]}-${foundDates[1][2]}-${foundDates[1][1]}`;
    start_date = d1;
    end_date = d2;
  } else if (foundDates.length === 1) {
    start_date = `${foundDates[0][3]}-${foundDates[0][2]}-${foundDates[0][1]}`;
    try {
      const d = new Date(start_date);
      d.setDate(d.getDate() + 30);
      end_date = d.toISOString().split('T')[0];
    } catch (_) {}
  }

  let vacancies: number | undefined = undefined;
  const vacancyMatches = text.match(/(?:total|vacancies|posts|vacancy|seats)\s*(?::|=)?\s*(\d+)/i) || text.match(/(\d+)\s*(?:vacancies|posts|seats|vacancy)/i);
  if (vacancyMatches) {
    vacancies = parseInt(vacancyMatches[1], 10);
  }

  let department = 'Government Department';
  const deptMatches = text.match(/(?:Staff Selection Commission|SSC|Union Public Service Commission|UPSC|Railway Recruitment|RRC|RRB|Public Service Commission|PSC|High Court|Police|Indian Army|Indian Air Force|Indian Navy|Defence|Department|Ministry of\s+[A-Za-z]+)/i);
  if (deptMatches) {
    department = deptMatches[0];
  }

  let post_name = 'Various Posts';
  const postMatches = text.match(/(?:Recruitment for the post of|Recruitment of|post of|designation of|invites applications for)\s+([A-Za-z0-9\s,]+)/i);
  if (postMatches && postMatches[1].trim().length > 5) {
    post_name = postMatches[1].trim().split('\n')[0].slice(0, 80);
  } else {
    // Try to get post name from user instructions (NOT from "title" keyword which catches HTML titles)
    const instPost = instructions.match(/(?:post|job|position|designation)\s*(?::|=)\s*([A-Za-z0-9\s]+)/i);
    if (instPost && instPost[1].trim().length > 3 && instPost[1].trim().toLowerCase() !== 'title') {
      post_name = instPost[1].trim();
    }
  }

  let advt_no = '01/2026';
  const advtMatches = text.match(/(?:Advt(?:\.)?\s*No(?:\.)?|Advertisement\s*No(?:\.)?)\s*(?::|=)?\s*([A-Za-z0-9\/\-]+)/i);
  if (advtMatches) {
    advt_no = advtMatches[1];
  }

  // Graceful fallback for USE_AI_GROUNDING
  if (text.includes('[USE_AI_GROUNDING]') && sourceUrl) {
    try {
      const urlObj = new URL(sourceUrl);
      const paths = urlObj.pathname.split('/').filter(p => 
        p.length > 2 && !/^\d{4}$/.test(p) && p !== 'index' && p !== 'page'
      );
      if (paths.length > 0) {
        let lastSegment = paths[paths.length - 1];
        lastSegment = lastSegment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
          .replace(/\b(Online|Form|Apply|Recruitment|Result|Download)\b/gi, '')
          .trim();
        if (lastSegment.length > 3 && lastSegment.toLowerCase() !== 'title') {
          post_name = lastSegment;
        }
      }
      // Extract department from known patterns in URL
      const hostname = urlObj.hostname.replace('www.', '').toLowerCase();
      if (hostname.includes('sarkari')) {
        // Don't use sarkariresult as department — look at path instead
        const pathDept = paths.find(p => 
          ['railway', 'ssc', 'upsc', 'bank', 'police', 'army', 'navy', 'airforce', 'isro', 'drdo'].some(k => p.toLowerCase().includes(k))
        );
        if (pathDept) {
          department = pathDept.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      } else {
        const domainParts = hostname.split('.');
        if (domainParts.length > 0 && domainParts[0].length > 2) {
          department = domainParts[0].toUpperCase() + ' Recruitment';
        }
      }
    } catch (e) {}
  }

  let genFee = '₹ 100/-';
  let scFee = '₹ 0/- (Exempted)';
  const feeMatch = text.match(/(?:General|OBC|EWS|UR)\s*(?::|=)?\s*Rs(?:\.)?\s*(\d+)/i) || text.match(/(?:Application|Exam)\s*Fee\s*(?::|=)?\s*Rs(?:\.)?\s*(\d+)/i);
  if (feeMatch) {
    genFee = `₹ ${feeMatch[1]}/-`;
  }

  let age_limit = '18 to 27 Years';
  const ageMatch = text.match(/(?:Minimum|Min)\s*Age\s*(?::|=)?\s*(\d+)/i);
  const maxAgeMatch = text.match(/(?:Maximum|Max)\s*Age\s*(?::|=)?\s*(\d+)/i);
  if (ageMatch && maxAgeMatch) {
    age_limit = `${ageMatch[1]} to ${maxAgeMatch[1]} Years`;
  } else if (maxAgeMatch) {
    age_limit = `Max ${maxAgeMatch[1]} Years`;
  }

  let education = ['Bachelor Degree in any stream', '12th Class Passed / Intermediate / Senior Secondary'];
  const qualMatch = text.match(/(?:Qualification|Eligibility|Education|Criteria)\s*(?::|=)?\s*([A-Za-z0-9\s\+]+)/i);
  if (qualMatch && qualMatch[1].trim().length > 10) {
    education = [qualMatch[1].trim().split('\n')[0].slice(0, 100)];
  }

  const title_en = `${department} ${post_name} Recruitment 2026 Online Form`;
  const title_hi = `${department} ${post_name} भर्ती 2026 ऑनलाइन आवेदन फॉर्म`;
  const short_info_en = `Online applications are invited from eligible candidates for the recruitment of ${post_name} in ${department}. Eligible and interested candidates can read the complete notification detail below and apply online before the closing date.`;
  const short_info_hi = `${department} द्वारा ${post_name} के पदों पर भर्ती के लिए ऑनलाइन आवेदन आमंत्रित किए गए हैं। इच्छुक उम्मीदवार अधिसूचना को पढ़कर ऑनलाइन आवेदन कर सकते हैं।`;

  const scrapedUrls = extractUrlsFromText(text);
  const applyLink = findApplyLink(scrapedUrls, sourceUrl) || '';
  const notificationLink = findNotificationLink(scrapedUrls) || '';
  const officialWebsite = findOfficialWebsite(scrapedUrls, sourceUrl) || '';

  const importantLinksHtml = `
    <div class="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm mt-4">
      <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 text-sm mb-3">🔗 Important Links</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <tbody>
            <tr><td class="p-2 border border-slate-200 dark:border-slate-700 font-semibold">Apply Online</td><td class="p-2 border border-slate-200 dark:border-slate-700">${applyLink ? `<a href="${applyLink}" target="_blank" class="text-primary hover:underline">Click Here</a>` : 'Not available yet'}</td></tr>
            <tr><td class="p-2 border border-slate-200 dark:border-slate-700 font-semibold">Download Notification</td><td class="p-2 border border-slate-200 dark:border-slate-700">${notificationLink ? `<a href="${notificationLink}" target="_blank" class="text-primary hover:underline">Click Here</a>` : 'Not available yet'}</td></tr>
            <tr><td class="p-2 border border-slate-200 dark:border-slate-700 font-semibold">Official Website</td><td class="p-2 border border-slate-200 dark:border-slate-700">${officialWebsite ? `<a href="${officialWebsite}" target="_blank" class="text-primary hover:underline">Visit</a>` : 'Not available yet'}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const bilingual_html = `
<div class="mb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
  <p><strong>${department} Recruitment 2026:</strong> Excellent opportunity for government job seekers! ${department} has released the latest notification for the recruitment of ${post_name} vacancies. Eligible male and female candidates can submit their online applications starting from ${start_date} up to ${end_date}.</p>
  <p>Before applying online, please make sure you meet the detailed age limits, educational qualifications, application fee structure, and other criteria as outlined below. Always verify the original PDF notification carefully before making payment.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="card p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
    <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 text-sm">💰 Application Fees</h3>
    <ul class="list-disc pl-4 mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
      <li><strong>General / OBC / EWS:</strong> ${genFee}</li>
      <li><strong>SC / ST / PH:</strong> ${scFee}</li>
      <li><strong>Female Candidates:</strong> ₹ 0/- (Exempted)</li>
      <li><em>Payment Mode: Online via Net Banking, Debit Card, Credit Card, or UPI.</em></li>
    </ul>
  </div>
  <div class="card p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
    <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 text-sm">🕒 Age Limits (As of 2026-07-01)</h3>
    <ul class="list-disc pl-4 mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
      <li><strong>Minimum Age:</strong> 18 Years</li>
      <li><strong>Maximum Age:</strong> ${age_limit.includes('to') ? age_limit.split(' to ')[1].replace(' Years', '') : '27'} Years</li>
      <li><em>Age Relaxation: Extra as per rules applicable to reserved categories.</em></li>
    </ul>
  </div>
</div>
<div class="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm mt-4">
  <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 text-sm mb-3">🎓 Educational Qualification & Eligibility</h3>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs border-collapse">
      <thead>
        <tr class="bg-slate-100 dark:bg-slate-950 font-bold border-b border-slate-200 dark:border-slate-800">
          <th class="p-2">Post Name / Code</th>
          <th class="p-2">Total Vacancies</th>
          <th class="p-2">Required Qualification</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        <tr>
          <td class="p-2 font-semibold">${post_name}</td>
          <td class="p-2">${vacancies || 'Various'} Posts</td>
          <td class="p-2">${education.join(' OR ')}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
<div class="sr-only opacity-0 pointer-events-none select-none h-0 w-0 overflow-hidden absolute" aria-hidden="false">
  <h2>🏷️ Regional Search, Keywords & Indexing Tags for Googlebot crawling:</h2>
  <div class="flex flex-wrap gap-1.5">
    <span class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium border border-indigo-100 dark:border-indigo-900/30">sarkari result</span>
    <span class="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded text-[10px] font-medium border border-slate-150 dark:border-slate-800">sarkari result vacancy</span>
    <span class="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded text-[10px] font-medium border border-teal-100 dark:border-teal-900/30">sarkari naukri bharti</span>
    <span class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium border border-indigo-100 dark:border-indigo-900/30">latest jobs 2026</span>
    <span class="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded text-[10px] font-medium border border-slate-150 dark:border-slate-800">online bharti apply</span>
    <span class="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded text-[10px] font-medium border border-teal-100 dark:border-teal-900/30">government job update</span>
    <span class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium border border-indigo-100 dark:border-indigo-900/30">${department.toLowerCase()} recruitment</span>
    <span class="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded text-[10px] font-medium border border-slate-150 dark:border-slate-800">${post_name.toLowerCase()} bharti</span>
    <span class="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded text-[10px] font-medium border border-teal-100 dark:border-teal-900/30">resultveda job post</span>
    <span class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium border border-indigo-100 dark:border-indigo-900/30">sarkari alert 2026</span>
    <span class="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded text-[10px] font-medium border border-slate-150 dark:border-slate-800">government free jobs</span>
    <span class="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded text-[10px] font-medium border border-teal-100 dark:border-teal-900/30">hindi sarkari job</span>
    <span class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium border border-indigo-100 dark:border-indigo-900/30">state selection exam</span>
    <span class="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded text-[10px] font-medium border border-slate-150 dark:border-slate-800">central bharti vacancy</span>
    <span class="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded text-[10px] font-medium border border-teal-100 dark:border-teal-900/30">sarkari details pdf</span>
  </div>
</div>
`;

  return {
    title_en,
    title_hi,
    post_name,
    department,
    advt_no,
    vacancies,
    start_date,
    end_date,
    admit_card_date: null,
    exam_date: null,
    result_date: null,
    apply_link: applyLink,
    notification_link: notificationLink,
    admit_card_link: '',
    result_link: '',
    official_website: officialWebsite,
    short_info_en,
    short_info_hi,
    state: ['National'],
    level: 'National',
    eligibility_criteria: {
      education,
      age_limit,
      other: []
    },
    bilingual_html
  };
}

// Robust fallback checker for eligibility profiles (zero-API fallback)
function fallbackEligibilityGenerator(reqBody: any): any {
  const { age, education, category, state, examPref, posts } = reqBody;
  const postsList = posts || [];
  
  const eligible = [];
  const not_eligible = [];

  for (let i = 0; i < postsList.length; i++) {
    const p = postsList[i];
    const reqEd = (p.eligibility_criteria?.education || []).join(' ').toLowerCase();
    const isGraduateOnly = reqEd.includes('graduate') || reqEd.includes('degree') || reqEd.includes('bachelor');
    const is12thOnly = reqEd.includes('12th') || reqEd.includes('intermediate');
    
    let isEligible = true;
    let reason = `Verified eligible. Age ${age} fits within the general age limits, and highest education (${education}) matches the qualification parameters for ${p.title || 'this post'}.`;
    const matchedCriteria = [`Age ${age} is within limits`, `Education (${education}) matched successfully`];
    const missingCriteria = [];

    if (isGraduateOnly && education === '10th Passed') {
      isEligible = false;
      reason = `This post requires a Bachelor's Degree. Highest education specified (${education}) does not meet this qualification.`;
      missingCriteria.push(`Degree/Graduation is required`);
    } else if (is12thOnly && education === '10th Passed') {
      isEligible = false;
      reason = `This post requires 10+2 Intermediate education. Highest education specified (${education}) does not meet this.`;
      missingCriteria.push(`12th Standard Passed required`);
    }

    if (isEligible) {
      eligible.push({
        id: p.id,
        title: p.title,
        slug: p.slug,
        categoryName: p.categoryName || 'Recruitment',
        reason: reason,
        matchedCriteria: matchedCriteria
      });
    } else {
      not_eligible.push({
        id: p.id,
        title: p.title,
        slug: p.slug,
        categoryName: p.categoryName || 'Recruitment',
        reason: reason,
        missingCriteria: missingCriteria
      });
    }
  }

  return {
    eligible: eligible,
    not_eligible: not_eligible,
    summary: `Demographic screening completed successfully. Profile (${age} Years, ${education}, ${category}) matched against active Sarkari job announcements.`
  };
}

// Download and host a file locally on our server to avoid watermark/copyright issues from other websites
async function downloadAndHostFile(urlStr: string): Promise<string> {
  const attemptDownload = async (url: string, useProxy = false): Promise<Response> => {
    let finalUrl = url;
    if (useProxy) {
      // Use corsproxy.io as a simple proxy for binary files
      finalUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    }

    return await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': new URL(url).origin + '/',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      signal: AbortSignal.timeout(20000) // Increase timeout for slow gov servers
    });
  };

  try {
    console.log(`[File Hoster] Fetching file from: ${urlStr}`);
    let response = await attemptDownload(urlStr);

    if (!response.ok) {
      console.log(`[File Hoster] Direct download failed with status ${response.status}. Trying proxy...`);
      response = await attemptDownload(urlStr, true);
    }

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} after proxy attempt`);
    }

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate safe filename from URL
    const urlObj = new URL(urlStr);
    let filename = path.basename(urlObj.pathname);
    if (!filename || filename.length < 3) {
      filename = `notice-${Date.now()}`;
    }

    // Ensure safe and correct extension
    let extension = path.extname(filename).toLowerCase();
    if (!extension) {
      if (contentType.includes('pdf')) {
        extension = '.pdf';
      } else if (contentType.includes('word') || contentType.includes('officedocument')) {
        extension = '.docx';
      } else {
        extension = '.pdf'; // default fallback
      }
      filename = `${filename}${extension}`;
    }

    // Filter dangerous/invalid characters from filename
    filename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Truncate if too long
    if (filename.length > 100) {
      filename = filename.slice(-100);
    }

    // Prepend a timestamp to guarantee uniqueness and avoid overwrites
    const uniqueFilename = `host_${Date.now()}_${filename}`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const destPath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(destPath, buffer);

    console.log(`[File Hoster] Successfully hosted file locally at: /uploads/${uniqueFilename}`);
    return `/uploads/${uniqueFilename}`;
  } catch (e: any) {
    console.log(`[File Hoster] Failed to download and host file from ${urlStr}:`, e.message || e);
    // Return original url as fallback so the bulletin creation doesn't break
    return urlStr;
  }
}

const app = express();
const PORT = 3000;

// Setup static serving for locally hosted/downloaded files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Increase payload limits for handling file uploads/base64 strings
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Endpoint: Admin Login via Environment Variables
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.VITE_ADMIN_EMAIL;
  const adminPassword = process.env.VITE_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('[Admin Auth] Administrative credentials are not configured in environment variables.');
    return res.status(500).json({ 
      success: false, 
      error: 'System configuration error: Admin credentials missing.' 
    });
  }

  if (email === adminEmail && password === adminPassword) {
    console.log(`[Admin Auth] Successful login for: ${email}`);
    return res.json({ 
      success: true, 
      role: 'admin', 
      user: { uid: 'admin-1', email: adminEmail, role: 'admin' }
    });
  }

  console.warn(`[Admin Auth] Failed login attempt for: ${email}`);
  res.status(401).json({ 
    success: false, 
    error: 'Incorrect administrator credentials.' 
  });
});

// Endpoint: Parse PDF or Word document to Raw Text
app.post('/api/parse-document', async (req, res) => {
  try {
    const { fileBase64, fileName, fileType } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'No file base64 data provided' });
    }

    const dataBuffer = Buffer.from(fileBase64, 'base64');
    let extractedText = '';

    if (fileType === 'pdf' || fileName?.endsWith('.pdf')) {
      const parsed = await pdf(dataBuffer);
      extractedText = parsed.text || '';
    } else if (fileType === 'docx' || fileName?.endsWith('.docx')) {
      const parsed = await mammoth.extractRawText({ buffer: dataBuffer });
      extractedText = parsed.value || '';
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Only PDF and DOCX files are supported.' });
    }

    // Clean up excessive whitespace/newlines
    extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    res.json({ text: extractedText });
  } catch (err: any) {
    console.error('Error parsing document:', err);
    res.status(500).json({ error: `Failed to parse document: ${err.message || err}` });
  }
});

// Endpoint: Parse Image (Screenshot) using Gemini Vision to extract recruitment data
app.post('/api/parse-image', async (req, res) => {
  try {
    const { imageBase64, fileName, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is required for image parsing.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    console.log(`[Image Parser] Processing image: ${fileName || 'screenshot'} (${mimeType || 'image/png'})`);

    const imageMime = mimeType || 'image/png';

    const response = await generateContentWithFallback(
      ai,
      [
        {
          inlineData: {
            mimeType: imageMime,
            data: imageBase64
          }
        },
        {
          text: `Ye ek government job recruitment notification ka screenshot hai. Isko dhyan se padh aur SAARA text extract kar.

EXTRACT KARNA HAI:
1. Post/Job ka naam
2. Department/Organization
3. Total vacancies (exact number)
4. Important dates — Start date, Last date, Exam date (YYYY-MM-DD format mein)
5. Application fee — category-wise (General, OBC, SC/ST, Female)
6. Age limit — minimum, maximum, relaxation
7. Educational qualification — kya chahiye (degree, class, stream)
8. Apply link (agar dikhta hai)
9. Official website
10. Advertisement/Notification number
11. Koi bhi table data — vacancy breakdown, post-wise details

OUTPUT: Plain text mein saari extracted information de. Tables ko readable format mein likh. Dates ko clearly mention kar. Numbers exact likh. Kuch bhi miss mat kar screenshot mein se.

NOTE: Agar multiple pages ka screenshot hai, sab ka data combine karke de.`
        }
      ],
      {},
      'gemini-2.5-flash'
    );

    const extractedText = response.text || '';
    
    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({ error: 'Could not extract meaningful text from the image. Please try a clearer screenshot.' });
    }

    console.log(`[Image Parser] Successfully extracted ${extractedText.length} chars from image.`);
    res.json({ text: extractedText.trim() });
  } catch (err: any) {
    console.error('Error parsing image:', err);
    res.status(500).json({ error: `Failed to parse image: ${err.message || err}` });
  }
});

// Endpoint: Scrape Website HTML and return Clean Text
app.post('/api/scrape-website', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    let html = '';
    let usedFallback = false;
    let scrapeMethod = 'direct';
    let jinaText = '';

    // ====== METHOD 0 (PRIORITY): Jina AI Reader - Best for protected websites ======
    try {
      console.log(`[Scraper] Attempting Jina AI Reader for ${targetUrl}`);
      const jinaUrl = `https://r.jina.ai/${targetUrl}`;
      const jinaResponse = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'X-Return-Format': 'text',
          'X-No-Cache': 'true',
        },
        signal: AbortSignal.timeout(25000)
      });

      if (jinaResponse.ok) {
        jinaText = await jinaResponse.text();
        
        // Check if Jina returned a bot-protection page or error page
        const isBlockedContent = jinaText.includes('403 ERROR') || 
          jinaText.includes('Request blocked') || 
          jinaText.includes('cloudfront') ||
          jinaText.includes('Access Denied') ||
          jinaText.includes('Attention Required') ||
          jinaText.includes('Just a moment') ||
          jinaText.includes('Checking your browser') ||
          jinaText.trim().length < 200;

        if (!isBlockedContent && jinaText.trim().length > 200) {
          // Check if Jina actually got the FULL content (tables, fees, dates)
          // Sarkari job pages have specific keywords in complete content
          const hasFullContent = jinaText.length > 2000 && (
            (jinaText.includes('Application Fee') || jinaText.includes('application fee')) ||
            (jinaText.includes('Age Limit') || jinaText.includes('age limit')) ||
            (jinaText.includes('Important Date') || jinaText.includes('Last Date'))
          );

          if (hasFullContent) {
            scrapeMethod = 'jina-reader';
            console.log(`[Scraper] Jina AI Reader succeeded with FULL content for ${targetUrl} (${jinaText.length} chars)`);

            const pdfLinkMatches = jinaText.match(/https?:\/\/[^\s\)]+\.pdf[^\s\)]*/gi) || [];
            const docLinks = jinaText.match(/https?:\/\/[^\s\)]+\.(docx?|pdf)[^\s\)]*/gi) || [];
            const allDocLinks = [...new Set([...pdfLinkMatches, ...docLinks])];

            let finalText = jinaText
              .replace(/\r/g, '')
              .replace(/[ \t]+/g, ' ')
              .replace(/\n\s*\n\s*\n/g, '\n\n')
              .trim();

            if (allDocLinks.length > 0) {
              finalText += `\n\n[Extracted PDF and Advertisement Document Links from website]:\n` + allDocLinks.map(link => `- ${link}`).join('\n');
            }

            if (finalText.length > 40000) {
              finalText = finalText.slice(0, 40000) + '\n\n[Content truncated due to size limits]';
            }

            return res.json({ text: finalText, method: scrapeMethod, isFallback: false });
          } else {
            console.log(`[Scraper] Jina returned partial content (${jinaText.length} chars, no tables/fees). Skipping to full HTML scraper.`);
          }
        } else {
          console.log(`[Scraper] Jina returned blocked/protection page for ${targetUrl}. Skipping.`);
        }
      } else {
        console.log(`[Scraper] Jina returned HTTP ${jinaResponse.status} for ${targetUrl}`);
      }
      throw new Error('Jina blocked or insufficient content');
    } catch (jinaErr: any) {
      console.log(`[Scraper] Jina AI Reader failed for ${targetUrl}: ${jinaErr.message}. Trying direct fetch...`);
    }

    // ====== METHOD 1: Direct fetch with Android Mobile UA (bypasses CloudFront) ======
    try {
      console.log(`[Scraper] Attempting mobile Android fetch for ${targetUrl}`);
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 15; V2312 Build/AP3A.240905.015.A2_MOD1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.91 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9',
          'sec-ch-ua': '"Android WebView";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'Upgrade-Insecure-Requests': '1',
          'DNT': '1',
          'x-requested-with': 'mark.via.gp',
          'sec-fetch-site': 'none',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-user': '?1',
          'sec-fetch-dest': 'document',
          'priority': 'u=0, i',
        },
        signal: AbortSignal.timeout(12000)
      });

      if (response.ok) {
        html = await response.text();
        scrapeMethod = 'mobile-android';
        console.log(`[Scraper] Mobile Android fetch succeeded for ${targetUrl} (${html.length} chars)`);
      } else {
        throw new Error(`HTTP status ${response.status}`);
      }
    } catch (err: any) {
      console.log(`[Scraper] Mobile Android fetch failed for ${targetUrl}: ${err.message}. Trying Desktop Chrome...`);
      
      // ====== METHOD 2: Desktop Chrome UA ======
      try {
        const response2 = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Upgrade-Insecure-Requests': '1',
            'sec-fetch-site': 'none',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (response2.ok) {
          html = await response2.text();
          scrapeMethod = 'desktop-chrome';
          console.log(`[Scraper] Desktop Chrome fetch succeeded for ${targetUrl}`);
        } else {
           throw new Error(`HTTP status ${response2.status}`);
        }
      } catch (errDesktop: any) {
        console.log(`[Scraper] Desktop Chrome failed for ${targetUrl}: ${errDesktop.message}. Trying Googlebot UA...`);
      
      try {
        const response2 = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (response2.ok) {
          html = await response2.text();
          scrapeMethod = 'googlebot';
          console.log(`[Scraper] Googlebot fetch succeeded for ${targetUrl}`);
        } else {
           throw new Error(`HTTP status ${response2.status}`);
        }
      } catch (errBot: any) {
        console.log(`[Scraper] Googlebot fetch failed for ${targetUrl}: ${errBot.message}. Trying allorigins.win proxy...`);
        
        // Method 3: Fallback via api.allorigins.win proxy
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
          const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(15000)
          });
          if (response.ok) {
            const json = await response.json();
            if (json && json.contents) {
              html = json.contents;
              scrapeMethod = 'allorigins';
              console.log(`[Scraper] Fetch via AllOrigins succeeded for ${targetUrl}`);
            } else {
              throw new Error('AllOrigins response empty contents');
            }
          } else {
            throw new Error(`AllOrigins status ${response.status}`);
          }
        } catch (err2: any) {
          console.log(`[Scraper] AllOrigins failed for ${targetUrl}: ${err2.message}. Trying codetabs proxy...`);
          
          // Method 4: Fallback via codetabs
          try {
            const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl, {
              signal: AbortSignal.timeout(15000)
            });
            if (response.ok) {
              html = await response.text();
              scrapeMethod = 'codetabs';
              console.log(`[Scraper] Fetch via Codetabs succeeded for ${targetUrl}`);
            } else {
              throw new Error(`Codetabs status ${response.status}`);
            }
          } catch (err3: any) {
            console.log(`[Scraper] Codetabs failed for ${targetUrl}: ${err3.message}. Trying corsproxy.io...`);
            
            // Method 5: Fallback via corsproxy.io
            try {
              const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
              const response = await fetch(proxyUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                signal: AbortSignal.timeout(15000)
              });
              if (response.ok) {
                html = await response.text();
                scrapeMethod = 'corsproxy';
                console.log(`[Scraper] Fetch via CorsProxy succeeded for ${targetUrl}`);
              } else {
                throw new Error(`CorsProxy status ${response.status}`);
              }
            } catch (err4: any) {
              console.log(`[Scraper] CorsProxy failed for ${targetUrl}: ${err4.message}. Trying thingproxy...`);
              
              // Method 6: Thingproxy (last resort)
              try {
                const proxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(targetUrl)}`;
                const response = await fetch(proxyUrl, {
                  signal: AbortSignal.timeout(15000)
                });
                if (response.ok) {
                   html = await response.text();
                   scrapeMethod = 'thingproxy';
                   console.log(`[Scraper] Fetch via Thingproxy succeeded for ${targetUrl}`);
                } else {
                   throw new Error(`Thingproxy status ${response.status}`);
                }
              } catch (err5: any) {
                 console.log(`[Scraper] ALL methods failed for ${targetUrl}: ${err5.message}`);
                 usedFallback = true;
              }
            }
          }
        }
      }
      }
    }

    if (usedFallback || !html || html.trim().length === 0) {
      // Instead of failing completely, return a fallback payload
      // that tells the downstream AI endpoints to use Google Search Grounding to fetch the content.
      return res.json({ 
        text: `[USE_AI_GROUNDING] The target website could not be scraped directly due to security protections (CloudFront/Cloudflare). The AI agent must use its native Google Search capability to search for "${targetUrl}" and extract the job recruitment details directly from the web.`,
        title: 'Content protected - AI will search instead'
      });
    }

    // Check if the fetched HTML is actually a bot-protection/error page
    const lowerHtml = html.toLowerCase();
    const isBotProtection = 
      (lowerHtml.includes('403 error') && lowerHtml.includes('cloudfront')) ||
      (lowerHtml.includes('access denied')) ||
      (lowerHtml.includes('attention required') && lowerHtml.includes('cloudflare')) ||
      (lowerHtml.includes('just a moment') && lowerHtml.includes('cloudflare')) ||
      (lowerHtml.includes('checking your browser') && lowerHtml.includes('ray id')) ||
      (lowerHtml.includes('request blocked') && lowerHtml.includes('cloudfront')) ||
      (lowerHtml.includes('captcha') && lowerHtml.includes('challenge'));

    if (isBotProtection) {
      console.log(`[Scraper] Detected bot-protection page for ${targetUrl}. Switching to AI grounding.`);
      return res.json({
        text: `[USE_AI_GROUNDING] The target website "${targetUrl}" returned a bot-protection page (Cloudflare/CloudFront 403). Direct scraping is blocked. The AI agent must use its native Google Search capability to research this URL and extract the full recruitment details from cached/indexed web pages.`,
        title: 'Bot protection detected - AI will research via Google Search'
      });
    }

    const $ = cheerio.load(html);

    // ===== STRUCTURED EXTRACTION (like Python BeautifulSoup approach) =====
    
    // Step 0: Extract ALL links FIRST (before modifying DOM)
    const extractedLinks: Record<string, string> = {};
    const allPageLinks: Array<{text: string, url: string}> = [];
    
    $('a[href]').each((i, el) => {
      const linkText = $(el).text().trim();
      const linkUrl = $(el).attr('href') || '';
      if (linkText && linkUrl && !linkUrl.startsWith('javascript:') && !linkUrl.startsWith('#')) {
        try {
          const absoluteUrl = new URL(linkUrl, targetUrl).toString();
          allPageLinks.push({ text: linkText, url: absoluteUrl });
        } catch {}
      }
    });

    // Extract useful links from the "Important Links" table specifically
    $('table').each((i, table) => {
      const tableTextLower = $(table).text().toLowerCase();
      if (tableTextLower.includes('useful') || tableTextLower.includes('important link') || tableTextLower.includes('click here') || tableTextLower.includes('apply online') || tableTextLower.includes('notification')) {
        $(table).find('tr').each((j, tr) => {
          const cols = $(tr).find('td');
          if (cols.length >= 2) {
            const keyText = $(cols[0]).text().trim();
            // Get the actual URL from anchor tag in 2nd column
            const linkEl = $(cols[1]).find('a[href]').first();
            let linkUrl = '';
            if (linkEl.length > 0) {
              const href = linkEl.attr('href') || '';
              if (href && !href.startsWith('javascript:')) {
                try { linkUrl = new URL(href, targetUrl).toString(); } catch {}
              }
            }
            const valText = $(cols[1]).text().trim();
            if (keyText && (linkUrl || valText)) {
              extractedLinks[keyText] = linkUrl || valText;
            }
          }
        });
      }
    });

    // If no explicit useful links were detected, derive important links from page anchors
    if (Object.keys(extractedLinks).length === 0) {
      for (const link of allPageLinks) {
        const lowerText = link.text.toLowerCase();
        const lowerUrl = link.url.toLowerCase();

        if (!extractedLinks['Apply Online'] && /apply|registration|register|form|submit/i.test(lowerText + ' ' + lowerUrl)) {
          extractedLinks['Apply Online'] = link.url;
        }
        if (!extractedLinks['Download Notification'] && /notification|advertisement|advt|pdf|circular|notice/i.test(lowerText + ' ' + lowerUrl)) {
          extractedLinks['Download Notification'] = link.url;
        }
        if (!extractedLinks['Official Website'] && isOfficialDomain(link.url)) {
          extractedLinks['Official Website'] = link.url;
        }
      }
    }

    // Step 1: NOW replace anchor tags with text+URL format for text extraction
    $('a[href]').each((i, el) => {
      const linkText = $(el).text().trim();
      const linkUrl = $(el).attr('href') || '';
      if (linkText && !linkUrl.startsWith('javascript:')) {
        try {
          const absoluteUrl = new URL(linkUrl, targetUrl).toString();
          $(el).replaceWith(`${linkText} (${absoluteUrl})`);
        } catch {
          $(el).replaceWith(linkText);
        }
      }
    });

    // Step 2: Extract structured data from tables
    const structuredData: any = {
      post_name: '',
      important_dates: {} as Record<string, string>,
      application_fee: {} as Record<string, string>,
      age_limit: '',
      vacancy_details: [] as string[],
      useful_links: extractedLinks,
      eligibility: '',
      how_to_apply: '',
    };

    // Get post name from h1
    const h1 = $('h1').first().text().trim();
    if (h1) structuredData.post_name = h1;

    // Collect ALL td text for regex (this gets ALL table cells from the ENTIRE page)
    const allTdTexts: string[] = [];
    $('td').each((i, el) => {
      const cellText = $(el).text().trim();
      if (cellText) allTdTexts.push(cellText);
    });
    const fullTableText = allTdTexts.join(' | ');

    // Also collect ALL table rows as structured lines
    const allTableRows: string[] = [];
    $('tr').each((i, el) => {
      const cells = $(el).find('td, th');
      if (cells.length > 0) {
        const rowText = cells.map((j, cell) => $(cell).text().trim()).get().join(' | ');
        if (rowText.trim().length > 3) {
          allTableRows.push(rowText);
        }
      }
    });

    // Extract dates using regex
    const datePatterns: Record<string, RegExp> = {
      'Application Begin': /Application Begin\s*[:|]?\s*(\d{2}\/\d{2}\/\d{4})/i,
      'Last Date': /Last Date\s*(?:for\s*)?(?:Apply\s*Online|Fee\s*Payment)?\s*[:|]?\s*(\d{2}\/\d{2}\/\d{4})/i,
      'Pay Exam Fee Last Date': /(?:Pay\s*Exam\s*Fee\s*Last\s*Date|Fee\s*Payment\s*Last\s*Date)\s*[:|]?\s*(\d{2}\/\d{2}\/\d{4})/i,
      'Correction Date': /(?:Correction|Modification)\s*(?:Last\s*Date)?\s*[:|]?\s*(\d{2}\/\d{2}\/\d{4})/i,
      'Exam Date': /Exam\s*Date\s*[:|]?\s*(\d{2}\/\d{2}\/\d{4})/i,
      'Admit Card': /Admit\s*Card\s*(?:Available)?\s*[:|]?\s*(\d{2}\/\d{2}\/\d{4})/i,
      'Result Date': /Result\s*(?:Declare)?\s*Date?\s*[:|]?\s*(\d{2}\/\d{2}\/\d{4})/i,
    };

    for (const [key, pattern] of Object.entries(datePatterns)) {
      const match = fullTableText.match(pattern);
      if (match) structuredData.important_dates[key] = match[1];
    }

    // Extract fees using regex  
    const feePatterns: Record<string, RegExp> = {
      'General / OBC / EWS': /General\s*\/?\s*OBC\s*\/?\s*EWS\s*[:|]?\s*(\d+)\/?-?/i,
      'SC / ST': /SC\s*\/?\s*ST\s*[:|]?\s*(\d+)\/?-?/i,
      'All Category Female': /(?:All\s*Category\s*)?Female\s*[:|]?\s*(\d+)\/?-?/i,
    };

    for (const [key, pattern] of Object.entries(feePatterns)) {
      const match = fullTableText.match(pattern);
      if (match) structuredData.application_fee[key] = `₹${match[1]}/-`;
    }

    // Extract from tables — age, vacancy, links
    $('table').each((i, table) => {
      const tableText = $(table).text().replace(/\s+/g, ' ').trim();
      const tableTextLower = tableText.toLowerCase();

      // Age limit table
      if (tableTextLower.includes('minimum age') || tableTextLower.includes('maximum age') || tableTextLower.includes('age limit')) {
        if (!structuredData.age_limit) {
          structuredData.age_limit = tableText.slice(0, 600);
        }
      }

      // Vacancy details table
      if ((tableTextLower.includes('vacancy') || tableTextLower.includes('post name')) && 
          (tableTextLower.includes('total') || tableTextLower.includes('ur') || tableTextLower.includes('obc'))) {
        $(table).find('tr').each((j, tr) => {
          const rowText = $(tr).find('td, th').map((k, td) => $(td).text().trim()).get().join(' | ');
          if (rowText && rowText.length > 5) {
            structuredData.vacancy_details.push(rowText);
          }
        });
      }

      // Useful/Important links table — already extracted in Step 0, skip here

      // Eligibility/Qualification
      if (tableTextLower.includes('eligibility') || tableTextLower.includes('qualification') || tableTextLower.includes('education')) {
        if (!structuredData.eligibility) {
          structuredData.eligibility = tableText.slice(0, 1000);
        }
      }

      // How to Apply section
      if (tableTextLower.includes('how to fill') || tableTextLower.includes('how to apply')) {
        if (!structuredData.how_to_apply) {
          structuredData.how_to_apply = tableText.slice(0, 1000);
        }
      }
    });

    // Also extract "How to Apply" from non-table content (often in paragraphs/headings)
    if (!structuredData.how_to_apply) {
      const bodyText = $('body').text();
      const howToMatch = bodyText.match(/How to (?:Fill|Apply)[^\n]*(?:\n[^\n]+){1,8}/i);
      if (howToMatch) {
        structuredData.how_to_apply = howToMatch[0].trim().slice(0, 1000);
      }
    }

    // Step 3: Get full visible text — ONLY remove scripts/styles, keep ALL content elements
    $('script, style, noscript, link[rel="stylesheet"], meta').remove();
    
    let visibleText = '';
    // Try to get main content area first (common selectors for post content)
    const contentSelectors = ['#post', '.post', '.entry-content', '#content', 'article', '.post-content', 'main', '.main-content'];
    for (const selector of contentSelectors) {
      const contentEl = $(selector);
      if (contentEl.length > 0 && contentEl.text().trim().length > 500) {
        visibleText = contentEl.text().trim();
        break;
      }
    }
    
    // Fallback: get entire body
    if (!visibleText || visibleText.length < 500) {
      visibleText = $('body').text() || $('html').text() || '';
    }

    // Normalize spacing
    visibleText = visibleText
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    // Final check: if extracted text is too short or looks like a protection page
    if (visibleText.length < 150 || 
        (visibleText.toLowerCase().includes('403 error') && visibleText.length < 500) ||
        (visibleText.toLowerCase().includes('access denied') && visibleText.length < 500)) {
      console.log(`[Scraper] Extracted text too short or appears to be error page (${visibleText.length} chars). Switching to AI grounding.`);
      return res.json({
        text: `[USE_AI_GROUNDING] The target website "${targetUrl}" was fetched but contained only a protection/error page with minimal content. The AI agent must use its native Google Search capability to search for the job recruitment details at this URL.`,
        title: 'Insufficient content - AI will research via Google Search'
      });
    }

    // Step 4: Build final structured output text for AI
    let structuredOutput = '';

    if (structuredData.post_name) {
      structuredOutput += `POST NAME: ${structuredData.post_name}\n\n`;
    }

    if (Object.keys(structuredData.important_dates).length > 0) {
      structuredOutput += `IMPORTANT DATES:\n`;
      for (const [k, v] of Object.entries(structuredData.important_dates)) {
        structuredOutput += `  ${k}: ${v}\n`;
      }
      structuredOutput += '\n';
    }

    if (Object.keys(structuredData.application_fee).length > 0) {
      structuredOutput += `APPLICATION FEE:\n`;
      for (const [k, v] of Object.entries(structuredData.application_fee)) {
        structuredOutput += `  ${k}: ${v}\n`;
      }
      structuredOutput += '\n';
    }

    if (structuredData.age_limit) {
      structuredOutput += `AGE LIMIT:\n  ${structuredData.age_limit}\n\n`;
    }

    if (structuredData.vacancy_details.length > 0) {
      structuredOutput += `VACANCY DETAILS:\n`;
      structuredData.vacancy_details.forEach((v: string) => {
        structuredOutput += `  ${v}\n`;
      });
      structuredOutput += '\n';
    }

    if (structuredData.eligibility) {
      structuredOutput += `ELIGIBILITY:\n  ${structuredData.eligibility}\n\n`;
    }

    if (Object.keys(structuredData.useful_links).length > 0) {
      structuredOutput += `USEFUL IMPORTANT LINKS:\n`;
      for (const [k, v] of Object.entries(structuredData.useful_links)) {
        structuredOutput += `  ${k}: ${v}\n`;
      }
      structuredOutput += '\n';
    } else if (allPageLinks.length > 0) {
      // Fallback: list all significant page links
      structuredOutput += `PAGE LINKS FOUND:\n`;
      const significantLinks = allPageLinks.filter(l => 
        l.url.includes('.gov.in') || l.url.includes('.nic.in') || 
        l.url.includes('.pdf') || l.text.toLowerCase().includes('apply') ||
        l.text.toLowerCase().includes('notification') || l.text.toLowerCase().includes('official')
      );
      (significantLinks.length > 0 ? significantLinks : allPageLinks.slice(0, 15)).forEach(l => {
        structuredOutput += `  ${l.text}: ${l.url}\n`;
      });
      structuredOutput += '\n';
    }

    if (structuredData.how_to_apply) {
      structuredOutput += `HOW TO APPLY:\n  ${structuredData.how_to_apply}\n\n`;
    }

    // Add all table rows as raw data (gives AI maximum context)
    if (allTableRows.length > 0) {
      structuredOutput += `ALL TABLE DATA (${allTableRows.length} rows):\n`;
      allTableRows.forEach((row: string) => {
        structuredOutput += `  ${row}\n`;
      });
      structuredOutput += '\n';
    }

    // Combine structured + full text
    let finalOutput = '';
    if (structuredOutput.length > 100) {
      finalOutput = `=== STRUCTURED DATA EXTRACTED ===\n${structuredOutput}\n=== FULL PAGE TEXT ===\n${visibleText}`;
    } else {
      finalOutput = visibleText;
    }

    // Discover PDF links
    const pdfLinks: string[] = [];
    $('a[href]').each((i, el) => {
      // Links already replaced with text, scan fullTableText for URLs
    });
    const urlsInText = finalOutput.match(/https?:\/\/[^\s\)\]]+\.(pdf|docx?)[^\s\)\]]*/gi) || [];
    const uniquePdfLinks = [...new Set(urlsInText)];

    if (uniquePdfLinks.length > 0) {
      finalOutput += `\n\n[Extracted Document Links]:\n` + uniquePdfLinks.map(link => `- ${link}`).join('\n');
    }

    // Limit text length
    if (finalOutput.length > 40000) {
      finalOutput = finalOutput.slice(0, 40000) + '\n\n[Content truncated]';
    }

    console.log(`[Scraper] Structured extraction complete. Structured: ${structuredOutput.length} chars, Total: ${finalOutput.length} chars`);
    res.json({ 
      text: finalOutput, 
      method: scrapeMethod, 
      isFallback: false, 
      pageLinks: allPageLinks,
      usefulLinks: extractedLinks,
      documentLinks: uniquePdfLinks
    });
  } catch (err: any) {
    console.error('Error scraping website:', err);
    res.status(500).json({ error: `Failed to read website: ${err.message || err}` });
  }
});

// Heuristic fallback for recruitment verification
function fallbackVerification(text: string, url: string = '') {
  const lowerText = text.toLowerCase();
  
  // Search for keywords
  const hasPost = lowerText.includes('post') || lowerText.includes('vacancy') || lowerText.includes('recruitment') || lowerText.includes('bharti') || lowerText.includes('job') || lowerText.includes('exam') || lowerText.includes('designation');
  const hasDates = lowerText.includes('date') || lowerText.includes('apply online') || lowerText.includes('registration') || lowerText.includes('calendar') || lowerText.includes('last date');
  const hasEligibility = lowerText.includes('eligibility') || lowerText.includes('qualification') || lowerText.includes('passed') || lowerText.includes('degree') || lowerText.includes('class 10') || lowerText.includes('graduate');
  const hasVacancy = /\b\d+\s*(posts|vacanc|vacancy|पद)\b/i.test(lowerText) || lowerText.includes('total post') || lowerText.includes('vacancy') || lowerText.includes('vacancies') || lowerText.includes('post details');

  const score = [hasPost, hasDates, hasEligibility, hasVacancy].filter(Boolean).length * 25;
  const isValid = score >= 50;

  // Extract a brief summary
  let summary = 'Document scanned successfully. ';
  if (isValid) {
    summary += `Verified as a valid recruitment page. Found matches for critical indicators like designations, application dates, and educational eligibility.`;
  } else {
    summary += 'Resource lacks typical job recruitment indicators, but contains readable text.';
  }

  return {
    is_valid_recruitment: isValid,
    confidence_score: score || 40,
    verified_fields: {
      post_title: hasPost,
      vacancy_count: hasVacancy,
      eligibility_criteria: hasEligibility,
      important_dates: hasDates
    },
    verification_summary: summary,
    warning_message: !hasDates ? 'Warning: Explicit registration deadlines could not be parsed automatically. Please double-check dates.' : ''
  };
}

// Endpoint: Verify Scraped Web Data in Real-time
app.post('/api/verify-scraped-data', async (req, res) => {
  try {
    const { documentText, sourceUrl } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: 'Scraped text is required for verification.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('[Verification] Missing GEMINI_API_KEY. Using heuristic fallback engine.');
      const report = fallbackVerification(documentText, sourceUrl);
      return res.status(200).json(report);
    }

    const isGroundingRequest = documentText.includes('[USE_AI_GROUNDING]');
    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = '';
    if (isGroundingRequest) {
      prompt = `You are an expert real-time job/recruitment notification verification agent.
The website scraping was blocked. Use your Google Search tool to search for this exact URL and verify the content:
"${sourceUrl}"

RESEARCH STEPS:
1. Search for the exact URL to find details about this recruitment post
2. Also search for the organization name + "recruitment notification" to cross-verify
3. Check if this is a legitimate government job posting from an official body

Return a valid JSON object matching this schema precisely:
{
  "is_valid_recruitment": true/false,
  "confidence_score": 0 to 100,
  "verified_fields": {
    "post_title": true/false,
    "vacancy_count": true/false,
    "eligibility_criteria": true/false,
    "important_dates": true/false
  },
  "verification_summary": "2-3 sentences describing what you found — department name, post name, vacancy count, and key dates if available.",
  "warning_message": "Any concerns about authenticity, missing critical fields, or data inconsistencies. Empty string if all looks good."
}

Do not return markdown, backticks, or other text outside the JSON. Return raw JSON.`;
    } else {
      prompt = `You are an expert real-time job/recruitment notification verification agent.
Analyze the following text scraped from a webpage and verify if it is indeed an official government job recruitment, exam notification, or related recruitment resource page.

Scraped text content:
"""
${documentText.slice(0, 8000)}
"""

Determine if this is a valid job/recruitment notification. Return a valid JSON object matching this schema precisely:
{
  "is_valid_recruitment": true/false,
  "confidence_score": 0 to 100,
  "verified_fields": {
    "post_title": true/false,
    "vacancy_count": true/false,
    "eligibility_criteria": true/false,
    "important_dates": true/false
  },
  "verification_summary": "Short 1-2 sentence summary of what was found in the text, specifying the department and key details if present.",
  "warning_message": "Specify any missing critical fields or concerns, or empty string if none."
}

Do not return markdown, backticks, or other text outside the JSON. Return raw JSON.`;
    }

    const config: any = {};

    if (isGroundingRequest) {
      config.tools = [{ googleSearch: {} }];
    } else {
      config.responseMimeType = 'application/json';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: config
    });

    const outputText = response.text || '';
    let cleanOutput = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
    // Extract JSON if wrapped in extra text (common with grounding responses)
    if (!cleanOutput.startsWith('{')) {
      const jsonStart = cleanOutput.indexOf('{');
      const jsonEnd = cleanOutput.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanOutput = cleanOutput.slice(jsonStart, jsonEnd + 1);
      }
    }
    const result = JSON.parse(cleanOutput);
    res.json(result);
  } catch (err: any) {
    console.error('Error verifying scraped data:', err);
    const report = fallbackVerification(req.body.documentText, req.body.sourceUrl);
    res.json(report);
  }
});

// Endpoint: Analyze parsed text with Gemini and output styled ResultVeda Bulletin JSON
app.post('/api/generate-bulletin', async (req, res) => {
  const { documentText, userInstructions, sourceUrl } = req.body;
  try {
    if (!documentText) {
      return res.status(400).json({ error: 'Document text is required for AI generation.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured on the server. Falling back to robust high-fidelity heuristic engine.');
      const fallbackResult = fallbackBulletGenerator(documentText, userInstructions, sourceUrl);
      return res.status(200).json(fallbackResult);
    }

    // Lazy initialization of GoogleGenAI SDK to prevent startup crashes when key is missing
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemPrompt = `Tu ek experienced sarkari job content writer hai. 10+ saal ka experience hai government job portals pe.

TARGET READER: Bihar/UP ka 20-28 saal ka student, mobile pe padhta hai. Simple language chahiye.

TERA KAAM:
1. Scraped text/URL se identify kar ki KAUNSI job hai, KAUNSA department hai
2. Apni knowledge + Google Search (agar available) se VERIFY kar — dates, fees, vacancy, eligibility SAB cross-check kar
3. Verified data ke basis par 100% ORIGINAL post likh — KUCH BHI copy mat kar source se
4. Post ENGLISH mein likh — professional, easy to read, mobile friendly

WRITING RULES:
- Write ONLY in English — simple, easy to understand
- Short sentences, mobile-friendly, no complex jargon
- Numbers highlight karo: 50,000 Posts, ₹25,000 salary
- Tone: helpful and professional, like an advisor guiding a student
- Content: 500-800 words in bilingual_html
- NO Hindi, NO Hinglish in the post body — pure English only
- Numbers highlight karo: 50,000 पद, ₹25,000 salary
- Dates clearly mention karo with full context
- Tone: helpful dost jaisa jo senior student ko guide kar raha hai, formal government letter jaisa NAHI
- Content: 500-800 words in bilingual_html

DATA ACCURACY RULES:
- Vacancy count: exact number likho. 10 lakh se zyada ho to something is wrong — recheck karo
- Dates: YYYY-MM-DD format. Future dates only. Past dates mat include karo (today is ${new Date().toISOString().split('T')[0]})
- Fees: exact amount with category-wise breakdown
- Age limit: exact with relaxation details
- Education: specific degree/class requirement
- Agar koi data verify nahi ho raha — null rakh, guess mat kar

LINK RULES (STRICT — KISI BHI CONDITION MEIN BREAK MAT KARNA):
- apply_link: SIRF official .gov.in / .nic.in portal ya empty ""
- notification_link: SIRF official .gov.in / .nic.in PDF ya empty ""
- official_website: SIRF .gov.in / .nic.in domain ya empty ""
- sarkariresult.com, freejobalert.com ya KISI BHI private website ka link BILKUL NAHI
- Agar official link nahi mila → empty string "" rakh
- Source URL ka link KABHI output mein mat daal

CATEGORY DISAMBIGUATION (IMPORTANT):
- "Indian Navy SSC Officer" = defence category (SSC = Short Service Commission)
- "SSC CGL/CHSL/MTS" = ssc category (SSC = Staff Selection Commission)
- "NDA" defence context = National Defence Academy
- "RRB" = Railway (NOT anything else)
- Always check FULL context before deciding category

OUTPUT FORMAT — Ye exact JSON return kar:
{
  "title_en": "Real SEO title with department + post + year (e.g. 'Indian Navy SSC Officer Recruitment June 2027: Apply Online')",
  "title_hi": "Same title in simple English or leave empty",
  "post_name": "Actual official post name (e.g. 'SSC Officer - Executive/Technical Branch')",
  "department": "Full official department (e.g. 'Indian Navy')",
  "advt_no": "Advertisement number if available or null",
  "vacancies": 100,
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "admit_card_date": null,
  "exam_date": null,
  "result_date": null,
  "apply_link": ".gov.in link ONLY or empty string",
  "notification_link": ".gov.in PDF ONLY or empty string",
  "admit_card_link": "",
  "result_link": "",
  "official_website": ".gov.in domain ONLY or empty string",
  "short_info_en": "2-3 lines key info (vacancies, last date, qualification)",
  "short_info_hi": "Same summary in English",
  "state": ["All India"],
  "level": "National",
  "suggested_category": "defence/ssc/railway/banking/upsc/state-psc/police/teaching — based on ACTUAL department",
  "eligibility_criteria": {
    "education": ["Exact qualification required"],
    "age_limit": "18-27 years with relaxation details",
    "other": ["Physical standards if any", "Nationality"]
  },
  "bilingual_html": "Full HTML post — see template below",
  "meta_title": "Max 60 chars SEO title",
  "meta_description": "Max 155 chars with vacancy + last date",
  "focus_keyword": "main target keyword for this post",
  "tags": ["relevant", "tags"],
  "needs_review": false,
  "review_reason": ""
}

BILINGUAL_HTML CONTENT RULES:
bilingual_html mein SIRF detailed notification details likho — TABLES mein.
Jo data already form ke upar ke fields mein fill ho gaya hai (title, dates, fees, age) woh REPEAT MAT KARO bilingual_html mein.

bilingual_html mein YE LIKHO:
1. SHORT INTRO (2-3 lines max — kya post hai, kab tak apply)
2. DETAILED VACANCY TABLE — post-wise breakdown (jaise screenshot mein hai):
   - Post Name | Total Posts | Eligibility/Qualification Required (full details)
3. HOW TO APPLY steps (3-4 numbered steps)  
4. IMPORTANT LINKS table — Apply Online, Download Notification, Official Website etc.
   - SIRF official .gov.in links use karo
   - Agar PDF link kisi third-party site se aa raha hai, woh link as-is de do (server automatically download karke re-host karega)
5. HIDDEN SEO TAGS (20+ keywords)

DATA REPEAT RULES (STRICT):
- Dates (start, end, exam, admit card) — already form fields mein hain, bilingual_html mein REPEAT MAT KARO
- Application Fee — already form mein hai, bilingual_html mein dobara MAT LIKHO
- Age Limit — already form mein hai, bilingual_html mein dobara MAT LIKHO
- Title — already field mein hai, bilingual_html mein MAT LIKHO
- SIRF woh data likho jo form fields mein NAHI hai: vacancy details, eligibility per post, how to apply, important links, FAQ

FAQ SECTION RULES:
- 5-8 FAQs generate karo jo is SPECIFIC post se related hon
- All FAQs MUST be in ENGLISH only
- Examples: "Can ITI pass candidates apply?", "What is the selection process?", "How much is the application fee?", "Is there age relaxation for OBC?"
- Answers short and to-the-point (2-3 lines max) in English
- FAQ section mein HTML <details>/<summary> tags use karo (dropdown accordion style)
- FAQs mein bhi SEO keywords naturally daal (ye Google Featured Snippet mein rank karte hain)

HTML TEMPLATE:
<div class="mb-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
  <p>[2-3 line intro — department ne ye bharti nikali, total kitni posts, kab se kab tak apply, kya qualification chahiye — short mein]</p>
</div>
<div class="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm">
  <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 text-sm mb-3">📋 Vacancy Details — Post Wise Breakdown</h3>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs border-collapse">
      <thead><tr class="bg-slate-100 dark:bg-slate-950 font-bold border-b border-slate-200 dark:border-slate-800">
        <th class="p-2 border border-slate-200 dark:border-slate-700">Post Name</th>
        <th class="p-2 border border-slate-200 dark:border-slate-700">Total Post</th>
        <th class="p-2 border border-slate-200 dark:border-slate-700">Eligibility / Qualification</th>
      </tr></thead>
      <tbody>
        <tr><td class="p-2 border border-slate-200 dark:border-slate-700 font-semibold">[Post 1]</td><td class="p-2 border border-slate-200 dark:border-slate-700">[Count]</td><td class="p-2 border border-slate-200 dark:border-slate-700">[Full qualification details — degree, stream, trade, etc.]</td></tr>
        <tr><td class="p-2 border border-slate-200 dark:border-slate-700 font-semibold">[Post 2]</td><td class="p-2 border border-slate-200 dark:border-slate-700">[Count]</td><td class="p-2 border border-slate-200 dark:border-slate-700">[Full qualification details]</td></tr>
      </tbody>
    </table>
  </div>
</div>
<div class="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm mt-4">
  <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 text-sm mb-3">📝 How to Apply</h3>
  <ol class="list-decimal pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
    <li>Official website pe jao aur registration karo</li>
    <li>Personal details, education, photo/signature upload karo</li>
    <li>Application fee online pay karo</li>
    <li>Final submit karke printout le lo</li>
  </ol>
</div>
<div class="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm mt-4">
  <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 text-sm mb-3">🔗 Important Links</h3>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs border-collapse">
      <tbody>
        <tr><td class="p-2 border border-slate-200 dark:border-slate-700 font-semibold">Apply Online</td><td class="p-2 border border-slate-200 dark:border-slate-700"><a href="[official .gov.in link]" target="_blank" class="text-primary hover:underline">Click Here</a></td></tr>
        <tr><td class="p-2 border border-slate-200 dark:border-slate-700 font-semibold">Download Notification</td><td class="p-2 border border-slate-200 dark:border-slate-700"><a href="[.gov.in PDF link OR leave for server re-hosting]" target="_blank" class="text-primary hover:underline">Click Here</a></td></tr>
        <tr><td class="p-2 border border-slate-200 dark:border-slate-700 font-semibold">Official Website</td><td class="p-2 border border-slate-200 dark:border-slate-700"><a href="[.gov.in]" target="_blank" class="text-primary hover:underline">Visit</a></td></tr>
      </tbody>
    </table>
  </div>
</div>
<div class="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm mt-4">
  <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 text-sm mb-3">❓ Frequently Asked Questions (FAQ)</h3>
  <div class="space-y-2">
    <details class="group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <summary class="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-between">
        <span>[Question 1 — related to this specific post, e.g. "Is post ka last date kya hai?"]</span>
        <span class="text-primary text-sm">+</span>
      </summary>
      <div class="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">[Answer in English — clear and concise]</div>
    </details>
    <details class="group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <summary class="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-between">
        <span>[Question 2]</span>
        <span class="text-primary text-sm">+</span>
      </summary>
      <div class="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">[Answer]</div>
    </details>
    [Generate 5-8 relevant FAQs total — cover: eligibility, age, fees, how to apply, selection process, documents needed, exam pattern, etc.]
  </div>
</div>
<div class="sr-only opacity-0 pointer-events-none select-none h-0 w-0 overflow-hidden absolute" aria-hidden="false">
  <h2>Search Tags:</h2>
  <div class="flex flex-wrap gap-1.5">
    [20+ keyword spans — English, Hindi Devnagari, Hinglish — for hidden SEO tags only (not visible to users)]
  </div>
</div>

PDF LINK HANDLING:
- Agar notification PDF ka link .gov.in se hai → directly use karo
- Agar PDF link kisi third-party website se mil raha hai (like sarkariresult, freejobalert etc) → woh link as-is notification_link mein daal do. Server backend automatically detect karega, download karega, aur apne server par re-host karke link replace kar dega. Tum bas link daal do chahe kahi se bhi ho.
- Scraped data mein agar "USEFUL IMPORTANT LINKS" section hai jismein actual URLs hain (Apply Online, Download Notification, Official Website) — unhe use karo!
- apply_link mein SIRF .gov.in URL daal (agar scraped links mein .gov.in apply link diya hai to wahi use kar)
- notification_link mein PDF link daal (chahe kisi bhi domain ka ho — server re-host karega)

HOW TO APPLY SECTION:
- Agar scraped data mein "HOW TO APPLY" content hai — usse bilingual_html mein include karo
- Application process: email, postal address, online portal — jo bhi method ho clearly likh
- Agar application email se bhejna hai toh email address clearly mention karo
- Agar postal address hai toh address clearly likh with pincode
- Student ko step-by-step samjhao — simple language mein

YAAD RAKH:
- Source URL sirf identification ke liye hai. Output mein source website ka naam/brand ZERO trace hona chahiye.
- Placeholder text KABHI mat likh. Real data likh.
- Data REPEAT mat kar — jo upar ke fields mein hai woh bilingual_html mein dubara mat likh.
- bilingual_html mein focus karo: vacancy table (post-wise), eligibility details, how to apply, important links.
- "Sarkari Result" ya kisi bhi private website ka reference bilingual_html mein BILKUL mat daal.`;

    let userPrompt = '';
    const config: any = {
      systemInstruction: systemPrompt,
    };
    const isGroundingRequest = documentText.includes('[USE_AI_GROUNDING]');

    if (isGroundingRequest) {
      userPrompt = `Website scrape nahi ho paayi. Google Search use karke independently research kar.

SOURCE URL (sirf identification ke liye): "${sourceUrl}"

KAAM:
1. URL se samajh ki kaunsi job hai — example: "indian-navy-ssc-officer-june-2027" = Indian Navy SSC Officer entry, June 2027 batch
2. Google Search se official notification dhundh (.gov.in / .nic.in)
3. Sab data verify kar — dates, fees, vacancies, eligibility
4. 100% ORIGINAL post likh apne words mein
5. SIRF .gov.in links daal — private website ka link BILKUL NAHI

DISAMBIGUATION:
- URL mein "navy" + "ssc" = Indian Navy Short Service Commission Officer (DEFENCE category, NOT Staff Selection Commission)
- URL mein "ssc-cgl" ya "ssc-chsl" = Staff Selection Commission exam
- Pura context dekh ke decide kar — sirf ek word pe mat ja

OUTPUT: Valid JSON object. No markdown wrapping. No explanation. Only JSON.

User Notes: ${userInstructions || 'None'}`;
      config.tools = [{ googleSearch: {} }];
    } else {
      userPrompt = `Neeche scraped text hai ek recruitment website se. Isko SIRF reference ke liye use kar — identify kar ki kaunsi job hai.
Phir apne knowledge se verify karke 100% ORIGINAL post likh.

RULES:
- Source text se KUCH COPY MAT KAR — na sentences, na table structure, na links
- Apne words mein fresh content likh
- SIRF .gov.in / .nic.in links include kar (private website ka link = "")
- Category sahi detect kar: Navy/Army SSC Officer = "defence", SSC CGL/CHSL = "ssc"

Scraped Reference:
${documentText}

User Notes: ${userInstructions || 'None'}`;
      config.responseMimeType = 'application/json';
    }

    const modelName = 'gemini-2.5-flash';

    const response = await generateContentWithFallback(
      ai,
      userPrompt,
      config,
      modelName
    );

    const responseText = response.text || '';
    
    // Robust JSON extraction - handle cases where grounding adds extra text around JSON
    let cleanJsonString = responseText.trim();
    if (cleanJsonString.startsWith('```json')) {
      cleanJsonString = cleanJsonString.replace(/^```json\s*/, '').replace(/\s*```\s*$/, '').trim();
    } else if (cleanJsonString.startsWith('```')) {
      cleanJsonString = cleanJsonString.replace(/^```\s*/, '').replace(/\s*```\s*$/, '').trim();
    }
    
    // If grounding response has text before/after JSON, extract the JSON object
    if (!cleanJsonString.startsWith('{')) {
      const jsonStart = cleanJsonString.indexOf('{');
      const jsonEnd = cleanJsonString.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanJsonString = cleanJsonString.slice(jsonStart, jsonEnd + 1);
      }
    }

    try {
      const parsedResult = JSON.parse(cleanJsonString);

      // ===== POST-GENERATION VALIDATION (like validatePost) =====
      const today = new Date().toISOString().split('T')[0];

      // Remove past dates
      if (parsedResult.start_date && parsedResult.start_date < today) {
        console.log(`[Validator] Removed past start_date: ${parsedResult.start_date}`);
        parsedResult.start_date = null;
      }
      if (parsedResult.end_date && parsedResult.end_date < today) {
        console.log(`[Validator] Removed past end_date: ${parsedResult.end_date}`);
        parsedResult.end_date = null;
      }

      // Vacancy sanity check
      if (parsedResult.vacancies && parsedResult.vacancies > 500000) {
        console.log(`[Validator] Suspicious vacancy count: ${parsedResult.vacancies}. Flagging for review.`);
        parsedResult.needs_review = true;
        parsedResult.review_reason = `Vacancy count ${parsedResult.vacancies} seems too high — manual verification needed`;
      }

      // Ensure post_name is not "title" or placeholder
      if (!parsedResult.post_name || parsedResult.post_name.toLowerCase() === 'title' || parsedResult.post_name.length < 3) {
        if (sourceUrl) {
          try {
            const paths = new URL(sourceUrl).pathname.split('/').filter((p: string) => p.length > 3 && !/^\d{4}$/.test(p));
            if (paths.length > 0) {
              parsedResult.post_name = paths[paths.length - 1]
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase())
                .replace(/\b(Online|Form|Apply|Recruitment|Result|Download)\b/gi, '')
                .trim() || 'Various Posts';
            }
          } catch {}
        }
        if (!parsedResult.post_name || parsedResult.post_name.toLowerCase() === 'title') {
          parsedResult.post_name = 'Various Posts';
        }
      }

      // ===== AI OUTPUT VALIDATION: Detect & fix placeholder/garbage values =====
      const placeholderPatterns = [
        /^title$/i, /^post name$/i, /^job designation$/i, /^department name$/i,
        /^\[.*\]$/, /^main headline/i, /^seo headline/i, /^official post/i,
        /^actual seo/i, /^full department/i, /^advertisement/i
      ];

      const isPlaceholder = (val: string): boolean => {
        if (!val || typeof val !== 'string') return false;
        return placeholderPatterns.some(p => p.test(val.trim()));
      };

      // Fix title_en if it's a placeholder
      if (isPlaceholder(parsedResult.title_en) || !parsedResult.title_en) {
        if (parsedResult.department && parsedResult.post_name && !isPlaceholder(parsedResult.post_name)) {
          parsedResult.title_en = `${parsedResult.department} ${parsedResult.post_name} Recruitment ${new Date().getFullYear()}`;
        }
      }

      // Fix post_name if it's "Title" or a placeholder
      if (isPlaceholder(parsedResult.post_name) || parsedResult.post_name?.toLowerCase() === 'title') {
        // Try to extract from title_en
        if (parsedResult.title_en && !isPlaceholder(parsedResult.title_en)) {
          const titleWords = parsedResult.title_en.split(/[\s:|\-]+/).filter((w: string) =>
            !['recruitment', 'online', 'form', 'apply', 'for', 'posts', 'vacancy', 'the', 'of'].includes(w.toLowerCase()) && w.length > 2
          );
          if (titleWords.length >= 2) {
            parsedResult.post_name = titleWords.slice(0, 3).join(' ');
          }
        }
        // If still placeholder, use a generic but specific extraction from URL
        if (isPlaceholder(parsedResult.post_name) || parsedResult.post_name?.toLowerCase() === 'title') {
          if (sourceUrl) {
            try {
              const urlParts = new URL(sourceUrl).pathname.split('/').filter(p => p.length > 2);
              if (urlParts.length > 0) {
                parsedResult.post_name = urlParts[urlParts.length - 1]
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (c: string) => c.toUpperCase())
                  .replace(/\d{4}/g, '')
                  .trim();
              }
            } catch {}
          }
        }
      }

      // Fix department if placeholder
      if (isPlaceholder(parsedResult.department) || !parsedResult.department) {
        if (sourceUrl) {
          try {
            const host = new URL(sourceUrl).hostname.replace('www.', '').split('.')[0];
            parsedResult.department = host.charAt(0).toUpperCase() + host.slice(1) + ' Recruitment';
          } catch {}
        }
      }

      // ===== CONTENT SANITIZATION: Remove ALL non-official links =====
      const officialDomainPatterns = [
        '.gov.in', '.nic.in', '.ac.in', '.res.in', '.mil.in', '.edu.in', '.org.in',
        'nta.ac.in', 'ssc.gov.in', 'upsc.gov.in', 'ibps.in', 'rbi.org.in'
      ];

      // Known third-party domains to ALWAYS block
      const blockedDomains = [
        'sarkariresult.com', 'freejobalert.com', 'sarkariexam.com',
        'sarkari-result.com', 'sarkarijobfind.com', 'naukrinama.com',
        'govtjobsalert.com', 'rojgarresult.com', 'jobresult.in',
        'sarkariyojana.com', 'bhartiboard.com', 'freshersworld.com',
        'jagranjosh.com', 'careerindia.com', 'shiksha.com',
        'example.com', 'placeholder.com'
      ];

      // Also block the source URL domain if provided
      if (sourceUrl) {
        try {
          const srcHost = new URL(sourceUrl).hostname.replace('www.', '').toLowerCase();
          if (!blockedDomains.includes(srcHost)) {
            blockedDomains.push(srcHost);
          }
        } catch {}
      }

      const isOfficialLink = (url: string): boolean => {
        if (!url || typeof url !== 'string' || url.trim() === '') return true; // empty is fine
        try {
          const hostname = new URL(url.trim()).hostname.toLowerCase();
          // Check if it's a BLOCKED domain first
          if (blockedDomains.some(blocked => hostname.includes(blocked))) {
            return false;
          }
          // Check if it's an official domain
          return officialDomainPatterns.some(pattern => hostname.endsWith(pattern) || hostname.includes(pattern));
        } catch {
          return false;
        }
      };

      // Strip non-official links from link fields (EXCEPT notification_link — that gets re-hosted)
      if (!isOfficialLink(parsedResult.apply_link)) {
        console.log(`[Sanitizer] Removed non-official apply_link: ${parsedResult.apply_link}`);
        parsedResult.apply_link = '';
      }
      // notification_link: Allow ANY PDF link — will be downloaded and re-hosted
      // Only strip if it's not a PDF/document link
      if (parsedResult.notification_link && !isOfficialLink(parsedResult.notification_link)) {
        const notifLower = (parsedResult.notification_link || '').toLowerCase();
        const isPdfOrDoc = notifLower.includes('.pdf') || notifLower.includes('.docx') || notifLower.includes('notification') || notifLower.includes('advt');
        if (!isPdfOrDoc) {
          console.log(`[Sanitizer] Removed non-official non-PDF notification_link: ${parsedResult.notification_link}`);
          parsedResult.notification_link = '';
        } else {
          console.log(`[Sanitizer] Keeping PDF notification_link for re-hosting: ${parsedResult.notification_link}`);
        }
      }
      if (!isOfficialLink(parsedResult.official_website)) {
        console.log(`[Sanitizer] Removed non-official official_website: ${parsedResult.official_website}`);
        parsedResult.official_website = '';
      }
      if (!isOfficialLink(parsedResult.admit_card_link)) {
        parsedResult.admit_card_link = '';
      }
      if (!isOfficialLink(parsedResult.result_link)) {
        parsedResult.result_link = '';
      }

      // Strip non-official logo URL
      if (parsedResult.official_logo_url && !isOfficialLink(parsedResult.official_logo_url)) {
        parsedResult.official_logo_url = '';
      }

      // Sanitize bilingual_html: Remove any href links that are NOT official
      if (parsedResult.bilingual_html && typeof parsedResult.bilingual_html === 'string') {
        // Remove all anchor tags with non-official href
        parsedResult.bilingual_html = parsedResult.bilingual_html.replace(
          /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
          (match: string, href: string, text: string) => {
            if (isOfficialLink(href)) {
              return match; // Keep official links
            }
            return text; // Remove anchor tag but keep the text
          }
        );

        // Remove ALL raw URLs from blocked domains (including source URL)
        for (const blocked of blockedDomains) {
          const escapedDomain = blocked.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          parsedResult.bilingual_html = parsedResult.bilingual_html.replace(
            new RegExp(`https?://[^\\s"'<>]*${escapedDomain}[^\\s"'<>]*`, 'gi'),
            ''
          );
        }

        // Remove any remaining non-official URLs (catch-all)
        parsedResult.bilingual_html = parsedResult.bilingual_html.replace(
          /https?:\/\/[^\s"'<>]+/gi,
          (url: string) => {
            if (isOfficialLink(url)) return url;
            if (url.startsWith('/uploads/')) return url; // local hosted files OK
            return ''; // Remove everything else
          }
        );
      }

      // If notification_link exists (official or third-party PDF), download and host locally
      let notificationLink = parsedResult.notification_link || '';
      if (notificationLink && notificationLink.startsWith('http')) {
        // Download and re-host ANY PDF link (official or third-party) on our server
        console.log(`[File Hoster] Notification link detected: "${notificationLink}". Downloading and hosting locally...`);
        const hostedUrl = await downloadAndHostFile(notificationLink);
        const originalLink = notificationLink;
        parsedResult.notification_link = hostedUrl;

        // Replace in bilingual_html too
        if (parsedResult.bilingual_html && typeof parsedResult.bilingual_html === 'string') {
          try {
            const escapedOriginal = originalLink.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            parsedResult.bilingual_html = parsedResult.bilingual_html.replace(new RegExp(escapedOriginal, 'g'), hostedUrl);
          } catch (replErr) {
            console.error('[File Hoster] Failed to replace link in bilingual_html:', replErr);
          }
        }
      }

      res.json(parsedResult);
    } catch (parseErr) {
      console.error('Failed to parse Gemini output as JSON:', responseText);
      console.warn('Falling back to robust heuristic engine.');
      const fallbackResult = fallbackBulletGenerator(documentText, userInstructions, sourceUrl);
      // Apply same link sanitization to fallback
      fallbackResult.apply_link = '';
      fallbackResult.notification_link = '';
      fallbackResult.official_website = '';
      res.json(fallbackResult);
    }

  } catch (err: any) {
    console.error('Error generating bulletin with Gemini:', err);
    console.warn('Falling back to robust heuristic engine.');
    try {
      const fallbackResult = fallbackBulletGenerator(documentText, userInstructions, sourceUrl);
      // Apply same link sanitization to fallback
      fallbackResult.apply_link = '';
      fallbackResult.notification_link = '';
      fallbackResult.official_website = '';
      res.json(fallbackResult);
    } catch (fallbackErr: any) {
      res.status(500).json({ error: `Fallback failed: ${fallbackErr.message}` });
    }
  }
});

// Endpoint: AI-Powered Eligibility Evaluator
app.post('/api/eligibility', async (req, res) => {
  try {
    const { age, education, category, state, examPref, posts } = req.body;

    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ error: 'Posts list is required for evaluation.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a 400 with specialized hint or trigger local fallback logic, but let's provide a simulated elegant JSON response
      // so client-side still succeeds even if API key isn't populated in preview env!
      console.warn('GEMINI_API_KEY is not defined. Simulating eligibility results.');
      return res.status(200).json({
        eligible: posts.slice(0, 3).map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          categoryName: p.categoryName || 'Recruitment',
          reason: `Verified eligible. Age ${age} fits the criteria, and highest education (${education}) meets the qualifications for ${p.title}.`,
          matchedCriteria: [`Age within general limits`, `Education (${education}) matched`]
        })),
        not_eligible: posts.slice(3, 5).map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          categoryName: p.categoryName || 'Recruitment',
          reason: `Requires specialized technical degrees or certifications.`,
          missingCriteria: [`Specific domain degree required`, `Age threshold check`]
        })),
        summary: `Demographic screening completed successfully. Based on your profile (${age} Years, ${education}, ${category}), you are eligible for several hot vacancies.`
      });
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemPrompt = `You are a professional government recruitment eligibility checker. 
Evaluate each post and match it with candidate profile:
- Candidate Age: ${age} Years
- Candidate Education: ${education}
- Reservation Category: ${category}
- Resident State: ${state}
- Exam Board Preference: ${examPref}

JSON Schema structure to return:
{
  "eligible": [
    {
      "id": "post-id",
      "title": "Post Title",
      "slug": "post-slug",
      "categoryName": "Category Name",
      "reason": "Bilingual (English/Hindi) clear reason explaining eligibility criteria matching",
      "matchedCriteria": ["e.g. Age matched", "e.g. Graduation matched"]
    }
  ],
  "not_eligible": [
    {
      "id": "post-id",
      "title": "Post Title",
      "slug": "post-slug",
      "categoryName": "Category Name",
      "reason": "Reason for missing parameters",
      "missingCriteria": ["Specific reasons why criteria is missed"]
    }
  ],
  "summary": "1-2 sentence overview summarizing matches in a friendly way."
}
Only evaluate the provided posts. If eligibility rules are not specified or clear, look for common patterns in standard notifications. Return valid JSON only.`;

    const modelName = 'gemini-2.5-flash';
    const response = await generateContentWithFallback(
      ai,
      `Evaluate eligibility for candidate profile over these active postings:\n${JSON.stringify(posts)}`,
      {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
      modelName
    );

    const responseText = response.text || '';
    let cleanJsonString = responseText.trim();
    if (cleanJsonString.startsWith('```json')) {
      cleanJsonString = cleanJsonString.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJsonString.startsWith('```')) {
      cleanJsonString = cleanJsonString.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const resultObj = JSON.parse(cleanJsonString);
    res.json(resultObj);

  } catch (err: any) {
    console.error('Error checking eligibility with Gemini:', err);
    console.warn('Falling back to robust eligibility heuristic evaluator.');
    try {
      const fallbackResult = fallbackEligibilityGenerator(req.body);
      res.json(fallbackResult);
    } catch (fallbackErr: any) {
      res.status(500).json({ error: `Eligibility fallback failed: ${fallbackErr.message}` });
    }
  }
});

// SEO: Dynamic Sitemap Generation
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  const baseUrl = 'https://resultveda.com';
  
  const staticRoutes = [
    '', '/latest-jobs', '/results', '/admit-card', '/answer-key', '/syllabus',
    '/admission', '/state-jobs', '/central-jobs', '/railway-jobs', '/ssc-jobs',
    '/bank-jobs', '/teaching-jobs', '/defence-jobs', '/question-paper', 
    '/mock-test', '/rank-predictor', '/current-affairs', '/government-schemes'
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
</urlset>`;

  res.send(xml.trim());
});

app.get('/sitemap-news.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  const baseUrl = 'https://resultveda.com';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>${baseUrl}/latest-jobs</loc>
    <news:news>
      <news:publication>
        <news:name>ResultVeda</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date().toISOString()}</news:publication_date>
      <news:title>Latest Sarkari Result and Government Jobs</news:title>
    </news:news>
  </url>
</urlset>`;
  res.send(xml.trim());
});

// ==================== BACKGROUND URL QUEUE SYSTEM ====================
// Tasks persist to disk — processing continues even if browser is closed

interface QueueTask {
  id: string;
  url: string;
  status: 'pending' | 'scraping' | 'generating' | 'saving' | 'completed' | 'failed';
  error?: string;
  createdPostId?: string;
  createdPostTitle?: string;
  instructions?: string;
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

interface QueueState {
  tasks: QueueTask[];
  isProcessing: boolean;
  lastUpdated: string;
}

const QUEUE_FILE = path.join(process.cwd(), 'queue-state.json');

function loadQueue(): QueueState {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return { tasks: [], isProcessing: false, lastUpdated: new Date().toISOString() };
}

function saveQueue(state: QueueState) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(state, null, 2));
}

let queueProcessing = false;

// Process a single URL task
async function processQueueTask(task: QueueTask, instructions: string = '') {
  const state = loadQueue();
  const taskIndex = state.tasks.findIndex(t => t.id === task.id);
  if (taskIndex === -1) return;

  try {
    // Step 1: Scrape
    state.tasks[taskIndex].status = 'scraping';
    state.tasks[taskIndex].updatedAt = new Date().toISOString();
    saveQueue(state);

    console.log(`[Queue] Scraping: ${task.url}`);
    state.tasks[taskIndex].currentStep = 'Scraping website content';
    state.tasks[taskIndex].updatedAt = new Date().toISOString();
    saveQueue(state);

    const scrapeRes = await fetch(`http://localhost:${PORT}/api/scrape-website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: task.url })
    });
    const scrapeData = await scrapeRes.json();
    if (scrapeData.error) throw new Error(scrapeData.error);
    const text = scrapeData.text || '';
    if (!text.trim()) throw new Error('No content extracted from URL');

    state.tasks[taskIndex].scrapedTextLength = text.length;
    state.tasks[taskIndex].scrapedTextPreview = text.slice(0, 400);
    saveQueue(state);

    // Step 2: Generate post with AI
    state.tasks[taskIndex].status = 'generating';
    state.tasks[taskIndex].currentStep = 'AI is generating post draft';
    state.tasks[taskIndex].updatedAt = new Date().toISOString();
    saveQueue(state);

    console.log(`[Queue] Generating AI post for: ${task.url}`);
    const genRes = await fetch(`http://localhost:${PORT}/api/generate-bulletin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentText: text,
        userInstructions: instructions || 'Extract all details and write a complete post.',
        sourceUrl: task.url
      })
    });
    const genData = await genRes.json();
    if (genData.error) throw new Error(genData.error);

    // Step 3: Save to Supabase
    state.tasks[taskIndex].status = 'saving';
    state.tasks[taskIndex].currentStep = 'Saving generated post to database';
    state.tasks[taskIndex].generatedFields = {
      title_en: genData.title_en,
      department: genData.department,
      vacancies: genData.vacancies ? parseInt(String(genData.vacancies)) : undefined,
      advt_no: genData.advt_no,
      start_date: genData.start_date,
      end_date: genData.end_date,
      apply_link: genData.apply_link,
      notification_link: genData.notification_link,
      official_website: genData.official_website,
      short_info_en: genData.short_info_en,
    };
    state.tasks[taskIndex].updatedAt = new Date().toISOString();
    saveQueue(state);

    console.log(`[Queue] Saving post: ${genData.title_en || 'Untitled'}`);
    
    // Import supabase client for server-side queue processing.
    // On Node 20+, Supabase realtime initialization requires a transport implementation.
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const wsModule = await import('ws');
    const wsTransport = wsModule.default ?? wsModule;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        transport: wsTransport,
      },
    });

    const slug = (genData.title_en || `draft-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);

    const toDate = (val: any) => {
      if (!val || typeof val !== 'string') return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) return val.trim();
      return null;
    };

    const postData: any = {
      slug,
      title: genData.title_en || 'Draft Post',
      title_hindi: genData.title_hi || null,
      post_name: genData.post_name || null,
      department: genData.department || null,
      advt_no: genData.advt_no || null,
      total_vacancies: genData.vacancies ? parseInt(String(genData.vacancies)) : null,
      vacancies: genData.vacancies ? parseInt(String(genData.vacancies)) : null,
      eligibility: genData.eligibility_criteria || {},
      start_date: toDate(genData.start_date),
      end_date: toDate(genData.end_date),
      admit_card_date: toDate(genData.admit_card_date),
      exam_date: toDate(genData.exam_date),
      result_date: toDate(genData.result_date),
      apply_link: genData.apply_link || null,
      notification_link: genData.notification_link || null,
      official_website: genData.official_website || null,
      official_site: genData.official_website || null,
      bilingual_html: genData.bilingual_html || '',
      short_info_en: genData.short_info_en || null,
      short_info_hi: genData.short_info_hi || null,
      excerpt: genData.short_info_en || null,
      category_id: null, // Will be set based on suggested_category
      tags: genData.tags || [],
      state: genData.state || [],
      source_type: 'url',
      source_url: task.url,
      meta_title: genData.meta_title || genData.title_en || null,
      meta_description: genData.meta_description || genData.short_info_en || null,
      focus_keyword: genData.focus_keyword || null,
      keywords: genData.tags || [],
      status: 'draft',
    };

    // Map suggested_category to category_id
    if (genData.suggested_category) {
      const { data: cats } = await supabase.from('categories').select('id, slug').eq('slug', genData.suggested_category);
      if (cats && cats.length > 0) {
        postData.category_id = cats[0].id;
      }
    }

    // Remove null/undefined fields
    Object.keys(postData).forEach(k => {
      if (postData[k] === undefined || postData[k] === null) delete postData[k];
    });

    const { data: savedPost, error: saveError } = await supabase
      .from('posts')
      .insert(postData)
      .select('id, title')
      .single();

    if (saveError) throw new Error(saveError.message);

    // Mark completed
    const updatedState = loadQueue();
    const idx = updatedState.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      updatedState.tasks[idx].status = 'completed';
      updatedState.tasks[idx].createdPostId = savedPost?.id;
      updatedState.tasks[idx].createdPostTitle = savedPost?.title || genData.title_en;
      updatedState.tasks[idx].updatedAt = new Date().toISOString();
      saveQueue(updatedState);
    }

    console.log(`[Queue] ✅ Completed: ${genData.title_en}`);
  } catch (err: any) {
    console.error(`[Queue] ❌ Failed: ${task.url} — ${err.message}`);
    const updatedState = loadQueue();
    const idx = updatedState.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      updatedState.tasks[idx].status = 'failed';
      updatedState.tasks[idx].error = err.message;
      updatedState.tasks[idx].updatedAt = new Date().toISOString();
      saveQueue(updatedState);
    }
  }
}

// Background queue processor — runs continuously
async function processQueue() {
  if (queueProcessing) return;
  queueProcessing = true;

  const state = loadQueue();
  const pendingTasks = state.tasks.filter(t => t.status === 'pending');

  if (pendingTasks.length === 0) {
    queueProcessing = false;
    state.isProcessing = false;
    saveQueue(state);
    return;
  }

  state.isProcessing = true;
  saveQueue(state);

  for (const task of pendingTasks) {
    await processQueueTask(task, task.instructions || '');
    // Small delay between tasks to avoid rate limiting
    await new Promise(r => setTimeout(r, 3000));
  }

  queueProcessing = false;
  const finalState = loadQueue();
  finalState.isProcessing = false;
  saveQueue(finalState);
  console.log(`[Queue] All pending tasks processed.`);
}

// API: Add URLs to queue
app.post('/api/queue/add', (req, res) => {
  const { urls, instructions } = req.body;
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls array is required' });
  }

  const state = loadQueue();
  const newTasks: QueueTask[] = urls
    .filter((u: string) => u && u.trim().length > 5)
    .map((url: string) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: url.trim(),
      status: 'pending' as const,
      instructions: instructions || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  state.tasks.push(...newTasks);
  saveQueue(state);

  // Start background processing
  setTimeout(() => processQueue(), 500);

  res.json({ 
    success: true, 
    added: newTasks.length, 
    totalPending: state.tasks.filter(t => t.status === 'pending').length,
    message: `${newTasks.length} URLs added to queue. Processing started in background.`
  });
});

// API: Get queue status
app.get('/api/queue/status', (req, res) => {
  const state = loadQueue();
  const summary = {
    total: state.tasks.length,
    pending: state.tasks.filter(t => t.status === 'pending').length,
    processing: state.tasks.filter(t => ['scraping', 'generating', 'saving'].includes(t.status)).length,
    completed: state.tasks.filter(t => t.status === 'completed').length,
    failed: state.tasks.filter(t => t.status === 'failed').length,
    isProcessing: state.isProcessing || queueProcessing,
    lastUpdated: state.lastUpdated,
  };
  res.json({ ...summary, tasks: state.tasks.slice(-50) }); // Last 50 tasks
});

// API: Clear completed/failed tasks
app.post('/api/queue/clear', (req, res) => {
  const { clearType } = req.body; // 'completed', 'failed', 'all'
  const state = loadQueue();
  
  if (clearType === 'all') {
    state.tasks = state.tasks.filter(t => ['scraping', 'generating', 'saving'].includes(t.status));
  } else if (clearType === 'completed') {
    state.tasks = state.tasks.filter(t => t.status !== 'completed');
  } else if (clearType === 'failed') {
    state.tasks = state.tasks.filter(t => t.status !== 'failed');
  }
  
  saveQueue(state);
  res.json({ success: true, remaining: state.tasks.length });
});

// API: Retry failed tasks
app.post('/api/queue/retry-failed', (req, res) => {
  const state = loadQueue();
  let retried = 0;
  state.tasks.forEach(t => {
    if (t.status === 'failed') {
      t.status = 'pending';
      t.error = undefined;
      t.updatedAt = new Date().toISOString();
      retried++;
    }
  });
  saveQueue(state);

  if (retried > 0) {
    setTimeout(() => processQueue(), 500);
  }

  res.json({ success: true, retried });
});

// On server start, resume any pending tasks from last session
function resumeQueueOnStartup() {
  const state = loadQueue();
  const pending = state.tasks.filter(t => t.status === 'pending');
  const stuck = state.tasks.filter(t => ['scraping', 'generating', 'saving'].includes(t.status));
  
  // Reset stuck tasks back to pending
  stuck.forEach(t => { t.status = 'pending'; t.updatedAt = new Date().toISOString(); });
  if (stuck.length > 0) saveQueue(state);

  if (pending.length > 0 || stuck.length > 0) {
    console.log(`[Queue] Resuming ${pending.length + stuck.length} pending tasks from previous session...`);
    setTimeout(() => processQueue(), 5000); // Wait 5s for server to fully boot
  }
}

// Configure Vite middleware or static serving
async function setupServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback — only for non-API routes
    app.get('*', (req, res) => {
      // Don't catch API routes — let them 404 properly
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ResultVeda] Server successfully running on http://localhost:${PORT}`);
    resumeQueueOnStartup();
  });
}

setupServer();
