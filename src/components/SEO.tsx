import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  schema?: Record<string, any> | Record<string, any>[];
  faq?: { question: string; answer: string }[];
}

export default function SEO({
  title = 'ResultVeda 2026: Sarkari Result, Latest Jobs, Admit Card, Answer Key & Government Exam Updates',
  description = 'Get the latest Sarkari Result, Government Jobs, Admit Card, Answer Key, Syllabus, Admission and Exam Updates at ResultVeda.',
  canonical,
  type = 'website',
  schema,
  faq
}: SEOProps) {
  const siteUrl = 'https://resultveda.com';
  const url = canonical ? `${siteUrl}${canonical}` : siteUrl;

  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ResultVeda",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ResultVeda",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`
  };

  const schemas: any[] = [defaultSchema, orgSchema];
  if (schema) {
    if (Array.isArray(schema)) {
      schemas.push(...schema);
    } else {
      schemas.push(schema as any);
    }
  }

  if (faq && faq.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faq.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    });
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="ResultVeda" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* JSON-LD Schemas */}
      <script type="application/ld+json">
        {JSON.stringify(schemas)}
      </script>
    </Helmet>
  );
}
