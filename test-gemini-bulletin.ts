import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function testGeminiSearch() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.log('No API KEY'); return; }

  const ai = new GoogleGenAI({ apiKey });
  const url = 'https://www.sarkariresult.com/railway/rrb-technician-cen-02-2026/';
  
  const systemPrompt = `You are an independent Sarkari Exam Research Analyst. The URL below is ONLY a reference to identify which job post to research. You must INDEPENDENTLY verify all data and write 100% ORIGINAL content.

ZERO FOOTPRINT RULES:
- NEVER include ANY link from the source URL's website
- ONLY include links from official .gov.in / .nic.in domains
- If no official link found, use empty string ""
- Write completely original content — zero copy from any source

Return a valid JSON object with these fields:
{
  "title_en": "SEO headline",
  "title_hi": "Hinglish headline",
  "post_name": "Official designation",
  "department": "Department name",
  "advt_no": "Advt number",
  "vacancies": number,
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "admit_card_date": null,
  "exam_date": null,
  "result_date": null,
  "apply_link": "Official .gov.in URL only or empty",
  "notification_link": "Official .gov.in PDF only or empty",
  "admit_card_link": "",
  "result_link": "",
  "official_website": "Official .gov.in domain or empty",
  "short_info_en": "2-3 line summary",
  "short_info_hi": "Hinglish summary",
  "state": ["All India"],
  "level": "National",
  "eligibility_criteria": { "education": [], "age_limit": "", "other": [] },
  "bilingual_html": "Original SEO HTML content"
}

Write bilingual_html in natural human language, targeting SEO keywords naturally. Include fees, age limits, qualifications in structured HTML cards.`;

  try {
    const userPrompt = `Use your Google Search tool to research this recruitment post. The URL below is ONLY for identification — do NOT include any link from this website in your output.

Reference URL (for identification only): "${url}"

Research this job independently. Find official .gov.in sources. Write original content. Return ONLY valid raw JSON.`;
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
