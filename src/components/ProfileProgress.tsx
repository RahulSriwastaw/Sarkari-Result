import React from 'react';
import { Profile } from '../lib/types';

interface ProfileProgressProps {
  profile: Profile | null;
}

export default function ProfileProgress({ profile }: ProfileProgressProps) {
  if (!profile) return null;

  const fields = ['name', 'dob', 'qualification', 'category', 'state'];
  const filledFields = fields.filter(field => (profile as any)[field]).length;
  const percentage = (filledFields / fields.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Profile Completion</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
      {percentage < 100 && (
        <p className="text-xs text-amber-600">Complete your profile to get personalized suggestions!</p>
      )}
    </div>
  );
}
