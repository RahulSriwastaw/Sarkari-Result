import { Profile } from './types';
import { Post } from './types';

export function checkEligibility(profile: Profile, post: Post): { eligible: boolean, reason: string } {
  // 1. Qualification Check (Simple string match for now)
  if (profile.qualification && post.eligibility?.education) {
     if (!post.eligibility.education.toLowerCase().includes(profile.qualification.toLowerCase())) {
         return { eligible: false, reason: 'Qualification mismatch' };
     }
  }

  // 2. Category Check (Simple string match)
  if (profile.category && post.category?.name) {
      if (profile.category.toLowerCase() !== post.category.name.toLowerCase()) {
         return { eligible: false, reason: 'Category mismatch' };
      }
  }

  // 3. State Check
  if (profile.state && post.state && post.state.length > 0) {
      if (!post.state.map(s => s.toLowerCase()).includes(profile.state.toLowerCase())) {
         return { eligible: false, reason: 'State mismatch' };
      }
  }

  return { eligible: true, reason: 'Matches' };
}
