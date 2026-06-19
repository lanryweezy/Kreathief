import { BlogPost } from './blogPosts';

export const EXTRA_BLOG_POSTS: BlogPost[] = [
  {
    id: 'mastering-color-theory-2026',
    title: 'Mastering Color Theory in the Age of Generative AI',
    excerpt:
      'AI can generate an image, but it takes a human eye to ensure the brand colors hit the exact emotional chord. Learn how to dictate color theory to AI engines.',
    author: 'Elena Rostova',
    date: 'March 14, 2026',
    image: '/images/hero_floating_palette_1772559659004.png',
    category: 'Tutorial',
    readTime: '7 min read',
    content: `
# Mastering Color Theory in the Age of Generative AI

We often think of generative AI as a magic box that spits out perfect designs. But as any professional knows, AI has a tendency to default to "safe" or overly saturated aesthetics. If you want true brand control, you must learn to master color theory globally within your AI workflow.

## The Problem with "Make it professional"
When you prompt an AI to "make a professional design," it defaults to corporate blues and sterile whites. This is the visual equivalent of elevator music. To break free, you need to understand how to force the AI out of its local minima.

In Kreathief, we approach this by separating the structure generation from the color application. 

## Generative Re-Coloring
Instead of hoping the AI guesses your corporate brand colors during the initial render, Kreathief allows you to generate the structural asset in grayscale, then use target-mapping to apply your precise hex codes globally.

*   Want a cyberpunk aesthetic? Map your palette to neon cyan, magenta, and deep violet.
*   Want an organic, eco-friendly look? Apply a triadic palette of sage greens, earthy browns, and warm cream.

Stop letting the machine dictate your brand's emotional resonance. Take control.
    `,
  },
  {
    id: 'webgl-future-design',
    title: 'Why WebGL is Replacing Native Apps (And What It Means for You)',
    excerpt:
      'The technology powering Kreathief is quietly making your $3,000 MacBook Pro overkill. Here is how WebGL changes everything.',
    author: 'Marcus Chen',
    date: 'March 12, 2026',
    image: '/images/hero_abstract_glass_1772614949077.png',
    category: 'Tech',
    readTime: '5 min read',
    content: `
# Why WebGL is Replacing Native Apps

For a long time, the browser was considered a "toy" environment for complex rendering. If you wanted to run a 60fps design engine with complex drop shadows, boolean operations, and real-time masking, you had to write C++ and compile it strictly for macOS or Windows.

## The WebGL Revolution
Kreathief is built on a custom WebGL rendering pipeline. Instead of asking Chrome to draw a DOM element, we talk directly to your GPU. This means we can render 10,000 vector nodes at 144Hz entirely in the browser. 

The result? You no longer need an expensive desktop app. You can log into Kreathief from a Chromebook at a coffee shop and design a 4K billboard with zero lag. The hardware barrier to professional design has officially fallen.
    `,
  },
  {
    id: 'design-systems-kreathief',
    title: 'Implementing Design Systems for Marketing Scaling',
    excerpt:
      "Design systems aren't just for product engineers. Find out how marketing teams use Kreathief components to scale ad operations by 10x.",
    author: 'Sarah Jenkins',
    date: 'March 11, 2026',
    image: '/images/bento_grid_features_1772681955750.png',
    category: 'Industry',
    readTime: '6 min read',
    content: `
# Implementing Design Systems for Marketing Scaling

Product design has heavily utilized "Design Systems" for a decade. But marketing design? That has traditionally been a Wild West of disorganized Photoshop folders and loose brand guidelines.

## The Scale of Modern Marketing
To run a successful e-commerce campaign today, you need:
- 5 Instagram Stories
- 12 TikTok Variations
- 4 Facebook static carousels
- 3 Email Header variants

Doing this manually is burning out design teams. In Kreathief, we introduce **Marketing Components**. 

If you update the CTA button component from "Buy Now" to "Shop Sale", that change propagates instantly across all 24 ad variants across all 5 aspect ratios. This isn't just a time-saver; it's a fundamental shift in how creative agencies scale production. Stop designing manually; start building systems.
    `,
  },
];
