export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    date: string;
    image: string;
    category: string;
    readTime: string;
}

export const BLOG_POSTS: BlogPost[] = [
    {
        id: 'intro-to-generative-design',
        title: 'Intro to Generative Design: Why Professionals are Switching',
        excerpt: 'Explore how AI is redefining the workflow for modern graphic designers and why speed is no longer a luxury.',
        author: 'Sulaiman Adebayo',
        date: 'February 24, 2026',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop',
        category: 'Industry',
        readTime: '5 min read',
        content: `
      # Intro to Generative Design

      The design landscape is shifting faster than ever. What used to take hours of meticulous masking and vector point manipulation now happens in seconds with generative AI.

      ## The Hybrid Approach
      Top brands aren't just using AI; they are using "Generative Design" — a hybrid approach where AI generates the foundation, and human creativity provides the direction and refinement.

      ### Why Kreathief?
      Kreathief was built to bridge the gap between creative prompt-based AI and professional editing tools. You don't just get an image; you get layers, vectors, and masks that you can control.

      Stay tuned as we dive deeper into the specific tools that are changing the game.
    `,
    },
    {
        id: 'mastering-the-cut-out-tool',
        title: 'Mastering the Cut Out Tool: From Lasso to AI',
        excerpt: 'A deep dive into isolating subjects with pixel-perfect precision using our latest Lasso and Brush refinement updates.',
        author: 'Sulaiman Adebayo',
        date: 'February 20, 2026',
        image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=450&fit=crop',
        category: 'Tutorial',
        readTime: '8 min read',
        content: `
      # Mastering the Cut Out Tool

      Subject isolation is the cornerstone of great compositing. In our latest update, we've introduced professional-grade tools to make this easier than ever.

      ## The Lasso Tool
      For complex shapes where AI might miss a curve, the manual Lasso tool gives you 100% control. Simply click and drag to define your selection.

      ## Brush Refinement
      Once you have your base mask, use the **Erase** and **Restore** brushes to fine-tune the edges. This is "Adobe-grade" control right in your browser.

      ### Pro Tip
      Always use the Rule of Thirds grid (enabled in our latest crop update) to ensure your subject remains the focal point of your design.
    `,
    },
];
