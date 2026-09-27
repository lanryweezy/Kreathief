import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { geoService, GeoLocationInfo } from '../services/geoService';
import { billingService } from '../services/billingService';
import { useStore } from '../store/useStore';

interface PricingModalProps {
  onClose: () => void;
  onUpgrade?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const addToast = useStore((state) => (state as any).addToast);
  const [geoInfo, setGeoInfo] = useState<GeoLocationInfo>(() => geoService.detectSync());
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'paystack'>(() =>
    geoService.detectSync().recommendedProvider
  );
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    geoService.detectAsync().then((info) => {
      setGeoInfo(info);
      setSelectedProvider(info.recommendedProvider);
    });
  }, []);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      if (selectedProvider === 'paystack') {
        addToast?.('Redirecting to Paystack Secure Checkout...', 'info');
        // ₦28,500 for monthly (2,850,000 kobo), ₦285,000 for annual (2 months free)
        const amountKobo = billingCycle === 'annual' ? 28500000 : 2850000;
        const checkoutUrl = await billingService.createPaystackCheckout(undefined, amountKobo);
        billingService.redirectToCheckout(checkoutUrl);
      } else {
        addToast?.('Redirecting to Stripe Secure Checkout...', 'info');
        const priceId = billingCycle === 'annual' ? 'price_pro_annual' : 'price_pro_monthly';
        const checkoutUrl = await billingService.createStripeCheckout(priceId);
        billingService.redirectToCheckout(checkoutUrl);
      }
    } catch (err: any) {
      console.error('[PricingModal] Checkout error:', err);
      addToast?.(err.message || 'Failed to initialize checkout. Please try again.', 'error');
      setIsLoading(false);
    }
  };

  const isNgn = selectedProvider === 'paystack';
  const priceDisplay = isNgn
    ? billingCycle === 'annual' ? '₦23,750' : '₦28,500'
    : billingCycle === 'annual' ? '$15' : '$19';
  const cycleLabel = billingCycle === 'annual' ? '/month (billed yearly)' : '/month';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-surface-dark-3 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close pricing modal"
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="text-2xl leading-none" aria-hidden="true">
            &times;
          </div>
        </button>

        {/* Region & Payment Provider Selector Banner */}
        <div className="bg-surface-dark-2 border-b border-gray-700/60 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="text-base">🌍</span>
            <span>
              Region detected:{' '}
              <strong className="text-white">
                {geoInfo.isAfrica ? 'Africa (Nigeria & Continental)' : 'Global'}
              </strong>
            </span>
            <span className="hidden sm:inline text-gray-500">•</span>
            <span className="hidden sm:inline text-gray-400">
              {geoInfo.isAfrica
                ? 'Paystack recommended for local cards, transfer & USSD'
                : 'Stripe recommended for international cards'}
            </span>
          </div>

          {/* Payment Gateway Toggle */}
          <div className="flex items-center bg-surface-dark-1 border border-white/10 rounded-lg p-1 text-xs">
            <button
              onClick={() => setSelectedProvider('stripe')}
              className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                selectedProvider === 'stripe'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Stripe</span>
              <span className="text-[10px] opacity-75">(Card / Apple Pay)</span>
            </button>
            <button
              onClick={() => setSelectedProvider('paystack')}
              className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                selectedProvider === 'paystack'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Paystack</span>
              <span className="text-[10px] opacity-75">(Bank / Transfer / Verve)</span>
            </button>
          </div>
        </div>

        {/* Monthly vs Annual Toggle */}
        <div className="flex justify-center pt-6 pb-2">
          <div className="bg-surface-dark-2 border border-white/10 rounded-full p-1 flex items-center text-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all ${
                billingCycle === 'monthly' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Annual billing</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Tiers Container */}
        <div className="flex flex-col md:flex-row">
          {/* Free Tier */}
          <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-gray-700/60 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <p className="text-gray-400 text-sm">Perfect for hobbyists and trying out AI design tools.</p>
            </div>
            <div className="mb-8">
              <span className="text-3xl font-bold text-white">{isNgn ? '₦0' : '$0'}</span>
              <span className="text-gray-500 text-sm">/forever</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Standard Quality Generations',
                '10 Projects Storage Limit',
                'Basic Design Templates',
                'Standard Exports (720p)',
                'Community Support',
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-gray-700/80 flex items-center justify-center shrink-0">
                    <Icons.Check className="w-3 h-3 text-gray-300" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-3 bg-gray-800 text-gray-400 rounded-lg font-bold cursor-default border border-white/5"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="flex-1 p-8 bg-gradient-to-b from-surface-dark-3 to-indigo-950/30 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                Pro <Icons.Magic className="w-4 h-4 text-brand-400" />
              </h3>
              <p className="text-gray-400 text-sm">For creators who want full AI power, speed, and unlimited storage.</p>
            </div>
            <div className="mb-8">
              <span className="text-3xl font-extrabold text-white tracking-tight">{priceDisplay}</span>
              <span className="text-gray-400 text-xs ml-1.5">{cycleLabel}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'HD Quality Generations (4K Render)',
                'Unlimited Projects & Cloud Sync',
                'Premium Vector & Poster Style Packs',
                'Magic Object Eraser & Background Removal',
                'Brand Kits, Color Palettes & Custom Fonts',
                'Full Commercial License',
                'Priority Rendering Queue',
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-white">
                  <div className="w-5 h-5 rounded-full bg-brand-600/90 flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/50">
                    <Icons.Check className="w-3 h-3 text-white" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className={`w-full py-3.5 text-white rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                selectedProvider === 'paystack'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40'
                  : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-purple-950/40'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]`}
            >
              {isLoading ? (
                <>
                  <Icons.RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to {selectedProvider === 'paystack' ? 'Paystack' : 'Stripe'}...</span>
                </>
              ) : (
                <>
                  <span>Upgrade to Pro with {selectedProvider === 'paystack' ? 'Paystack' : 'Stripe'}</span>
                  <Icons.ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-3">
              🔒 256-bit encrypted checkout. Cancel anytime with 1-click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
