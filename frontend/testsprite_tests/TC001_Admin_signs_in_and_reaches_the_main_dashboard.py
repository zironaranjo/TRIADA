"""TC001 — Admin login y dashboard."""
import asyncio
import re

from _e2e_helpers import BASE_URL, browser_page, close_all, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        assert "/dashboard" in page.url
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
