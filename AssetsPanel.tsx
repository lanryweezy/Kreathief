// Wire-up: AssetUploadModal
// File: components/panels/AssetsPanel.tsx
// Change: Add import and render for AssetUploadModal

// ADD THIS IMPORT (near the top with other imports):
import { AssetUploadModal } from '../modals/AssetUploadModal';

// ADD THIS STATE (inside the component, near other state declarations):
const [uploadModalOpen, setUploadModalOpen] = useState(false);

// ADD THIS BUTTON inside the header section, after the <h3> element (around line 230):
<div className="flex items-center justify-between mb-4">
  <h3 className="font-bold text-white flex items-center gap-2">
    <Icons.Image className="w-5 h-5 text-accent" />
    {provider ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} Photos` : 'Pro Photos'}
  </h3>
  <button
    onClick={() => setUploadModalOpen(true)}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 text-accent rounded-lg text-xs font-bold hover:bg-accent/30 transition-colors"
  >
    <Icons.Plus className="w-3.5 h-3.5" />
    Upload
  </button>
</div>

// REMOVE the old <h3> element since we replaced it with the flex container above.

// ADD THIS RENDER at the end of the component, before the closing </div>:
<AssetUploadModal
  isOpen={uploadModalOpen}
  onClose={() => setUploadModalOpen(false)}
/>
