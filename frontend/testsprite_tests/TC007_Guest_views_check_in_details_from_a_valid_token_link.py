"""TC007 — Portal huésped con token real."""
import asyncio
import re

from _e2e_helpers import BASE_URL, browser_page, close_all, first_guest_token, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        token = await first_guest_token(page)
        assert token, "No hay guest_token en reservas"
        await page.goto(f"{BASE_URL}/guest/{token}")
        await page.get_by_text(re.compile(r"wifi|check|instruc|welcome|bienven", re.I)).first.wait_for(
            state="visible", timeout=30000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
