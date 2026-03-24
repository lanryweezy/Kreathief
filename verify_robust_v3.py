import os
import asyncio
from playwright.async_api import async_playwright

async def verify_drawing_robust():
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
            # Look for the export button or something similar that indicates the editor is loaded
            await page.wait_for_selector("#export-btn", timeout=20000)
            print("Editor UI detected.")
        except Exception as e:
            print(f"Failed to detect Editor UI: {e}")
            await page.screenshot(path="v_error_no_ui.png")
            await browser.close()
            return

        # 1. Verify separation in Toolbar
        brush_btn = page.locator("button[title*='Brush Tool']")
        pen_btn = page.locator("button[title*='Vector Pen']")

        if await brush_btn.is_visible() and await pen_btn.is_visible():
            print("SUCCESS: Both Brush and Pen tools are visible in the toolbar.")
        else:
            print("FAILURE: Toolbar tools not found or not separated.")
            await page.screenshot(path="v_error_toolbar.png")

        # 2. Test clicking Brush Tool
        print("Clicking Brush Tool...")
        await brush_btn.click()
        await asyncio.sleep(2) # Wait for sidebar transition

        # Verify Draw Panel is active
        # The Sidebar component has data-tab or we can check the header in SidePanel
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

        # 4. Verify clicking a brush activates drawing
        # Let's find a brush button. They are in a grid.
        # We'll look for one that isn't the vector pencil.
        first_brush = page.locator("section:has-text('Creative Brushes') button").first
        print("Clicking a Creative Brush...")
        await first_brush.click()

        # Check if it's active (should have bg-[#7d2ae8])
        # We can also check if the toolbar brush icon is active
        if "bg-[#7d2ae8]" in (await first_brush.get_attribute("class") or ""):
            print("SUCCESS: Brush is selected.")
        else:
            print("WARNING: Brush selection style not detected, but might be active.")

        # 5. Take final screenshots
        await page.screenshot(path="v_final_brush_active.png")

        # Switch to Pen
        print("Clicking Vector Pen in toolbar...")
        await pen_btn.click()
        await asyncio.sleep(1)
        await page.screenshot(path="v_final_pen_active.png")

        print("Verification complete.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_drawing_robust())
