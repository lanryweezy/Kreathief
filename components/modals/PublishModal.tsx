import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { communityService } from '../../services/communityService';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../Button';
import { Input } from '../Input';

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
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    modalRef.current?.focus();
  }, []);

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
      const message = err instanceof Error ? err.message : 'Unknown error';
      const hint =
        message.includes('network') || message.includes('fetch')
          ? ' Check your connection and try again.'
          : message.includes('auth') || message.includes('permission')
            ? ' Please sign in again.'
            : '';
      useStore.getState().addToast(`Failed to publish: ${message}${hint}`, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 outline-none">
      <div className="bg-surface-dark-2 border border-white/10 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Icons.Globe className="w-5 h-5 text-orange-500" />
              Publish to Community
            </h2>
            <p className="text-xs text-gray-500 mt-1">Share your creation with thousands of designers.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close publish modal"
          >
            <Icons.X aria-hidden="true" className="w-5 h-5 text-gray-400" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <Input
              id="template-name"
              label="Template Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Minimalist Business Deck"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Social', 'Video', 'Business', 'Personal'] as const).map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className={category === cat ? '!bg-orange-500 !border-orange-400 !shadow-lg !shadow-orange-900/20' : ''}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Input
              id="template-description"
              label="Description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others what makes this template special..."
            />
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
            <Icons.Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-light leading-relaxed">
              By publishing, you agree to share this design&apos;s layout and settings with the community. Personal
              images and private assets will be included.
            </p>
          </div>
        </div>

        <div className="p-6 bg-surface-dark-0/40 border-t border-white/5 flex gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePublish}
            disabled={isPublishing || !name}
            className="flex-[2] !bg-orange-500 hover:!bg-orange-400 !shadow-lg !shadow-orange-900/20"
            loading={isPublishing}
          >
            {!isPublishing && <>
              <Icons.Globe className="w-4 h-4" />
              Publish to Community
            </>}
          </Button>
        </div>
      </div>
    </div>
  );
};
