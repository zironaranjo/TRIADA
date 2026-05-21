"""TC021 — Editar huésped de reserva (REST)."""
import asyncio
import re
import time

from _e2e_helpers import (
    browser_page,
    close_all,
    ensure_booking,
    login_admin,
    rest_get,
    rest_patch,
)


async def run_test():
    new_name = f"E2E Edited {int(time.time())}"
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        booking = await ensure_booking(page)
        bid = booking["id"]
        await rest_patch(page, "bookings", f"id=eq.{bid}", {"guest_name": new_name})
        rows = await rest_get(page, "bookings", "guest_name", f"id=eq.{bid}")
        assert rows and rows[0].get("guest_name") == new_name
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
