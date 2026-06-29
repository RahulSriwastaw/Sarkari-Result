import { Category } from './types';

/**
 * Generate a clean, SEO-friendly slug from post data.
 * Uses post_name + department for a concise slug instead of the full long title.
 * Filters out placeholder words like "title", "post", "job", "recruitment"
 */
export function generatePostSlug(data: {
  post_name?: string;
  department?: string;
  title_en?: string;
  advt_no?: string;
  start_date?: string;
}): string {
  const year = new Date().getFullYear().toString();
  let extractedYear = year;

  // Try to extract year from start_date or advt_no
  if (data.start_date) {
    const match = data.start_date.match(/(\d{4})/);
    if (match) extractedYear = match[1];
  } else if (data.advt_no) {
    const match = data.advt_no.match(/(\d{4})/);
    if (match) extractedYear = match[1];
  } else if (data.title_en) {
    const match = data.title_en.match(/(202[4-9]|203\d)/);
    if (match) extractedYear = match[1];
  }

  // Words to NEVER include in slug (placeholders, filler words)
  const bannedWords = [
    'title', 'post', 'job', 'recruitment', 'online', 'form', 'apply', 
    'for', 'the', 'of', 'and', 'in', 'to', 'posts', 'vacancy', 'vacancies',
    'notification', 'advertisement', 'last', 'date', 'download', 'pdf',
    'latest', 'new', 'update', 'sarkari', 'result', 'exam', 'examination'
  ];

  let slugParts: string[] = [];

  // Get department abbreviation
  if (data.department) {
    const dept = data.department.trim();
    // Check for known abbreviations in parentheses like "Staff Selection Commission (SSC)"
    const abbrMatch = dept.match(/\(([A-Z]{2,6})\)/);
    if (abbrMatch) {
      slugParts.push(abbrMatch[1].toLowerCase());
    } else {
      // Extract meaningful short name
      const knownAbbr: Record<string, string> = {
        'railway recruitment board': 'rrb',
        'staff selection commission': 'ssc',
        'union public service commission': 'upsc',
        'institute of banking': 'ibps',
        'reserve bank of india': 'rbi',
        'state bank of india': 'sbi',
      };
      const deptLower = dept.toLowerCase();
      let found = false;
      for (const [key, abbr] of Object.entries(knownAbbr)) {
        if (deptLower.includes(key)) {
          slugParts.push(abbr);
          found = true;
          break;
        }
      }
      if (!found) {
        // Use first 1-2 meaningful words
        const deptWords = dept.split(/\s+/).filter(w =>
          !bannedWords.includes(w.toLowerCase()) && w.length > 2
        );
        if (deptWords.length > 0) {
          slugParts.push(deptWords.slice(0, 2).join('-').toLowerCase());
        }
      }
    }
  }

  // Add post name (filtering out banned words)
  if (data.post_name && data.post_name.toLowerCase() !== 'title' && data.post_name.length > 2) {
    const postWords = data.post_name.split(/\s+/).filter(w =>
      !bannedWords.includes(w.toLowerCase()) && w.length > 1
    );
    if (postWords.length > 0) {
      slugParts.push(postWords.slice(0, 3).join('-').toLowerCase());
    }
  } else if (data.title_en) {
    // Fallback: extract from title
    const titleWords = data.title_en.split(/[\s:|\-]+/).filter(w =>
      !bannedWords.includes(w.toLowerCase()) && w.length > 2 && !/^\d+$/.test(w)
    );
    if (titleWords.length > 0) {
      slugParts.push(titleWords.slice(0, 3).join('-').toLowerCase());
    }
  }

  // Add year
  slugParts.push(extractedYear);

  // Add advt_no if short and meaningful
  if (data.advt_no && data.advt_no.length <= 15 && data.advt_no.length > 1) {
    const cleanAdvt = data.advt_no.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').toLowerCase();
    if (cleanAdvt.length > 1 && cleanAdvt !== '-') {
      slugParts.push(cleanAdvt);
    }
  }

  // Convert to slug
  const slug = slugParts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return slug || `post-${Date.now()}`;
}

/**
 * Auto-detect the correct category based on department, post_name, and keywords.
 * Returns the matching category slug or null if no match.
 */
export function detectCategory(
  data: { department?: string; post_name?: string; title_en?: string; state?: string[] },
  categories: Category[]
): string | null {
  if (!categories || categories.length === 0) return null;

  const searchText = [
    data.department || '',
    data.post_name || '',
    data.title_en || ''
  ].join(' ').toLowerCase();

  // Keyword mapping to category slugs (ORDER MATTERS — more specific categories first)
  const categoryKeywords: Record<string, string[]> = {
    'defence': ['army', 'navy', 'airforce', 'air force', 'defence', 'defense', 'military', 'agniveer', 'territorial', 'ncc', 'indian army', 'indian navy', 'indian air force', 'coast guard', 'short service commission', 'nda ', 'cds ', 'afcat', 'inet', 'joinindiannavy', 'joinindianarmy'],
    'railway': ['railway', 'rrb', 'rrc', 'ntpc', 'group d', 'technician', 'alp', 'je railway', 'rail', 'indian railway', 'indian railways'],
    'banking': ['bank', 'ibps', 'sbi', 'rbi', 'nabard', 'clerk', 'po ', 'specialist officer', 'banking', 'lic ', 'insurance'],
    'upsc': ['upsc', 'union public service', 'ias', 'ips', 'ifs', 'civil services', 'capf', 'epfo', 'ese ', 'indian engineering'],
    'police': ['police', 'constable', 'sub inspector', 'si ', 'cisf', 'bsf', 'crpf', 'itbp', 'ssb police', 'rpf', 'inspector'],
    'ssc': ['staff selection commission', 'combined graduate level', 'cgl', 'chsl', 'mts ', 'ssc gd', 'cpo', 'stenographer', 'ssc exam', 'ssc je'],
    'state-psc': ['psc', 'public service commission', 'ppsc', 'uppsc', 'bpsc', 'mppsc', 'rpsc', 'hpsc', 'jpsc', 'ukpsc', 'wbpsc', 'opsc', 'kpsc', 'tspsc', 'appsc'],
    'teaching': ['teacher', 'tgt', 'pgt', 'ctet', 'tet', 'kvs', 'nvs', 'navodaya', 'kendriya', 'lecturer', 'professor', 'assistant professor', 'school', 'education'],
    'results': ['result', 'merit list', 'cut off', 'score card', 'marks'],
    'admit-card': ['admit card', 'hall ticket', 'call letter', 'e-admit'],
    'answer-key': ['answer key', 'objection', 'response sheet'],
    'syllabus': ['syllabus', 'exam pattern', 'exam scheme']
  };

  // DISAMBIGUATION: If "ssc" appears with navy/army/airforce context, it's Defence (Short Service Commission), not SSC exam
  const hasDefenceContext = searchText.includes('navy') || searchText.includes('army') || 
    searchText.includes('airforce') || searchText.includes('air force') || 
    searchText.includes('defence') || searchText.includes('military') ||
    searchText.includes('officer') && (searchText.includes('navy') || searchText.includes('army'));
  
  // If defence context is present, remove 'ssc' from being a standalone SSC match
  const adjustedText = hasDefenceContext ? searchText.replace(/\bssc\b/g, 'short-service-commission') : searchText;

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [catSlug, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (adjustedText.includes(keyword)) {
        // Longer keywords get higher weight
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = catSlug;
    }
  }

  // Only return a match if we have reasonable confidence
  if (bestScore >= 3) {
    // Verify this category exists in the available categories
    const matchedCat = categories.find(c => c.slug === bestMatch);
    if (matchedCat) {
      return matchedCat.slug;
    }
  }

  // Fallback: check state-level posts
  if (data.state && data.state.length > 0 && !data.state.includes('All India')) {
    const statePsc = categories.find(c => c.slug === 'state-psc');
    if (statePsc) return statePsc.slug;
  }

  return null;
}
