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
  // === NEW FUN STICKERS ===
  {
    id: 'curated_warning_tape',
    name: 'Warning Creative Genius Tape',
    source: 'curated',
    width: 250,
    height: 80,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 80"><g><rect x="10" y="15" width="230" height="50" fill="%23FACC15" stroke="%23000000" stroke-width="4" transform="rotate(-2 125 40)"/><line x1="20" y1="15" x2="40" y2="65" stroke="%23000000" stroke-width="6" transform="rotate(-2 125 40)"/><line x1="50" y1="15" x2="70" y2="65" stroke="%23000000" stroke-width="6" transform="rotate(-2 125 40)"/><line x1="180" y1="15" x2="200" y2="65" stroke="%23000000" stroke-width="6" transform="rotate(-2 125 40)"/><line x1="210" y1="15" x2="230" y2="65" stroke="%23000000" stroke-width="6" transform="rotate(-2 125 40)"/><text x="125" y="48" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="20" fill="%23000000" text-anchor="middle" transform="rotate(-2 125 40)">CREATIVE GENIUS</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 80"><rect x="10" y="15" width="230" height="50" fill="%23FACC15" stroke="%23000000" stroke-width="4"/><text x="125" y="48" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="20" fill="%23000000" text-anchor="middle">CREATIVE GENIUS</text></svg>`,
  },
  {
    id: 'curated_good_vibes',
    name: 'Good Vibes Smiley',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><circle cx="80" cy="80" r="70" fill="%23FDE047" stroke="%23FFFFFF" stroke-width="6"/><circle cx="55" cy="65" r="12" fill="%23000000"/><circle cx="105" cy="65" r="12" fill="%23000000"/><path d="M40,95 Q80,140 120,95" fill="none" stroke="%23000000" stroke-width="12" stroke-linecap="round"/><text x="80" y="35" font-family="Comic Sans MS, cursive, sans-serif" font-weight="bold" font-size="18" fill="%23EF4444" text-anchor="middle">GOOD VIBES</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="%23FDE047" stroke="%23FFF" stroke-width="6"/><circle cx="55" cy="65" r="12" fill="%23000000"/><circle cx="105" cy="65" r="12" fill="%23000000"/><path d="M40,95 Q80,140 120,95" fill="none" stroke="%23000000" stroke-width="12" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'curated_kawaii_cloud',
    name: 'Kawaii Happy Cloud',
    source: 'curated',
    width: 200,
    height: 140,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.2"/></filter></defs><g filter="url(%23shadow)"><path d="M50,90 A30,30 0 0,1 50,30 A40,40 0 0,1 120,20 A45,45 0 0,1 170,80 A30,30 0 0,1 150,130 L50,130 A30,30 0 0,1 50,90 Z" fill="%23E0F2FE" stroke="%23FFFFFF" stroke-width="8" stroke-linejoin="round"/><circle cx="80" cy="85" r="6" fill="%23000000"/><circle cx="140" cy="85" r="6" fill="%23000000"/><path d="M100,95 Q110,110 120,95" fill="none" stroke="%23000000" stroke-width="6" stroke-linecap="round"/><circle cx="65" cy="95" r="8" fill="%23FCA5A5" opacity="0.6"/><circle cx="155" cy="95" r="8" fill="%23FCA5A5" opacity="0.6"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><path d="M50,90 A30,30 0 0,1 50,30 A40,40 0 0,1 120,20 A45,45 0 0,1 170,80 A30,30 0 0,1 150,130 L50,130 A30,30 0 0,1 50,90 Z" fill="%23E0F2FE" stroke="%23FFFFFF" stroke-width="6"/><circle cx="80" cy="85" r="6" fill="%23000000"/><circle cx="140" cy="85" r="6" fill="%23000000"/><path d="M100,95 Q110,110 120,95" fill="none" stroke="%23000000" stroke-width="6" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'curated_urgent_stamp',
    name: 'URGENT Ink Stamp',
    source: 'curated',
    width: 200,
    height: 100,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><defs><filter id="stampShadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.2"/></filter></defs><g filter="url(%23stampShadow)" transform="rotate(-5 100 50)"><rect x="10" y="10" width="180" height="80" rx="8" fill="none" stroke="%23EF4444" stroke-width="8" stroke-dasharray="20 4 8 4"/><text x="100" y="65" font-family="Courier New, Impact, sans-serif" font-weight="900" font-size="42" fill="%23EF4444" text-anchor="middle" letter-spacing="4">URGENT</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><g transform="rotate(-5 100 50)"><rect x="10" y="10" width="180" height="80" rx="8" fill="none" stroke="%23EF4444" stroke-width="8"/><text x="100" y="65" font-family="Courier New, Impact, sans-serif" font-weight="900" font-size="42" fill="%23EF4444" text-anchor="middle">URGENT</text></g></svg>`,
  },
  {
    id: 'curated_vinyl_record',
    name: 'Retro Vinyl Record',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.4"/></filter></defs><g filter="url(%23shadow)"><circle cx="80" cy="80" r="75" fill="%23171717" stroke="%23FFFFFF" stroke-width="4"/><circle cx="80" cy="80" r="60" fill="none" stroke="%23262626" stroke-width="2"/><circle cx="80" cy="80" r="45" fill="none" stroke="%23262626" stroke-width="2"/><circle cx="80" cy="80" r="30" fill="%23F43F5E"/><circle cx="80" cy="80" r="8" fill="%23FFFFFF"/><text x="80" y="75" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="%23FFFFFF" text-anchor="middle">A-SIDE</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="75" fill="%23171717" stroke="%23FFF" stroke-width="4"/><circle cx="80" cy="80" r="30" fill="%23F43F5E"/><circle cx="80" cy="80" r="8" fill="%23FFFFFF"/></svg>`,
  },
  {
    id: 'curated_alien_head',
    name: 'Y2K Alien Head',
    source: 'curated',
    width: 140,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 160"><defs><filter id="glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="%2384CC16" flood-opacity="0.8"/></filter></defs><g filter="url(%23glow)"><path d="M70,10 C120,10 130,60 120,110 C110,150 85,155 70,155 C55,155 30,150 20,110 C10,60 20,10 70,10 Z" fill="%2384CC16" stroke="%23FFFFFF" stroke-width="4"/><path d="M40,75 Q60,65 65,95 Q40,105 40,75 Z" fill="%23000000"/><path d="M100,75 Q80,65 75,95 Q100,105 100,75 Z" fill="%23000000"/><circle cx="70" cy="125" r="4" fill="%23000000"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 160"><path d="M70,10 C120,10 130,60 120,110 C110,150 85,155 70,155 C55,155 30,150 20,110 C10,60 20,10 70,10 Z" fill="%2384CC16" stroke="%23FFF" stroke-width="4"/><path d="M40,75 Q60,65 65,95 Q40,105 40,75 Z" fill="%23000000"/><path d="M100,75 Q80,65 75,95 Q100,105 100,75 Z" fill="%23000000"/></svg>`,
  },
  {
    id: 'curated_top_secret',
    name: 'Top Secret Folder Label',
    source: 'curated',
    width: 220,
    height: 120,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="200" height="100" fill="%23FBBF24" stroke="%23000000" stroke-width="4"/><rect x="16" y="16" width="188" height="88" fill="none" stroke="%23000000" stroke-width="2"/><text x="110" y="55" font-family="Arial Black, sans-serif" font-weight="900" font-size="28" fill="%23000000" text-anchor="middle" letter-spacing="2">TOP SECRET</text><text x="110" y="85" font-family="Courier New, monospace" font-weight="bold" font-size="14" fill="%23EF4444" text-anchor="middle">DO NOT DISTRIBUTE</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120"><rect x="10" y="10" width="200" height="100" fill="%23FBBF24" stroke="%23000000" stroke-width="4"/><text x="110" y="60" font-family="Arial Black, sans-serif" font-weight="900" font-size="28" fill="%23000000" text-anchor="middle">TOP SECRET</text></svg>`,
  },
  {
    id: 'curated_vintage_cassette',
    name: 'Vintage Cassette Tape',
    source: 'curated',
    width: 200,
    height: 130,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="180" height="110" rx="8" fill="%231F2937" stroke="%23FFFFFF" stroke-width="4"/><rect x="25" y="25" width="150" height="55" rx="4" fill="%23E5E7EB"/><circle cx="55" cy="52" r="14" fill="%231F2937"/><circle cx="145" cy="52" r="14" fill="%231F2937"/><circle cx="55" cy="52" r="4" fill="%23FFFFFF"/><circle cx="145" cy="52" r="4" fill="%23FFFFFF"/><path d="M40,95 L160,95 L150,110 L50,110 Z" fill="%234B5563"/><path d="M55,52 L145,52" fill="none" stroke="%23374151" stroke-width="2"/><text x="100" y="42" font-family="Courier New, monospace" font-weight="bold" font-size="12" fill="%23111827" text-anchor="middle">MIXTAPE VOL. 1</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130"><rect x="10" y="10" width="180" height="110" rx="8" fill="%231F2937" stroke="%23FFF" stroke-width="4"/><rect x="25" y="25" width="150" height="55" rx="4" fill="%23E5E7EB"/><circle cx="55" cy="52" r="14" fill="%231F2937"/><circle cx="145" cy="52" r="14" fill="%231F2937"/></svg>`,
  },
  {
    id: 'curated_instant_camera',
    name: 'Retro Instant Camera Frame',
    source: 'curated',
    width: 160,
    height: 190,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 190"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="3" dy="5" stdDeviation="5" flood-opacity="0.4"/></filter></defs><g filter="url(%23shadow)"><rect x="15" y="15" width="130" height="160" fill="%23FFFFFF"/><rect x="25" y="25" width="110" height="110" fill="%231F2937"/><rect x="25" y="25" width="110" height="110" fill="none" stroke="%23E5E7EB" stroke-width="2"/><text x="80" y="160" font-family="Brush Script MT, cursive, sans-serif" font-size="24" fill="%234B5563" text-anchor="middle" transform="rotate(-5 80 160)">Memories</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 190"><rect x="15" y="15" width="130" height="160" fill="%23FFFFFF"/><rect x="25" y="25" width="110" height="110" fill="%231F2937"/></svg>`,
  },
  {
    id: 'curated_motel_key',
    name: 'Vintage Motel Key',
    source: 'curated',
    width: 130,
    height: 200,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 200"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><polygon points="65,10 115,50 95,180 35,180 15,50" fill="%23064E3B" stroke="%23FDE047" stroke-width="2"/><circle cx="65" cy="30" r="8" fill="%23FFFFFF"/><circle cx="65" cy="30" r="10" fill="none" stroke="%23FDE047" stroke-width="2"/><text x="65" y="70" font-family="Courier New, monospace" font-size="12" fill="%23FDE047" text-anchor="middle">DROP IN</text><text x="65" y="85" font-family="Courier New, monospace" font-size="12" fill="%23FDE047" text-anchor="middle">ANY MAILBOX</text><text x="65" y="115" font-family="Courier New, monospace" font-weight="900" font-size="28" fill="%23FDE047" text-anchor="middle">314</text><text x="65" y="145" font-family="Arial, sans-serif" font-size="10" fill="%23FDE047" text-anchor="middle">DESERT INN</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 200"><polygon points="65,10 115,50 95,180 35,180 15,50" fill="%23064E3B" stroke="%23FDE047" stroke-width="2"/><circle cx="65" cy="30" r="8" fill="%23FFFFFF"/><text x="65" y="115" font-family="Courier New, monospace" font-weight="900" font-size="28" fill="%23FDE047" text-anchor="middle">314</text></svg>`,
  },
  {
    id: 'curated_route66',
    name: 'Retro Route Sign',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.4"/></filter></defs><g filter="url(%23shadow)"><path d="M10,40 Q80,10 150,40 L150,110 Q80,150 10,110 Z" fill="%23FFFFFF" stroke="%23000000" stroke-width="4"/><path d="M16,44 Q80,18 144,44 L144,106 Q80,142 16,106 Z" fill="none" stroke="%23000000" stroke-width="2"/><text x="80" y="65" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%23000000" text-anchor="middle">ROUTE</text><text x="80" y="115" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="48" fill="%23000000" text-anchor="middle">66</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><path d="M10,40 Q80,10 150,40 L150,110 Q80,150 10,110 Z" fill="%23FFFFFF" stroke="%23000000" stroke-width="4"/><text x="80" y="65" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%23000000" text-anchor="middle">ROUTE</text><text x="80" y="115" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="48" fill="%23000000" text-anchor="middle">66</text></svg>`,
  },
  {
    id: 'curated_fresh_produce',
    name: '100% FRESH Produce Sticker',
    source: 'curated',
    width: 140,
    height: 140,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><ellipse cx="70" cy="70" rx="60" ry="45" fill="%2322C55E" stroke="%23FFFFFF" stroke-width="4"/><ellipse cx="70" cy="70" rx="55" ry="40" fill="none" stroke="%23FFFFFF" stroke-width="2" stroke-dasharray="4 2"/><text x="70" y="65" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="20" fill="%23FFFFFF" text-anchor="middle">100% FRESH</text><text x="70" y="85" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="%23FFFFFF" text-anchor="middle">ORGANIC PRODUCE</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><ellipse cx="70" cy="70" rx="60" ry="45" fill="%2322C55E" stroke="%23FFF" stroke-width="4"/><text x="70" y="65" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="20" fill="%23FFFFFF" text-anchor="middle">FRESH</text></svg>`,
  },
  {
    id: 'curated_biohazard',
    name: 'Toxic Biohazard Warning',
    source: 'curated',
    width: 180,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.5"/></filter></defs><g filter="url(%23shadow)"><polygon points="90,10 170,150 10,150" fill="%23EAB308" stroke="%23000000" stroke-width="8" stroke-linejoin="round"/><path d="M90,70 A20,20 0 1,1 90,110 A20,20 0 1,1 90,70 Z" fill="none" stroke="%23000000" stroke-width="6"/><path d="M90,50 A40,40 0 0,1 125,75" fill="none" stroke="%23000000" stroke-width="6"/><path d="M90,130 A40,40 0 0,1 55,105" fill="none" stroke="%23000000" stroke-width="6"/><circle cx="90" cy="90" r="8" fill="%23000000"/><text x="90" y="140" font-family="Arial Black, sans-serif" font-weight="900" font-size="18" fill="%23000000" text-anchor="middle">TOXIC</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><polygon points="90,10 170,150 10,150" fill="%23EAB308" stroke="%23000" stroke-width="6"/><circle cx="90" cy="90" r="20" fill="none" stroke="%23000" stroke-width="6"/><text x="90" y="140" font-family="Arial Black, sans-serif" font-weight="900" font-size="18" fill="%23000000" text-anchor="middle">TOXIC</text></svg>`,
  },
  {
    id: 'curated_hello_my_name_is',
    name: 'Hello My Name Is Label',
    source: 'curated',
    width: 240,
    height: 140,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="220" height="120" rx="12" fill="%23EF4444"/><rect x="15" y="55" width="210" height="70" rx="6" fill="%23FFFFFF"/><text x="120" y="32" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="%23FFFFFF" text-anchor="middle">HELLO</text><text x="120" y="48" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="%23FFFFFF" text-anchor="middle">MY NAME IS</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><rect x="10" y="10" width="220" height="120" rx="12" fill="%23EF4444"/><rect x="15" y="55" width="210" height="70" rx="6" fill="%23FFFFFF"/><text x="120" y="32" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="%23FFFFFF" text-anchor="middle">HELLO</text></svg>`,
  },
  {
    id: 'curated_arcade_ticket',
    name: 'Retro Arcade Ticket',
    source: 'curated',
    width: 240,
    height: 120,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="220" height="100" fill="%23FDE047" stroke="%23CA8A04" stroke-width="2"/><circle cx="10" cy="60" r="15" fill="%23FFFFFF" stroke="%23CA8A04" stroke-width="2"/><circle cx="230" cy="60" r="15" fill="%23FFFFFF" stroke="%23CA8A04" stroke-width="2"/><rect x="40" y="20" width="160" height="80" fill="none" stroke="%23CA8A04" stroke-width="4" stroke-dasharray="10 5"/><text x="120" y="55" font-family="Courier New, monospace" font-weight="900" font-size="24" fill="%23CA8A04" text-anchor="middle">ONE ADMIT</text><text x="120" y="85" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="%23CA8A04" text-anchor="middle">ARCADE</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120"><rect x="10" y="10" width="220" height="100" fill="%23FDE047" stroke="%23CA8A04" stroke-width="2"/><circle cx="10" cy="60" r="15" fill="%23FFFFFF"/><circle cx="230" cy="60" r="15" fill="%23FFFFFF"/><text x="120" y="65" font-family="Courier New, monospace" font-weight="900" font-size="24" fill="%23CA8A04" text-anchor="middle">TICKET</text></svg>`,
  },
  {
    id: 'curated_magic_8_ball',
    name: 'Magic 8 Ball',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.4"/></filter><radialGradient id="ballGrad" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="%234B5563"/><stop offset="100%" stop-color="%23000000"/></radialGradient></defs><g filter="url(%23shadow)"><circle cx="80" cy="80" r="70" fill="url(%23ballGrad)"/><circle cx="80" cy="80" r="35" fill="%23FFFFFF"/><circle cx="80" cy="80" r="32" fill="none" stroke="%23D1D5DB" stroke-width="2"/><text x="80" y="95" font-family="Times New Roman, serif" font-weight="bold" font-size="44" fill="%23000000" text-anchor="middle">8</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="%23000"/><circle cx="80" cy="80" r="35" fill="%23FFF"/><text x="80" y="95" font-family="Times New Roman, serif" font-weight="bold" font-size="44" fill="%23000000" text-anchor="middle">8</text></svg>`,
  },
  {
    id: 'curated_y2k_tribal_heart',
    name: 'Y2K Tribal Heart',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="glow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="%23EC4899" flood-opacity="0.8"/></filter></defs><g filter="url(%23glow)"><path d="M80,140 Q80,90 20,60 Q0,40 20,20 Q40,0 70,20 Q80,30 80,40 Q80,30 90,20 Q120,0 140,20 Q160,40 140,60 Q80,90 80,140 Z" fill="none" stroke="%23EC4899" stroke-width="8" stroke-linejoin="round"/><path d="M80,120 Q80,80 40,60 Q30,50 40,40 Q50,30 65,40 Q75,45 80,55 Q85,45 95,40 Q110,30 120,40 Q130,50 120,60 Q80,80 80,120 Z" fill="%23EC4899"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><path d="M80,140 Q80,90 20,60 Q0,40 20,20 Q40,0 70,20 Q80,30 80,40 Q80,30 90,20 Q120,0 140,20 Q160,40 140,60 Q80,90 80,140 Z" fill="none" stroke="%23EC4899" stroke-width="8" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'curated_y2k_flip_phone',
    name: 'Y2K Flip Phone',
    source: 'curated',
    width: 120,
    height: 180,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/></filter><linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23F472B6"/><stop offset="100%" stop-color="%23BE185D"/></linearGradient></defs><g filter="url(%23shadow)"><rect x="20" y="80" width="80" height="90" rx="10" fill="url(%23phoneGrad)" stroke="%23FCE7F3" stroke-width="2"/><rect x="20" y="10" width="80" height="80" rx="10" fill="url(%23phoneGrad)" stroke="%23FCE7F3" stroke-width="2"/><rect x="30" y="20" width="60" height="50" fill="%23A7F3D0"/><text x="60" y="50" font-family="Courier New, monospace" font-size="12" fill="%23065F46" text-anchor="middle">Txt me</text><circle cx="40" cy="100" r="4" fill="%23FCE7F3"/><circle cx="60" cy="100" r="4" fill="%23FCE7F3"/><circle cx="80" cy="100" r="4" fill="%23FCE7F3"/><circle cx="40" cy="120" r="4" fill="%23FCE7F3"/><circle cx="60" cy="120" r="4" fill="%23FCE7F3"/><circle cx="80" cy="120" r="4" fill="%23FCE7F3"/><circle cx="40" cy="140" r="4" fill="%23FCE7F3"/><circle cx="60" cy="140" r="4" fill="%23FCE7F3"/><circle cx="80" cy="140" r="4" fill="%23FCE7F3"/><rect x="55" y="0" width="10" height="20" rx="2" fill="%239CA3AF"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180"><rect x="20" y="80" width="80" height="90" rx="10" fill="%23F472B6"/><rect x="20" y="10" width="80" height="80" rx="10" fill="%23F472B6"/><rect x="30" y="20" width="60" height="50" fill="%23A7F3D0"/></svg>`,
  },
  {
    id: 'curated_y2k_cyber_star',
    name: 'Cyber Chrome Star',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><radialGradient id="chrome" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="%23FFFFFF"/><stop offset="40%" stop-color="%2394A3B8"/><stop offset="60%" stop-color="%23475569"/><stop offset="100%" stop-color="%230F172A"/></radialGradient><filter id="glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="%2338BDF8" flood-opacity="0.8"/></filter></defs><g filter="url(%23glow)"><polygon points="80,10 100,60 150,60 110,95 125,145 80,115 35,145 50,95 10,60 60,60" fill="url(%23chrome)" stroke="%2338BDF8" stroke-width="2"/><polygon points="80,30 95,65 130,65 100,85 110,120 80,100 50,120 60,85 30,65 65,65" fill="none" stroke="%23FFFFFF" stroke-width="1"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><polygon points="80,10 100,60 150,60 110,95 125,145 80,115 35,145 50,95 10,60 60,60" fill="%2394A3B8" stroke="%2338BDF8" stroke-width="2"/></svg>`,
  },
  {
    id: 'curated_y2k_tamagotchi',
    name: 'Virtual Pet Device',
    source: 'curated',
    width: 140,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><ellipse cx="70" cy="80" rx="60" ry="75" fill="%23A78BFA" stroke="%23FFFFFF" stroke-width="4"/><rect x="35" y="40" width="70" height="50" rx="8" fill="%23D1FAE5" stroke="%234C1D95" stroke-width="2"/><circle cx="70" cy="65" r="10" fill="%2334D399"/><path d="M60,65 Q70,75 80,65" fill="none" stroke="%23064E3B" stroke-width="2"/><circle cx="45" cy="120" r="6" fill="%23FCD34D"/><circle cx="70" cy="125" r="8" fill="%23FCD34D"/><circle cx="95" cy="120" r="6" fill="%23FCD34D"/><circle cx="70" cy="15" r="4" fill="%234C1D95"/><path d="M70,15 L70,5" fill="none" stroke="%234C1D95" stroke-width="2"/><circle cx="70" cy="5" r="8" fill="none" stroke="%234C1D95" stroke-width="2"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 160"><ellipse cx="70" cy="80" rx="60" ry="75" fill="%23A78BFA" stroke="%23FFF" stroke-width="4"/><rect x="35" y="40" width="70" height="50" rx="8" fill="%23D1FAE5"/><circle cx="70" cy="125" r="8" fill="%23FCD34D"/></svg>`,
  },
  {
    id: 'curated_y2k_cd_rom',
    name: 'Holographic CD-ROM',
    source: 'curated',
    width: 160,
    height: 160,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter><linearGradient id="holo" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FBCFE8"/><stop offset="33%" stop-color="%23BAE6FD"/><stop offset="66%" stop-color="%23D9F99D"/><stop offset="100%" stop-color="%23E9D5FF"/></linearGradient></defs><g filter="url(%23shadow)"><circle cx="80" cy="80" r="75" fill="url(%23holo)" stroke="%23E2E8F0" stroke-width="2"/><circle cx="80" cy="80" r="25" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="2"/><circle cx="80" cy="80" r="10" fill="transparent" stroke="%23CBD5E1" stroke-width="4"/><path d="M80,5 A75,75 0 0,1 155,80" fill="none" stroke="%23FFFFFF" stroke-width="4" opacity="0.6"/><path d="M5,80 A75,75 0 0,0 80,155" fill="none" stroke="%23FFFFFF" stroke-width="4" opacity="0.6"/><text x="80" y="55" font-family="Arial Black, sans-serif" font-weight="900" font-size="12" fill="%23475569" text-anchor="middle">CD-RW 700MB</text></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="75" fill="%23BAE6FD" stroke="%23E2E8F0" stroke-width="2"/><circle cx="80" cy="80" r="25" fill="%23FFFFFF"/><circle cx="80" cy="80" r="10" fill="transparent" stroke="%23CBD5E1" stroke-width="4"/></svg>`,
  },
  {
    id: 'curated_y2k_floppy',
    name: 'Neon Floppy Disk',
    source: 'curated',
    width: 140,
    height: 140,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="2" stdDeviation="4" flood-opacity="0.4"/></filter></defs><g filter="url(%23shadow)"><path d="M10,10 L100,10 L130,40 L130,130 L10,130 Z" fill="%2338BDF8" stroke="%230284C7" stroke-width="4"/><rect x="30" y="10" width="80" height="40" fill="%23E0F2FE" stroke="%230284C7" stroke-width="2"/><rect x="90" y="15" width="15" height="30" fill="%230284C7"/><rect x="25" y="70" width="90" height="60" fill="%23FFFFFF" stroke="%230284C7" stroke-width="2"/><line x1="35" y1="85" x2="105" y2="85" stroke="%2394A3B8" stroke-width="2"/><line x1="35" y1="100" x2="105" y2="100" stroke="%2394A3B8" stroke-width="2"/><line x1="35" y1="115" x2="80" y2="115" stroke="%2394A3B8" stroke-width="2"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><path d="M10,10 L100,10 L130,40 L130,130 L10,130 Z" fill="%2338BDF8" stroke="%230284C7" stroke-width="4"/><rect x="30" y="10" width="80" height="40" fill="%23E0F2FE"/><rect x="25" y="70" width="90" height="60" fill="%23FFFFFF"/></svg>`,
  },
  {
    id: 'curated_y2k_angel',
    name: 'Angel Airbrush Text',
    source: 'curated',
    width: 200,
    height: 100,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(%23glow)"><text x="100" y="65" font-family="Brush Script MT, cursive, sans-serif" font-weight="bold" font-size="64" fill="%23F0ABFC" stroke="%23FFFFFF" stroke-width="2" text-anchor="middle" transform="rotate(-5 100 50)">Angel</text><path d="M30,30 Q40,10 60,15 Q50,30 65,40 Q40,30 30,30 Z" fill="%23FFFFFF" opacity="0.8"/><path d="M170,30 Q160,10 140,15 Q150,30 135,40 Q160,30 170,30 Z" fill="%23FFFFFF" opacity="0.8"/><circle cx="160" cy="70" r="4" fill="%23FFFFFF"/><circle cx="170" cy="65" r="2" fill="%23FFFFFF"/><circle cx="40" cy="75" r="3" fill="%23FFFFFF"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="100" y="65" font-family="Brush Script MT, cursive, sans-serif" font-weight="bold" font-size="64" fill="%23F0ABFC" stroke="%23FFFFFF" stroke-width="2" text-anchor="middle" transform="rotate(-5 100 50)">Angel</text></svg>`,
  },
  {
    id: 'curated_y2k_gameboy',
    name: 'Retro Handheld Console',
    source: 'curated',
    width: 140,
    height: 200,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 200"><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="120" height="180" rx="10" fill="%23C4B5FD" stroke="%238B5CF6" stroke-width="4"/><rect x="20" y="20" width="100" height="80" rx="4" fill="%236EE7B7" stroke="%23064E3B" stroke-width="4"/><text x="70" y="65" font-family="Courier New, monospace" font-weight="bold" font-size="16" fill="%23064E3B" text-anchor="middle">LVL 99</text><path d="M30,140 L50,140 M40,130 L40,150" fill="none" stroke="%234C1D95" stroke-width="8" stroke-linecap="round"/><circle cx="95" cy="145" r="8" fill="%23EC4899"/><circle cx="115" cy="130" r="8" fill="%23EC4899"/><line x1="70" y1="170" x2="90" y2="170" stroke="%234C1D95" stroke-width="4" stroke-linecap="round"/><line x1="70" y1="180" x2="90" y2="180" stroke="%234C1D95" stroke-width="4" stroke-linecap="round"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 200"><rect x="10" y="10" width="120" height="180" rx="10" fill="%23C4B5FD" stroke="%238B5CF6" stroke-width="4"/><rect x="20" y="20" width="100" height="80" rx="4" fill="%236EE7B7" stroke="%23064E3B" stroke-width="4"/><path d="M30,140 L50,140 M40,130 L40,150" fill="none" stroke="%234C1D95" stroke-width="8" stroke-linecap="round"/><circle cx="95" cy="145" r="8" fill="%23EC4899"/><circle cx="115" cy="130" r="8" fill="%23EC4899"/></svg>`,
  },
  {
    id: 'curated_3d_cube',
    name: '3D Isometric Cube',
    source: 'curated',
    width: 200,
    height: 200,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g transform="translate(100, 30)"><polygon points="0,0 70,40 0,80 -70,40" fill="%23a78bfa" stroke="%238b5cf6" stroke-width="2"/><polygon points="-70,40 0,80 0,160 -70,120" fill="%237c3aed" stroke="%238b5cf6" stroke-width="2"/><polygon points="0,80 70,40 70,120 0,160" fill="%235b21b6" stroke="%238b5cf6" stroke-width="2"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g transform="translate(100, 30) scale(0.8)"><polygon points="0,0 70,40 0,80 -70,40" fill="%23a78bfa"/><polygon points="-70,40 0,80 0,160 -70,120" fill="%237c3aed"/><polygon points="0,80 70,40 70,120 0,160" fill="%235b21b6"/></g></svg>`,
  },
  {
    id: 'curated_3d_sphere',
    name: '3D Sphere',
    source: 'curated',
    width: 200,
    height: 200,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="sphereGrad" cx="30%25" cy="30%25" r="70%25"><stop offset="0%25" stop-color="%23f472b6"/><stop offset="50%25" stop-color="%23db2777"/><stop offset="100%25" stop-color="%23831843"/></radialGradient></defs><circle cx="100" cy="100" r="80" fill="url(%23sphereGrad)"/></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="%23db2777"/></svg>`,
  },
  {
    id: 'curated_3d_cylinder',
    name: '3D Cylinder',
    source: 'curated',
    width: 200,
    height: 200,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="cylGrad" x1="0%25" y1="0%25" x2="100%25" y2="0%25"><stop offset="0%25" stop-color="%233b82f6"/><stop offset="50%25" stop-color="%2393c5fd"/><stop offset="100%25" stop-color="%231d4ed8"/></linearGradient></defs><path d="M 50,70 A 50,20 0 0,0 150,70 L 150,140 A 50,20 0 0,1 50,140 Z" fill="url(%23cylGrad)"/><ellipse cx="100" cy="70" rx="50" ry="20" fill="%2360a5fa" stroke="%232563eb" stroke-width="2"/><path d="M 50,140 A 50,20 0 0,0 150,140" fill="none" stroke="%231e3a8a" stroke-width="2"/></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M 50,70 A 50,20 0 0,0 150,70 L 150,140 A 50,20 0 0,1 50,140 Z" fill="%233b82f6"/><ellipse cx="100" cy="70" rx="50" ry="20" fill="%2360a5fa"/></svg>`,
  },
  {
    id: 'curated_ui_macos_window',
    name: 'UI macOS Window Bar',
    source: 'curated',
    width: 300,
    height: 80,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80"><defs><filter id="shadow" x="-10%25" y="-10%25" width="120%25" height="120%25"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><g filter="url(%23shadow)"><rect x="10" y="10" width="280" height="60" rx="12" fill="%231e1e28" stroke="%23ffffff" stroke-opacity="0.1" stroke-width="2"/><circle cx="40" cy="40" r="8" fill="%23ef4444"/><circle cx="65" cy="40" r="8" fill="%23eab308"/><circle cx="90" cy="40" r="8" fill="%2322c55e"/></g></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80"><rect x="10" y="10" width="280" height="60" rx="12" fill="%231e1e28" stroke="%23ffffff" stroke-opacity="0.1" stroke-width="2"/><circle cx="40" cy="40" r="8" fill="%23ef4444"/><circle cx="65" cy="40" r="8" fill="%23eab308"/><circle cx="90" cy="40" r="8" fill="%2322c55e"/></svg>`,
  },
  {
    id: 'curated_ui_cursor',
    name: 'UI Mouse Cursor',
    source: 'curated',
    width: 100,
    height: 150,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150"><defs><filter id="shadow"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3"/></filter></defs><path d="M20,20 L80,70 L50,80 L70,130 L50,140 L30,90 L10,110 Z" fill="%23000000" stroke="%23ffffff" stroke-width="4" filter="url(%23shadow)"/></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150"><path d="M20,20 L80,70 L50,80 L70,130 L50,140 L30,90 L10,110 Z" fill="%23000000" stroke="%23ffffff" stroke-width="4"/></svg>`,
  },
  {
    id: 'curated_ui_toggle',
    name: 'UI Toggle Switch',
    source: 'curated',
    width: 200,
    height: 100,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><defs><filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.2"/></filter></defs><rect x="10" y="20" width="180" height="60" rx="30" fill="%2334d399"/><circle cx="150" cy="50" r="24" fill="%23ffffff" filter="url(%23shadow)"/></svg>`,
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect x="10" y="20" width="180" height="60" rx="30" fill="%2334d399"/><circle cx="150" cy="50" r="24" fill="%23ffffff"/></svg>`,
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
