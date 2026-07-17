import React, { useState, useCallback } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { ModalWrapper } from './ModalWrapper';
import { db } from '../../lib/supabase/client';

interface CreatorSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPECIALIZATIONS = [
  'UI/UX Design',
  'Social Media Templates',
  'Brand Identity',
  'Illustration',
  'Typography',
  'Icon Design',
  'Motion Graphics',
  'Presentation Design',
  'Print Design',
  'Web Design',
] as const;

export const CreatorSignupModal: React.FC<CreatorSignupModalProps> = React.memo(function CreatorSignupModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !specialization) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await db
        .from('profiles')
        .update({
          name: name.trim(),
          website: portfolioUrl.trim() || null,
          bio: `Specialization: ${specialization}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      localStorage.setItem('kreathief_creator_status', 'pending');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to become a creator');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, email, portfolioUrl, specialization, onClose]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Become a Creator</h2>
          <p className="text-gray-400 text-sm">Sell your templates and assets on Kreathief</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            aria-label="Full name"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            aria-label="Email address"
          />

          <Input
            label="Portfolio URL (optional)"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://yourportfolio.com"
            aria-label="Portfolio URL"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="specialization" className="text-xs font-medium text-gray-400">
              Specialization
            </label>
            <select
              id="specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              required
              aria-label="Select your specialization"
              className="w-full px-3 py-2 text-sm rounded-xl bg-surface-dark-3 text-white border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-600 transition-all duration-200"
            >
              <option value="">Select a specialization</option>
              {SPECIALIZATIONS.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="w-full"
            aria-label="Become a Creator"
          >
            Become a Creator
          </Button>
        </form>
      </div>
    </ModalWrapper>
  );
});
