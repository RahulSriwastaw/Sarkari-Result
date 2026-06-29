import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import React from 'react';

// Public Pages & Components
import Header from './components/Header';
import Footer from './components/Footer';
import Homepage from './pages/public/Homepage';
import CategoryPage from './pages/public/CategoryPage';
import PostPage from './pages/public/PostPage';
import ResultsPage from './pages/public/ResultsPage';
import AdmitCardPage from './pages/public/AdmitCardPage';
import SearchPage from './pages/public/SearchPage';
import CalendarPage from './pages/public/CalendarPage';
import EligibilityPage from './pages/public/EligibilityPage';
import AboutUsPage from './pages/public/AboutUsPage';
import TermsPage from './pages/public/TermsPage';
import UserProfilePage from './pages/public/UserProfilePage';
import ContactUsPage from './pages/public/ContactUsPage';
import BackToTop from './components/BackToTop';
import SEOPage from './pages/public/SEOPage';
import SalaryCalculatorPage from './pages/public/SalaryCalculatorPage';

// Admin Pages & Components
import Login from './pages/admin/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/admin/Dashboard';
import Posts from './pages/admin/Posts';
import PostForm from './pages/admin/PostForm';
import Categories from './pages/admin/Categories';
import AIGenerator from './pages/admin/AIGenerator';

// Public Layout containing standard header/footer wrappers
function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-250 font-sans text-slate-800 dark:text-slate-100">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

export default function App() {
  const seoRoutes = [
    '/latest-jobs', '/answer-key', '/syllabus',
    '/admission', '/state-jobs', '/central-jobs', '/railway-jobs', '/ssc-jobs',
    '/bank-jobs', '/teaching-jobs', '/defence-jobs', '/question-paper', 
    '/mock-test', '/rank-predictor', '/current-affairs', '/government-schemes',
    // Dynamic params
    '/results/:exam', '/admit-card/:exam', '/answer-key/:exam', '/syllabus/:exam', '/jobs/:exam', '/rank-predictor/:exam'
  ];

  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Homepage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/posts/:slug" element={<PostPage />} />
        <Route path="/job/:slug" element={<PostPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/admit-card" element={<AdmitCardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/eligibility" element={<EligibilityPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/expected-salary-calculator" element={<SalaryCalculatorPage />} />
        
        {/* Redirects for common admin paths */}
        <Route path="/admin" element={<Navigate to="/veda-admin-6721" replace />} />
        <Route path="/login" element={<Navigate to="/veda-admin-6721/login" replace />} />
        
        {/* Dynamic SEO Routes */}
        {seoRoutes.map(path => (
           <React.Fragment key={path}>
             <Route path={path} element={<SEOPage />} />
           </React.Fragment>
        ))}
      </Route>

      {/* Admin Panel Authentication */}
      <Route path="/veda-admin-6721/login" element={<Login />} />

      {/* Admin Panel Protected Workspace */}
      <Route
        path="/veda-admin-6721"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="posts" element={<Posts />} />
        <Route path="posts/new" element={<PostForm />} />
        <Route path="posts/edit/:id" element={<PostForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="ai-generator" element={<AIGenerator />} />
      </Route>
    </Routes>
  );
}
