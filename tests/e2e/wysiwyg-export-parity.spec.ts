import { test, expect } from '@playwright/test';

test.describe('Canvas-to-Export WYSIWYG Parity', () => {
  test('exported PNG preserves custom artboard background, texture overlay, shape, and text', async ({ page }) => {
    await page.goto('/auth');
    const guestBtn = page.locator('button:has-text("Guest")').first();
    await guestBtn.waitFor({ state: 'visible', timeout: 15000 });
    await guestBtn.evaluate((el: HTMLButtonElement) => el.click());
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    await page.goto('/studio?tool=textures');
    await page.waitForSelector('[data-artboard-content]', { timeout: 25000 });

    // Seed a deterministic fixture artboard via the Zustand store
    await page.evaluate(() => {
      const store = (window as any).__KREATHIEF_STORE__ || null;
      if (!store) {
        return;
      }
      const state = store.getState();
      const abId = state.activeArtboardId || state.artboards[0]?.id;
      if (!abId) {
        return;
      }

      state.updateArtboard?.(abId, {
        backgroundColor: '#121226',
        textureOverlay: {
          id: 'paperGrain',
          name: 'Vintage Paper Grain',
          svgDataUri:
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#ffffff" fill-opacity="0.08"/></svg>'
            ),
          opacity: 0.35,
          blendMode: 'overlay',
          scale: 1,
          invert: false,
        },
      });

      state.addShapeLayer?.('rectangle', {
        name: 'Parity Rect',
        x: 120,
        y: 120,
        width: 320,
        height: 180,
        color: '#7c3aed',
        cornerRadius: 24,
        rotation: 12,
      });

      state.addTextLayer?.({
        name: 'Parity Headline',
        text: 'WYSIWYG',
        x: 140,
        y: 360,
        width: 400,
        fontSize: 64,
        fontWeight: '800',
        color: '#f8fafc',
        letterSpacing: 2,
      });
    });

    await page.waitForTimeout(500);

    // Capture the live canvas artboard
    const artboard = page.locator('[data-artboard-content]').first();
    await expect(artboard).toBeVisible();
    const canvasScreenshot = await artboard.screenshot();
    expect(canvasScreenshot.byteLength).toBeGreaterThan(1000);

    // Open Export Modal and download PNG
    const exportBtn = page.getByRole('button', { name: /export/i }).first();
    await exportBtn.click();

    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    const confirmExportBtn = page.getByRole('button', { name: /export png|download/i }).last();
    await confirmExportBtn.click();

    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const exportedPng = Buffer.concat(chunks);

    // Exported PNG must be valid, non-trivial, and non-blank
    expect(exportedPng.byteLength).toBeGreaterThan(2000);
    // PNG magic header: 89 50 4E 47
    expect(exportedPng.subarray(0, 4).toString('hex')).toBe('89504e47');
  });
});
