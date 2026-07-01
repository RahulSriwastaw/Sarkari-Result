import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button if page is scrolled beyond 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      id="back-to-top-btn"
      aria-label="Back to Top"
      className={`fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-primary hover:bg-primary-hover text-white shadow-lg transition-all duration-300 transform outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
        isVisible 
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5 animate-pulse" />
    </button>
  );
}
