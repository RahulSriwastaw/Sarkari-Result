import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How do I search for a specific government job?',
    answer: 'You can use the search bar at the top of the portal. Enter keywords like the department name, job title, or location to find relevant listings. You can also filter by categories like Latest Jobs, Results, or Admit Cards.',
  },
  {
    question: 'How does the Gemini AI Eligibility Checker work?',
    answer: 'The AI Eligibility Checker takes your basic profile details (age, education level, and category) and matches them against the complex requirements of active government job postings to tell you which exams you are eligible to take.',
  },
  {
    question: 'How frequently is the portal updated?',
    answer: 'The portal is updated daily with the latest notifications, admit cards, and results from official government sources like SSC, UPSC, IBPS, and state boards.',
  },
  {
    question: 'How can I save jobs to view them later?',
    answer: 'You can click the bookmark icon on any job card. This will save the job to your Profile. You can access your saved jobs by clicking the user icon in the top navigation bar.',
  },
  {
    question: 'Are the notifications provided on this site official?',
    answer: 'While we aggregate information from official sources to make it easier to discover and track, always refer to the official government notification PDF provided in each job post before applying.',
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mt-8 mb-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Common queries from our student community</p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-200 ${
              openIndex === index ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
            }`}
          >
            <button
              className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
              onClick={() => toggleFAQ(index)}
            >
              <span className="font-semibold text-sm text-slate-800 dark:text-white pr-8">
                {faq.question}
              </span>
              <ChevronDown 
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                  openIndex === index ? 'rotate-180 text-indigo-500' : ''
                }`} 
              />
            </button>
            
            <div 
              className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? 'max-h-48 pb-4 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
