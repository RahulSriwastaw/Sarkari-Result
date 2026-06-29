import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function testGeminiSearch() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.log('No API KEY'); return; }

  const ai = new GoogleGenAI({ apiKey });
  const url = 'https://www.sarkariresult.com/railway/rrb-technician-cen-02-2026/';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Search for the job details at this exact URL and extract all the text content regarding the job post, vacancy details, eligibility, dates, and fees: ${url}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    console.log(response.text);
  } catch(e: any) { console.log('Err:', e.message); }
}
testGeminiSearch();
