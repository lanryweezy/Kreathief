import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../../constants';
import { AnimatePresence, motion } from 'framer-motion';
import {
  initiateCheckout,
  detectGeoAndProvider,
  PAYSTACK_COUNTRIES,
  CREDIT_GRANTS,
  type PaymentProvider,
  type PlanType,
} from '../../services/billingService';

// ── Pricing data ──────────────────────────────────────────────────────────────
// Prices shown to users. Paystack countries see local-currency equivalents in
// the footer label; the actual charge amount is set server-side in billingService.
const PLANS = {
  pro: {
    usdLabel: '$15',
    period: '/mo',
    credits: CREDIT_GRANTS.pro,
    features: [
      { icon: 'Sparkles', text: 'AI Design Director', highlight: true },
      { icon: 'Check', text: '4K High-Res Exports' },
      { icon: 'Check', text: 'AI Background Removal' },
      { icon: 'Check', text: 'Magic Expand & Remix' },
      { icon: 'Check', text: `${CREDIT_GRANTS.pro} AI Credits / month` },
      { icon: 'Check', text: 'All Aesthetic Archetypes' },
      { icon: 'Check', text: 'Commercial License' },
      { icon: 'Check', text: 'Priority Support' },
    ],
  },
  creditPack: {
    usdLabel: '$10',
    period: ' one-time',
    credits: CREDIT_GRANTS.creditPack,
    features: [
      { icon: 'Check', text: `Instant +${CREDIT_GRANTS.creditPack} Credits` },
      { icon: 'Check', text: 'Never expires' },
      { icon: 'Check', text: 'Works with any plan' },
      { icon: 'Check', text: 'Great for heavy usage' },
    ],
  },
};

// Human-readable local price labels per Paystack country (shown in the modal
// footer so users know what they will actually be charged).
const LOCAL_PRICE_LABELS: Record<string, { pro: string; creditPack: string }> = {
  NG: { pro: '₦22,500',  creditPack: '₦15,000' },
  GH: { pro: 'GH₵220',  creditPack: 'GH₵145'  },
  KE: { pro: 'KSh 1,950', creditPack: 'KSh 1,300' },
  ZA: { pro: 'R275',     creditPack: 'R185'    },
  CI: { pro: 'XOF 9,000', creditPack: 'XOF 6,000' },
};

export const PricingModal: React.FC = () => {
  const { showPricingModal, setShowPricingModal, user, credits } = useStore(
    useShallow((state) => ({
      showPricingModal: state.showPricingModal,
      setShowPricingModal: state.setShowPricingModal,
      user: state.user,
      credits: state.credits,
    }))
  );

  const [provider, setProvider] = useState<PaymentProvider>('stripe');
  const [countryCode, setCountryCode] = useState<string>('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanType | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Detect provider once when modal opens. Cached by billingService so
  // subsequent opens are instant.
  useEffect(() => {
    if (!showPricingModal) return;
    setGeoLoading(true);
    detectGeoAndProvider()
      .then((geo) => {
        setProvider(geo.provider);
        setCountryCode(geo.countryCode);
      })
      .finally(() => setGeoLoading(false));
  }, [showPricingModal]);

  if (!showPricingModal) return null;

  const isPaystack = provider === 'paystack';
  const localLabels = LOCAL_PRICE_LABELS[countryCode];

  const handleCheckout = async (plan: PlanType) => {
    if (!user) {
      setCheckoutError('You must be signed in to upgrade.');
      return;
    }
    setCheckoutError(null);
    setCheckoutLoading(plan);
    try {
      const result = await initiateCheckout(plan);
      // Redirect to hosted checkout page (Stripe or Paystack)
      window.location.href = result.url;
    } catch (err: any) {
      setCheckoutError(err?.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowPricingModal(false)}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="relative w-full max-w-5xl bg-surface-dark-1/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          <button
            onClick={() => setShowPricingModal(false)}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <Icons.X size={22} />
          </button>

          {/* Header */}
          <div className="text-center px-8 pt-10 pb-6">
            <div className="inline-flex items-center gap-2 bg-brand-500/15 border border-brand-500/30 rounded-full px-4 py-1.5 mb-4">
              <Icons.Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[11px] font-black uppercase tracking-widest text-brand-400">
                {credits === 0 ? 'Out of AI Credits' : 'Upgrade Kreathief'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-white mb-2">
              {credits === 0 ? 'You\'ve used all your credits' : 'Unlock the Full AI Engine'}
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              {credits === 0
                ? 'Top up your credits or upgrade to Pro to keep generating.'
                : 'Pick the plan that fits your workflow. Cancel or top-up any time.'}
            </p>
            {credits > 0 && (
              <p className="text-[11px] text-brand-400 mt-2 font-mono">
                You have <span className="font-black">{credits}</span> credits remaining
              </p>
            )}
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-8 pb-6">

            {/* Free / Current */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6 flex flex-col opacity-60">
              <h3 className="text-lg font-bold text-white mb-1">Starter</h3>
              <p className="text-3xl font-black text-white mb-1">
                $0<span className="text-sm font-normal text-white/40">/mo</span>
              </p>
              <p className="text-[11px] text-white/30 mb-5">10 free credits, no payment needed</p>
              <ul className="space-y-2.5 flex-1 text-sm text-white/50 mb-6">
                {[
                  'Manual Design Editor',
                  '720p Exports',
                  '10 AI Credits (lifetime)',
                  'Community Support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Icons.Check size={14} className="text-gray-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled className="w-full py-2.5 rounded-lg bg-white/5 text-white/30 font-bold text-sm cursor-not-allowed">
                Current Plan
              </button>
            </div>

            {/* Pro — highlighted */}
            <div className="bg-gradient-to-b from-brand-500/15 to-purple-900/10 border border-brand-500/50 rounded-xl p-6 flex flex-col relative shadow-2xl shadow-brand-500/10 md:scale-[1.03]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-full shadow-lg">
                Most Popular
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
              <p className="text-3xl font-black text-white mb-1">
                {isPaystack && localLabels
                  ? localLabels.pro
                  : PLANS.pro.usdLabel}
                <span className="text-sm font-normal text-white/40">{PLANS.pro.period}</span>
              </p>
              <p className="text-[11px] text-white/40 mb-5">
                {isPaystack ? 'Charged in local currency via Paystack' : 'Charged in USD via Stripe'}
              </p>
              <ul className="space-y-2.5 flex-1 text-sm mb-6">
                {PLANS.pro.features.map((f) => (
                  <li key={f.text} className={`flex items-center gap-2 ${f.highlight ? 'text-brand-300 font-semibold' : 'text-white/80'}`}>
                    <Icons.Check size={14} className={f.highlight ? 'text-brand-400 shrink-0' : 'text-green-400 shrink-0'} />
                    {f.text}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout('pro')}
                disabled={checkoutLoading !== null || geoLoading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-400 hover:to-purple-400 text-white font-black uppercase tracking-wider text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkoutLoading === 'pro' ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Redirecting...</>
                ) : (
                  'Upgrade to Pro'
                )}
              </button>
            </div>

            {/* Credit Pack */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-1">Credit Top-Up</h3>
              <p className="text-3xl font-black text-white mb-1">
                {isPaystack && localLabels
                  ? localLabels.creditPack
                  : PLANS.creditPack.usdLabel}
                <span className="text-sm font-normal text-white/40">{PLANS.creditPack.period}</span>
              </p>
              <p className="text-[11px] text-white/40 mb-5">
                {isPaystack ? 'Charged in local currency via Paystack' : 'Charged in USD via Stripe'}
              </p>
              <ul className="space-y-2.5 flex-1 text-sm text-white/70 mb-6">
                {PLANS.creditPack.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2">
                    <Icons.Check size={14} className="text-green-400 shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout('creditPack')}
                disabled={checkoutLoading !== null || geoLoading}
                className="w-full py-3 rounded-lg bg-white/8 hover:bg-white/15 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkoutLoading === 'creditPack' ? (
                  <><div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> Redirecting...</>
                ) : (
                  `Buy ${CREDIT_GRANTS.creditPack.toLocaleString()} Credits`
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] text-white/25 font-mono">
              {geoLoading ? (
                <span>Detecting your location…</span>
              ) : (
                <>
                  <span>Secured by</span>
                  <span className="font-black text-white/40 uppercase">
                    {isPaystack ? 'Paystack' : 'Stripe'}
                  </span>
                  {countryCode && PAYSTACK_COUNTRIES.has(countryCode) && (
                    <span className="text-white/20">· Local payments for {countryCode}</span>
                  )}
                </>
              )}
            </div>

            {checkoutError && (
              <p className="text-xs text-red-400 font-medium">{checkoutError}</p>
            )}

            {!user && (
              <p className="text-xs text-yellow-400/80">
                Sign in first to complete your purchase.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
