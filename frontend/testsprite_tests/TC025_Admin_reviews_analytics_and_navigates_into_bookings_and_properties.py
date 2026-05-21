"""TC025 — Dashboard -> bookings -> properties."""
import asyncio
import re

from _e2e_helpers import BASE_URL, browser_page, close_all, goto_path, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        await goto_path(page, "/bookings")
        await page.wait_for_url(re.compile(r"/bookings"), timeout=20000)
        await goto_path(page, "/properties")
        await page.wait_for_url(re.compile(r"/properties"), timeout=20000)
        await page.get_by_role("button", name=re.compile(r"add property|añadir", re.I)).wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
