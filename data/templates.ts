import { CanvasSize, HistoryState, Project } from '../types';

export interface StarterTemplate {
  id: string;
  name: string;
  category: 'Social' | 'Video' | 'Business' | 'Personal';
  description: string;
  size: CanvasSize;
  state: HistoryState;
}

const baseState = (size: CanvasSize): Omit<HistoryState, 'canvasSize'> => ({
  textLayers: [],
  shapeLayers: [],
  imageLayers: [],
  canvasBackgroundColor: '#0f172a',
  canvasFilters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    opacity: 1,
    vignette: 0
  }
});

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'social_instagram_post',
    name: 'Instagram Post',
    category: 'Social',
    description: 'Square social post with bold title and CTA',
    size: { width: 1080, height: 1080, name: 'Instagram Post' },
    state: {
      ...baseState({ width: 1080, height: 1080, name: 'Instagram Post' }),
      canvasSize: { width: 1080, height: 1080, name: 'Instagram Post' },
      shapeLayers: [
        {
          id: 'shape_bg_accent',
          type: 'rectangle',
          name: 'Accent Block',
          x: 80,
          y: 120,
          width: 920,
          height: 680,
          rotation: 0,
          color: '#0b1120',
          cornerRadius: 32,
          opacity: 1,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'shape_pill',
          type: 'rectangle',
          name: 'Top Tag',
          x: 120,
          y: 150,
          width: 260,
          height: 52,
          rotation: 0,
          color: '#22c55e',
          cornerRadius: 999,
          opacity: 1,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        }
      ],
      textLayers: [
        {
          id: 'text_tag',
          type: 'text',
          name: 'Tag',
          text: 'NEW DROP',
          x: 140,
          y: 160,
          width: 220,
          rotation: 0,
          fontSize: 22,
          fontWeight: '600',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#022c22',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 2,
          lineHeight: 1.4,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'text_title',
          type: 'text',
          name: 'Title',
          text: 'Make scroll‑stopping\ncontent in minutes',
          x: 140,
          y: 240,
          width: 520,
          rotation: 0,
          fontSize: 64,
          fontWeight: '800',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#e5e7eb',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 0,
          lineHeight: 1.1,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'text_body',
          type: 'text',
          name: 'Body',
          text: 'Swap your colors, text, and images.\nPerfect for product drops and promos.',
          x: 140,
          y: 430,
          width: 520,
          rotation: 0,
          fontSize: 20,
          fontWeight: '400',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#9ca3af',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 0,
          lineHeight: 1.5,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'text_cta',
          type: 'text',
          name: 'CTA',
          text: 'Edit this button →',
          x: 140,
          y: 560,
          width: 320,
          rotation: 0,
          fontSize: 20,
          fontWeight: '600',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#22c55e',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 0,
          lineHeight: 1.4,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        }
      ],
      imageLayers: []
    }
  },
  {
    id: 'social_story',
    name: 'Story / Reel',
    category: 'Social',
    description: 'Vertical story layout with headline and footer bar',
    size: { width: 1080, height: 1920, name: 'Story / Reel' },
    state: {
      ...baseState({ width: 1080, height: 1920, name: 'Story / Reel' }),
      canvasSize: { width: 1080, height: 1920, name: 'Story / Reel' },
      shapeLayers: [
        {
          id: 'shape_story_header',
          type: 'rectangle',
          name: 'Top Gradient',
          x: 0,
          y: 0,
          width: 1080,
          height: 580,
          rotation: 0,
          color: '#0b1120',
          cornerRadius: 0,
          opacity: 1,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'shape_story_footer',
          type: 'rectangle',
          name: 'Footer Bar',
          x: 64,
          y: 1550,
          width: 952,
          height: 180,
          rotation: 0,
          color: '#020617',
          cornerRadius: 24,
          opacity: 0.9,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        }
      ],
      textLayers: [
        {
          id: 'story_kicker',
          type: 'text',
          name: 'Kicker',
          text: 'TUTORIAL',
          x: 80,
          y: 140,
          width: 260,
          rotation: 0,
          fontSize: 26,
          fontWeight: '600',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#38bdf8',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 3,
          lineHeight: 1.3,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'story_title',
          type: 'text',
          name: 'Title',
          text: 'Design thumbnails\npeople actually click',
          x: 80,
          y: 220,
          width: 760,
          rotation: 0,
          fontSize: 72,
          fontWeight: '800',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#e5e7eb',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 0,
          lineHeight: 1.05,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'story_footer',
          type: 'text',
          name: 'Footer',
          text: 'Add your handle or CTA here',
          x: 96,
          y: 1585,
          width: 820,
          rotation: 0,
          fontSize: 24,
          fontWeight: '500',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#cbd5f5',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 0,
          lineHeight: 1.4,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        }
      ],
      imageLayers: []
    }
  },
  {
    id: 'video_youtube_thumb',
    name: 'YouTube Thumbnail',
    category: 'Video',
    description: '16:9 thumbnail with bold title and image area',
    size: { width: 1280, height: 720, name: 'YouTube Thumbnail' },
    state: {
      ...baseState({ width: 1280, height: 720, name: 'YouTube Thumbnail' }),
      canvasSize: { width: 1280, height: 720, name: 'YouTube Thumbnail' },
      shapeLayers: [
        {
          id: 'yt_bg',
          type: 'rectangle',
          name: 'BG',
          x: 0,
          y: 0,
          width: 1280,
          height: 720,
          rotation: 0,
          color: '#020617',
          cornerRadius: 0,
          opacity: 1,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'yt_left',
          type: 'rectangle',
          name: 'Image Placeholder',
          x: 40,
          y: 80,
          width: 520,
          height: 560,
          rotation: 0,
          color: '#0f172a',
          cornerRadius: 24,
          opacity: 1,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        }
      ],
      textLayers: [
        {
          id: 'yt_tag',
          type: 'text',
          name: 'Tag',
          text: 'KREATHIEF GUIDE',
          x: 600,
          y: 110,
          width: 360,
          rotation: 0,
          fontSize: 24,
          fontWeight: '600',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#38bdf8',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 2,
          lineHeight: 1.3,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'yt_title',
          type: 'text',
          name: 'Title',
          text: 'From blank canvas\nto viral design',
          x: 600,
          y: 170,
          width: 620,
          rotation: 0,
          fontSize: 64,
          fontWeight: '900',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#f9fafb',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 0,
          lineHeight: 1.05,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        }
      ],
      imageLayers: []
    }
  },
  {
    id: 'business_linkedin_post',
    name: 'LinkedIn Post',
    category: 'Business',
    description: 'Professional layout with headline and subhead',
    size: { width: 1200, height: 627, name: 'LinkedIn Post' },
    state: {
      ...baseState({ width: 1200, height: 627, name: 'LinkedIn Post' }),
      canvasSize: { width: 1200, height: 627, name: 'LinkedIn Post' },
      shapeLayers: [
        {
          id: 'li_left_band',
          type: 'rectangle',
          name: 'Brand Bar',
          x: 0,
          y: 0,
          width: 80,
          height: 627,
          rotation: 0,
          color: '#0f766e',
          cornerRadius: 0,
          opacity: 1,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        }
      ],
      textLayers: [
        {
          id: 'li_title',
          type: 'text',
          name: 'Title',
          text: '3 ways to ship design assets\nfaster with AI',
          x: 120,
          y: 160,
          width: 760,
          rotation: 0,
          fontSize: 40,
          fontWeight: '700',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#020617',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 0,
          lineHeight: 1.3,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        },
        {
          id: 'li_body',
          type: 'text',
          name: 'Body',
          text: 'Summarise the key value here in one or two short sentences.',
          x: 120,
          y: 280,
          width: 760,
          rotation: 0,
          fontSize: 20,
          fontWeight: '400',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#4b5563',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 0,
          lineHeight: 1.6,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        }
      ],
      imageLayers: []
    }
  },
  {
    id: 'business_presentation_cover',
    name: 'Presentation Cover',
    category: 'Business',
    description: 'Wide slide cover for decks and case studies',
    size: { width: 1920, height: 1080, name: 'Presentation Slide' },
    state: {
      ...baseState({ width: 1920, height: 1080, name: 'Presentation Slide' }),
      canvasSize: { width: 1920, height: 1080, name: 'Presentation Slide' },
      shapeLayers: [
        {
          id: 'deck_band',
          type: 'rectangle',
          name: 'Accent Band',
          x: 0,
          y: 720,
          width: 1920,
          height: 360,
          rotation: 0,
          color: '#0f172a',
          cornerRadius: 0,
          opacity: 1,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        }
      ],
      textLayers: [
        {
          id: 'deck_title',
          type: 'text',
          name: 'Title',
          text: 'Your next big idea,\n beautifully presented',
          x: 160,
          y: 320,
          width: 880,
          rotation: 0,
          fontSize: 64,
          fontWeight: '800',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#020617',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 0,
          lineHeight: 1.2,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        }
      ],
      imageLayers: []
    }
  },
  {
    id: 'social_tiktok_ad',
    name: 'TikTok Video Ad',
    category: 'Social',
    description: 'Vertical overlay with CTA button and text safe zones',
    size: { width: 1080, height: 1920, name: 'TikTok Ad' },
    state: {
      ...baseState({ width: 1080, height: 1920, name: 'TikTok Ad' }),
      canvasSize: { width: 1080, height: 1920, name: 'TikTok Ad' },
      shapeLayers: [
        {
          id: 'tt_btn',
          type: 'rectangle',
          name: 'Shop Now Button',
          x: 340,
          y: 1650,
          width: 400,
          height: 100,
          rotation: 0,
          color: '#fe2c55',
          cornerRadius: 8,
          opacity: 1,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        }
      ],
      textLayers: [
        {
          id: 'tt_headline',
          type: 'text',
          name: 'Headline',
          text: '50% OFF TODAY',
          x: 100,
          y: 400,
          width: 880,
          rotation: 0,
          fontSize: 80,
          fontWeight: '900',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          letterSpacing: -2,
          lineHeight: 1.1,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        }
      ],
      imageLayers: []
    }
  },
  {
    id: 'social_pinterest_pin',
    name: 'Pinterest Pin',
    category: 'Social',
    description: '2:3 aspect ratio optimized for Pinterest discovery',
    size: { width: 1000, height: 1500, name: 'Pinterest Pin' },
    state: {
      ...baseState({ width: 1000, height: 1500, name: 'Pinterest Pin' }),
      canvasSize: { width: 1000, height: 1500, name: 'Pinterest Pin' },
      shapeLayers: [
        {
          id: 'pin_overlay',
          type: 'rectangle',
          name: 'Text Background',
          x: 100,
          y: 1100,
          width: 800,
          height: 300,
          rotation: 0,
          color: '#ffffff',
          cornerRadius: 16,
          opacity: 0.95,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        }
      ],
      textLayers: [
        {
          id: 'pin_title',
          type: 'text',
          name: 'Title',
          text: 'Master the Art of\nMinimalist Design',
          x: 150,
          y: 1150,
          width: 700,
          rotation: 0,
          fontSize: 48,
          fontWeight: '700',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#1e293b',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        }
      ],
      imageLayers: []
    }
  },
  {
    id: 'business_card_horizontal',
    name: 'Business Card',
    category: 'Business',
    description: 'Minimalist professional business card',
    size: { width: 1050, height: 600, name: 'Business Card' },
    state: {
      ...baseState({ width: 1050, height: 600, name: 'Business Card' }),
      canvasSize: { width: 1050, height: 600, name: 'Business Card' },
      shapeLayers: [
        {
          id: 'bc_line',
          type: 'rectangle',
          name: 'Separator',
          x: 100,
          y: 300,
          width: 50,
          height: 4,
          rotation: 0,
          color: '#3b82f6',
          cornerRadius: 2,
          opacity: 1,
          locked: false,
          visible: true,
          skewX: 0,
          skewY: 0
        }
      ],
      textLayers: [
        {
          id: 'bc_name',
          type: 'text',
          name: 'Name',
          text: 'ALEX RIVERA',
          x: 100,
          y: 200,
          width: 600,
          rotation: 0,
          fontSize: 32,
          fontWeight: '700',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#f8fafc',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          letterSpacing: 4,
          lineHeight: 1.2,
          textTransform: 'uppercase',
          opacity: 1,
          locked: false,
          visible: true,
          blendMode: 'normal',
          curve: 0,
          skewX: 0,
          skewY: 0
        }
      ],
      imageLayers: []
    }
  },
  {
    id: 'social_twitter_header',
    name: 'Twitter Header',
    category: 'Social',
    description: 'Ultra-wide banner with center focus',
    size: { width: 1500, height: 500, name: 'Twitter Header' },
    state: {
      ...baseState({ width: 1500, height: 500, name: 'Twitter Header' }),
      canvasSize: { width: 1500, height: 500, name: 'Twitter Header' },
      shapeLayers: [],
      textLayers: [
        {
          id: 'tw_title',
          text: 'CREATING THE FUTURE',
          x: 0, y: 200, width: 1500, fontSize: 40, fontWeight: '800', fontFamily: 'Inter', color: '#ffffff', textAlign: 'center', letterSpacing: 10,
          type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', lineHeight: 1.2, textTransform: 'uppercase', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Title'
        }
      ],
      imageLayers: []
    }
  },
  {
    id: 'personal_event_poster',
    name: 'Event Poster (A4)',
    category: 'Personal',
    description: 'Vertical layout for events and announcements',
    size: { width: 2480, height: 3508, name: 'A4 Poster' },
    state: {
      ...baseState({ width: 2480, height: 3508, name: 'A4 Poster' }),
      canvasSize: { width: 2480, height: 3508, name: 'A4 Poster' },
      shapeLayers: [
        { id: 'p_circ', type: 'circle', name: 'Decoration', x: 1800, y: -200, width: 1000, height: 1000, color: '#f59e0b', rotation: 0, cornerRadius: 500, opacity: 0.2, locked: false, visible: true, skewX: 0, skewY: 0 }
      ],
      textLayers: [
        { id: 'p_h', text: 'SUMMER\nFESTIVAL', x: 200, y: 400, width: 2000, fontSize: 320, fontWeight: '900', fontFamily: 'Inter', color: '#ffffff', textAlign: 'left', lineHeight: 0.95, letterSpacing: 0, type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Headline' }
      ],
      imageLayers: []
    }
  },
  {
    id: 'video_podcast_cover',
    name: 'Podcast Cover',
    category: 'Video',
    description: 'Square cover for Apple & Spotify Podcasts',
    size: { width: 3000, height: 3000, name: 'Podcast Cover' },
    state: {
      ...baseState({ width: 3000, height: 3000, name: 'Podcast Cover' }),
      canvasSize: { width: 3000, height: 3000, name: 'Podcast Cover' },
      shapeLayers: [],
      textLayers: [
        { id: 'pod_t', text: 'THE\nDESIGN\nVOICE', x: 300, y: 600, width: 2400, fontSize: 400, fontWeight: '900', fontFamily: 'Inter', color: '#7d2ae8', textAlign: 'center', lineHeight: 0.9, letterSpacing: 0, type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Title' }
      ],
      imageLayers: []
    }
  },
  {
    id: 'business_linkedin_banner',
    name: 'LinkedIn Banner',
    category: 'Business',
    description: 'Professional profile header',
    size: { width: 1584, height: 396, name: 'LinkedIn Banner' },
    state: {
      ...baseState({ width: 1584, height: 396, name: 'LinkedIn Banner' }),
      canvasSize: { width: 1584, height: 396, name: 'LinkedIn Banner' },
      textLayers: [{ id: 'li_b', text: 'Solving Problems Through Design', x: 100, y: 150, width: 800, fontSize: 48, fontWeight: '700', fontFamily: 'Inter', color: '#ffffff', type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', lineHeight: 1.2, letterSpacing: 0, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Tagline' }],
      shapeLayers: [], imageLayers: []
    }
  },
  {
    id: 'social_facebook_cover',
    name: 'Facebook Cover',
    category: 'Social',
    description: 'Optimized cover for FB pages',
    size: { width: 820, height: 312, name: 'FB Cover' },
    state: {
      ...baseState({ width: 820, height: 312, name: 'FB Cover' }),
      canvasSize: { width: 820, height: 312, name: 'FB Cover' },
      textLayers: [{ id: 'fb_t', text: 'Join Our Community', x: 0, y: 120, width: 820, fontSize: 42, fontWeight: '800', fontFamily: 'Inter', color: '#ffffff', textAlign: 'center', type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', lineHeight: 1.2, letterSpacing: 0, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Call to Action' }],
      shapeLayers: [], imageLayers: []
    }
  },
  {
    id: 'personal_ebook_cover',
    name: 'E-book Cover',
    category: 'Personal',
    description: 'Portrait layout for Kindle & Kindle Direct',
    size: { width: 1600, height: 2560, name: 'E-book' },
    state: {
      ...baseState({ width: 1600, height: 2560, name: 'E-book' }),
      canvasSize: { width: 1600, height: 2560, name: 'E-book' },
      textLayers: [
        { id: 'eb_title', text: 'THE POWER\nOF HABITS', x: 100, y: 400, width: 1400, fontSize: 180, fontWeight: '900', fontFamily: 'Inter', color: '#fde047', textAlign: 'center', type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', lineHeight: 1.1, letterSpacing: 0, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Book Title' },
        { id: 'eb_author', text: 'By Author Name', x: 0, y: 2200, width: 1600, fontSize: 64, fontWeight: '500', fontFamily: 'Inter', color: '#ffffff', textAlign: 'center', type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', lineHeight: 1.2, letterSpacing: 0, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Author' }
      ],
      shapeLayers: [], imageLayers: []
    }
  },
  {
    id: 'personal_minimal_brand',
    name: 'Minimal Logo',
    category: 'Personal',
    description: 'Clean square layout for personal branding',
    size: { width: 1000, height: 1000, name: 'Square Branding' },
    state: {
      ...baseState({ width: 1000, height: 1000, name: 'Square Branding' }),
      canvasSize: { width: 1000, height: 1000, name: 'Square Branding' },
      shapeLayers: [{ id: 'lb', type: 'circle', x: 400, y: 400, width: 200, height: 200, color: '#ffffff', rotation: 0, cornerRadius: 100, opacity: 1, locked: false, visible: true, skewX: 0, skewY: 0, name: 'Circle' }],
      textLayers: [{ id: 'lt', text: 'LOGO', x: 0, y: 650, width: 1000, fontSize: 42, fontWeight: '200', fontFamily: 'Inter', color: '#ffffff', textAlign: 'center', letterSpacing: 12, type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', lineHeight: 1.2, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Brand Name' }],
      imageLayers: []
    }
  },
  {
    id: 'social_app_screenshot',
    name: 'App Store Screenshot',
    category: 'Social',
    description: 'Vertical presentation for mobile apps',
    size: { width: 1242, height: 2208, name: 'App Preview' },
    state: {
      ...baseState({ width: 1242, height: 2208, name: 'App Preview' }),
      canvasSize: { width: 1242, height: 2208, name: 'App Preview' },
      shapeLayers: [{ id: 'app_ph', type: 'rectangle', x: 150, y: 600, width: 942, height: 1408, color: '#1e293b', cornerRadius: 80, rotation: 0, opacity: 1, locked: false, visible: true, skewX: 0, skewY: 0, name: 'Phone' }],
      textLayers: [{ id: 'app_t', text: 'Discover New Sounds', x: 100, y: 200, width: 1042, fontSize: 110, fontWeight: '800', fontFamily: 'Inter', color: '#ffffff', textAlign: 'center', type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', lineHeight: 1.1, letterSpacing: 0, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Headline' }],
      imageLayers: []
    }
  },
  {
    id: 'personal_flyer_cyber',
    name: 'Cyberpunk Flyer',
    category: 'Personal',
    description: 'High-contrast neon layout for events',
    size: { width: 1080, height: 1350, name: 'Portrait Flyer' },
    state: {
      ...baseState({ width: 1080, height: 1350, name: 'Portrait Flyer' }),
      canvasSize: { width: 1080, height: 1350, name: 'Portrait Flyer' },
      shapeLayers: [{ id: 'ne', type: 'rectangle', x: 0, y: 1300, width: 1080, height: 50, color: '#ff00ff', rotation: 0, cornerRadius: 0, opacity: 1, locked: false, visible: true, skewX: 0, skewY: 0, name: 'Neon Line' }],
      textLayers: [{ id: 'cy_t', text: 'NEO\nTOKYO', x: 100, y: 400, width: 880, fontSize: 220, fontWeight: '900', fontFamily: 'Inter', color: '#00ffff', textAlign: 'left', lineHeight: 0.8, letterSpacing: 0, type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'City' }],
      imageLayers: []
    }
  },
  {
    id: 'business_letterhead',
    name: 'Letterhead',
    category: 'Business',
    description: 'Official document layout with header',
    size: { width: 2480, height: 3508, name: 'Letterhead' },
    state: {
      ...baseState({ width: 2480, height: 3508, name: 'Letterhead' }),
      canvasSize: { width: 2480, height: 3508, name: 'Letterhead' },
      shapeLayers: [{ id: 'lh_h', type: 'rectangle', x: 0, y: 0, width: 2480, height: 300, color: '#f8fafc', rotation: 0, cornerRadius: 0, opacity: 1, locked: false, visible: true, skewX: 0, skewY: 0, name: 'Header' }],
      textLayers: [{ id: 'lh_c', text: 'CORPORATE IDENTITY', x: 200, y: 120, width: 2080, fontSize: 80, fontWeight: '700', fontFamily: 'Inter', color: '#0f172a', type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', lineHeight: 1.2, letterSpacing: 0, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Corp Name' }],
      imageLayers: []
    }
  },
  {
    id: 'personal_magazine_cover',
    name: 'Magazine Cover',
    category: 'Personal',
    description: 'High-end portrait layout for fashion',
    size: { width: 1000, height: 1300, name: 'Magazine' },
    state: {
      ...baseState({ width: 1000, height: 1300, name: 'Magazine' }),
      canvasSize: { width: 1000, height: 1300, name: 'Magazine' },
      textLayers: [
        { id: 'mag_v', text: 'VOGUE', x: 0, y: 100, width: 1000, fontSize: 320, fontWeight: '900', fontFamily: 'Inter', color: '#000000', textAlign: 'center', letterSpacing: -10, type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', lineHeight: 1.2, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Masthead' },
        { id: 'mag_s', text: 'THE FUTURE OF FASHION', x: 50, y: 1100, width: 500, fontSize: 42, fontWeight: '700', fontFamily: 'Inter', color: '#000000', textAlign: 'left', type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', lineHeight: 1.2, letterSpacing: 0, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Headline' }
      ],
      shapeLayers: [], imageLayers: []
    }
  },
  {
    id: 'personal_thank_you',
    name: 'Thank You Card',
    category: 'Personal',
    description: 'Elegant square card for social thanks',
    size: { width: 1000, height: 1000, name: 'Square Card' },
    state: {
      ...baseState({ width: 1000, height: 1000, name: 'Square Card' }),
      canvasSize: { width: 1000, height: 1000, name: 'Square Card' },
      textLayers: [{ id: 'ty_t', text: 'Thank You', x: 0, y: 400, width: 1000, fontSize: 120, fontWeight: '700', fontFamily: 'Caveat', color: '#be185d', textAlign: 'center', type: 'text', rotation: 0, fontStyle: 'normal', textDecoration: 'none', lineHeight: 1.2, letterSpacing: 0, textTransform: 'none', opacity: 1, locked: false, visible: true, blendMode: 'normal', curve: 0, skewX: 0, skewY: 0, name: 'Message' }],
      shapeLayers: [], imageLayers: []
    }
  }
];

export const createProjectFromTemplate = (template: StarterTemplate): Project => {
  const timestamp = Date.now();
  return {
    id: `tmpl_${template.id}_${timestamp}`,
    name: template.name,
    updatedAt: timestamp,
    state: template.state
  };
};
