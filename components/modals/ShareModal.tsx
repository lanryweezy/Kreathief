import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { log } from '../../utils/log';
import { useStore } from '../../store/useStore';
import { Button } from '../Button';
import { Input } from '../Input';

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
  const addToast = useStore((s) => s.addToast);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
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
      addToast('Failed to generate share link', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // silent
    }
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      return;
    }
    const inviteLink = shareLink || '';
    if (inviteLink) {
      const message = `Hey! Check out my design "${designTitle}" on Kreathief: ${inviteLink}`;
      navigator.clipboard
        .writeText(message)
        .then(() => {
          setInviteSent(true);
          setInviteEmail('');
          addToast(`Invite link copied! Send it to ${inviteEmail || 'your colleague'}`, 'success');
          setTimeout(() => setInviteSent(false), 3000);
        })
        .catch(() => {
          addToast('Failed to copy invite link', 'error');
        });
    } else {
      addToast('Generate a share link first', 'warning');
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
        className="bg-surface-dark-3 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Send className="w-5 h-5 text-accent" /> Share Design
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close share modal">
            <div className="text-2xl leading-none" aria-hidden="true">
              &times;
            </div>
          </Button>
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
                    className="w-6 h-6 rounded-full border border-surface-dark-3 flex items-center justify-center text-[9px] font-bold text-white"
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
            <p className="text-muted-light text-sm mb-3">Generate a link to share your design with others.</p>

            {!shareLink ? (
              <Button
                variant="primary"
                onClick={handleGenerateLink}
                disabled={isGenerating}
                className="w-full"
                loading={isGenerating}
              >
                {!isGenerating && (
                  <>
                    Generate Share Link <Icons.Zap className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareLink}
                  aria-label="Share link"
                  className="flex-1 bg-surface-dark-2 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-accent"
                />
                <Button
                  variant="secondary"
                  onClick={copyToClipboard}
                  className={copied ? '!bg-green-600 !text-white' : ''}
                >
                  {copied ? <Icons.Check className="w-4 h-4" /> : <Icons.Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            )}
          </div>

          {/* Invite by email */}
          {shareLink && (
            <div>
              <p className="text-muted-light text-sm mb-3">Or invite someone by email:</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@email.com"
                  className="flex-1 bg-surface-dark-2 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-600 placeholder-gray-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <Button
                  variant={inviteSent ? 'primary' : inviteEmail.trim() ? 'accent' : 'secondary'}
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                  className={inviteSent ? '!bg-green-600 !text-white' : ''}
                >
                  {inviteSent ? <Icons.Check className="w-4 h-4" /> : <Icons.Send className="w-4 h-4" />}
                  {inviteSent ? 'Copied to Clipboard!' : 'Copy Invite Link'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-surface-dark-2 border-t border-gray-800 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
