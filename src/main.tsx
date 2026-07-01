// import './patch';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './lib/LanguageContext.tsx';
import App from './App.tsx';
import './index.css';
import { seedSupabaseDatabase, testSupabaseConnection } from './lib/supabase';

// Test connection on boot
testSupabaseConnection().catch(console.error);

// Initialize Database Seeding
seedSupabaseDatabase().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
