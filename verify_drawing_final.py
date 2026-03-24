import os
import asyncio
from playwright.async_api import async_playwright

async def verify_drawing_separation():
    async with async_playwright() as p:
        # Use a consistent viewport
        browser = await p.chromium.launch(headless=True)

        # Create a context with storage state if needed, but here we'll inject it
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Go to the app
        print("Navigating to http://localhost:5174/...")
        await page.goto("http://localhost:5174/")

        # Inject QA session to bypass login
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

        # Navigate to editor
        print("Navigating to /editor...")
        await page.goto("http://localhost:5174/editor")

        # Wait for editor to load
        try:
            await page.wait_for_selector("canvas", timeout=15000)
            print("Editor loaded.")
        except Exception as e:
            print(f"Failed to load editor: {e}")
            await page.screenshot(path="debug_editor_load_failed.png")
            await browser.close()
            return

        # 1. Verify Toolbar Buttons
        print("Checking toolbar for Brush and Pen tools...")
        # Check if both exist
        brush_tool = page.locator("button:has(svg.lucide-brush)")
        pen_tool = page.locator("button:has(svg.lucide-pen)")

        brush_count = await brush_tool.count()
        pen_count = await pen_tool.count()

        print(f"Found {brush_count} Brush tools and {pen_count} Pen tools in toolbar.")

        if brush_count == 0 or pen_count == 0:
            print("Error: Missing toolbar buttons.")
            await page.screenshot(path="debug_toolbar_missing.png")

        # 2. Click Brush Tool and verify Draw Panel opens
        print("Clicking Brush Tool...")
        await brush_tool.first.click()
        await asyncio.sleep(1)

        # Verify Draw Panel is active
        draw_panel_header = page.locator("h3:has-text('Drawing Tools')")
        if await draw_panel_header.is_visible():
            print("Draw Panel successfully opened via Brush Tool.")
        else:
            print("Error: Draw Panel did not open.")
            await page.screenshot(path="debug_draw_panel_not_open.png")

        # 3. Verify Categories in Draw Panel
        print("Checking categories in Draw Panel...")
        creative_brushes = page.locator("text=Creative Brushes")
        vector_tools = page.locator("text=Vector Tools")

        if await creative_brushes.is_visible() and await vector_tools.is_visible():
            print("Categories 'Creative Brushes' and 'Vector Tools' are present.")
        else:
            print("Error: Categories missing in Draw Panel.")
            await page.screenshot(path="debug_categories_missing.png")

        # 4. Final Screenshot
        await page.screenshot(path="final_verification.png")
        print("Verification complete. Screenshot saved as final_verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_drawing_separation())
