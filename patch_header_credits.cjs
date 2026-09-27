const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/components/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add PricingModal import
content = content.replace(
  "import { ConnectionStatus } from './ConnectionStatus';",
  `import { ConnectionStatus } from './ConnectionStatus';\nimport { PricingModal } from './PricingModal';`
);

// 2. Add hook subscriptions inside Header component
content = content.replace(
  'const { past, future, isSaving, lastSaved, hasUnsavedChanges, projectTitle, showAIOverlay, aiTab } = useStore(',
  `const showPricingModal = useStore((state) => (state as any).showPricingModal);
  const setShowPricingModal = useStore((state) => (state as any).setShowPricingModal);
  const credits = useStore((state) => (state as any).credits ?? 50);

  const { past, future, isSaving, lastSaved, hasUnsavedChanges, projectTitle, showAIOverlay, aiTab } = useStore(`
);

// 3. Add Credit Counter Pill before the user avatar
const creditPill = `
        {/* Live AI Credit Counter Pill */}
        <button
          onClick={() => setShowPricingModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 hover:text-amber-200 transition-all text-xs font-semibold shadow-sm hover:scale-105 active:scale-95"
          title="AI Credits Remaining — Click to view plans & upgrade"
          aria-label="View AI Credits and Pricing"
        >
          <Icons.Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="font-bold">{credits}</span>
          <span className="hidden xl:inline text-[11px] text-amber-400/80 font-normal">credits</span>
        </button>
`;

content = content.replace(
  '        {user && (\n          <button\n            onClick={() => useStore.getState().setShowProfileModal(true)}',
  creditPill + '\n        {user && (\n          <button\n            onClick={() => useStore.getState().setShowProfileModal(true)}'
);

// 4. Mount PricingModal before closing header tag
content = content.replace(
  '    </header>',
  `      {showPricingModal && (
        <PricingModal onClose={() => setShowPricingModal(false)} />
      )}
    </header>`
);

fs.writeFileSync(file, content);
console.log('Patched Header.tsx with live Credit Counter Pill & PricingModal');
