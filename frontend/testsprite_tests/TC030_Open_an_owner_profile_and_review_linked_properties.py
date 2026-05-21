"""TC030 — Perfil propietario con propiedades."""
import asyncio
import re

from _e2e_helpers import BASE_URL, browser_page, close_all, first_owner_id, goto_path, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        owner_id = await first_owner_id(page)
        assert owner_id, "No hay propietarios en la base de datos"
        await goto_path(page, f"/owners/{owner_id}")
        await page.wait_for_url(re.compile(rf"/owners/{owner_id}"), timeout=20000)
        await page.get_by_text(re.compile(r"properties|propiedades", re.I)).first.wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
