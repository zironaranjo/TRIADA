"""TC027 — Admin crea propietario (script fijo)."""
import asyncio
import re
import time
from playwright.async_api import async_playwright

BASE = "http://localhost:5174"
EMAIL = "ziro@zirox.io"
PASSWORD = "ziro1878@"


async def run_test():
    unique_email = f"e2e.owner.{int(time.time())}@example.com"

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

        await page.goto(f"{BASE}/owners")
        await page.wait_for_selector('[data-testid="owners-panel"]', timeout=30000)
        await page.wait_for_selector('[data-testid="owner-row"]', timeout=45000)

        await page.get_by_role("button", name=re.compile(r"add owner|añadir|agregar", re.I)).click()
        await page.locator('input[name="firstName"]').fill("E2E")
        await page.locator('input[name="lastName"]').fill("Owner")
        await page.locator('input[name="email"]').fill(unique_email)
        await page.locator('input[name="phone"]').fill("+34600000000")
        await page.get_by_test_id("create-owner-submit").click()
        await page.wait_for_timeout(4000)
        await page.reload(wait_until="networkidle")
        await page.wait_for_selector('[data-testid="owner-row"]', timeout=45000)
        await page.wait_for_selector(f'text={unique_email}', timeout=30000)
        assert await page.get_by_text(unique_email).count() >= 1

        await browser.close()


asyncio.run(run_test())
