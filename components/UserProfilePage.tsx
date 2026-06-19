import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../constants';
import { profileService, UserProfile as UserProfileType } from '../services/profileService';
import { useStore } from '../store/useStore';

interface UserProfilePageProps {
  userId: string;
  onBack: () => void;
  onRemix?: (template: any) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ userId, onBack, onRemix }) => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', website: '', location: '' });
  const currentUser = useStore((s) => s.user);
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await profileService.getPublicProfile(userId);
      setProfile(data);
      if (data) {
        setEditForm({
          name: data.name || '',
          bio: data.bio || '',
          website: data.website || '',
          location: data.location || '',
        });
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleSave = async () => {
    const success = await profileService.updateProfile(userId, editForm);
    if (success && profile) {
      setProfile({ ...profile, ...editForm });
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1318] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7d2ae8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0e1318] flex items-center justify-center text-center p-8">
        <div>
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Icons.User className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">User not found</h2>
          <p className="text-gray-500 text-sm">This profile may have been removed or is private.</p>
          <button onClick={onBack} className="mt-4 text-[#7d2ae8] font-bold text-sm hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1318]">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <Icons.ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white">Profile</h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`}
              alt={profile.name || 'User'}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-white/10"
            />
            {isOwnProfile && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#7d2ae8] flex items-center justify-center border-2 border-[#0e1318]">
                <Icons.Magic className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Display name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-[#7d2ae8]/50 focus:outline-none"
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Bio"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-[#7d2ae8]/50 focus:outline-none resize-none"
                />
                <div className="flex gap-3">
                  <input
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="Website URL"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-[#7d2ae8]/50 focus:outline-none"
                  />
                  <input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Location"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-[#7d2ae8]/50 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[#7d2ae8] text-white rounded-xl text-sm font-bold hover:bg-[#6b23c5] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-white">{profile.name || 'Anonymous'}</h2>
                {profile.bio && <p className="text-gray-400 text-sm mt-2">{profile.bio}</p>}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <Icons.Cloud className="w-3 h-3" /> {profile.location}
                    </span>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#7d2ae8] hover:underline"
                    >
                      <Icons.ExternalLink className="w-3 h-3" /> {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Icons.Flag className="w-3 h-3" /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#7d2ae8]/20 text-[#7d2ae8] font-bold text-[10px] uppercase">
                    {profile.plan}
                  </span>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Portfolio */}
        <div className="mt-12">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Icons.Layers className="w-5 h-5 text-[#7d2ae8]" />
            Published Designs
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({profile.communityTemplates?.length || 0})
            </span>
          </h3>

          {profile.communityTemplates && profile.communityTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.communityTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ y: -4 }}
                  className="group rounded-2xl overflow-hidden bg-[#1a1a2e] border border-white/5 hover:border-[#7d2ae8]/30 transition-all cursor-pointer"
                  onClick={() => onRemix?.(template)}
                >
                  <div className="aspect-video bg-gradient-to-br from-[#7d2ae8]/10 to-[#1a1a2e] overflow-hidden">
                    {template.thumbnailUrl ? (
                      <img
                        src={template.thumbnailUrl}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icons.Magic className="w-8 h-8 text-[#7d2ae8]/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-white text-sm group-hover:text-[#7d2ae8] transition-colors">
                      {template.name}
                    </h4>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Icons.Heart className="w-3 h-3" /> {template.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icons.Download className="w-3 h-3" /> {template.downloads}
                        </span>
                      </div>
                      <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
              <Icons.Layers className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {isOwnProfile ? "You haven't published any designs yet." : "This user hasn't published any designs yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
