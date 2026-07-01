import React, { useState } from 'react';
import { IndianRupee, Calculator, ChevronDown, MapPin, Briefcase } from 'lucide-react';

const PAY_LEVELS = [
  { level: 1, grade: '1800', basic: 18000 },
  { level: 2, grade: '1900', basic: 19900 },
  { level: 3, grade: '2000', basic: 21700 },
  { level: 4, grade: '2400', basic: 25500 },
  { level: 5, grade: '2800', basic: 29200 },
  { level: 6, grade: '4200', basic: 35400 },
  { level: 7, grade: '4600', basic: 44900 },
  { level: 8, grade: '4800', basic: 47600 },
  { level: 9, grade: '5400', basic: 53100 },
  { level: 10, grade: '5400', basic: 56100 },
];

const CITIES = [
  { id: 'X', name: 'X Class (Metros)', hra: 0.30 },
  { id: 'Y', name: 'Y Class (Cities)', hra: 0.20 },
  { id: 'Z', name: 'Z Class (Towns/Villages)', hra: 0.10 },
];

export default function SalaryCalculator() {
  const [selectedLevel, setSelectedLevel] = useState(PAY_LEVELS[5]);
  const [selectedCity, setSelectedCity] = useState(CITIES[1]);
  
  const daRate = 0.50; // 50% DA as per current trends
  
  const calculateSalary = () => {
    const basic = selectedLevel.basic;
    const da = basic * daRate;
    const hra = basic * selectedCity.hra;
    
    // Transport Allowance (approximate for Class X/Y vs Z)
    let taBasic = 1350;
    if (selectedLevel.level >= 3 && selectedLevel.level <= 8) taBasic = 3600;
    if (selectedLevel.level >= 9) taBasic = 7200;
    
    if (selectedCity.id === 'Z') {
        if (selectedLevel.level <= 2) taBasic = 900;
        else if (selectedLevel.level <= 8) taBasic = 1800;
        else taBasic = 3600;
    }
    
    const ta = taBasic + (taBasic * daRate);
    const gross = basic + da + hra + ta;
    
    // NPS deduction (10% of basic + DA)
    const nps = (basic + da) * 0.10;
    // CGHS (Central Gov Health Scheme) approx
    let cghs = 250;
    if (selectedLevel.level >= 6) cghs = 450;
    if (selectedLevel.level >= 7) cghs = 650;
    if (selectedLevel.level >= 10) cghs = 1000;
    
    const cgegis = selectedLevel.level <= 5 ? 30 : 60;
    const deduction = nps + cghs + cgegis;
    const inHand = gross - deduction;

    return {
      basic,
      da,
      hra,
      ta,
      gross,
      deduction,
      inHand
    };
  };

  const salary = calculateSalary();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 mt-4 mb-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Expected Salary Calculator</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Estimate your in-hand monthly salary based on 7th CPC standard pay scales</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Pay Level / Grade Pay
            </label>
            <div className="relative">
              <select
                value={selectedLevel.level}
                onChange={(e) => setSelectedLevel(PAY_LEVELS.find(p => p.level === parseInt(e.target.value)) || PAY_LEVELS[0])}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow cursor-pointer"
              >
                {PAY_LEVELS.map(p => (
                  <option key={p.level} value={p.level}>
                    Level {p.level} (Grade Pay: ₹{p.grade}) - Basic: ₹{p.basic.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Posting Location (City Class)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CITIES.map(city => (
                <button
                  key={city.id}
                  onClick={() => setSelectedCity(city)}
                  className={`flex flex-col items-center justify-center text-center p-2.5 rounded-lg border text-xs transition-all ${
                    selectedCity.id === city.id 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-bold' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="block mb-0.5 text-sm">{city.id} Class</span>
                  <span className="text-[10px] opacity-80 font-normal leading-tight">{city.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Output */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 md:p-5 border border-slate-200 dark:border-slate-700/50 space-y-4 shadow-inner">
          <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-700 pb-3">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Estimated In-Hand</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center">
                <IndianRupee className="w-5 h-5 sm:w-7 sm:h-7 mr-0.5" strokeWidth={3} />
                {Math.round(salary.inHand).toLocaleString('en-IN')}
                <span className="text-xs font-medium text-slate-500 ml-1.5 self-end mb-1.5">/ mo</span>
              </h3>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">Gross: ₹{Math.round(salary.gross).toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">Ded: -₹{Math.round(salary.deduction).toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Basic Pay</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₹{Math.round(salary.basic).toLocaleString('en-IN')}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400">DA (50%)</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₹{Math.round(salary.da).toLocaleString('en-IN')}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400">HRA ({selectedCity.hra * 100}%)</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₹{Math.round(salary.hra).toLocaleString('en-IN')}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400">TA (incl. DA)</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₹{Math.round(salary.ta).toLocaleString('en-IN')}</span>
             </div>
          </div>
          
          <div className="pt-2">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic leading-snug">
               *Note: These are estimated figures. Actual salary may vary by department, specific allowances, deductions, and tax bracket.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
