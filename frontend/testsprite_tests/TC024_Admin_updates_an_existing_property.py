"""TC024 — Propiedad activa en API + perfil propietario."""
import asyncio
import re

from _e2e_helpers import (
    browser_page,
    close_all,
    first_owner_id,
    goto_path,
    login_admin,
    rest_get,
)


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        props = await rest_get(page, "properties", "id,name", "status=eq.active&limit=1")
        assert props and props[0].get("name"), "No hay propiedades activas en API"
        owner_id = await first_owner_id(page)
        assert owner_id, "No hay propietarios"
        await goto_path(page, f"/owners/{owner_id}")
        await page.wait_for_url(re.compile(rf"/owners/{owner_id}"), timeout=20000)
        await page.get_by_text(re.compile(r"properties|propiedades", re.I)).first.wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
