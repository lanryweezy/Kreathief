export const twitterLaunchThread = [
  {
    id: 1,
    type: 'hook',
    content: "I built an AI design tool for Africa. Here's why. 🧵",
  },
  {
    id: 2,
    type: 'problem',
    content:
      "Canva and Figma are great — but they weren't built for African markets. Wrong templates, wrong fonts, wrong color palettes, wrong currencies. Our visual culture gets filtered through a Western lens.",
  },
  {
    id: 3,
    type: 'solution',
    content:
      'Meet Kreathief — an AI-powered design tool built specifically for African creators. Local templates, culturally relevant assets, and AI that understands our markets.',
  },
  {
    id: 4,
    type: 'business-model',
    content:
      "The best part? Creators earn money from their templates. Build once, sell forever. We're turning African design talent into a sustainable income stream.",
  },
  {
    id: 5,
    type: 'tech',
    content:
      'Under the hood: Gemini AI for generation, React for the editor, Supabase for backend. Ships fast, runs in the browser, works on low-bandwidth connections.',
  },
  {
    id: 6,
    type: 'demo',
    content: '[Insert GIF/video of Kreathief in action — AI generating a social media post in seconds]',
  },
  {
    id: 7,
    type: 'lessons',
    content:
      'Lessons learned: 1) Start with one market, not all of Africa. 2) Offline-first matters more than you think. 3) Creators want to earn, not just design. 4) Simple beats powerful every time.',
  },
  {
    id: 8,
    type: 'next',
    content:
      "What's next: Mobile-first editor, more local payment integrations, creator analytics dashboard, and partnerships with African brands who need authentic content.",
  },
  {
    id: 9,
    type: 'cta',
    content:
      "We're opening the waitlist. If you're an African creator, designer, or business owner — this is for you. Link in bio.",
  },
  {
    id: 10,
    type: 'thank-you',
    content:
      "Thanks for reading. If this resonates, RT the first tweet. Let's build something that actually serves our markets. 🙏",
  },
];

export interface InstagramPost {
  id: number;
  type: string;
  caption: string;
  hashtags: string[];
  visualDescription: string;
}

export const instagramPosts: InstagramPost[] = [
  {
    id: 1,
    type: 'design-showcase',
    caption:
      'When AI meets African design 🎨 Swipe to see how Kreathief transforms blank canvases into culturally rich content — in seconds.',
    hashtags: ['kreathief', 'africandesign', 'aitools', 'graphicdesign', 'africacreators', 'designinspiration'],
    visualDescription: 'Carousel: 3-4 slides showing before/after AI-generated African-themed designs',
  },
  {
    id: 2,
    type: 'behind-the-scenes',
    caption:
      "Building Kreathief from Lagos. Late nights, early mornings, and a lot of debugging. Here's what the journey looks like. 💪",
    hashtags: ['buildinpublic', 'indiemaker', 'lagosstartup', 'techafrica', 'saaslife', 'startupjourney'],
    visualDescription: 'Photo/video of workspace, code on screen, team working',
  },
  {
    id: 3,
    type: 'creator-spotlight',
    caption:
      'Meet @[creator_name] — a Kreathief template designer who earned ₦50,000 last month from just 3 templates. "I never thought my designs could make money like this."',
    hashtags: [
      'kreathiefcreator',
      'earnwithdesign',
      'africanentrepreneur',
      'passiveincome',
      'creatoreconomy',
      'designbusiness',
    ],
    visualDescription: "Screenshot of creator's earnings dashboard with their permission, or photo of creator",
  },
  {
    id: 4,
    type: 'ai-feature-demo',
    caption:
      'Watch this 👀 Type a prompt → get a complete social media post in 10 seconds. No design skills needed. The future of content creation is here.',
    hashtags: ['aidesign', 'aitools', 'contentcreation', 'kreathief', 'futureofdesign', 'socialmediatips'],
    visualDescription: 'Reel/screen recording showing prompt input → AI-generated design result',
  },
  {
    id: 5,
    type: 'community-highlight',
    caption:
      'Our community just hit [X] creators! 🎉 From Lagos to Nairobi to Accra — African designers are building something special together.',
    hashtags: ['kreathiefcommunity', 'africancreators', 'techcommunity', 'designtools', 'africantech', 'communitylove'],
    visualDescription: 'Collage of community member profiles, designs, or a map showing creator locations',
  },
];

export interface TikTokScript {
  id: number;
  type: string;
  duration: string;
  hook: string;
  script: string[];
  cta: string;
  musicSuggestion: string;
}

export const tiktokScripts: TikTokScript[] = [
  {
    id: 1,
    type: 'design-demo',
    duration: '15 seconds',
    hook: 'POV: You need a flyer in 10 seconds',
    script: [
      'Show phone/laptop screen',
      "Open Kreathief, type: 'Nigerian independence day flyer, modern, bold'",
      'AI generates design',
      'Show final result with reaction',
    ],
    cta: 'Link in bio — try Kreathief free',
    musicSuggestion: 'Trending upbeat African beat',
  },
  {
    id: 2,
    type: 'before-after',
    duration: '15-30 seconds',
    hook: 'What AI does to your design vs what you do manually',
    script: [
      'Split screen: left = boring template, right = empty canvas',
      'Show manual design process on left (fast-forward, struggling)',
      'Show AI generation on right (smooth, instant)',
      'Final comparison: AI result vs manual result',
    ],
    cta: 'Stop struggling. Use Kreathief.',
    musicSuggestion: 'Comparison/transformation trending audio',
  },
  {
    id: 3,
    type: 'speed-run',
    duration: '30 seconds',
    hook: 'Creating 5 Instagram posts in 60 seconds — speed run',
    script: [
      'Start timer',
      'Type prompt 1 → generate → save',
      'Type prompt 2 → generate → save',
      'Continue for 5 posts',
      'Stop timer, show all 5 designs',
    ],
    cta: 'How fast can YOU create? Try it now',
    musicSuggestion: 'Fast-paced challenge music',
  },
  {
    id: 4,
    type: 'earnings-reveal',
    duration: '15-30 seconds',
    hook: "I made ₦[amount] selling designs I didn't even design",
    script: [
      'Show earnings dashboard (blur sensitive info)',
      "Explain: 'I created templates on Kreathief'",
      'Show how others buy and use templates',
      'Show passive income accumulating',
    ],
    cta: 'Become a creator. Link in bio.',
    musicSuggestion: 'Money/success trending sound',
  },
  {
    id: 5,
    type: 'design-tip',
    duration: '15 seconds',
    hook: 'Design tip: The 3-second rule',
    script: [
      "Text on screen: 'Your design has 3 seconds to grab attention'",
      'Show example: crowded vs clean design',
      'Show Kreathief AI optimizing for clarity',
      "Final tip: 'White space is your friend'",
    ],
    cta: 'Follow for more design tips',
    musicSuggestion: 'Educational/explainer trending audio',
  },
];

export const socialMediaConfig = {
  brandName: 'Kreathief',
  tagline: 'AI Design for Africa',
  platforms: {
    twitter: {
      maxThreadLength: 10,
      postingFrequency: '3-5x/week',
      bestTimes: ['9:00 AM WAT', '12:00 PM WAT', '7:00 PM WAT'],
    },
    instagram: {
      postingFrequency: '4-5x/week',
      bestTimes: ['11:00 AM WAT', '2:00 PM WAT', '7:00 PM WAT'],
      contentMix: {
        reels: '40%',
        carousels: '30%',
        staticPosts: '20%',
        stories: '10%',
      },
    },
    tiktok: {
      postingFrequency: '5-7x/week',
      bestTimes: ['12:00 PM WAT', '6:00 PM WAT', '9:00 PM WAT'],
    },
  },
  hashtags: {
    primary: ['#kreathief', '#aidesign', '#africancreators'],
    secondary: ['#africandesign', '#designcommunity', '#aitools', '#creatoreconomy'],
    location: ['#lagos', '#nairobi', '#accra', '#africa'],
  },
};
