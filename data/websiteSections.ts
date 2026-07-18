// Pre-defined website section blocks for the drag-to-canvas section library.
// Each block is described with metadata; the actual layer generation happens
// in the WebsitePanel when a user drags/inserts a block.

export interface SectionBlock {
  id: string;
  name: string;
  category: SectionCategory;
  description: string;
  tags: string[];
  defaultHeight: number; // pixels at 1440px artboard width
  icon: string;          // icon name from Icons
  variants?: string[];   // variant names
  isPremium?: boolean;
}

export type SectionCategory =
  | 'Navigation'
  | 'Hero'
  | 'Features'
  | 'Testimonials'
  | 'Pricing'
  | 'Team'
  | 'Gallery'
  | 'Blog'
  | 'Contact'
  | 'FAQ'
  | 'CTA'
  | 'Footer'
  | 'E-commerce';

export const SECTION_CATEGORIES: SectionCategory[] = [
  'Navigation',
  'Hero',
  'Features',
  'Testimonials',
  'Pricing',
  'Team',
  'Gallery',
  'Blog',
  'Contact',
  'FAQ',
  'CTA',
  'Footer',
  'E-commerce',
];

export const SECTION_BLOCKS: SectionBlock[] = [
  // Navigation
  {
    id: 'nav-solid',
    name: 'Solid Navbar',
    category: 'Navigation',
    description: 'Clean navigation bar with logo and links on a solid background',
    tags: ['header', 'menu', 'logo'],
    defaultHeight: 80,
    icon: 'LayoutGrid',
  },
  {
    id: 'nav-transparent',
    name: 'Transparent Navbar',
    category: 'Navigation',
    description: 'Overlay navigation bar that sits over a hero image',
    tags: ['header', 'overlay', 'glass'],
    defaultHeight: 80,
    icon: 'LayoutGrid',
  },
  {
    id: 'nav-centered',
    name: 'Centered Logo Nav',
    category: 'Navigation',
    description: 'Navigation with centered logo and links split either side',
    tags: ['header', 'centered', 'brand'],
    defaultHeight: 80,
    icon: 'LayoutGrid',
  },

  // Hero
  {
    id: 'hero-fullscreen',
    name: 'Fullscreen Hero',
    category: 'Hero',
    description: 'Bold full-viewport hero with headline, sub-copy and CTA buttons',
    tags: ['landing', 'above-fold', 'cta'],
    defaultHeight: 900,
    icon: 'Monitor',
    variants: ['Dark', 'Light', 'Gradient'],
  },
  {
    id: 'hero-split',
    name: 'Split Hero',
    category: 'Hero',
    description: 'Left text content, right image — 50/50 split layout',
    tags: ['two-column', 'image', 'saas'],
    defaultHeight: 700,
    icon: 'Monitor',
    variants: ['Image Right', 'Image Left'],
  },
  {
    id: 'hero-minimal',
    name: 'Minimal Hero',
    category: 'Hero',
    description: 'Clean, typographic hero with centered headline and single CTA',
    tags: ['minimal', 'typography', 'centered'],
    defaultHeight: 600,
    icon: 'Monitor',
  },
  {
    id: 'hero-video',
    name: 'Video Background Hero',
    category: 'Hero',
    description: 'Fullscreen hero with video background placeholder and overlay text',
    tags: ['video', 'media', 'cinematic'],
    defaultHeight: 900,
    icon: 'Play',
    isPremium: true,
  },
  {
    id: 'hero-gradient',
    name: 'Gradient Mesh Hero',
    category: 'Hero',
    description: 'Animated gradient mesh background with bold typography',
    tags: ['gradient', 'animated', 'modern'],
    defaultHeight: 800,
    icon: 'Monitor',
    variants: ['Purple', 'Blue', 'Sunset'],
  },

  // Features
  {
    id: 'features-grid',
    name: 'Icon Feature Grid',
    category: 'Features',
    description: '3 or 4 column icon + heading + body grid for product features',
    tags: ['icons', 'grid', 'benefits'],
    defaultHeight: 500,
    icon: 'LayoutGrid',
    variants: ['3-col', '4-col'],
  },
  {
    id: 'features-alternating',
    name: 'Alternating Feature Rows',
    category: 'Features',
    description: 'Alternating text + image rows for detailed feature breakdowns',
    tags: ['two-column', 'image', 'detail'],
    defaultHeight: 1200,
    icon: 'LayoutGrid',
  },
  {
    id: 'features-centered',
    name: 'Centered Feature Showcase',
    category: 'Features',
    description: 'Large screenshot or image above feature highlights',
    tags: ['product', 'screenshot', 'centered'],
    defaultHeight: 700,
    icon: 'Monitor',
  },
  {
    id: 'features-stats',
    name: 'Stats & Numbers',
    category: 'Features',
    description: 'Bold metric numbers with labels — great for social proof',
    tags: ['numbers', 'proof', 'metrics'],
    defaultHeight: 280,
    icon: 'BarChart2',
  },

  // Testimonials
  {
    id: 'testimonials-cards',
    name: 'Testimonial Cards',
    category: 'Testimonials',
    description: '3-column card layout with avatar, quote and star rating',
    tags: ['reviews', 'social-proof', 'cards'],
    defaultHeight: 500,
    icon: 'MessageSquare',
  },
  {
    id: 'testimonials-quotes',
    name: 'Large Quote Block',
    category: 'Testimonials',
    description: 'Single prominent testimonial quote with large typography',
    tags: ['quote', 'featured', 'brand'],
    defaultHeight: 400,
    icon: 'MessageSquare',
  },
  {
    id: 'testimonials-logo-wall',
    name: 'Logo Wall',
    category: 'Testimonials',
    description: 'A row or grid of client/partner logos for trust building',
    tags: ['logos', 'clients', 'trust'],
    defaultHeight: 200,
    icon: 'Image',
  },

  // Pricing
  {
    id: 'pricing-3col',
    name: '3-Tier Pricing Table',
    category: 'Pricing',
    description: 'Free / Pro / Enterprise three-column pricing with feature checklist',
    tags: ['saas', 'plans', 'comparison'],
    defaultHeight: 700,
    icon: 'DollarSign',
    variants: ['Light', 'Dark'],
  },
  {
    id: 'pricing-toggle',
    name: 'Monthly/Annual Toggle Pricing',
    category: 'Pricing',
    description: 'Pricing cards with monthly/annual toggle switch',
    tags: ['saas', 'toggle', 'annual'],
    defaultHeight: 750,
    icon: 'DollarSign',
    isPremium: true,
  },
  {
    id: 'pricing-simple',
    name: 'Simple Pricing',
    category: 'Pricing',
    description: 'Single pricing option with features list and CTA',
    tags: ['simple', 'solo', 'straightforward'],
    defaultHeight: 500,
    icon: 'DollarSign',
  },

  // Team
  {
    id: 'team-grid',
    name: 'Team Grid',
    category: 'Team',
    description: 'Photo cards for team members with name, role and social links',
    tags: ['people', 'about', 'grid'],
    defaultHeight: 600,
    icon: 'Users',
    variants: ['2-col', '3-col', '4-col'],
  },
  {
    id: 'team-featured',
    name: 'Featured Team Member',
    category: 'Team',
    description: 'Large featured profile with bio and social links',
    tags: ['founder', 'profile', 'about'],
    defaultHeight: 400,
    icon: 'User',
  },

  // Gallery
  {
    id: 'gallery-grid',
    name: 'Photo Grid',
    category: 'Gallery',
    description: 'Responsive masonry or uniform photo grid',
    tags: ['photos', 'portfolio', 'grid'],
    defaultHeight: 700,
    icon: 'Image',
    variants: ['Masonry', 'Uniform', 'Carousel'],
  },
  {
    id: 'gallery-fullwidth',
    name: 'Full-Width Image Banner',
    category: 'Gallery',
    description: 'Edge-to-edge image or photo banner with optional caption',
    tags: ['image', 'banner', 'full-width'],
    defaultHeight: 500,
    icon: 'Image',
  },

  // Blog
  {
    id: 'blog-cards',
    name: 'Blog Card Grid',
    category: 'Blog',
    description: 'Three recent post cards with thumbnail, title, date and excerpt',
    tags: ['articles', 'news', 'content'],
    defaultHeight: 600,
    icon: 'BookOpen',
  },
  {
    id: 'blog-featured',
    name: 'Featured Post Hero',
    category: 'Blog',
    description: 'Large featured article with image background and overlay text',
    tags: ['featured', 'hero', 'article'],
    defaultHeight: 500,
    icon: 'BookOpen',
  },

  // Contact
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'Contact',
    description: 'Standard contact form with name, email, message fields and submit button',
    tags: ['form', 'email', 'lead'],
    defaultHeight: 600,
    icon: 'Mail',
    variants: ['Light', 'Dark', 'Split with Map'],
  },
  {
    id: 'contact-info',
    name: 'Contact Info Block',
    category: 'Contact',
    description: 'Address, phone, email, and social media icons block',
    tags: ['address', 'info', 'social'],
    defaultHeight: 350,
    icon: 'MapPin',
  },

  // FAQ
  {
    id: 'faq-accordion',
    name: 'FAQ Accordion',
    category: 'FAQ',
    description: 'Expandable question/answer accordion — great for reducing support load',
    tags: ['questions', 'support', 'accordion'],
    defaultHeight: 700,
    icon: 'HelpCircle',
    variants: ['Left-aligned', 'Centered'],
  },
  {
    id: 'faq-two-col',
    name: 'Two-Column FAQ',
    category: 'FAQ',
    description: 'FAQs in a two-column grid layout, always expanded',
    tags: ['questions', 'grid', 'open'],
    defaultHeight: 500,
    icon: 'HelpCircle',
  },

  // CTA
  {
    id: 'cta-banner',
    name: 'CTA Banner',
    category: 'CTA',
    description: 'High-contrast banner with headline, supporting copy and action button',
    tags: ['call-to-action', 'conversion', 'banner'],
    defaultHeight: 280,
    icon: 'Zap',
    variants: ['Dark', 'Brand Color', 'Gradient'],
  },
  {
    id: 'cta-newsletter',
    name: 'Newsletter CTA',
    category: 'CTA',
    description: 'Email capture with headline and inline email input + submit',
    tags: ['email', 'capture', 'newsletter'],
    defaultHeight: 300,
    icon: 'Mail',
  },
  {
    id: 'cta-app-download',
    name: 'App Download CTA',
    category: 'CTA',
    description: 'App Store / Play Store download buttons with phone mockup',
    tags: ['app', 'mobile', 'download'],
    defaultHeight: 400,
    icon: 'Smartphone',
    isPremium: true,
  },

  // Footer
  {
    id: 'footer-full',
    name: 'Full Footer',
    category: 'Footer',
    description: 'Multi-column footer with logo, navigation links, social icons, and copyright',
    tags: ['footer', 'links', 'social'],
    defaultHeight: 350,
    icon: 'LayoutGrid',
    variants: ['Dark', 'Light'],
  },
  {
    id: 'footer-minimal',
    name: 'Minimal Footer',
    category: 'Footer',
    description: 'Single-line footer with copyright and essential links',
    tags: ['footer', 'minimal', 'simple'],
    defaultHeight: 100,
    icon: 'LayoutGrid',
  },
  {
    id: 'footer-newsletter',
    name: 'Footer with Newsletter',
    category: 'Footer',
    description: 'Footer combining newsletter sign-up, links and social icons',
    tags: ['footer', 'email', 'newsletter'],
    defaultHeight: 400,
    icon: 'Mail',
    isPremium: true,
  },

  // E-commerce
  {
    id: 'ecom-product-grid',
    name: 'Product Card Grid',
    category: 'E-commerce',
    description: 'Grid of product cards with image, name, price and add-to-cart button',
    tags: ['shop', 'products', 'grid'],
    defaultHeight: 700,
    icon: 'ShoppingCart',
    isPremium: true,
  },
  {
    id: 'ecom-product-hero',
    name: 'Product Hero',
    category: 'E-commerce',
    description: 'Large product image with details, pricing and CTA on the right',
    tags: ['product', 'detail', 'pdp'],
    defaultHeight: 700,
    icon: 'ShoppingBag',
    isPremium: true,
  },
];

export const getSectionsByCategory = (category: SectionCategory): SectionBlock[] =>
  SECTION_BLOCKS.filter((b) => b.category === category);
