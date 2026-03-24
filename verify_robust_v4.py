import os
import asyncio
from playwright.async_api import async_playwright

async def verify_drawing_robust_v4():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        print("Navigating to http://localhost:5174/...")
        await page.goto("http://localhost:5174/")

        print("Injecting QA session...")
        await page.evaluate("""() => {
            localStorage.setItem('kreathief_qa_session', JSON.stringify({
                id: 'qa-user-id',
                email: 'test@example.com',
                name: 'Test User',
                plan: 'pro'
            }));
            localStorage.setItem('kreathief_onboarding_seen', 'true');
        }""")

        print("Navigating to /editor...")
        await page.goto("http://localhost:5174/editor")

        # Wait for the main UI to appear
        print("Waiting for editor UI...")
        try:
            await page.wait_for_selector("#export-btn", timeout=20000)
            print("Editor UI detected.")
        except Exception as e:
            print(f"Failed to detect Editor UI: {e}")
            await page.screenshot(path="v_error_no_ui.png")
            await browser.close()
            return

        # 1. Verify separation in Toolbar
        # We'll use aria-label since title is only on hover/tooltip in the DOM sometimes
        brush_btn = page.locator("button[aria-label*='Brush Tool']")
        pen_btn = page.locator("button[aria-label*='Vector Pen']")

        if await brush_btn.count() > 0 and await pen_btn.count() > 0:
            print("SUCCESS: Both Brush and Pen tools are visible in the toolbar.")
        else:
            print("FAILURE: Toolbar tools not found or not separated.")
            await page.screenshot(path="v_error_toolbar.png")
            # Log all buttons for debugging
            buttons = await page.locator("button").all_inner_texts()
            # print(f"Visible buttons: {buttons}")

        # 2. Test clicking Brush Tool
        print("Clicking Brush Tool...")
        await brush_btn.first.click()
        await asyncio.sleep(2)

        # Verify Draw Panel is active
        draw_header = page.locator("h3:has-text('Drawing Tools')")
        if await draw_header.is_visible():
            print("SUCCESS: Clicking Brush Tool opened the Drawing Tools panel.")
        else:
            print("FAILURE: Drawing Tools panel did not open.")
            await page.screenshot(path="v_error_draw_panel.png")

        # 3. Verify Categories in Draw Panel
        creative_brushes = page.locator("text=Creative Brushes")
        vector_tools = page.locator("text=Vector Tools")

        if await creative_brushes.is_visible() and await vector_tools.is_visible():
            print("SUCCESS: Categories 'Creative Brushes' and 'Vector Tools' are present in Draw Panel.")
        else:
            print("FAILURE: Categories missing in Draw Panel.")
            await page.screenshot(path="v_error_categories.png")

        # 4. Final Screenshots
        await page.screenshot(path="v_final_brush_active.png")

        print("Clicking Vector Pen in toolbar...")
        await pen_btn.first.click()
        await asyncio.sleep(1)
        await page.screenshot(path="v_final_pen_active.png")

        print("Verification complete.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_drawing_robust_v4())
