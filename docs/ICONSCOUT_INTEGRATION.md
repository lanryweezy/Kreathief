# IconScout API Integration

## Overview

The IconScout API integration provides access to millions of design assets including icons, illustrations, 3D assets, and Lottie animations directly within the Kreathief editor.

## Features

- **Multi-Asset Type Support**: Search and use icons, illustrations, 3D assets, and Lottie animations
- **Seamless Integration**: Assets appear alongside Unsplash, Freepik, and Vecteezy results
- **Type Filtering**: Dedicated UI controls to switch between asset types
- **Drag & Drop**: Add assets to canvas with a single click

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```env
VITE_ICONSCOUT_CLIENT_ID=your_client_id_here
VITE_ICONSCOUT_SECRET_KEY=your_secret_key_here
```

### Getting API Credentials

1. Visit [IconScout API Dashboard](https://iconscout.com/api)
2. Sign up or log in to your account
3. Navigate to API settings
4. Copy your Client ID and Secret Key
5. Add them to your `.env.local` file

## Usage

### In the Assets Panel

1. Open the Assets Panel in the editor
2. Select "IconScout" from the source tabs or use "All" to see mixed results
3. Choose asset type: 3D, Icons, Illustrations, or Lottie
4. Search for assets using the search bar
5. Click any asset to add it to your canvas

### Asset Types

- **Icons**: Vector icons in various styles
- **Illustrations**: Vector illustrations and graphics
- **3D**: 3D models and renders
- **Lottie**: Animated Lottie files

## API Service

### Search Assets

```typescript
import { iconScoutService } from './services/iconScoutService';

// Search for icons
const icons = await iconScoutService.search('home', 'icon');

// Search for 3D assets
const assets3d = await iconScoutService.search('cube', '3d');

// Search with pagination
const page2 = await iconScoutService.search('nature', 'illustration', 2);
```

### Get Asset Details

```typescript
const details = await iconScoutService.getAssetDetails('asset-uuid-here');
```

## API Response Structure

```typescript
interface IconScoutAsset {
  id: number;
  uuid: string;
  name: string;
  type: 'icon' | 'illustration' | '3d' | 'lottie';
  previewUrl: string;
  downloadUrl?: string;
  author: string;
}
```

## Error Handling

The service includes comprehensive error handling:

- Returns empty array on API failures
- Logs warnings when credentials are missing
- Logs errors with context for debugging
- Gracefully degrades when API is unavailable

## Rate Limits

IconScout API has rate limits based on your subscription plan. The integration handles rate limit errors gracefully by:

- Returning empty results on rate limit errors
- Logging errors for monitoring
- Not blocking other asset sources

## Testing

Run the test suite:

```bash
npm test services/iconScoutService.test.ts
```

## UI Components

### Source Badge

IconScout assets display with a blue "IS" badge in the Assets Panel:

```tsx
<span className="bg-blue-500/30 text-blue-300">IS</span>
```

### Type Selector

When IconScout is selected, a type selector appears with 4 options:
- 3D
- Icons
- Illustrations
- Lottie

## Integration Points

### Files Modified

- `services/iconScoutService.ts` - Core API service
- `components/panels/AssetsPanel.tsx` - UI integration
- `config/index.ts` - Configuration management
- `.env.example` - Environment variable template

### Dependencies

No additional dependencies required. Uses native `fetch` API.

## Troubleshooting

### No Results Appearing

1. Check that credentials are set in `.env.local`
2. Verify credentials are valid in IconScout dashboard
3. Check browser console for API errors
4. Ensure you're not hitting rate limits

### API Errors

Check the browser console for detailed error messages. Common issues:

- **401 Unauthorized**: Invalid credentials
- **429 Too Many Requests**: Rate limit exceeded
- **500 Server Error**: IconScout API issue

### Credentials Not Loading

1. Restart the dev server after adding credentials
2. Verify `.env.local` file is in the root directory
3. Check that variable names match exactly: `VITE_ICONSCOUT_CLIENT_ID` and `VITE_ICONSCOUT_SECRET_KEY`

## Future Enhancements

Potential improvements for the integration:

- [ ] Download high-resolution versions
- [ ] Save favorites
- [ ] Advanced filtering (style, color, orientation)
- [ ] Asset collections/categories
- [ ] Direct SVG import for icons
- [ ] Lottie animation preview
- [ ] 3D model viewer

## API Documentation

For complete API documentation, visit:
https://iconscout.com/api/docs

## Support

For issues with the IconScout API integration:

1. Check this documentation
2. Review browser console errors
3. Verify API credentials
4. Contact IconScout support for API-specific issues
