"""TC016 — Worker tasks y earnings."""
import asyncio
import re

from _e2e_helpers import browser_page, close_all, goto_path, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        await goto_path(page, "/worker/tasks")
        await page.wait_for_url(re.compile(r"/worker/tasks"), timeout=20000)
        await goto_path(page, "/worker/earnings")
        await page.wait_for_url(re.compile(r"/worker/earnings"), timeout=20000)
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
