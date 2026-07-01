import { Link } from 'react-router-dom';
import { Briefcase, ShieldCheck, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Main Grid — 5 columns on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pb-6 border-b border-slate-800">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-2">
            <Link to="/" className="flex items-center gap-1.5">
              <span className="w-7 h-7 flex items-center justify-center bg-primary rounded-lg text-white font-bold text-sm">R</span>
              <span className="font-bold text-base text-white">Result<span className="text-primary">Veda</span></span>
            </Link>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              India's fastest government job alert portal — results, admit cards, vacancies & notifications sabse pehle.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live Updates Active
            </div>
          </div>

          {/* Jobs */}
          <div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">
              <Briefcase className="w-3 h-3 text-primary inline mr-1" />Jobs
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/category/ssc" className="hover:text-primary transition-colors">SSC Exams</Link></li>
              <li><Link to="/category/railway" className="hover:text-primary transition-colors">Railway Jobs</Link></li>
              <li><Link to="/category/banking" className="hover:text-primary transition-colors">Bank Exams</Link></li>
              <li><Link to="/category/upsc" className="hover:text-primary transition-colors">UPSC / IAS</Link></li>
              <li><Link to="/category/state-psc" className="hover:text-primary transition-colors">State PSC</Link></li>
              <li><Link to="/category/defence" className="hover:text-primary transition-colors">Defence Jobs</Link></li>
            </ul>
          </div>

          {/* Results & Cards */}
          <div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Results</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/results" className="hover:text-primary transition-colors">Latest Results</Link></li>
              <li><Link to="/admit-card" className="hover:text-primary transition-colors">Admit Cards</Link></li>
              <li><Link to="/category/answer-key" className="hover:text-primary transition-colors">Answer Keys</Link></li>
              <li><Link to="/category/syllabus" className="hover:text-primary transition-colors">Syllabus</Link></li>
              <li><Link to="/latest-jobs" className="hover:text-primary transition-colors">Latest Jobs</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Links</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Use</Link></li>
            </ul>
          </div>

          {/* Subscribe */}
          <div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Subscribe</h4>
            <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }}>
              <input
                type="email"
                placeholder="Your email..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-[11px] px-2.5 py-1.5 rounded focus:outline-none focus:border-primary"
                required
              />
              <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white text-[11px] px-2.5 py-1.5 rounded font-semibold transition-colors">
                Get Job Alerts
              </button>
            </form>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2">
              <Mail className="w-3 h-3 text-primary" />
              support@resultveda.com
            </div>
          </div>
        </div>

        {/* Disclaimer — compact */}
        <div className="py-4 border-b border-slate-800">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            <ShieldCheck className="w-3 h-3 text-primary inline mr-1 -mt-0.5" />
            <strong className="text-slate-400">Disclaimer:</strong> Content on ResultVeda.com is for informational purposes only and is not a legal or official document. We do not guarantee accuracy — verify from official government websites before acting. ResultVeda is not responsible for errors, omissions, or losses. <strong className="text-slate-400">ResultVeda™</strong> brand & content are protected under applicable IP laws. This website is <strong className="text-slate-400">NOT affiliated with any government body</strong>. All govt. names/logos belong to their respective owners.
          </p>
        </div>

        {/* Copyright */}
        <div className="pt-4 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2024-{currentYear} ResultVeda™ — All rights reserved.</p>
          <p className="text-slate-600">Made with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
}
