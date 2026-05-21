"""TC002 — Crear reserva (REST) y verificar en API."""
import asyncio
import re
import time

from _e2e_helpers import (
    browser_page,
    close_all,
    ensure_booking,
    goto_path,
    login_admin,
    rest_get,
    unique_email,
)


async def run_test():
    guest = f"E2E Guest {int(time.time())}"
    email = unique_email("booking")

    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        created = await ensure_booking(page, guest_name=guest, guest_email=email, force_new=True)
        bid = created.get("id")
        rows = await rest_get(page, "bookings", "id,guest_name", f"id=eq.{bid}")
        assert rows and rows[0].get("guest_name") == guest
        await goto_path(page, "/bookings")
        await page.get_by_role("heading", name=re.compile(r"bookings|reservas", re.I)).wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
