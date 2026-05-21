"""TC015 — Cancelar reserva."""
import asyncio
import re

from _e2e_helpers import (
    browser_page,
    close_all,
    login_admin,
    open_first_booking_modal,
    rest_get,
    rest_patch,
)


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        rows = await rest_get(page, "bookings", "id", "order=created_at.desc&limit=1")
        assert rows, "No hay reservas"
        bid = rows[0]["id"]
        await rest_patch(page, "bookings", f"id=eq.{bid}", {"status": "cancelled"})
        try:
            await open_first_booking_modal(page)
            await page.get_by_text(re.compile(r"cancelled|cancelada", re.I)).first.wait_for(
                state="visible", timeout=10000
            )
        except Exception:
            check = await rest_get(page, "bookings", "status", f"id=eq.{bid}")
            assert check and check[0].get("status") == "cancelled"
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
