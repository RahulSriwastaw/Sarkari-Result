import React, { useState, useEffect } from 'react';
import { updateProfile, getCurrentUser } from '../lib/supabase';
import { Profile } from '../lib/types';
import { toast } from 'react-hot-toast';

interface ProfileFormProps {
  profile: Profile | null;
  onUpdate: () => void;
}

export default function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    qualification: '',
    category: '',
    state: '',
  });

  // Sync state with profile prop if profile loads after initial mount
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        dob: profile.dob || '',
        qualification: profile.qualification || '',
        category: profile.category || '',
        state: profile.state || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await getCurrentUser();
    const profileId = profile?.id || (user ? (user.uid || user.email) : null);
    if (!profileId) {
      toast.error('You must be logged in to save your profile.');
      return;
    }
    try {
      await updateProfile(profileId, formData);
      toast.success('Profile saved successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
        <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Qualification</label>
        <input type="text" value={formData.qualification} onChange={(e) => setFormData({...formData, qualification: e.target.value})} className="w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Category</label>
        <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">State</label>
        <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full border rounded p-2" />
      </div>
      <button type="submit" className="bg-indigo-600 text-white rounded p-2 w-full">Save Profile</button>
    </form>
  );
}
