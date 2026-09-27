import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'audit_screenshots');

test.describe('Comprehensive App Visual & UX Audit', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('Walk through all app views, panels, modals and capture visual audit', async ({ page }) => {
    test.setTimeout(180000);

    const issues: Array<{ category: string; description: string; severity: 'critical' | 'warning' | 'info'; screenshot?: string }> = [];
    const consoleLogs: Array<{ type: string; text: string }> = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
      }
    });

    page.on('pageerror', (err) => {
      issues.push({
        category: 'Runtime Exception',
        description: `Uncaught JS exception: ${err.message}`,
        severity: 'critical',
      });
    });

    // 1. Landing Page (Desktop)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_desktop.png'), fullPage: true });

    // 2. Landing Page (Mobile)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_landing_mobile.png'), fullPage: true });

    // Set up QA Session
    await page.addInitScript(() => {
      const session = JSON.stringify({
        id: 'audit-designer',
        name: 'Alex Rivera',
        email: 'alex@kreathief.com',
        plan: 'pro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      });
      localStorage.setItem('kreathief_guest_session', session);
      localStorage.setItem('kreathief_qa_session', session);
      localStorage.setItem('kreathief_onboarding_seen', 'true');
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
    });

    // 3. Dashboard (Desktop)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard_desktop.png'), fullPage: true });

    // Check dashboard search & filters
    const searchInput = page.getByTestId('dashboard-search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Social');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_dashboard_search.png') });
      await searchInput.fill('');
    }

    // 4. Dashboard (Mobile)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_dashboard_mobile.png'), fullPage: true });

    // 5. Open Editor
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).useStore !== undefined);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_editor_initial.png') });

    // 6. Test Sidebar Panels
    const panelsToAudit = [
      { id: 'Templates', label: 'Templates', screenshot: '07_panel_templates.png' },
      { id: 'Text', label: 'Text', screenshot: '08_panel_text.png' },
      { id: 'Elements', label: 'Elements', screenshot: '09_panel_elements.png' },
      { id: 'Media', label: 'Media', screenshot: '10_panel_media.png' },
      { id: 'Draw', label: 'Draw', screenshot: '11_panel_draw.png' },
      { id: 'Brand', label: 'Brand', screenshot: '12_panel_brand.png' },
      { id: 'Layers', label: 'Layers', screenshot: '13_panel_layers.png' },
      { id: 'Mockups', label: 'Mockups', screenshot: '14_panel_mockups.png' },
      { id: 'Motion', label: 'Motion', screenshot: '15_panel_motion.png' },
      { id: 'Accessibility', label: 'Accessibility', screenshot: '16_panel_accessibility.png' },
    ];

    for (const panel of panelsToAudit) {
      try {
        const tabBtn = page.locator(`aside button[aria-label="${panel.id}"], button[aria-label="${panel.label}"]`).first();
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await page.waitForTimeout(800);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, panel.screenshot) });
        } else {
          issues.push({
            category: 'Navigation',
            description: `Sidebar tab button for "${panel.label}" was not found or visible.`,
            severity: 'warning',
          });
        }
      } catch (err: any) {
        issues.push({
          category: 'Panel Error',
          description: `Failed opening panel ${panel.label}: ${err.message}`,
          severity: 'warning',
        });
      }
    }

    // 7. Modals: Export Modal
    try {
      const exportBtn = page.locator('button[aria-label="Export design"], [data-testid="export-btn"], button:has-text("Export")').first();
      if (await exportBtn.isVisible()) {
        await exportBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_modal_export.png') });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } catch (e: any) {
      issues.push({ category: 'Export Modal', description: e.message, severity: 'warning' });
    }

    // 8. Modals: Shortcuts Dialog
    try {
      await page.keyboard.press('?');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_modal_shortcuts.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } catch (e: any) {
      issues.push({ category: 'Shortcuts Modal', description: e.message, severity: 'info' });
    }

    // 9. Modals: Pricing / Credit Modal
    try {
      const pricingTrigger = page.locator('button:has-text("Upgrade"), button:has-text("Plan"), [data-testid="pricing-modal-btn"]').first();
      if (await pricingTrigger.isVisible()) {
        await pricingTrigger.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_modal_pricing.png') });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } catch (e: any) {}

    // 10. Mobile Editor Layout
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_editor_mobile.png') });

    // Save Findings JSON
    const report = {
      timestamp: new Date().toISOString(),
      screenshotsCaptured: fs.readdirSync(SCREENSHOT_DIR),
      consoleErrors: consoleLogs,
      detectedIssues: issues,
    };
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'audit_summary.json'), JSON.stringify(report, null, 2));
    expect(issues.filter((i) => i.severity === 'critical')).toHaveLength(0);
  });
});
