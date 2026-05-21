"""TC020 — Finanzas: KPIs y modal gasto."""
import asyncio
import re

from _e2e_helpers import browser_page, close_all, goto_path, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        await goto_path(page, "/accounting")
        await page.get_by_text(re.compile(r"revenue|ingresos|expense|gasto", re.I)).first.wait_for(
            state="visible", timeout=30000
        )
        add_btn = page.locator("button").filter(
            has=page.locator("svg")
        ).filter(has_text=re.compile(r"add expense|añadir gasto", re.I))
        if await add_btn.count() == 0:
            await page.get_by_role("button", name=re.compile(r"add expense|añadir gasto", re.I)).click()
        else:
            await add_btn.first.click()
        await page.get_by_role("heading", name=re.compile(r"new expense|nuevo gasto|añadir gasto", re.I)).wait_for(
            state="visible", timeout=15000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
