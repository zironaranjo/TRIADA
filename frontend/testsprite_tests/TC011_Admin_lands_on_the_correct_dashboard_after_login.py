"""TC011 — Admin aterriza en dashboard tras login."""
import asyncio

from _e2e_helpers import browser_page, close_all, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        assert page.url.endswith("/dashboard") or "/dashboard" in page.url
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
