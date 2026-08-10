import { log } from '../utils/log';

export interface StickerAsset {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  source: 'tenor' | 'curated';
}

// Curated high-utility static design sticker packs (SVG Data URIs with die-cut white borders & drop shadows)
const CURATED_STICKERS: StickerAsset[] = [
  {
    id: 'curated_star_badge',
    name: '100% Quality Badge',
    source: 'curated',
    width: 200,
    height: 200,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><polygon points="100,10 120,60 170,70 135,110 145,160 100,135 55,160 65,110 30,70 80,60" fill="%23FFFFFF" stroke="%23FFFFFF" stroke-width="8" stroke-linejoin="round"/><polygon points="100,18 116,61 160,70 128,105 137,149 100,127 63,149 72,105 40,70 84,61" fill="%23FFD700"/><circle cx="100" cy="90" r="32" fill="%23FF4500"/><text x="100" y="96" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="%23FFFFFF" text-anchor="middle">100%</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><polygon points="100,18 116,61 160,70 128,105 137,149 100,127 63,149 72,105 40,70 84,61" fill="%23FFD700" stroke="%23FFF" stroke-width="6"/><circle cx="100" cy="90" r="32" fill="%23FF4500"/><text x="100" y="96" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="%23FFFFFF" text-anchor="middle">100%</text></svg>`,
  },
  {
    id: 'curated_fire_sticker',
    name: 'Fire Lit Sticker',
    source: 'curated',
    width: 200,
    height: 200,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><path d="M100,15 C130,50 160,90 160,130 A60,60 0 0,1 40,130 C40,90 70,50 100,15 Z" fill="%23FFFFFF" stroke="%23FFFFFF" stroke-width="10" stroke-linejoin="round"/><path d="M100,25 C125,55 150,90 150,130 A50,50 0 0,1 50,130 C50,90 75,55 100,25 Z" fill="%23FF4500"/><path d="M100,65 C115,85 135,110 135,140 A35,35 0 0,1 65,140 C65,110 85,85 100,65 Z" fill="%23FFD700"/><text x="100" y="160" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="%23FFFFFF" text-anchor="middle">LIT!</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100,25 C125,55 150,90 150,130 A50,50 0 0,1 50,130 C50,90 75,55 100,25 Z" fill="%23FF4500" stroke="%23FFF" stroke-width="8"/><path d="M100,65 C115,85 135,110 135,140 A35,35 0 0,1 65,140 C65,110 85,85 100,65 Z" fill="%23FFD700"/></svg>`,
  },
  {
    id: 'curated_approved_stamp',
    name: 'Approved Stamp Sticker',
    source: 'curated',
    width: 220,
    height: 120,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="200" height="100" rx="16" fill="%23FFFFFF" stroke="%23FFFFFF" stroke-width="8"/><rect x="18" y="18" width="184" height="84" rx="12" fill="none" stroke="%2310B981" stroke-width="6" stroke-dasharray="8 4"/><text x="110" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%2310B981" text-anchor="middle" transform="rotate(-4 110 70)">APPROVED</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120"><rect x="18" y="18" width="184" height="84" rx="12" fill="%23FFF" stroke="%2310B981" stroke-width="6"/><text x="110" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%2310B981" text-anchor="middle">APPROVED</text></svg>`,
  },
  {
    id: 'curated_sale_tag',
    name: 'Sale Tag Sticker',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><circle cx="90" cy="90" r="75" fill="%23FFFFFF"/><circle cx="90" cy="90" r="68" fill="%23EC4899"/><text x="90" y="85" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23FFFFFF" text-anchor="middle">SALE</text><text x="90" y="115" font-family="Arial, sans-serif" font-weight="700" font-size="20" fill="%23FDE047" text-anchor="middle">50% OFF</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><circle cx="90" cy="90" r="68" fill="%23EC4899" stroke="%23FFF" stroke-width="6"/><text x="90" y="85" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23FFFFFF" text-anchor="middle">SALE</text><text x="90" y="115" font-family="Arial, sans-serif" font-weight="700" font-size="20" fill="%23FDE047" text-anchor="middle">50%</text></svg>`,
  },
  {
    id: 'curated_wow_bubble',
    name: 'WOW Comic Sticker',
    source: 'curated',
    width: 200,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><path d="M10,80 L30,50 L20,30 L60,40 L80,10 L110,35 L150,15 L160,50 L190,70 L165,100 L185,130 L145,135 L120,155 L90,135 L50,150 L55,115 L15,110 Z" fill="%23FFFFFF" stroke="%23FFFFFF" stroke-width="8" stroke-linejoin="round"/><path d="M18,80 L35,54 L27,36 L62,45 L80,18 L107,40 L143,23 L152,54 L179,72 L157,99 L175,125 L139,129 L117,147 L90,129 L54,142 L59,111 L23,106 Z" fill="%23FACC15"/><text x="100" y="95" font-family="Arial, sans-serif" font-weight="900" font-size="42" fill="%23000000" text-anchor="middle" transform="rotate(-5 100 95)">WOW!</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><path d="M18,80 L35,54 L27,36 L62,45 L80,18 L107,40 L143,23 L152,54 L179,72 L157,99 L175,125 L139,129 L117,147 L90,129 L54,142 L59,111 L23,106 Z" fill="%23FACC15" stroke="%23FFF" stroke-width="6"/><text x="100" y="95" font-family="Arial, sans-serif" font-weight="900" font-size="42" fill="%23000000" text-anchor="middle">WOW!</text></svg>`,
  },
  {
    id: 'curated_new_badge',
    name: 'NEW Drop Badge',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><circle cx="80" cy="80" r="70" fill="%23FFFFFF"/><circle cx="80" cy="80" r="62" fill="%233B82F6"/><text x="80" y="90" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="%23FFFFFF" text-anchor="middle" transform="rotate(-10 80 90)">NEW</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="62" fill="%233B82F6" stroke="%23FFF" stroke-width="6"/><text x="80" y="90" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="%23FFFFFF" text-anchor="middle">NEW</text></svg>`,
  },
  {
    id: 'curated_verified_badge',
    name: 'Verified Check Badge',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><path d="M80,10 L95,25 L116,20 L124,40 L144,48 L142,69 L157,84 L144,101 L148,122 L127,128 L120,148 L100,142 L80,154 L60,142 L40,148 L33,128 L12,122 L16,101 L3,84 L18,69 L16,48 L36,40 L44,20 L65,25 Z" fill="%23FFFFFF"/><path d="M80,16 L93,30 L112,25 L119,43 L137,50 L135,69 L149,83 L137,98 L141,117 L122,122 L115,140 L97,135 L80,146 L63,135 L45,140 L38,122 L19,117 L23,98 L11,83 L25,69 L23,50 L41,43 L48,25 L67,30 Z" fill="%230284C7"/><path d="M55,83 L72,100 L110,62" fill="none" stroke="%23FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="65" fill="%230284C7" stroke="%23FFF" stroke-width="6"/><path d="M55,83 L72,100 L110,62" fill="none" stroke="%23FFFFFF" stroke-width="12" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'curated_best_seller',
    name: 'Best Seller Ribbon',
    source: 'curated',
    width: 200,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><polygon points="60,110 60,170 85,150 110,170 110,110" fill="%23DC2626"/><circle cx="100" cy="70" r="60" fill="%23FFFFFF"/><circle cx="100" cy="70" r="52" fill="%23EAB308"/><text x="100" y="62" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="%23FFFFFF" text-anchor="middle">BEST</text><text x="100" y="82" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="%23FFFFFF" text-anchor="middle">SELLER</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180"><circle cx="100" cy="70" r="52" fill="%23EAB308" stroke="%23FFF" stroke-width="6"/><text x="100" y="75" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="%23FFFFFF" text-anchor="middle">BEST SELLER</text></svg>`,
  },
  {
    id: 'curated_hot_deal',
    name: 'Hot Deal Badge',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><polygon points="90,10 112,30 142,20 148,50 178,62 166,90 178,118 148,130 142,160 112,150 90,170 68,150 38,160 32,130 2,118 14,90 2,62 32,50 38,20 68,30" fill="%23FFFFFF"/><polygon points="90,18 108,34 135,26 140,52 165,62 154,88 165,114 140,124 135,150 108,142 90,158 72,142 45,150 40,124 15,114 26,88 15,62 40,52 45,26 72,34" fill="%23EF4444"/><text x="90" y="82" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%23FFFFFF" text-anchor="middle">HOT</text><text x="90" y="110" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%23FACC15" text-anchor="middle">DEAL</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><polygon points="90,18 108,34 135,26 140,52 165,62 154,88 165,114 140,124 135,150 108,142 90,158 72,142 45,150 40,124 15,114 26,88 15,62 40,52 45,26 72,34" fill="%23EF4444" stroke="%23FFF" stroke-width="6"/><text x="90" y="100" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%23FFFFFF" text-anchor="middle">HOT DEAL</text></svg>`,
  },
  {
    id: 'curated_vip_badge',
    name: 'VIP Pass Sticker',
    source: 'curated',
    width: 200,
    height: 140,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="180" height="120" rx="20" fill="%23FFFFFF"/><rect x="18" y="18" width="164" height="104" rx="14" fill="%2318181B" stroke="%23EAB308" stroke-width="4"/><text x="100" y="76" font-family="Arial, sans-serif" font-weight="900" font-size="40" fill="%23EAB308" text-anchor="middle" letter-spacing="4">VIP</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><rect x="18" y="18" width="164" height="104" rx="14" fill="%2318181B" stroke="%23EAB308" stroke-width="4"/><text x="100" y="76" font-family="Arial, sans-serif" font-weight="900" font-size="40" fill="%23EAB308" text-anchor="middle">VIP</text></svg>`,
  },
  {
    id: 'curated_limited_edition',
    name: 'Limited Edition Stamp',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><circle cx="90" cy="90" r="75" fill="%23FFFFFF"/><circle cx="90" cy="90" r="66" fill="%238B5CF6"/><text x="90" y="75" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="%23DDD6FE" text-anchor="middle">LIMITED</text><text x="90" y="105" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="%23FFFFFF" text-anchor="middle">EDITION</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><circle cx="90" cy="90" r="66" fill="%238B5CF6" stroke="%23FFF" stroke-width="6"/><text x="90" y="95" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="%23FFFFFF" text-anchor="middle">LIMITED</text></svg>`,
  },
  {
    id: 'curated_top_rated',
    name: 'Top Rated Badge',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><polygon points="90,10 112,30 142,20 148,50 178,62 166,90 178,118 148,130 142,160 112,150 90,170 68,150 38,160 32,130 2,118 14,90 2,62 32,50 38,20 68,30" fill="%23FFFFFF"/><polygon points="90,18 108,34 135,26 140,52 165,62 154,88 165,114 140,124 135,150 108,142 90,158 72,142 45,150 40,124 15,114 26,88 15,62 40,52 45,26 72,34" fill="%23F59E0B"/><text x="90" y="75" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="%23FFFFFF" text-anchor="middle">TOP</text><text x="90" y="105" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="%23FFFFFF" text-anchor="middle">RATED</text><text x="90" y="130" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="%23FEF08A" text-anchor="middle">★★★★★</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><polygon points="90,18 108,34 135,26 140,52 165,62 154,88 165,114 140,124 135,150 108,142 90,158 72,142 45,150 40,124 15,114 26,88 15,62 40,52 45,26 72,34" fill="%23F59E0B" stroke="%23FFF" stroke-width="6"/><text x="90" y="90" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="%23FFFFFF" text-anchor="middle">TOP RATED</text></svg>`,
  },
  {
    id: 'curated_organic_green',
    name: '100% Organic Badge',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><circle cx="90" cy="90" r="75" fill="%23FFFFFF"/><circle cx="90" cy="90" r="66" fill="%2316A34A"/><text x="90" y="75" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="%23BBF7D0" text-anchor="middle">100%</text><text x="90" y="105" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="%23FFFFFF" text-anchor="middle">ORGANIC</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><circle cx="90" cy="90" r="66" fill="%2316A34A" stroke="%23FFF" stroke-width="6"/><text x="90" y="95" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="%23FFFFFF" text-anchor="middle">ORGANIC</text></svg>`,
  },
  {
    id: 'curated_flash_sale',
    name: 'Flash Sale Bolt',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><polygon points="95,10 50,95 85,95 60,170 135,75 95,75" fill="%23FFFFFF" stroke="%23FFFFFF" stroke-width="8" stroke-linejoin="round"/><polygon points="95,18 55,95 88,95 68,160 128,78 92,78" fill="%23EAB308"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><polygon points="95,18 55,95 88,95 68,160 128,78 92,78" fill="%23EAB308" stroke="%23FFF" stroke-width="6"/></svg>`,
  },
  {
    id: 'curated_free_shipping',
    name: 'Free Shipping Badge',
    source: 'curated',
    width: 200,
    height: 120,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="180" height="100" rx="16" fill="%23FFFFFF"/><rect x="18" y="18" width="164" height="84" rx="12" fill="%232563EB"/><text x="100" y="55" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="%23FFFFFF" text-anchor="middle">FREE</text><text x="100" y="80" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="%2393C5FD" text-anchor="middle">SHIPPING</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><rect x="18" y="18" width="164" height="84" rx="12" fill="%232563EB" stroke="%23FFF" stroke-width="6"/><text x="100" y="65" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="%23FFFFFF" text-anchor="middle">FREE SHIPPING</text></svg>`,
  },

  // === NEO-BRUTALIST & Y2K STYLES ===
  {
    id: 'curated_neobrutalist_chill',
    name: 'Neo-Brutalist CHILL Sticker',
    source: 'curated',
    width: 200,
    height: 130,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130"><g><rect x="20" y="20" width="170" height="90" rx="12" fill="%23000000"/><rect x="12" y="12" width="170" height="90" rx="12" fill="%23A855F7" stroke="%23000000" stroke-width="6"/><text x="97" y="70" font-family="Impact, Arial, sans-serif" font-weight="900" font-size="42" fill="%23CCFF00" text-anchor="middle" letter-spacing="2" transform="rotate(-3 97 70)">CHILL</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130"><rect x="12" y="12" width="170" height="90" rx="12" fill="%23A855F7" stroke="%23000000" stroke-width="6"/><text x="97" y="70" font-family="Impact, Arial, sans-serif" font-weight="900" font-size="42" fill="%23CCFF00" text-anchor="middle">CHILL</text></svg>`,
  },
  {
    id: 'curated_neobrutalist_hyped',
    name: 'Y2K HYPED Badge',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><g><polygon points="98,18 123,38 153,28 158,58 183,72 168,102 183,132 153,142 148,172 118,162 98,182 78,162 48,172 43,142 13,132 28,102 13,72 43,58 48,28 78,38" fill="%23000000"/><polygon points="90,10 115,30 145,20 150,50 175,64 160,94 175,124 145,134 140,164 110,154 90,174 70,154 40,164 35,134 5,124 20,94 5,64 35,50 40,20 70,30" fill="%23CCFF00" stroke="%23000000" stroke-width="6"/><text x="90" y="104" font-family="Impact, Arial, sans-serif" font-weight="900" font-size="34" fill="%23000000" text-anchor="middle" transform="rotate(-6 90 104)">HYPED!</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><polygon points="90,10 115,30 145,20 150,50 175,64 160,94 175,124 145,134 140,164 110,154 90,174 70,154 40,164 35,134 5,124 20,94 5,64 35,50 40,20 70,30" fill="%23CCFF00" stroke="%23000000" stroke-width="6"/><text x="90" y="104" font-family="Impact, Arial, sans-serif" font-weight="900" font-size="34" fill="%23000000" text-anchor="middle">HYPED!</text></svg>`,
  },

  // === HOLOGRAPHIC & GLASS STYLES ===
  {
    id: 'curated_holographic_magic',
    name: 'Holographic MAGIC Glass Sticker',
    source: 'curated',
    width: 200,
    height: 140,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><defs><linearGradient id="holo" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23EC4899"/><stop offset="50%" stop-color="%238B5CF6"/><stop offset="100%" stop-color="%2306B6D4"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(%23glow)"><rect x="10" y="10" width="180" height="120" rx="24" fill="url(%23holo)" stroke="%23FFFFFF" stroke-width="6"/><text x="100" y="78" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="%23FFFFFF" text-anchor="middle" letter-spacing="3">MAGIC</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><rect x="10" y="10" width="180" height="120" rx="24" fill="%238B5CF6" stroke="%23FFF" stroke-width="6"/><text x="100" y="78" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="%23FFFFFF" text-anchor="middle">MAGIC</text></svg>`,
  },
  {
    id: 'curated_holographic_aura',
    name: 'AURA Iridescent Badge',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><linearGradient id="aura" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23F43F5E"/><stop offset="33%" stop-color="%23FB923C"/><stop offset="66%" stop-color="%23FACC15"/><stop offset="100%" stop-color="%234ADE80"/></linearGradient></defs><g><circle cx="90" cy="90" r="75" fill="%23FFFFFF"/><circle cx="90" cy="90" r="66" fill="url(%23aura)"/><text x="90" y="100" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="%23FFFFFF" text-anchor="middle" letter-spacing="2">AURA</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><circle cx="90" cy="90" r="66" fill="%23FB923C" stroke="%23FFF" stroke-width="6"/><text x="90" y="100" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="%23FFFFFF" text-anchor="middle">AURA</text></svg>`,
  },

  // === RETRO SYNTHWAVE / NEON ===
  {
    id: 'curated_retro_synthwave',
    name: 'Retro 80s Neon Sticker',
    source: 'curated',
    width: 220,
    height: 130,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 130"><g><rect x="10" y="10" width="200" height="110" rx="16" fill="%230F172A" stroke="%2306B6D4" stroke-width="6"/><text x="110" y="55" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23F43F5E" text-anchor="middle" letter-spacing="4">RETRO</text><text x="110" y="90" font-family="Arial, sans-serif" font-weight="900" font-size="26" fill="%2338BDF8" text-anchor="middle" letter-spacing="3">VIBES</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 130"><rect x="10" y="10" width="200" height="110" rx="16" fill="%230F172A" stroke="%2306B6D4" stroke-width="6"/><text x="110" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%23F43F5E" text-anchor="middle">RETRO</text></svg>`,
  },

  // === HAND-DRAWN DOODLE ===
  {
    id: 'curated_doodle_speech',
    name: 'Hand-Drawn IDEA! Bubble',
    source: 'curated',
    width: 200,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><g><path d="M20,30 C30,10 170,10 180,30 C195,60 190,100 170,120 C130,135 90,130 70,135 L40,155 L45,130 C20,120 10,80 20,30 Z" fill="%23FFFFFF" stroke="%23000000" stroke-width="8" stroke-linejoin="round"/><path d="M25,35 C35,18 165,18 175,35 C188,62 183,96 165,114 C128,128 88,124 70,128 L46,145 L50,123 C26,114 16,77 25,35 Z" fill="%23FEF08A"/><text x="100" y="85" font-family="Comic Sans MS, cursive, sans-serif" font-weight="900" font-size="34" fill="%23000000" text-anchor="middle" transform="rotate(-4 100 85)">IDEA!</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><path d="M25,35 C35,18 165,18 175,35 C188,62 183,96 165,114 Z" fill="%23FEF08A" stroke="%23000" stroke-width="6"/><text x="100" y="85" font-family="Comic Sans MS, cursive, sans-serif" font-weight="900" font-size="34" fill="%23000000" text-anchor="middle">IDEA!</text></svg>`,
  },

  // === PIXEL ART / 8-BIT ===
  {
    id: 'curated_pixel_1up',
    name: '8-Bit 1UP Pixel Heart',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.5"/></filter></defs><g filter="url(%23shadow)"><rect x="30" y="40" width="20" height="20" fill="%23EF4444" stroke="%23000000" stroke-width="4"/><rect x="50" y="20" width="20" height="20" fill="%23EF4444" stroke="%23000000" stroke-width="4"/><rect x="70" y="20" width="20" height="20" fill="%23EF4444" stroke="%23000000" stroke-width="4"/><rect x="90" y="40" width="20" height="20" fill="%23EF4444" stroke="%23000000" stroke-width="4"/><rect x="110" y="40" width="20" height="20" fill="%23EF4444" stroke="%23000000" stroke-width="4"/><rect x="30" y="60" width="100" height="20" fill="%23EF4444" stroke="%23000000" stroke-width="4"/><rect x="50" y="80" width="60" height="20" fill="%23EF4444" stroke="%23000000" stroke-width="4"/><rect x="70" y="100" width="20" height="20" fill="%23EF4444" stroke="%23000000" stroke-width="4"/><text x="80" y="75" font-family="'Courier New', Courier, monospace" font-weight="900" font-size="20" fill="%23FFFFFF" text-anchor="middle">1UP</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect x="50" y="20" width="60" height="100" fill="%23EF4444" stroke="%23000" stroke-width="4"/><text x="80" y="75" font-family="'Courier New', Courier, monospace" font-weight="900" font-size="20" fill="%23FFFFFF" text-anchor="middle">1UP</text></svg>`,
  },

  // === METALLIC / CHROME ===
  {
    id: 'curated_chrome_fire',
    name: 'Chrome FIRE Emblem',
    source: 'curated',
    width: 220,
    height: 120,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120"><defs><linearGradient id="chrome" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23FFFFFF"/><stop offset="45%" stop-color="%2394A3B8"/><stop offset="50%" stop-color="%231E293B"/><stop offset="100%" stop-color="%23E2E8F0"/></linearGradient></defs><g><rect x="10" y="10" width="200" height="100" rx="50" fill="%23000000"/><rect x="15" y="15" width="190" height="90" rx="45" fill="url(%23chrome)"/><text x="110" y="75" font-family="Arial, sans-serif" font-weight="900" font-size="46" fill="%23000000" text-anchor="middle" letter-spacing="2">FIRE</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120"><rect x="15" y="15" width="190" height="90" rx="45" fill="%2394A3B8" stroke="%23000" stroke-width="4"/><text x="110" y="75" font-family="Arial, sans-serif" font-weight="900" font-size="46" fill="%23000000" text-anchor="middle">FIRE</text></svg>`,
  },

  // === CLAYMORPHISM / SOFT 3D ===
  {
    id: 'curated_clay_soft',
    name: 'Claymorphism Soft Bubble',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><filter id="clay"><feDropShadow dx="10" dy="10" stdDeviation="15" flood-color="%23A78BFA" flood-opacity="0.5"/><feDropShadow dx="-10" dy="-10" stdDeviation="15" flood-color="%23FFFFFF" flood-opacity="0.8"/><feInnerShadow dx="-5" dy="-5" stdDeviation="5" flood-color="%23A78BFA" flood-opacity="0.2"/><feInnerShadow dx="5" dy="5" stdDeviation="5" flood-color="%23FFFFFF" flood-opacity="1"/></filter></defs><g><circle cx="90" cy="90" r="70" fill="%23DDD6FE" filter="url(%23clay)"/><text x="90" y="100" font-family="Quicksand, Arial, sans-serif" font-weight="900" font-size="28" fill="%237C3AED" text-anchor="middle">SOFT</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><circle cx="90" cy="90" r="70" fill="%23DDD6FE"/><text x="90" y="100" font-family="Quicksand, Arial, sans-serif" font-weight="900" font-size="28" fill="%237C3AED" text-anchor="middle">SOFT</text></svg>`,
  },

  // === SWISS / BAUHAUS MINIMAL ===
  {
    id: 'curated_bauhaus_pure',
    name: 'Bauhaus PURE Geometric',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><g><rect x="10" y="10" width="140" height="140" fill="%23000000"/><circle cx="50" cy="50" r="30" fill="%23E11D48"/><path d="M90,20 L140,80 L90,140 Z" fill="%232563EB"/><rect x="20" y="90" width="60" height="50" fill="%23FBBF24"/><text x="80" y="88" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="28" fill="%23FFFFFF" text-anchor="middle" letter-spacing="4">PURE</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect x="10" y="10" width="140" height="140" fill="%23000000"/><circle cx="50" cy="50" r="30" fill="%23E11D48"/><text x="80" y="88" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="28" fill="%23FFFFFF" text-anchor="middle">PURE</text></svg>`,
  },

  // === POP ART / COMIC BOOK ===
  {
    id: 'curated_popart_boom',
    name: 'Pop Art BOOM! Comic',
    source: 'curated',
    width: 200,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180"><defs><pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="%23EF4444"/></pattern><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="8" dy="8" stdDeviation="0" flood-opacity="1" flood-color="%23000000"/></filter></defs><g filter="url(%23shadow)"><polygon points="100,10 120,50 170,40 140,80 190,110 140,130 150,170 100,140 50,170 60,130 10,110 60,80 30,40 80,50" fill="%23FDE047" stroke="%23000000" stroke-width="8" stroke-linejoin="round"/><polygon points="100,20 115,55 160,45 135,80 180,110 135,125 145,160 100,135 55,160 65,125 20,110 65,80 40,45 85,55" fill="url(%23dots)"/><text x="100" y="105" font-family="Comic Sans MS, Impact, sans-serif" font-weight="900" font-size="44" fill="%23FFFFFF" stroke="%23000000" stroke-width="8" text-anchor="middle" transform="rotate(-5 100 105)">BOOM!</text><text x="100" y="105" font-family="Comic Sans MS, Impact, sans-serif" font-weight="900" font-size="44" fill="%23FFFFFF" text-anchor="middle" transform="rotate(-5 100 105)">BOOM!</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180"><polygon points="100,10 120,50 170,40 140,80 190,110 140,130 150,170 100,140 50,170 60,130 10,110 60,80 30,40 80,50" fill="%23FDE047" stroke="%23000" stroke-width="6"/><text x="100" y="105" font-family="Comic Sans MS, Impact, sans-serif" font-weight="900" font-size="44" fill="%23FFFFFF" stroke="%23000" stroke-width="4" text-anchor="middle">BOOM!</text></svg>`,
  },
  {
    id: 'curated_popart_wow',
    name: 'Pop Art WOW! Bubble',
    source: 'curated',
    width: 200,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><defs><pattern id="dotsWow" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="%233B82F6"/></pattern><filter id="shadowWow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="6" dy="6" stdDeviation="0" flood-opacity="1" flood-color="%23000000"/></filter></defs><g filter="url(%23shadowWow)"><path d="M20,80 A 60 40 0 1 1 180,80 A 60 40 0 0 1 140,120 L160,150 L100,120 A 60 40 0 0 1 20,80 Z" fill="%23FBCFE8" stroke="%23000000" stroke-width="8" stroke-linejoin="round"/><path d="M28,80 A 52 32 0 1 1 172,80 A 52 32 0 0 1 135,112 L150,135 L100,112 A 52 32 0 0 1 28,80 Z" fill="url(%23dotsWow)"/><text x="100" y="90" font-family="Comic Sans MS, Impact, sans-serif" font-weight="900" font-size="48" fill="%23FACC15" stroke="%23000000" stroke-width="8" text-anchor="middle">WOW!</text><text x="100" y="90" font-family="Comic Sans MS, Impact, sans-serif" font-weight="900" font-size="48" fill="%23FACC15" text-anchor="middle">WOW!</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><path d="M20,80 A 60 40 0 1 1 180,80 A 60 40 0 0 1 140,120 L160,150 L100,120 A 60 40 0 0 1 20,80 Z" fill="%23FBCFE8" stroke="%23000" stroke-width="6"/><text x="100" y="90" font-family="Comic Sans MS, Impact, sans-serif" font-weight="900" font-size="48" fill="%23FACC15" stroke="%23000" stroke-width="4" text-anchor="middle">WOW!</text></svg>`,
  },

  // === Y2K CYBER / TRIBAL ===
  {
    id: 'curated_cyber_tribal',
    name: 'Cyber Y2K Tribal Star',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><linearGradient id="cyber" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23A78BFA"/><stop offset="50%" stop-color="%2338BDF8"/><stop offset="100%" stop-color="%232DD4BF"/></linearGradient></defs><g><path d="M90,10 Q95,75 160,90 Q95,105 90,170 Q85,105 20,90 Q85,75 90,10 Z" fill="url(%23cyber)" stroke="%23FFFFFF" stroke-width="4"/><path d="M90,30 Q93,78 140,90 Q93,102 90,150 Q87,102 40,90 Q87,78 90,30 Z" fill="%230F172A"/><circle cx="90" cy="90" r="15" fill="%23FFFFFF"/><text x="90" y="95" font-family="Arial, sans-serif" font-weight="900" font-size="12" fill="%230F172A" text-anchor="middle">Y2K</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><path d="M90,10 Q95,75 160,90 Q95,105 90,170 Q85,105 20,90 Q85,75 90,10 Z" fill="%2338BDF8" stroke="%23FFF" stroke-width="4"/><text x="90" y="95" font-family="Arial, sans-serif" font-weight="900" font-size="12" fill="%23000" text-anchor="middle">Y2K</text></svg>`,
  },
  {
    id: 'curated_cyber_chrome',
    name: 'Cyber Chrome Badge',
    source: 'curated',
    width: 200,
    height: 120,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><defs><linearGradient id="cyberChrome" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23E2E8F0"/><stop offset="45%" stop-color="%2364748B"/><stop offset="50%" stop-color="%23020617"/><stop offset="100%" stop-color="%2394A3B8"/></linearGradient></defs><g><path d="M20,10 L180,10 L195,60 L180,110 L20,110 L5,60 Z" fill="%23000000"/><path d="M25,18 L175,18 L188,60 L175,102 L25,102 L12,60 Z" fill="url(%23cyberChrome)"/><text x="100" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="%23FFFFFF" text-anchor="middle" letter-spacing="6">CYBER</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><path d="M25,18 L175,18 L188,60 L175,102 L25,102 L12,60 Z" fill="%2364748B" stroke="%23FFF" stroke-width="4"/><text x="100" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="%23FFFFFF" text-anchor="middle">CYBER</text></svg>`,
  },

  // === MEMPHIS / 90S RETRO ===
  {
    id: 'curated_memphis_fresh',
    name: '90s Memphis FRESH Squiggle',
    source: 'curated',
    width: 210,
    height: 140,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 140"><g><rect x="15" y="15" width="180" height="110" rx="16" fill="%23000000"/><rect x="10" y="10" width="180" height="110" rx="16" fill="%23EC4899" stroke="%23000000" stroke-width="6"/><path d="M30,30 Q45,15 60,30 T90,30" fill="none" stroke="%23FACC15" stroke-width="8" stroke-linecap="round"/><circle cx="160" cy="35" r="12" fill="%2306B6D4" stroke="%23000000" stroke-width="4"/><text x="100" y="82" font-family="Impact, Arial, sans-serif" font-weight="900" font-size="38" fill="%23A3E635" text-anchor="middle" letter-spacing="3" transform="rotate(-3 100 82)">FRESH!</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 140"><rect x="10" y="10" width="180" height="110" rx="16" fill="%23EC4899" stroke="%23000" stroke-width="6"/><text x="100" y="82" font-family="Impact, Arial, sans-serif" font-weight="900" font-size="38" fill="%23A3E635" text-anchor="middle">FRESH!</text></svg>`,
  },

  // === CYBERPUNK NEON ===
  {
    id: 'curated_neon_sign',
    name: 'Cyberpunk Glow NEON Sign',
    source: 'curated',
    width: 200,
    height: 120,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><defs><filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g><rect x="10" y="10" width="180" height="100" rx="20" fill="%2309090B" stroke="%23EC4899" stroke-width="6" filter="url(%23neonGlow)"/><text x="100" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="%2322D3EE" text-anchor="middle" letter-spacing="4" filter="url(%23neonGlow)">NEON</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><rect x="10" y="10" width="180" height="100" rx="20" fill="%2309090B" stroke="%23EC4899" stroke-width="6"/><text x="100" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="%2322D3EE" text-anchor="middle">NEON</text></svg>`,
  },

  // === VINTAGE STAMP / SEAL ===
  {
    id: 'curated_vintage_stamp',
    name: 'Vintage Rubber APPROVED Seal',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><g><circle cx="90" cy="90" r="75" fill="none" stroke="%23DC2626" stroke-width="8" stroke-dasharray="12,6"/><circle cx="90" cy="90" r="62" fill="none" stroke="%23DC2626" stroke-width="4"/><rect x="15" y="70" width="150" height="40" fill="%23DC2626" transform="rotate(-12 90 90)"/><text x="90" y="98" font-family="Impact, Arial, sans-serif" font-weight="900" font-size="24" fill="%23FFFFFF" text-anchor="middle" letter-spacing="3" transform="rotate(-12 90 90)">APPROVED</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><circle cx="90" cy="90" r="75" fill="none" stroke="%23DC2626" stroke-width="8"/><text x="90" y="98" font-family="Impact, Arial, sans-serif" font-weight="900" font-size="20" fill="%23DC2626" text-anchor="middle">APPROVED</text></svg>`,
  },

  // === GRADIENT HOLOGRAPHIC STARBURST ===
  {
    id: 'curated_holo_starburst',
    name: 'Holographic SUPERSTAR Burst',
    source: 'curated',
    width: 190,
    height: 190,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 190"><defs><linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23F472B6"/><stop offset="33%" stop-color="%2338BDF8"/><stop offset="66%" stop-color="%23FACC15"/><stop offset="100%" stop-color="%234ADE80"/></linearGradient></defs><g><path d="M95,10 L115,65 L175,45 L145,95 L180,140 L125,135 L105,185 L80,140 L25,160 L45,105 L10,65 L70,60 Z" fill="url(%23starGradient)" stroke="%23FFFFFF" stroke-width="6"/><circle cx="95" cy="95" r="45" fill="%230F172A"/><text x="95" y="100" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="%23FFFFFF" text-anchor="middle" letter-spacing="2">SUPER</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 190"><path d="M95,10 L115,65 L175,45 L145,95 L180,140 L125,135 L105,185 L80,140 L25,160 L45,105 L10,65 L70,60 Z" fill="%23F472B6" stroke="%23FFF" stroke-width="4"/><text x="95" y="100" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="%23FFF" text-anchor="middle">SUPER</text></svg>`,
  },

  // === KAWAII ANIME SPARKLE ===
  {
    id: 'curated_kawaii_sparkle',
    name: 'Cute Kawaii Sparkle Heart',
    source: 'curated',
    width: 170,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 160"><g><path d="M85,145 C-20,80 20,10 85,55 C150,10 190,80 85,145 Z" fill="%23F472B6" stroke="%23FFFFFF" stroke-width="8" stroke-linejoin="round"/><circle cx="65" cy="65" r="10" fill="%23FFFFFF"/><circle cx="110" cy="70" r="7" fill="%23FFFFFF"/><path d="M135,25 Q145,40 160,45 Q145,50 135,65 Q125,50 110,45 Q125,40 135,25 Z" fill="%23FACC15"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 160"><path d="M85,145 C-20,80 20,10 85,55 C150,10 190,80 85,145 Z" fill="%23F472B6" stroke="%23FFF" stroke-width="6"/><circle cx="65" cy="65" r="10" fill="%23FFFFFF"/></svg>`,
  },

  // === ACID TECHNO LABEL ===
  {
    id: 'curated_acid_techno',
    name: 'Acid Techno Warning Tag',
    source: 'curated',
    width: 220,
    height: 110,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 110"><g><rect x="10" y="10" width="200" height="90" fill="%23CCFF00" stroke="%23000000" stroke-width="6"/><rect x="20" y="20" width="180" height="70" fill="%23000000"/><text x="110" y="65" font-family="Courier New, monospace" font-weight="900" font-size="34" fill="%23CCFF00" text-anchor="middle" letter-spacing="4">ACID 303</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 110"><rect x="10" y="10" width="200" height="90" fill="%23CCFF00" stroke="%23000" stroke-width="6"/><text x="110" y="65" font-family="Courier New, monospace" font-weight="900" font-size="28" fill="%23000" text-anchor="middle">ACID</text></svg>`,
  },
];

export const getCuratedStickers = (query?: string): StickerAsset[] => {
  if (!query || !query.trim()) {
    return CURATED_STICKERS;
  }
  const q = query.toLowerCase().trim();
  const matched = CURATED_STICKERS.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  return matched.length > 0 ? matched : CURATED_STICKERS;
};

export const searchStickers = async (query: string, pos?: string): Promise<StickerAsset[]> => {
  if (!query || !query.trim()) {
    return getTrendingStickers(pos);
  }

  try {
    const url = new URL('/api/tenor', window.location.origin);
    url.searchParams.set('action', 'search');
    url.searchParams.set('query', query);
    if (pos) {
      url.searchParams.set('pos', pos);
    }

    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getCuratedStickers(query);
    }

    const data = await response.json();
    if (!data || !data.results || !Array.isArray(data.results)) {
      return getCuratedStickers(query);
    }

    const stickers: StickerAsset[] = data.results
      .map((item: any) => {
        const media =
          item.media_formats?.png ||
          item.media_formats?.webp ||
          item.media_formats?.gif ||
          item.media_formats?.tinywebp ||
          {};
        const thumb =
          item.media_formats?.tinywebp || item.media_formats?.tinypng || item.media_formats?.tinygif || media;
        return {
          id: item.id || `tenor_${crypto.randomUUID()}`,
          name: item.content_description || query || 'Sticker',
          url: media.url || thumb.url || '',
          thumbnail: thumb.url || media.url || '',
          width: media.dims ? media.dims[0] : 200,
          height: media.dims ? media.dims[1] : 200,
          source: 'tenor' as const,
        };
      })
      .filter((s: StickerAsset) => s.url);

    return stickers.length > 0 ? stickers : getCuratedStickers(query);
  } catch (error) {
    log.warn('[StickerService] Search failed or offline, using curated fallback pack', error, { query });
    return getCuratedStickers(query);
  }
};

export const getTrendingStickers = async (pos?: string): Promise<StickerAsset[]> => {
  try {
    const url = new URL('/api/tenor', window.location.origin);
    url.searchParams.set('action', 'trending');
    if (pos) {
      url.searchParams.set('pos', pos);
    }

    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return getCuratedStickers();
    }

    const data = await response.json();
    if (!data || !data.results || !Array.isArray(data.results)) {
      return getCuratedStickers();
    }

    const stickers: StickerAsset[] = data.results
      .map((item: any) => {
        const media =
          item.media_formats?.png ||
          item.media_formats?.webp ||
          item.media_formats?.gif ||
          item.media_formats?.tinywebp ||
          {};
        const thumb =
          item.media_formats?.tinywebp || item.media_formats?.tinypng || item.media_formats?.tinygif || media;
        return {
          id: item.id || `tenor_${crypto.randomUUID()}`,
          name: item.content_description || 'Trending Sticker',
          url: media.url || thumb.url || '',
          thumbnail: thumb.url || media.url || '',
          width: media.dims ? media.dims[0] : 200,
          height: media.dims ? media.dims[1] : 200,
          source: 'tenor' as const,
        };
      })
      .filter((s: StickerAsset) => s.url);

    return stickers.length > 0 ? stickers : getCuratedStickers();
  } catch (error) {
    log.warn('[StickerService] Trending fetch failed or offline, using curated fallback pack', error);
    return getCuratedStickers();
  }
};
