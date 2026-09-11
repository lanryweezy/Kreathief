import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../../constants';
import { ModalWrapper } from './ModalWrapper';

type ProfileTab = 'general' | 'preferences' | 'subscription';

export const ProfileModal: React.FC = () => {
  const { showProfileModal, setShowProfileModal, user, setUser, addToast } = useStore(
    useShallow((state) => ({
      showProfileModal: state.showProfileModal,
      setShowProfileModal: state.setShowProfileModal,
      user: state.user,
      setUser: state.setUser,
      addToast: state.addToast,
    }))
  );

  const [activeTab, setActiveTab] = useState<ProfileTab>('general');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Preferences State
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(5);
  const [defaultFormat, setDefaultFormat] = useState<string>('png');

  // Initialize form when modal opens or user changes
  useEffect(() => {
    if (user && showProfileModal) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'Senior Creative Director');
      setBio(user.bio || 'Passionate visual creator & digital designer building immersive AI experiences.');
      setWebsite(user.website || 'https://kreathief.app');
      setLocation(user.location || 'San Francisco, CA');
      setTwitter(user.socials?.twitter || '@creator_ai');
      setGithub(user.socials?.github || 'creator-dev');
      setLinkedin(user.socials?.linkedin || 'in/creator-profile');

      setAutoSaveInterval(user.preferences?.autoSaveInterval ?? 5);
      setDefaultFormat(user.preferences?.defaultFormat || 'png');
    }
  }, [user, showProfileModal]);

  if (!showProfileModal || !user) {
    return null;
  }

  const handleSave = () => {
    const updatedUser = {
      ...user,
      name,
      email,
      role,
      bio,
      website,
      location,
      socials: {
        twitter,
        github,
        linkedin,
      },
      preferences: {
        theme: user.preferences?.theme || 'dark',
        autoSaveInterval,
        defaultFormat,
      },
      apiKeys: user.apiKeys,
    };
    setUser(updatedUser);
    addToast('Profile & studio settings updated successfully!', 'success');
    setShowProfileModal(false);
  };

  const handleChangePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const avatarUrl = evt.target?.result as string;
          setUser({ ...user, avatar: avatarUrl });
          addToast('Profile picture updated!', 'success');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleGenerateRandomAvatar = () => {
    const randomSeed = crypto.randomUUID();
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
    setUser({ ...user, avatar: newAvatar });
    addToast('Generated new AI Bot avatar!', 'info');
  };

  const tabs: { id: ProfileTab; label: string; icon: React.FC<any> }[] = [
    { id: 'general', label: 'General & Bio', icon: Icons.User },
    { id: 'preferences', label: 'Studio Settings', icon: Icons.Sliders },
    { id: 'subscription', label: 'Plan & Storage', icon: Icons.Star },
  ];

  return (
    <ModalWrapper
      isOpen={showProfileModal}
      onClose={() => setShowProfileModal(false)}
      maxWidth="max-w-4xl"
      showCloseButton={false}
    >
      <div className="flex flex-col md:flex-row min-h-[580px] bg-[#0c0c0e] text-white overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        {/* Left Navigation Sidebar */}
        <div className="w-full md:w-64 bg-[#121215] border-b md:border-b-0 md:border-r border-white/[0.06] p-5 flex flex-col justify-between shrink-0">
          <div>
            {/* User Mini Card */}
            <div className="flex items-center gap-3.5 mb-6 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="relative group shrink-0">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                  alt={user.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-brand-500/30"
                />
                <button
                  onClick={handleChangePhoto}
                  title="Upload Photo"
                  aria-label="Upload Photo"
                  className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <Icons.Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate text-white">{user.name}</div>
                <div className="text-[11px] font-medium text-brand-400 truncate uppercase tracking-wider mt-0.5">
                  {user.plan || 'Free'} Plan
                </div>
              </div>
            </div>

            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 px-3 mb-2">Account Hub</div>

            {/* Nav Tabs */}
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 font-bold'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/50'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/[0.06] mt-6 md:mt-0 flex flex-col gap-2">
            <button
              onClick={handleGenerateRandomAvatar}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-[11px] font-semibold transition-colors border border-white/[0.05]"
            >
              <Icons.RefreshCw className="w-3.5 h-3.5 text-brand-400" />
              Randomize AI Avatar
            </button>
            <button
              onClick={() => setShowProfileModal(false)}
              aria-label="Close hub"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold transition-colors"
            >
              <Icons.X className="w-3.5 h-3.5" />
              Close Hub
            </button>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col justify-between p-6 md:p-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div>
            {/* Header Title */}
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/[0.06]">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  {activeTab === 'general' && 'Manage your personal identity, bio, and social presence.'}
                  {activeTab === 'preferences' && 'Configure auto-save timers and export defaults.'}
                  {activeTab === 'subscription' && 'Monitor your generation credits, storage limits, and plan level.'}
                </p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                aria-label="Close profile modal"
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab 1: General & Bio */}
            {activeTab === 'general' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                      Professional Role / Title
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="e.g. Senior Creative Director"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                    Creator Bio
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors resize-none"
                    placeholder="Tell the community about your creative work and style..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/[0.05]">
                  <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                      Website URL
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                      Twitter / X Handle
                    </label>
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="@creator_ai"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                      LinkedIn Profile
                    </label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="in/username"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Studio Settings */}
            {activeTab === 'preferences' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                      Auto-Save Interval
                    </label>
                    <select
                      value={autoSaveInterval}
                      onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                    >
                      <option value={1} className="bg-[#111113]">
                        Every 1 Minute
                      </option>
                      <option value={5} className="bg-[#111113]">
                        Every 5 Minutes (Recommended)
                      </option>
                      <option value={15} className="bg-[#111113]">
                        Every 15 Minutes
                      </option>
                      <option value={0} className="bg-[#111113]">
                        Off (Manual Save Only)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                      Default Export Format
                    </label>
                    <select
                      value={defaultFormat}
                      onChange={(e) => setDefaultFormat(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                    >
                      <option value="png" className="bg-[#111113]">
                        PNG (Transparent, High Quality)
                      </option>
                      <option value="jpg" className="bg-[#111113]">
                        JPEG (Compact Size)
                      </option>
                      <option value="svg" className="bg-[#111113]">
                        SVG (Vector Scalable)
                      </option>
                      <option value="pdf" className="bg-[#111113]">
                        PDF (Print & Document)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Snap to Objects & Guides</div>
                      <div className="text-[11px] text-white/50">
                        Automatically align layers when dragging on canvas
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600 rounded" />
                  </div>
                  <div className="border-t border-white/[0.05] pt-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">High-DPI Canvas Rendering</div>
                      <div className="text-[11px] text-white/50">
                        Render vectors at 2x resolution on Retina displays
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600 rounded" />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Plan & Storage */}
            {activeTab === 'subscription' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900/40 via-[#1a1428] to-surface-dark-1 border border-brand-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-[10px] font-black text-brand-300 uppercase tracking-wider mb-2">
                      <Icons.Star className="w-3 h-3" /> {user.plan || 'Free'} Tier
                    </div>
                    <h3 className="text-xl font-black text-white">Kreathief Creative Suite</h3>
                    <p className="text-xs text-white/60 mt-1">
                      You are currently on the <span className="text-white font-bold">{user.plan || 'Free'} Plan</span>{' '}
                      with access to vector design tools, AI assistants, and community sharing.
                    </p>
                  </div>
                  <button
                    onClick={() => addToast('Opening upgrading modal...', 'info')}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-black tracking-wide shadow-lg shadow-brand-600/30 transition-all shrink-0"
                  >
                    Upgrade Plan
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-white">Monthly AI Generation Credits</span>
                      <span className="text-brand-400">420 / 500 Credits</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="w-[84%] h-full bg-gradient-to-r from-brand-500 to-purple-400 rounded-full" />
                    </div>
                    <div className="text-[11px] text-white/40 mt-2">
                      Credits reset automatically on the 1st of every month.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-white">Cloud Asset Storage</span>
                      <span className="text-purple-400">1.4 GB / 20.0 GB</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="w-[7%] h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full" />
                    </div>
                    <div className="text-[11px] text-white/40 mt-2">
                      Includes custom fonts, uploaded images, artboards, and exported snapshots.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-5 mt-6 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-white/40 font-mono hidden sm:inline">User ID: {user.id}</span>
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/25 transition-all"
              >
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
