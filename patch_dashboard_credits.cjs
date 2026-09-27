const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace local showPricingModal state with store subscription
content = content.replace(
  'const [showPricingModal, setShowPricingModal] = useState(false);',
  `const showPricingModal = useStore((state) => (state as any).showPricingModal);
  const setShowPricingModal = useStore((state) => (state as any).setShowPricingModal);
  const credits = useStore((state) => (state as any).credits ?? 50);`
);

// 2. Add Credit Counter Pill before the user info block
const dashboardCreditPill = `
            {/* Live AI Credit Counter Pill */}
            <button
              onClick={() => setShowPricingModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-bold transition-all hover:scale-105 active:scale-95"
              title="AI Credits Remaining — Click to view plans & upgrade"
            >
              <Icons.Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{credits}</span>
              <span className="hidden md:inline text-[10px] font-normal text-amber-400/80">credits</span>
            </button>
`;

content = content.replace(
  '            <div className="text-right hidden sm:block">',
  dashboardCreditPill + '\n            <div className="text-right hidden sm:block">'
);

fs.writeFileSync(file, content);
console.log('Patched Dashboard.tsx with live credits pill & store sync');
