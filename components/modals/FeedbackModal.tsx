import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { analyticsService } from '../../services/analyticsService';

export const FeedbackModal: React.FC = () => {
  const { showFeedbackModal, setShowFeedbackModal, addToast } = useStore();
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('feature');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showFeedbackModal) {return null;}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {return;}

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    analyticsService.track('feedback_submitted', { type, message_length: message.length });
    
    addToast('Feedback submitted! Thank you for helping us improve.', 'success');
    setIsSubmitting(false);
    setMessage('');
    setShowFeedbackModal(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={() => setShowFeedbackModal(false)}
    >
      <div 
        className="bg-[#1e1e1e] border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00c4cc]/20 flex items-center justify-center">
                <Icons.MessageSquare className="w-5 h-5 text-[#00c4cc]" />
              </div>
              <h2 className="text-xl font-bold text-white">Send Feedback</h2>
            </div>
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Feedback Type
              </label>
              <div className="flex gap-2">
                {(['bug', 'feature', 'other'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border capitalize ${
                      type === t 
                        ? 'bg-[#00c4cc] border-[#00c4cc] text-white' 
                        : 'bg-[#252627] border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Your Message
              </label>
              <textarea
                autoFocus
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:border-[#00c4cc] outline-none transition-colors resize-none"
                placeholder={
                  type === 'bug' 
                    ? "Tell us what happened..." 
                    : type === 'feature' 
                      ? "What feature would you like to see?" 
                      : "How can we improve Kreathief?"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="pt-2 flex gap-3">
               <Button
                variant="secondary"
                className="flex-1 py-3"
                type="button"
                onClick={() => setShowFeedbackModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 py-3 bg-gradient-to-r from-[#00c4cc] to-[#33e0e7] border-none text-white shadow-lg shadow-cyan-900/20"
                type="submit"
                loading={isSubmitting}
                disabled={!message.trim()}
              >
                Submit Feedback
              </Button>
            </div>
          </form>
        </div>
        
        <div className="bg-black/20 p-4 border-t border-white/5">
          <p className="text-[10px] text-gray-500 text-center leading-relaxed">
            Your feedback helps us make Kreathief the best AI design tool for everyone. 
            We read every single submission! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};
