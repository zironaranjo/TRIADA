"""TC013 — Worker tasks: expandir tarea (smoke)."""
import asyncio
import re

from _e2e_helpers import browser_page, close_all, goto_path, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        await goto_path(page, "/worker/tasks")
        expand = page.locator("button").filter(has=page.locator("svg")).first
        if await expand.count() > 0:
            await expand.click()
        await asyncio.sleep(1)
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
