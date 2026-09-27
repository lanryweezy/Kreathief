export type ExportFormatType = 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'psd' | 'mp4' | 'webm';

export interface ExportPreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'current', name: 'Current', width: 0, height: 0 },
  { id: 'ig_post', name: 'Instagram Post', width: 1080, height: 1080 },
  { id: 'ig_story', name: 'Instagram Story', width: 1080, height: 1920 },
  { id: 'fb_cover', name: 'Facebook Cover', width: 820, height: 312 },
  { id: 'twitter_header', name: 'Twitter Header', width: 1500, height: 500 },
  { id: 'hd_video', name: 'HD Video (1080p)', width: 1920, height: 1080 },
  { id: '4k_wallpaper', name: '4K Ultra HD', width: 3840, height: 2160 },
];
