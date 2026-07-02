// Wire-up: CreatorSignupModal
// File: components/Dashboard.tsx
// Change: Add import and render for CreatorSignupModal

// ADD THIS IMPORT (near the top with other modal imports):
import { CreatorSignupModal } from './modals/CreatorSignupModal';

// ADD THIS STATE (near the other modal state declarations around line 230):
const [creatorSignupOpen, setCreatorSignupOpen] = useState(false);

// ADD THIS BUTTON inside the profile dropdown menu (after the Sign Out button, around line 430):
<button
  onClick={(e) => {
    e.stopPropagation();
    setProfileDropdownOpen(false);
    setCreatorSignupOpen(true);
  }}
  onKeyDown={(e) => e.key === 'Enter' && setProfileDropdownOpen(false)}
  className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-400 hover:bg-brand-500/10 rounded-xl flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-brand-500/10"
  role="menuitem"
>
  <Icons.User className="w-4 h-4" /> Become Creator
</button>

// ADD THIS RENDER at the end of the component, next to other modals (after CreateProjectModal):
<CreatorSignupModal
  isOpen={creatorSignupOpen}
  onClose={() => setCreatorSignupOpen(false)}
/>
