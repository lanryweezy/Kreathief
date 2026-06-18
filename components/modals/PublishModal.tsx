import React, { useState } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { communityService } from '../../services/communityService';
import { v4 as uuidv4 } from 'uuid';

interface PublishModalProps {
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ onClose }) => {
  const { artboards, canvasBackgroundColor, canvasFilters, canvasSize, projectTitle } = useStore(
    useShallow((state) => ({
      artboards: state.artboards,
      canvasBackgroundColor: state.canvasBackgroundColor,
      canvasFilters: state.canvasFilters,
      canvasSize: state.canvasSize,
      projectTitle: state.projectTitle,
    }))
  );
  const user = useStore((state) => state.user);

  const [name, setName] = useState(projectTitle || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Social' | 'Video' | 'Business' | 'Personal'>('Social');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!user) {
      useStore.getState().addToast('Please log in to publish', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      const state = {
        artboards,
        canvasBackgroundColor,
        canvasFilters,
        canvasSize,
      };

      const success = await communityService.publishTemplate({
        id: uuidv4(),
        name,
        description,
        category,
        size: canvasSize || { width: 1080, height: 1080, name: 'Custom' },
        state,
        userId: user.id,
        userName: user.name,
      });

      if (success) {
        useStore.getState().addToast('Successfully published to community!', 'success');
        onClose();
      } else {
        throw new Error('Publish failed');
      }
    } catch (err) {
      useStore.getState().addToast('Failed to publish design', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#13161a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Icons.Globe className="w-5 h-5 text-orange-500" />
              Publish to Community
            </h2>
            <p className="text-xs text-gray-500 mt-1">Share your creation with thousands of designers.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close publish modal"
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <Icons.X aria-hidden="true" className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label
              htmlFor="template-name"
              className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block"
            >
              Template Name
            </label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Minimalist Business Deck"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Social', 'Video', 'Business', 'Personal'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    category === cat
                      ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-900/20'
                      : 'bg-black/20 border-white/5 text-gray-500 hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="template-description"
              className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block"
            >
              Description
            </label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others what makes this template special..."
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
            />
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
            <Icons.Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              By publishing, you agree to share this design&apos;s layout and settings with the community. Personal
              images and private assets will be included.
            </p>
          </div>
        </div>

        <div className="p-6 bg-black/40 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || !name}
            className="flex-[2] bg-orange-500 hover:bg-orange-400 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2"
          >
            {isPublishing ? (
              <>
                <Icons.Loader className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Icons.Globe className="w-4 h-4" />
                Publish to Community
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
