import os
from playwright.sync_api import sync_playwright, expect

def verify_landing_uplift(page):
    # Navigate to the landing page
    page.goto("http://localhost:5174")
    page.wait_for_timeout(1000)

    # Check for removals
    hero_text = page.content()
    removals = [
        "KREATHIEF 2.0 IS LIVE",
        "WATCH DEMO",
        "DESIGNED WITH ARTIFICIAL INTELLIGENCE",
        "BACKED BY GLOBAL VISION"
    ]
    for text in removals:
        if text in hero_text:
            print(f"FAILURE: Found {text} in page content")
        else:
            print(f"SUCCESS: {text} not found")

    # Capture screenshots of key sections
    page.screenshot(path="verification/landing_hero.png")
    page.wait_for_timeout(500)

    # Scroll to features
    page.evaluate("document.getElementById('features').scrollIntoView()")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/landing_features.png")

    # Scroll to pricing
    page.evaluate("document.getElementById('pricing').scrollIntoView()")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/landing_pricing.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/video")
        page = context.new_page()
        try:
            # Note: We assume the dev server is running on 5174 as per memory
            verify_landing_uplift(page)
        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            context.close()
            browser.close()
