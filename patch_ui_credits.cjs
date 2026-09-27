const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/store/slices/uiSlice.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add fields to interface
content = content.replace(
  'showProfileModal: boolean;',
  `showProfileModal: boolean;
  showPricingModal: boolean;
  credits: number;`
);

content = content.replace(
  'setShowProfileModal: (show: boolean) => void;',
  `setShowProfileModal: (show: boolean) => void;
  setShowPricingModal: (show: boolean) => void;
  setCredits: (credits: number) => void;
  deductCredit: (amount?: number) => boolean;`
);

// 2. Add state initial values
content = content.replace(
  'showProfileModal: false,',
  `showProfileModal: false,
  showPricingModal: false,
  credits: typeof window !== 'undefined' ? parseInt(localStorage.getItem('kreathief_credits') || '50', 10) : 50,`
);

// 3. Add actions implementation
const actionsCode = `setShowProfileModal: (show) => set({ showProfileModal: show }),
  setShowPricingModal: (showPricingModal) => set({ showPricingModal }),
  setCredits: (credits) => {
    try { localStorage.setItem('kreathief_credits', String(credits)); } catch {}
    set({ credits });
  },
  deductCredit: (amount = 1) => {
    const current = get().credits ?? 50;
    if (current < amount) {
      set({ showPricingModal: true });
      get().addToast?.('You have run out of AI generation credits! Please upgrade to continue.', 'warning');
      return false;
    }
    const nextCredits = current - amount;
    try { localStorage.setItem('kreathief_credits', String(nextCredits)); } catch {}
    set({ credits: nextCredits });

    const user = get().user;
    if (user && !user.isGuest && user.id !== 'guest') {
      import('../../lib/supabase/client').then(({ db }) => {
        db.from('user_subscriptions')
          .update({ ai_credits_balance: nextCredits })
          .eq('user_id', user.id)
          .then();
      }).catch(() => {});
    }
    return true;
  },`;

content = content.replace(
  'setShowProfileModal: (show) => set({ showProfileModal: show }),',
  actionsCode
);

// 4. Update setUser to automatically fetch and update user's credits balance from Supabase
const setUserCode = `setUser: (user) => {
    if (user && user.credits !== undefined) {
      set({ user, credits: user.credits });
    } else if (user && !user.isGuest && user.id !== 'guest') {
      set({ user });
      import('../../lib/supabase/client').then(({ db }) => {
        db.from('user_subscriptions')
          .select('ai_credits_balance')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data && data.ai_credits_balance !== undefined) {
              set({ credits: data.ai_credits_balance });
              try { localStorage.setItem('kreathief_credits', String(data.ai_credits_balance)); } catch {}
            }
          });
      }).catch(() => {});
    } else {
      set({ user });
    }
  },`;

content = content.replace('setUser: (user) => set({ user }),', setUserCode);

fs.writeFileSync(file, content);
console.log('Patched uiSlice.ts with credits and pricing modal state');
