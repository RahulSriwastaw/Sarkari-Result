import { Link } from 'react-router-dom';
import { Award, Briefcase, ExternalLink, ShieldCheck, Mail, Radio } from 'lucide-react';
import NewsletterSubscription from './NewsletterSubscription';
import FAQ from './FAQ';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 transition-colors duration-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* Added FAQ and Newsletter to Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-b border-slate-800 pb-12">
          <div className="bg-slate-800/30 rounded-xl p-1">
             <FAQ />
          </div>
          <div className="bg-slate-800/30 rounded-xl p-1">
             <NewsletterSubscription />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg text-white font-bold text-lg shadow-md shadow-primary/20">
                R
              </span>
              <div>
                <span className="font-bold text-lg text-white">Result</span>
                <span className="font-bold text-lg text-primary">Veda</span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              ResultVeda is India's premier portal for instant government job notification alerts. Providing comprehensive info on exam dates, admit cards, exam results, syllabi, and official keys, sabse pehle.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
              <span className="text-slate-400 font-semibold tracking-wide">Live Result Updates Running</span>
            </div>
          </div>

          {/* Jobs Categories Column */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>Jobs Categories</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/category/ssc" className="hover:text-primary-hover transition-colors">SSC GD & CGL Exams</Link>
              </li>
              <li>
                <Link to="/category/railway" className="hover:text-primary-hover transition-colors">Railway NTPC & RPF Jobs</Link>
              </li>
              <li>
                <Link to="/category/banking" className="hover:text-primary-hover transition-colors">SBI & IBPS Bank Exams</Link>
              </li>
              <li>
                <Link to="/category/upsc" className="hover:text-primary-hover transition-colors">UPSC Civil Services (IAS)</Link>
              </li>
            </ul>
          </div>

          {/* Portal Links Column */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary" />
              <span>Exam Corner</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/results" className="hover:text-primary-hover transition-colors">Latest Results</Link>
              </li>
              <li>
                <Link to="/admit-card" className="hover:text-primary-hover transition-colors">Admit Cards Download</Link>
              </li>
              <li>
                <Link to="/category/answer-key" className="hover:text-primary-hover transition-colors">Official Answer Keys</Link>
              </li>
              <li>
                <Link to="/category/syllabus" className="hover:text-primary-hover transition-colors">Exams Syllabus Guides</Link>
              </li>
            </ul>
          </div>

          {/* Disclaimer / Subscribe */}
          <div className="space-y-4 text-xs text-slate-400">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Subscribe & Disclaimer</span>
            </h3>
            
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); alert('Subscribed to job alerts!'); }}>
              <input 
                type="email" 
                placeholder="Enter your email..." 
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-primary"
                required
              />
              <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded font-bold transition-colors">
                Subscribe
              </button>
            </form>

            <p className="leading-relaxed mt-2">
              This is a private news alert cms application and is NOT affiliated with any government agency. Please verify with the official site before applying.
            </p>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-primary" />
              <span>support@resultveda.com</span>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} ResultVeda. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/veda-admin-6721" className="hover:text-primary transition-colors">Admin Panel</Link>
            <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
