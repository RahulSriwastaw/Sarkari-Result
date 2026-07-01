import React from 'react';
import ProfileForm from './ProfileForm';
import { Profile } from '../lib/types';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
}

export default function ProfileSetupModal({ isOpen, onClose, profile }: ProfileSetupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Complete Your Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Complete your qualification, date of birth, and category to unlock personalized AI job matching!
        </p>
        <ProfileForm profile={profile} onUpdate={onClose} />
      </div>
    </div>
  );
}
