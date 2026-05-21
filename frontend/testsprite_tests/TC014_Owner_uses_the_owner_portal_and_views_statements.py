"""TC014 — Portal propietario: liquidaciones."""
import asyncio
import re

from _e2e_helpers import browser_page, close_all, goto_path, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        await goto_path(page, "/portal/statements")
        await page.wait_for_url(re.compile(r"/portal/statements"), timeout=20000)
        await page.get_by_text(re.compile(r"statement|liquidaci|month|mes", re.I)).first.wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
