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
        <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Complete Your Profile</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Complete your qualification, date of birth, and category to unlock personalized AI job matching!
        </p>
        <ProfileForm profile={profile} onUpdate={onClose} />
      </div>
    </div>
  );
}
