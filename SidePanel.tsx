// Wire-up: DesignQualityScorer and SmartContentGenerator
// File: components/SidePanel.tsx
// Change: Add imports, state, buttons, and renders for both components

// ADD THESE IMPORTS (near the top with other imports):
import { DesignQualityScorer } from './DesignQualityScorer';
import { SmartContentGenerator } from './SmartContentGenerator';

// ADD THESE STATES (inside the component, near other state declarations):
const [qualityScorerOpen, setQualityScorerOpen] = useState(false);
const [contentGeneratorOpen, setContentGeneratorOpen] = useState(false);

// ADD THESE BUTTONS inside the SidePanel, right after the ErrorBoundary opening tag and before the motion.div
// Place them in a floating toolbar at the top of the panel:

// Inside the ErrorBoundary, add before the motion.div:
<div className="sticky top-0 z-10 flex gap-1 p-2 bg-surface-dark-2/95 backdrop-blur-xl border-b border-white/5">
  <button
    onClick={() => setQualityScorerOpen(true)}
    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-bold hover:bg-blue-500/20 transition-colors"
    title="Design Quality Score"
  >
    <Icons.Sparkles className="w-3.5 h-3.5" />
    Score
  </button>
  <button
    onClick={() => setContentGeneratorOpen(true)}
    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-bold hover:bg-green-500/20 transition-colors"
    title="AI Content Generator"
  >
    <Icons.Magic className="w-3.5 h-3.5" />
    Content
  </button>
</div>

// ADD THESE RENDERS at the end of the component, after the closing </motion.div> but before the closing </ErrorBoundary>:
<DesignQualityScorer
  isOpen={qualityScorerOpen}
  onClose={() => setQualityScorerOpen(false)}
  designImage={uploadedImage || undefined}
/>

<SmartContentGenerator
  isOpen={contentGeneratorOpen}
  onClose={() => setContentGeneratorOpen(false)}
/>
