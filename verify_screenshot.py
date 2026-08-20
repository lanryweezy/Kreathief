import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            record_video_dir='/home/jules/verification/videos',
            viewport={'width': 1280, 'height': 800}
        )
        page = await context.new_page()

        print("Navigating to setup mock auth...")
        await page.goto("http://localhost:5173/")
        await page.wait_for_load_state('networkidle')

        await page.evaluate("""() => {
            window.localStorage.setItem('kreathief_guest_session', JSON.stringify({
                id: 'guest',
                email: 'guest@example.com',
                user_metadata: { name: 'Guest' }
            }));
        }""")

        print("Navigating directly to /editor as guest...")
        await page.goto("http://localhost:5173/editor")
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(2000)

        print("Clicking Skip to dismiss modal if exists...")
        skip = page.get_by_text("Skip")
        if await skip.count() > 0:
            await skip.first.click(force=True)
            await page.wait_for_timeout(1000)

        # Let's add some layers so we can search them
        print("Adding a text layer by pressing 't' and clicking canvas...")
        await page.keyboard.press('t')
        await page.mouse.click(600, 400)
        await page.wait_for_timeout(1000)

        print("Adding another layer...")
        await page.keyboard.press('r') # Rectangle?
        await page.mouse.click(650, 450)
        await page.wait_for_timeout(1000)

        print("Opening layers panel by pressing 'l'...")
        await page.keyboard.press('l')
        await page.wait_for_timeout(1000)

        print("Locating search input...")
        # Since fuzzy search was added, let's type a typo: e.g. "txet" for text or "rctngle"
        # Search input is likely inside the Layers panel.
        search_input = page.locator('input[placeholder*="Search layers"]')
        if await search_input.count() > 0:
            print("Typing typo 'txe' into search...")
            await search_input.first.fill('txe')
            await page.wait_for_timeout(1000)
        else:
            print("Could not find search input. Falling back to screenshotting anyway.")

        await page.screenshot(path="/home/jules/verification/screenshots/editor_layers_search.png")

        print("Verification complete.")
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
