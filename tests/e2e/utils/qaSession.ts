import { Page } from '@playwright/test';

export async function ensureQASession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kreathief_qa_session',
      JSON.stringify({
        id: 'qa_default_user',
        email: 'qa@kreathief.app',
        name: 'QA Tester',
        plan: 'pro',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa_tester',
      })
    );
  });
}
