import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function testGeminiSearch() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.log('No API KEY'); return; }

  const ai = new GoogleGenAI({ apiKey });
  const url = 'https://www.sarkariresult.com/railway/rrb-technician-cen-02-2026/';
  
  const systemPrompt = `You are an expert Sarkari Exam Notification Analyst and Content Writer. Your task is to extract job recruitment details from the official government notifications text and convert them into a structured JSON payload ready to be saved in our ResultVeda portal database.

STRICT DESIGN & CONTENT RULES (English-Only Short Blog Posts, Hidden Tags & Accuracy):
1. ENGLISH ONLY POSTS: All main text, fee matrix, age limits, and qualification tables MUST be generated strictly in English. This reduces token overhead and keeps the content highly professional.
2. NO HINDI MANUAL BULLETIN: Do NOT write any manual bulletin in Hindi or bilingual text in the main body. Instead, write a highly optimized, lightweight Short Blog Post in English (1-2 crisp paragraphs) at the very beginning of "bilingual_html" containing primary job-related keywords (such as the vacancy name, department, registration procedures) to ensure lightning-fast Google indexation and ranking.
3. HIDDEN REGIONAL & SEO SEARCH TAGS: To maximize regional search discoverability without cluttering the UI, generate a rich list of at least 15 regional search tags in English, Hindi (Devnagari), and Hinglish (e.g. "sarkari naukri", "latest vacancy", "ssc bharti", "sarkari result"). Put these tags at the very bottom of the "bilingual_html" block, and MUST wrap them inside a container with the class "sr-only opacity-0 pointer-events-none select-none h-0 w-0 overflow-hidden absolute" so that they are 100% hidden from human visitors but perfectly crawlable by Google Bot crawler.
4. TRANSLATION ECONOMY: Even for the "title_hi" and "short_info_hi" fields, use clean, readable English or simplified bilingual Hinglish (phonetic) text to save AI tokens (e.g. "SSC CGL Recruitment Online Form 2026").
5. ABSOLUTE ACCURACY & TIME DOUBLE-CHECK: Thoroughly verify and crosscheck all vacancy numbers, fees, age criteria, and especially examine dates against the current year/notification text to ensure zero inaccuracy. Job details must be 100% accurate.
6. OFFICIAL NOTIFICATION LINKS: Generally try to discover and extract official government PDF notification links (e.g. from domains ending in .gov.in, .nic.in, etc.). If no official government link is available, and only third-party/unofficial links (like private blog uploads or third-party PDF file links) are found, provide that link in "notification_link". Our background server will automatically detect it and download/re-host it locally to eliminate watermark and copyright issues from other websites.

Return a valid, parsed JSON object matching this schema precisely:
{
  "title_en": "Main headlines in English, highly optimized for SEO.",
  "title_hi": "Headlines in English/Hinglish.",
  "post_name": "Job Designation.",
  "department": "Department Name.",
  "advt_no": "Advertisement Number.",
  "vacancies": 100,
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "admit_card_date": null,
  "exam_date": null,
  "result_date": null,
  "apply_link": "",
  "notification_link": "",
  "admit_card_link": "",
  "result_link": "",
  "official_website": "",
  "short_info_en": "Short overview.",
  "short_info_hi": "Short overview.",
  "state": ["State 1", "State 2"],
  "level": "National/State",
  "eligibility_criteria": {
    "education": ["Degree/Diploma details"],
    "age_limit": "Age details",
    "other": ["Other criteria"]
  },
  "bilingual_html": "Rich styled HTML string..."
}

CRITICAL RULES for 'bilingual_html' block:
1. Start with a clean, lightweight Short Blog Post (1-2 paragraphs) in English describing the vacancy details, how to fill the form, and a brief overview. Wrap it in a styled div container:
   <div class="mb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
     <p>[Paragraph 1 details...]</p>
     <p>[Paragraph 2 details...]</p>
   </div>
2. Wrap fee matrix and age criteria inside a 2-column grid layout on desktop:
   <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
     <div class="card p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
       <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 text-sm">💰 Application Fees</h3>
       <ul class="list-disc pl-4 mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
         <li><strong>General / OBC / EWS:</strong> ₹ [Amount]</li>
         <li><strong>SC / ST / PH:</strong> ₹ [Amount]</li>
         <li><strong>Female Candidates:</strong> ₹ [Amount]</li>
         <li><em>[Payment details]</em></li>
       </ul>
     </div>
     <div class="card p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
       <h3 class="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 text-sm">🕒 Age Limits (As of [Cut-off Date])</h3>
       <ul class="list-disc pl-4 mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
         <li><strong>Minimum Age:</strong> [Min] Years</li>
         <li><strong>Maximum Age:</strong> [Max] Years</li>
         <li><em>[Age relaxation details]</em></li>
       </ul>
     </div>
   </div>
3. Below the grid, add the Educational Qualification & Eligibility details inside a clean responsive card table:
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
           <!-- Dynamic rows populated from parsed document -->
           <tr>
             <td class="p-2 font-semibold">[Post Name]</td>
             <td class="p-2">[X] Posts</td>
             <td class="p-2">[Details of degree, physical criteria, stream requirement, diploma, etc.]</td>
           </tr>
         </tbody>
       </table>
     </div>
   </div>
4. At the very bottom of the 'bilingual_html' block, add the Multilingual Search Keywords & Tags section. To keep the post light and clean, you MUST hide this tags section using the specific 'sr-only' and hiding classes so that human users never see them, but search engine crawlers and bots can index them:
   <div class="sr-only opacity-0 pointer-events-none select-none h-0 w-0 overflow-hidden absolute" aria-hidden="false">
     <h2>🏷️ Regional Search, Keywords & Indexing Tags for Googlebot crawling:</h2>
     <div class="flex flex-wrap gap-1.5">
       <span class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium border border-indigo-100 dark:border-indigo-900/30">[English Keyword]</span>
       <span class="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded text-[10px] font-medium border border-slate-150 dark:border-slate-800">[Hindi Keyword in Devnagari]</span>
       <span class="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded text-[10px] font-medium border border-teal-100 dark:border-teal-900/30">[Hinglish Keyword]</span>
       <!-- Add at least 15 highly relevant regional keywords (e.g. ssc bharti, ssc naukri, sarkari result, ssc apply online, bharti, bharti alert, vacancy details) -->
     </div>
   </div>

Ensure all details like deadlines, application fee, age limit, educational streams, and physical standards (if any, like height/chest) are accurately represented. Ensure the text is natural, grammatically correct, and professional. Double-check all dates and fees for correctness.`;

  try {
    const userPrompt = `The website scraping was blocked. Use your Google Search tool to search for the following URL:
"${url}"
After searching and retrieving the latest job/recruitment details for that specific post from the website, fulfill the system prompt instructions based on what you found.

IMPORTANT: You MUST return a valid JSON object only. Do NOT wrap the JSON in Markdown or backticks. Return raw JSON text.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemPrompt
      }
    });
    console.log(response.text);
  } catch(e: any) { console.log('Err:', e.message); }
}
testGeminiSearch();
