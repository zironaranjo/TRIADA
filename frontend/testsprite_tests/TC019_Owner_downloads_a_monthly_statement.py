"""TC019 — Admin exporta estados de cuenta (script fijo, no regenerar)."""
import asyncio
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:5174"
EMAIL = "ziro@zirox.io"
PASSWORD = "ziro1878@"


async def run_test():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context()
        context.set_default_timeout(30000)
        page = await context.new_page()

        await page.goto(f"{BASE}/login")
        await page.get_by_placeholder(re.compile("example", re.I)).fill(EMAIL)
        await page.locator('input[type="password"]').fill(PASSWORD)
        await page.get_by_role("button", name=re.compile(r"sign in", re.I)).click()
        await page.wait_for_url(re.compile(r"/dashboard"), timeout=30000)
        await asyncio.sleep(6)

        await page.goto(f"{BASE}/statements")
        await page.wait_for_selector('[data-testid="owner-statements-page"]', timeout=30000)
        await page.wait_for_selector('[data-testid="export-pdf"]', timeout=30000)
        await page.wait_for_selector('[data-testid="export-pdf"]', timeout=30000)
        await asyncio.sleep(4)

        await page.get_by_test_id("export-pdf").click()
        await page.wait_for_selector('[data-testid="export-success"]', timeout=15000)
        msg = await page.get_by_test_id("export-success").inner_text()
        assert "export" in msg.lower() or "pdf" in msg.lower() or "complet" in msg.lower()

        await browser.close()


asyncio.run(run_test())
