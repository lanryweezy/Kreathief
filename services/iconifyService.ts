import { log } from '../utils/log';

export interface IconifyAsset {
  id: string;
  name: string;
  prefix: string;
  svgData: string;
}

/**
 * Searches the Iconify open source API for icons
 */
export async function searchIcons(query: string, limit = 20): Promise<IconifyAsset[]> {
  if (!query) {
    return [];
  }

  try {
    const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}`);

    if (!res.ok) {
      throw new Error(`Iconify search failed: ${res.status}`);
    }

    const data = await res.json();
    if (!data.icons || data.icons.length === 0) {
      return [];
    }

    // Now we must fetch the actual SVG data for each icon because the search endpoint
    // only returns icon names (e.g., 'mdi:home', 'ph:user')
    const svgPromises = data.icons.map(async (iconName: string) => {
      const [prefix, name] = iconName.split(':');
      try {
        // Fetch raw SVG
        const svgRes = await fetch(`https://api.iconify.design/${prefix}/${name}.svg`);
        if (!svgRes.ok) {
          return null;
        }

        const svgText = await svgRes.text();
        return {
          id: `iconify-${iconName}`,
          name: name,
          prefix: prefix,
          svgData: svgText,
        };
      } catch (err) {
        return null;
      }
    });

    const results = await Promise.all(svgPromises);
    return results.filter(Boolean) as IconifyAsset[];
  } catch (error) {
    log.error('[IconifyService] Error searching icons', error);
    return [];
  }
}
