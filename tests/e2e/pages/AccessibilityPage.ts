import { Page, Locator, expect } from '@playwright/test';

export class AccessibilityPage {
  readonly page: Page;
  readonly skipLink: Locator;
  readonly mainContent: Locator;
  readonly landmarks: Locator;
  readonly headings: Locator;
  readonly buttons: Locator;
  readonly links: Locator;
  readonly images: Locator;
  readonly forms: Locator;
  readonly colorContrast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.skipLink = page.locator('.skip-link, a[href="#main-content"], a[aria-label="Skip to content"]');
    this.mainContent = page.locator('main, [role="main"], #main-content');
    this.landmarks = page.locator('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]');
    this.headings = page.locator('h1, h2, h3, h4, h5, h6');
    this.buttons = page.locator('button, [role="button"]');
    this.links = page.locator('a[href]');
    this.images = page.locator('img');
    this.forms = page.locator('form, input, select, textarea');
    this.colorContrast = page.locator('*');
  }

  async checkSkipLink() {
    const skipLink = this.skipLink.first();
    const isVisible = await skipLink.isVisible();

    if (isVisible) {
      // Skip link should be focusable
      await skipLink.focus();
      await expect(skipLink).toBeFocused();

      // Click and verify it navigates
      await skipLink.click();
      const mainContent = this.mainContent.first();
      await expect(mainContent).toBeInViewport();
    }

    return isVisible;
  }

  async checkLandmarks() {
    const landmarkCount = await this.landmarks.count();
    return landmarkCount;
  }

  async checkHeadingHierarchy() {
    const headings = this.headings;
    const count = await headings.count();

    const violations: string[] = [];
    let previousLevel = 0;

    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));

      // Check for skipped levels (e.g., h1 to h3)
      if (level > previousLevel + 1 && previousLevel !== 0) {
        const text = await heading.textContent();
        violations.push(`Skipped heading level: ${tagName} - "${text?.trim()}"`);
      }

      previousLevel = level;
    }

    return violations;
  }

  async checkButtonAccessibility() {
    const buttons = this.buttons;
    const count = await buttons.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      // Check if button has accessible name
      const hasText = await button.evaluate((el) => el.textContent?.trim().length > 0);
      const hasAriaLabel = await button.evaluate((el) => el.hasAttribute('aria-label'));
      const hasTitle = await button.evaluate((el) => el.hasAttribute('title'));

      if (!hasText && !hasAriaLabel && !hasTitle) {
        violations.push(`Button ${i + 1} has no accessible name`);
      }

      // Check if button is keyboard accessible
      await button.focus();
      const isFocused = await button.evaluate((el) => document.activeElement === el);
      if (!isFocused) {
        violations.push(`Button ${i + 1} is not keyboard accessible`);
      }
    }

    return violations;
  }

  async checkLinkAccessibility() {
    const links = this.links;
    const count = await links.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);

      // Check for meaningful link text
      const text = (await link.textContent()) || '';
      const hasAriaLabel = await link.evaluate((el) => el.hasAttribute('aria-label'));

      const isGeneric = ['click here', 'read more', 'learn more', 'more'].includes(text.toLowerCase().trim());

      if (isGeneric && !hasAriaLabel) {
        violations.push(`Link ${i + 1} has generic text: "${text.trim()}"`);
      }

      // Check for empty links
      if (!text.trim() && !hasAriaLabel) {
        violations.push(`Link ${i + 1} has no accessible text`);
      }
    }

    return violations;
  }

  async checkImageAltText() {
    const images = this.images;
    const count = await images.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      const role = await image.getAttribute('role');

      // Decorative images should have alt="" or role="presentation"
      if (alt === null && role !== 'presentation') {
        violations.push(`Image ${i + 1} missing alt attribute`);
      }

      // Check for meaningless alt text
      if (alt && ['image', 'photo', 'picture', 'img'].includes(alt.toLowerCase())) {
        violations.push(`Image ${i + 1} has meaningless alt text: "${alt}"`);
      }
    }

    return violations;
  }

  async checkFormAccessibility() {
    const forms = this.forms;
    const count = await forms.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const form = forms.nth(i);
      const tagName = await form.evaluate((el) => el.tagName.toLowerCase());

      if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
        // Check for label
        const id = await form.getAttribute('id');
        const ariaLabel = await form.getAttribute('aria-label');
        const ariaLabelledby = await form.getAttribute('aria-labelledby');

        let hasLabel = false;
        if (id) {
          const label = this.page.locator(`label[for="${id}"]`);
          hasLabel = (await label.count()) > 0;
        }

        if (!hasLabel && !ariaLabel && !ariaLabelledby) {
          violations.push(`Form element ${i + 1} (${tagName}) has no label`);
        }

        // Check for error messages
        const ariaInvalid = await form.getAttribute('aria-invalid');
        if (ariaInvalid === 'true') {
          const ariaDescribedby = await form.getAttribute('aria-describedby');
          if (!ariaDescribedby) {
            violations.push(`Invalid form element ${i + 1} has no error description`);
          }
        }
      }
    }

    return violations;
  }

  async checkColorContrast() {
    // Sample check for common elements
    const elements = this.page.locator('button, a, .text-layer, h1, h2, h3');
    const count = await elements.count();
    const violations: string[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      // Check first 10 elements
      const element = elements.nth(i);
      const isVisible = await element.isVisible();

      if (isVisible) {
        const contrastRatio = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bgColor = style.backgroundColor;

          // Simple contrast check (this is a simplified version)
          // In production, use a proper contrast ratio library
          if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
            return null;
          }

          return { color, bgColor };
        });

        if (contrastRatio && !contrastRatio.color.includes('255') && !contrastRatio.color.includes('fff')) {
          // Potential low contrast - flag for manual review
          violations.push(`Element ${i + 1} may have contrast issues: ${contrastRatio.color}`);
        }
      }
    }

    return violations;
  }

  async checkKeyboardNavigation() {
    const violations: string[] = [];

    // Tab through all focusable elements
    await this.page.keyboard.press('Tab');
    let tabCount = 0;
    const maxTabs = 50; // Prevent infinite loop

    while (tabCount < maxTabs) {
      const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);

      if (!focusedElement || focusedElement === 'BODY') {
        break;
      }

      tabCount++;
      await this.page.keyboard.press('Tab');
    }

    if (tabCount === 0) {
      violations.push('No focusable elements found');
    }

    return violations;
  }

  async checkFocusIndicators() {
    const violations: string[] = [];

    // Check if focus styles are defined
    const hasFocusStyles = await this.page.evaluate(() => {
      const styleSheets = document.styleSheets;
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const rules = styleSheets[i].cssRules;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j] as CSSStyleRule;
            if (rule.selectorText?.includes(':focus')) {
              return true;
            }
          }
        } catch (e) {
          // Cross-origin stylesheet
        }
      }
      return false;
    });

    if (!hasFocusStyles) {
      violations.push('No focus styles detected');
    }

    return violations;
  }

  async runFullAccessibilityAudit() {
    const results = {
      skipLink: await this.checkSkipLink(),
      landmarks: await this.checkLandmarks(),
      headingHierarchy: await this.checkHeadingHierarchy(),
      buttonAccessibility: await this.checkButtonAccessibility(),
      linkAccessibility: await this.checkLinkAccessibility(),
      imageAltText: await this.checkImageAltText(),
      formAccessibility: await this.checkFormAccessibility(),
      colorContrast: await this.checkColorContrast(),
      keyboardNavigation: await this.checkKeyboardNavigation(),
      focusIndicators: await this.checkFocusIndicators(),
    };

    return results;
  }
}
