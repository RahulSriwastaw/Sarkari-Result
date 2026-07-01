import React from 'react';
import SEO from '../../components/SEO';
import SalaryCalculator from '../../components/SalaryCalculator';
import { Calculator, Info, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SalaryCalculatorPage() {
  const faqData = [
    {
      question: "How is the government job salary calculated?",
      answer: "The salary is calculated based on the 7th Pay Commission norms, including Basic Pay, Dearness Allowance (DA), House Rent Allowance (HRA), and various deductions like NPS and Tax."
    },
    {
      question: "What is the current DA rate for 2026?",
      answer: "The DA rate is revised semi-annually by the central government. Our calculator uses the latest projected rates to give you an accurate estimate."
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
        "name": "Expected Salary Calculator",
        "item": "https://resultveda.com/expected-salary-calculator"
      }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SEO 
        title="Expected Salary Calculator 2026: Calculate In-Hand Govt Job Salary - ResultVeda"
        description="Estimate your government job in-hand salary based on the 7th Pay Commission. Calculate Basic Pay, DA, HRA, and NPS deductions accurately."
        canonical="/expected-salary-calculator"
        faq={faqData}
        schema={breadcrumbSchema}
      />

      {/* Header section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
          <Calculator className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Expected Salary Calculator 2026
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Planning your career in the government sector? Use our professional 7th Pay Commission tool to estimate your monthly take-home pay based on your post and city category.
        </p>
      </div>

      {/* Main Calculator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
        <div className="p-6 md:p-10">
          <SalaryCalculator />
        </div>
      </div>

      {/* Informational Content for SEO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-primary" /> How it Works
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-2"><span>•</span> <strong>Basic Pay:</strong> The foundation of your salary based on Level.</li>
            <li className="flex gap-2"><span>•</span> <strong>DA:</strong> Current percentage of Basic Pay provided for inflation.</li>
            <li className="flex gap-2"><span>•</span> <strong>HRA:</strong> Based on city category (X, Y, or Z).</li>
            <li className="flex gap-2"><span>•</span> <strong>Deductions:</strong> Standard NPS (Basic+DA) 10% and insurance.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-primary" /> FAQ
          </h2>
          <div className="space-y-4">
            {faqData.map((item, index) => (
              <div key={index}>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.question}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center pt-8">
        <Link to="/latest-jobs" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
          Browse Latest Government Jobs <Calculator className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
