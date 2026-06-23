import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { log } from '../../utils/log';
import { useStore } from '../../store/useStore';

interface ShareModalProps {
  onClose: () => void;
  designTitle: string;
  onGetShareLink: () => Promise<string>;
}

export const ShareModal: React.FC<ShareModalProps> = ({ onClose, designTitle, onGetShareLink }) => {
  const [shareLink, setShareLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const onlineUsers = useStore((s) => s.onlineUsers);
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

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const link = await onGetShareLink();
      setShareLink(link);
    } catch (e) {
      log.error('[ShareModal] Failed to generate share link', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    // In a real app, this would send an email invitation
    // For now, just copy the share link with the email as context
    const inviteLink = shareLink || '';
    if (inviteLink) {
      navigator.clipboard.writeText(`Hey! Check out my design "${designTitle}" on Kreathief: ${inviteLink}`);
      setInviteSent(true);
      setInviteEmail('');
      setTimeout(() => setInviteSent(false), 3000);
    }
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 outline-none"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Send className="w-5 h-5 text-[#00c4cc]" /> Share Design
          </h3>
          <button
            onClick={onClose}
            aria-label="Close share modal"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <div className="text-2xl leading-none" aria-hidden="true">
              &times;
            </div>
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Online users */}
          {onlineUsers.length > 1 && (
            <div className="p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-400 font-bold mb-2">{onlineUsers.length} people currently viewing</p>
              <div className="flex -space-x-1">
                {onlineUsers.slice(0, 8).map((u) => (
                  <div
                    key={u.userId}
                    className="w-6 h-6 rounded-full border border-[#1e1e1e] flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: u.color }}
                    title={u.userName}
                  >
                    {u.userName.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share link */}
          <div>
            <p className="text-gray-400 text-sm mb-3">Generate a link to share your design with others.</p>

            {!shareLink ? (
              <button
                onClick={handleGenerateLink}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    Generate Share Link <Icons.Zap className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-[#13161a] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#00c4cc]"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                >
                  {copied ? <Icons.Check className="w-4 h-4" /> : <Icons.Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* Invite by email */}
          {shareLink && (
            <div>
              <p className="text-gray-400 text-sm mb-3">Or invite someone by email:</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@email.com"
                  className="flex-1 bg-[#13161a] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#00c4cc] placeholder-gray-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                  className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                    inviteSent
                      ? 'bg-green-600 text-white'
                      : inviteEmail.trim()
                        ? 'bg-[#7d2ae8] text-white hover:bg-[#6b23c5]'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {inviteSent ? <Icons.Check className="w-4 h-4" /> : <Icons.Send className="w-4 h-4" />}
                  {inviteSent ? 'Copied!' : 'Invite'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#13161a] border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-400 hover:text-white text-sm font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
