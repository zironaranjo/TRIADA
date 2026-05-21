"""TC018 — Abrir flujo de alta de propiedad (modal operativo)."""
import asyncio
import re

from _e2e_helpers import browser_page, close_all, goto_path, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        await goto_path(page, "/properties")
        await page.get_by_role("button", name=re.compile(r"add property|añadir propiedad", re.I)).wait_for(
            state="visible", timeout=20000
        )
        await page.get_by_role("button", name=re.compile(r"add property|añadir propiedad", re.I)).click()
        await page.get_by_role("heading", name=re.compile(r"add new property|nueva propiedad|añadir", re.I)).wait_for(
            state="visible", timeout=15000
        )
        assert await page.locator("form input[type='text']").count() >= 1
        assert await page.locator("form input[type='number']").count() >= 1
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
