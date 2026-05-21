"""TC006 — Admin abre reservas y ve listado."""
import asyncio
import re

from _e2e_helpers import browser_page, close_all, goto_path, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        await goto_path(page, "/bookings")
        await page.get_by_role("heading", name=re.compile(r"bookings|reservas", re.I)).wait_for(
            state="visible", timeout=20000
        )
        await page.get_by_role("button", name=re.compile(r"new booking|nueva reserva", re.I)).wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
