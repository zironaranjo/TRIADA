"""TC028 — Admin abre sección Propiedades."""
import asyncio
import re

from _e2e_helpers import BASE_URL, browser_page, close_all, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        await page.goto(f"{BASE_URL}/properties")
        await page.wait_for_url(re.compile(r"/properties"), timeout=30000)
        await page.get_by_role("button", name=re.compile(r"añadir|add property|agregar", re.I)).wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
