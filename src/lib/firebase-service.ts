import { 
  getDoc, 
  setDoc,
  doc, 
  serverTimestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from './firebase';
import { Profile } from './types';

// Authentication and Profile Management
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const docRef = doc(db, 'profiles', userId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return snapshot.data() as Profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
  try {
    const docRef = doc(db, 'profiles', userId);
    await setDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const envAdminEmail = (import.meta as any).env?.VITE_ADMIN_EMAIL || 'admin@resultveda.com';
  const envAdminPass = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin123';
  return email === envAdminEmail && password === envAdminPass;
}

export async function adminLogin(email: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> {
  if (validateAdminCredentials(email, password)) {
    localStorage.setItem('resultveda_auth_user', JSON.stringify({ 
      email: email, 
      uid: 'env-admin', 
      role: 'admin',
      is_env_admin: true 
    }));
    return { success: true, role: 'admin' };
  }
  return { success: false, error: 'Incorrect administrator credentials.' };
}

export async function candidateLogin(email: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (result.user) {
      const profile = await getProfile(result.user.uid);
      if (!profile) {
        const initialProfile: Profile = {
          id: result.user.uid,
          name: result.user.email ? result.user.email.split('@')[0] : 'Candidate',
          dob: '',
          qualification: '',
          category: '',
          state: '',
          role: 'user',
          profile_completion_percentage: 0,
          updated_at: new Date().toISOString()
        };
        await updateProfile(result.user.uid, initialProfile);
      }

      localStorage.setItem('resultveda_auth_user', JSON.stringify({ 
        email: result.user.email, 
        uid: result.user.uid, 
        role: 'user' 
      }));
      return { success: true, role: 'user' };
    }
    return { success: false, error: 'Invalid login credentials' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function registerUser(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (result.user) {
      const initialProfile: Profile = {
        id: result.user.uid,
        name: email.split('@')[0],
        dob: '',
        qualification: '',
        category: '',
        state: '',
        role: 'user',
        profile_completion_percentage: 0,
        updated_at: new Date().toISOString()
      };
      await updateProfile(result.user.uid, initialProfile);

      localStorage.setItem('resultveda_auth_user', JSON.stringify({ 
        email: result.user.email, 
        uid: result.user.uid, 
        role: 'user' 
      }));
      return { success: true };
    }
    return { success: false, error: 'Registration failed.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminLogout(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem('resultveda_auth_user');
}
