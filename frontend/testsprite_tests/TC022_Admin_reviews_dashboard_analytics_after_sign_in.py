"""TC022 — Dashboard con KPIs visibles."""
import asyncio
import re

from _e2e_helpers import BASE_URL, browser_page, close_all, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        assert "/dashboard" in page.url
        await page.locator(".recharts-responsive-container").first.wait_for(
            state="visible", timeout=30000
        )
        await page.get_by_text(re.compile(r"revenue|ingresos|properties|propiedades", re.I)).first.wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
