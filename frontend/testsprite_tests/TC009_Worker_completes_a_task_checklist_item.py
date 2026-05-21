"""TC009 — Marcar item checklist en tarea worker."""
import asyncio
import re

from _e2e_helpers import browser_page, close_all, goto_path, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        await goto_path(page, "/worker/tasks")
        checkbox = page.locator('input[type="checkbox"]').first
        if await checkbox.count() == 0:
            return
        await checkbox.click()
        await asyncio.sleep(1)
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
