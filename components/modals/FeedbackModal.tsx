import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { analyticsService } from '../../services/analyticsService';

import { ModalWrapper } from './ModalWrapper';

export const FeedbackModal: React.FC = () => {
  const { showFeedbackModal, setShowFeedbackModal, addToast, user } = useStore(
    useShallow((state) => ({
      showFeedbackModal: state.showFeedbackModal,
      setShowFeedbackModal: state.setShowFeedbackModal,
      addToast: state.addToast,
      user: state.user,
    }))
  );
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('feature');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const entry = {
        id: crypto.randomUUID(),
        type,
        message: trimmed,
        userId: user?.id || 'anonymous',
        userEmail: user?.email || null,
        route: window.location.pathname,
        createdAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('kreathief_feedback_log') || '[]');
      localStorage.setItem('kreathief_feedback_log', JSON.stringify([entry, ...existing].slice(0, 100)));
      analyticsService.track('feedback_submitted', { type, message_length: trimmed.length, route: entry.route });
      addToast('Feedback recorded. Thank you for helping improve Kreathief.', 'success');
      setMessage('');
      setShowFeedbackModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} maxWidth="max-w-md">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Icons.MessageSquare className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Send Feedback</h2>
            <p className="text-xs text-gray-400">Report an issue or request a capability</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block">Category</label>
            <div className="flex gap-2">
              {(['bug', 'feature', 'other'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all border ${
                    type === t
                      ? 'bg-accent/20 border-accent text-white shadow-sm'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block">Details</label>
            <textarea
              autoFocus
              className="w-full h-36 bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-gray-500 focus:border-accent outline-none transition-all resize-none leading-relaxed"
              placeholder={
                type === 'bug'
                  ? 'Describe what happened and steps to reproduce...'
                  : type === 'feature'
                    ? 'Describe the workflow or tool you would like to see...'
                    : 'Share your thoughts with the product team...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="pt-1">
            <Button
              variant="primary"
              className="w-full py-3.5 bg-gradient-to-r from-accent to-brand-600 border-none text-white rounded-xl font-semibold text-sm shadow-lg disabled:opacity-50 transition-all"
              type="submit"
              loading={isSubmitting}
              disabled={!message.trim()}
            >
              Submit Feedback
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white/[0.03] px-6 py-4 border-t border-white/5 text-center">
        <p className="text-xs text-gray-400">
          Submissions include your active route ({window.location.pathname}) for diagnostic context.
        </p>
      </div>
    </ModalWrapper>
  );
};
