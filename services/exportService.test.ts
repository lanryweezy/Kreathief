import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportDesignToImage } from './exportService';

describe('exportDesignToImage', () => {
    const mockParams = {
        width: 100,
        height: 100,
        backgroundColor: '#ffffff',
        backgroundImageUrl: null,
        shapes: [],
        texts: [],
        images: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fall back to main thread if Worker is not functional', async () => {
        // In our setup, Worker is mocked but doesn't do much.
        // We can test if the function returns a string (data URL)
        const result = await exportDesignToImage(
            mockParams.width,
            mockParams.height,
            mockParams.backgroundColor,
            mockParams.backgroundImageUrl,
            [] // Combined layers
        );
        expect(result).toContain('data:image/png;base64');
    });

    it('should handle different formats', async () => {
        const resultJpeg = await exportDesignToImage(
            100, 100, '#ffffff', null, [], undefined, 'jpeg'
        );
        expect(resultJpeg).toContain('data:image/jpeg;base64');
    });
});
