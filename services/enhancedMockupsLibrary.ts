// Enhanced Mockup Library - 50+ Templates
// Organized by category with advanced placement data

export interface MockupPlacement {
  top: number;
  left: number;
  width: number;
  rotate: number;
  skewX: number;
  skewY: number;
  opacity: number;
  blendMode: 'multiply' | 'screen' | 'overlay' | 'source-over' | 'soft-light';
  // Corner pinning (4-point perspective)
  cornerTopLeft?: { x: number; y: number };
  cornerTopRight?: { x: number; y: number };
  cornerBottomLeft?: { x: number; y: number };
  cornerBottomRight?: { x: number; y: number };
  useCornerPinning?: boolean;
  perspectiveIntensity?: number;
  curve?: number;
}

export interface MockupDef {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  bg: string;
  defaultPlacement: MockupPlacement;
  tags?: string[];
  isPremium?: boolean;
  description?: string;
}

const defPlace = (
  top = 30,
  left = 30,
  width = 40,
  rotate = 0,
  skewX = 0,
  skewY = 0,
  opacity = 0.9,
  blendMode: MockupPlacement['blendMode'] = 'multiply'
): MockupPlacement => ({
  top,
  left,
  width,
  rotate,
  skewX,
  skewY,
  opacity,
  blendMode,
});

export const ENHANCED_MOCKUPS: MockupDef[] = [
  // ==================== APPAREL (12 templates) ====================
  {
    id: 'tshirt_flat',
    name: 'T-Shirt Flat',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(25, 28, 45),
    tags: ['clothing', 'casual', 'unisex'],
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(25, 30, 40),
    tags: ['clothing', 'winter', 'casual'],
  },
  {
    id: 'model_tshirt',
    name: 'Model T-Shirt',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(30, 32, 35),
    tags: ['model', 'lifestyle', 'casual'],
  },
  {
    id: 'totebag',
    name: 'Tote Bag',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1597484662317-c9253e609141?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(45, 35, 30),
    tags: ['bag', 'eco', 'accessories'],
  },
  {
    id: 'minimal_tshirt',
    name: 'Minimal White T-Shirt',
    category: 'Apparel',
    bg: '/New folder/man-wearing-minimal-white-t-shirt.jpg',
    defaultPlacement: defPlace(30, 32, 35),
    tags: ['minimal', 'white', 'clean'],
  },
  {
    id: 'grunge_apparel',
    name: 'Grunge Black Top',
    category: 'Apparel',
    bg: '/New folder/teenage-girl-black-top-flannel-shirt-youth-apparel-grunge-fashion-shoot.jpg',
    defaultPlacement: defPlace(25, 30, 40),
    tags: ['grunge', 'dark', 'fashion'],
  },
  {
    id: 'polo_shirt',
    name: 'Polo Shirt',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(28, 30, 40),
    tags: ['formal', 'business', 'collar'],
  },
  {
    id: 'tank_top',
    name: 'Tank Top',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1571217628854-6e612f10f681?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(26, 30, 42),
    tags: ['summer', 'casual', 'sleeveless'],
  },
  {
    id: 'sweatshirt',
    name: 'Crewneck Sweatshirt',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(24, 29, 42),
    tags: ['winter', 'cozy', 'casual'],
  },
  {
    id: 'jacket_denim',
    name: 'Denim Jacket',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(22, 28, 50),
    tags: ['outerwear', 'denim', 'casual'],
  },
  {
    id: 'dress_casual',
    name: 'Casual Dress',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(28, 32, 36),
    tags: ['women', 'fashion', 'elegant'],
  },
  {
    id: 'cap_baseball',
    name: 'Baseball Cap',
    category: 'Apparel',
    bg: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(35, 40, 20, 0, 0, 0, 0.85, 'multiply'),
    tags: ['hat', 'accessories', 'sports'],
  },

  // ==================== DIGITAL (8 templates) ====================
  {
    id: 'macbook',
    name: 'MacBook Pro',
    category: 'Digital',
    bg: 'https://images.unsplash.com/photo-1517336712603-d2d0f0464686?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(18, 22, 56, 0, 0, 0, 0.95, 'source-over'),
    tags: ['laptop', 'apple', 'tech'],
  },
  {
    id: 'iphone',
    name: 'iPhone',
    category: 'Digital',
    bg: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(20, 38, 25, 0, 0, 0, 0.95, 'source-over'),
    tags: ['phone', 'mobile', 'apple'],
  },
  {
    id: 'ipad',
    name: 'iPad Pro',
    category: 'Digital',
    bg: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(15, 25, 50, 0, 0, 0, 0.95, 'source-over'),
    tags: ['tablet', 'apple', 'tech'],
  },
  {
    id: 'android_phone',
    name: 'Android Smartphone',
    category: 'Digital',
    bg: 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(20, 38, 25, 0, 0, 0, 0.95, 'source-over'),
    tags: ['phone', 'mobile', 'android'],
  },
  {
    id: 'laptop_angle',
    name: 'Laptop Side View',
    category: 'Digital',
    bg: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(25, 30, 45, 0, 0, 5, 0.9, 'source-over'),
    tags: ['laptop', 'workspace', 'tech'],
  },
  {
    id: 'headphones',
    name: 'Headphones',
    category: 'Digital',
    bg: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(35, 35, 30, 0, 0, 0, 0.85, 'multiply'),
    tags: ['audio', 'music', 'wireless'],
  },
  {
    id: 'smartwatch',
    name: 'Smart Watch',
    category: 'Digital',
    bg: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(45, 40, 20, 0, 0, 0, 0.9, 'source-over'),
    tags: ['wearable', 'tech', 'fitness'],
  },
  {
    id: 'monitor_desk',
    name: 'Desktop Monitor',
    category: 'Digital',
    bg: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(20, 25, 50, 0, 0, 0, 0.95, 'source-over'),
    tags: ['desktop', 'screen', 'workspace'],
  },

  // ==================== PRINT (8 templates) ====================
  {
    id: 'poster_frame',
    name: 'Poster Frame',
    category: 'Print',
    bg: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(15, 27, 46, -2, 0, 0, 0.9, 'multiply'),
    tags: ['wall', 'art', 'frame'],
  },
  {
    id: 'business_card',
    name: 'Business Cards',
    category: 'Print',
    bg: 'https://images.unsplash.com/photo-1589330694653-ded6df53f6ee?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(35, 25, 50, -15, 10, 0, 0.9, 'multiply'),
    tags: ['corporate', 'professional', 'branding'],
  },
  {
    id: 'magazine',
    name: 'Magazine',
    category: 'Print',
    bg: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(20, 30, 40, 5, 0, 0, 0.9, 'multiply'),
    tags: ['publication', 'editorial', 'cover'],
  },
  {
    id: 'flyer_table',
    name: 'Flyer on Table',
    category: 'Print',
    bg: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(30, 30, 40, 10, 5, 5, 0.85, 'multiply'),
    tags: ['marketing', 'promotional', 'flat'],
  },
  {
    id: 'book_cover',
    name: 'Book Cover',
    category: 'Print',
    bg: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(22, 32, 36, 0, 0, 3, 0.9, 'multiply'),
    tags: ['book', 'publishing', 'cover'],
  },
  {
    id: 'brochure_trifold',
    name: 'Tri-fold Brochure',
    category: 'Print',
    bg: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(28, 28, 44, 0, 0, 0, 0.9, 'multiply'),
    tags: ['marketing', 'corporate', 'folded'],
  },
  {
    id: 'notebook_mockup',
    name: 'Spiral Notebook',
    category: 'Print',
    bg: 'https://images.unsplash.com/photo-1531346878377-a513bc95ba0d?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(25, 30, 40, 0, 0, 0, 0.9, 'multiply'),
    tags: ['stationery', 'school', 'office'],
  },
  {
    id: 'greeting_cards',
    name: 'Greeting Cards',
    category: 'Print',
    bg: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(30, 28, 44, 0, 0, 0, 0.9, 'multiply'),
    tags: ['cards', 'celebration', 'paper'],
  },

  // ==================== PACKAGING (10 templates) ====================
  {
    id: 'coffee_bag',
    name: 'Coffee Bag',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(30, 35, 30, 0, 0, 5, 0.9, 'multiply'),
    tags: ['food', 'beverage', 'pouch'],
  },
  {
    id: 'box',
    name: 'Mailer Box',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(25, 25, 50, 0, 0, 0, 0.9, 'multiply'),
    tags: ['shipping', 'ecommerce', 'cardboard'],
  },
  {
    id: 'cosmetic',
    name: 'Cosmetic Bottle',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(40, 45, 10, 0, 0, 0, 0.8, 'multiply'),
    tags: ['beauty', 'skincare', 'bottle'],
  },
  {
    id: 'wine_bottle',
    name: 'Wine Bottle',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(35, 42, 16, 0, 0, 0, 0.85, 'multiply'),
    tags: ['beverage', 'alcohol', 'label'],
  },
  {
    id: 'beer_bottle',
    name: 'Beer Bottle',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(38, 43, 14, 0, 0, 0, 0.85, 'multiply'),
    tags: ['beverage', 'alcohol', 'label'],
  },
  {
    id: 'soda_can',
    name: 'Soda Can',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef07?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(35, 42, 16, 0, 0, 0, 0.85, 'multiply'),
    tags: ['beverage', 'drink', 'aluminum'],
  },
  {
    id: 'shopping_bag',
    name: 'Shopping Bag',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(28, 32, 36, 0, 0, 0, 0.9, 'multiply'),
    tags: ['retail', 'branding', 'paper'],
  },
  {
    id: 'takeout_box',
    name: 'Takeout Box',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(32, 35, 30, 0, 0, 5, 0.9, 'multiply'),
    tags: ['food', 'restaurant', 'chinese'],
  },
  {
    id: 'perfume_box',
    name: 'Perfume Box',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1594035910387-fea4779426e9?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(30, 38, 24, 0, 0, 0, 0.9, 'multiply'),
    tags: ['luxury', 'beauty', 'gift'],
  },
  {
    id: 'chocolate_box',
    name: 'Chocolate Box',
    category: 'Packaging',
    bg: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(35, 30, 40, 0, 0, 0, 0.9, 'multiply'),
    tags: ['food', 'gift', 'luxury'],
  },

  // ==================== OUTDOOR (6 templates) ====================
  {
    id: 'billboard',
    name: 'Highway Billboard',
    category: 'Outdoor',
    bg: 'https://images.unsplash.com/photo-1542662565-7e4b66b5adaa?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(10, 25, 50),
    tags: ['advertising', 'large', 'highway'],
  },
  {
    id: 'sign',
    name: 'Wall Sign',
    category: 'Outdoor',
    bg: 'https://images.unsplash.com/photo-1514454529242-9e467756334d?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(20, 30, 40),
    tags: ['signage', 'building', 'branding'],
  },
  {
    id: 'bus_stop',
    name: 'Bus Stop Ad',
    category: 'Outdoor',
    bg: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(18, 28, 44, 0, 0, 2, 0.9, 'multiply'),
    tags: ['transit', 'urban', 'advertising'],
  },
  {
    id: 'storefront',
    name: 'Storefront Sign',
    category: 'Outdoor',
    bg: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(15, 30, 40, 0, 0, 0, 0.9, 'multiply'),
    tags: ['retail', 'shop', 'signage'],
  },
  {
    id: 'vehicle_van',
    name: 'Delivery Van',
    category: 'Outdoor',
    bg: 'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(30, 25, 50, 0, 0, 0, 0.85, 'multiply'),
    tags: ['vehicle', 'branding', 'commercial'],
  },
  {
    id: 'banner_fence',
    name: 'Construction Banner',
    category: 'Outdoor',
    bg: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(25, 20, 60, 0, 0, 3, 0.85, 'multiply'),
    tags: ['banner', 'temporary', 'large'],
  },

  // ==================== FOOD & BEVERAGE (6 templates) ====================
  {
    id: 'coffee_cup',
    name: 'Coffee Cup',
    category: 'Food & Beverage',
    bg: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(38, 40, 20, 0, 0, 0, 0.85, 'multiply'),
    tags: ['drink', 'cafe', 'paper cup'],
  },
  {
    id: 'burger_wrapper',
    name: 'Burger Wrapper',
    category: 'Food & Beverage',
    bg: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(35, 35, 30, 0, 0, 5, 0.9, 'multiply'),
    tags: ['fast food', 'restaurant', 'packaging'],
  },
  {
    id: 'pizza_box',
    name: 'Pizza Box',
    category: 'Food & Beverage',
    bg: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(25, 25, 50, 0, 0, 5, 0.9, 'multiply'),
    tags: ['food', 'delivery', 'italian'],
  },
  {
    id: 'smoothie_cup',
    name: 'Smoothie Cup',
    category: 'Food & Beverage',
    bg: 'https://images.unsplash.com/photo-1623594830088-3d7d0a8b6d69?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(36, 40, 20, 0, 0, 0, 0.85, 'multiply'),
    tags: ['healthy', 'drink', 'plastic'],
  },
  {
    id: 'ice_cream',
    name: 'Ice Cream Cone',
    category: 'Food & Beverage',
    bg: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(40, 42, 18, 0, 0, 0, 0.85, 'multiply'),
    tags: ['dessert', 'summer', 'sweet'],
  },
  {
    id: 'donut_box',
    name: 'Donut Box',
    category: 'Food & Beverage',
    bg: 'https://images.unsplash.com/photo-1551024601-564d6d67e2b7?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(32, 30, 40, 0, 0, 0, 0.9, 'multiply'),
    tags: ['bakery', 'sweet', 'breakfast'],
  },

  // ==================== HOME DECOR (4 templates) ====================
  {
    id: 'pillow',
    name: 'Throw Pillow',
    category: 'Home Decor',
    bg: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(30, 30, 40, 0, 0, 0, 0.85, 'multiply'),
    tags: ['cushion', 'interior', 'fabric'],
  },
  {
    id: 'mug',
    name: 'Coffee Mug',
    category: 'Home Decor',
    bg: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(38, 40, 22, 0, 0, 0, 0.85, 'multiply'),
    tags: ['drink', 'ceramic', 'kitchen'],
  },
  {
    id: 'canvas_print',
    name: 'Canvas Print',
    category: 'Home Decor',
    bg: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(20, 30, 40, 0, 0, 0, 0.9, 'multiply'),
    tags: ['wall art', 'frame', 'interior'],
  },
  {
    id: 'blanket',
    name: 'Throw Blanket',
    category: 'Home Decor',
    bg: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=600&q=80',
    defaultPlacement: defPlace(28, 28, 44, 0, 0, 5, 0.8, 'multiply'),
    tags: ['cozy', 'fabric', 'interior'],
  },
];

export const MOCKUP_CATEGORIES = [
  'All',
  'Apparel',
  'Digital',
  'Print',
  'Packaging',
  'Outdoor',
  'Food & Beverage',
  'Home Decor',
];

export function getMockupsByCategory(category: string): MockupDef[] {
  if (category === 'All') {
    return ENHANCED_MOCKUPS;
  }
  return ENHANCED_MOCKUPS.filter((m) => m.category === category);
}

export function searchMockups(query: string): MockupDef[] {
  const lowerQuery = query.toLowerCase();
  return ENHANCED_MOCKUPS.filter(
    (m) =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      m.category.toLowerCase().includes(lowerQuery)
  );
}

export function getMockupById(id: string): MockupDef | undefined {
  return ENHANCED_MOCKUPS.find((m) => m.id === id);
}
