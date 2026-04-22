import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { analyticsService } from '../../services/analyticsService';

import { ModalWrapper } from './ModalWrapper';

export const FeedbackModal: React.FC = () => {
  const { showFeedbackModal, setShowFeedbackModal, addToast } = useStore();
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('feature');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {return;}

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    analyticsService.track('feedback_submitted', { type, message_length: message.length });
    addToast('Feedback submitted! Thank you for helping us improve.', 'success');
    setIsSubmitting(false);
    setMessage('');
    setShowFeedbackModal(false);
  };

  return (
    <ModalWrapper isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} maxWidth="max-w-md">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#00c4cc]/20 flex items-center justify-center shadow-lg shadow-cyan-900/10">
            <Icons.MessageSquare className="w-6 h-6 text-[#00c4cc]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Send Feedback</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Help us evolve</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">
              Feedback Type
            </label>
            <div className="flex gap-2">
              {(['bug', 'feature', 'other'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border uppercase tracking-widest ${
                    type === t 
                      ? 'bg-[#00c4cc] border-[#00c4cc] text-white shadow-lg shadow-cyan-500/20' 
                      : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">
              Your Message
            </label>
            <textarea
              autoFocus
              className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-gray-700 focus:border-[#00c4cc] outline-none transition-all resize-none font-medium leading-relaxed"
              placeholder={
                type === 'bug' 
                  ? "Describe the issue in detail..." 
                  : type === 'feature' 
                    ? "What's your dream feature?" 
                    : "Tell us anything..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full py-5 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] border-none text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
              type="submit"
              loading={isSubmitting}
              disabled={!message.trim()}
            >
              Dispatch Feedback
            </Button>
          </div>
        </form>
      </div>
      
      <div className="bg-white/5 p-6 border-t border-white/5 text-center">
        <p className="text-[10px] text-gray-600 font-bold leading-relaxed uppercase tracking-wider">
          Every submission is reviewed by our core designers. 🚀
        </p>
      </div>
    </ModalWrapper>
  );
};
