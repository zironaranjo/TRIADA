"""TC008 — Generar contrato desde reserva (REST)."""
import asyncio
import re
import time

from _e2e_helpers import (
    browser_page,
    close_all,
    ensure_booking,
    get_user_id,
    goto_path,
    login_admin,
    rest_get,
    rest_post,
)


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        booking = await ensure_booking(page)
        uid = await get_user_id(page)
        title = f"E2E Contract {int(time.time())}"
        created = await rest_post(
            page,
            "contracts",
            {
                "booking_id": booking["id"],
                "user_id": uid,
                "title": title,
                "content": f"Contrato E2E para {booking.get('guest_name', 'guest')}",
                "status": "draft",
                "guest_name": booking.get("guest_name"),
                "guest_email": booking.get("guest_email"),
            },
        )
        assert created and created[0].get("id")
        cid = created[0]["id"]
        rows = await rest_get(page, "contracts", "id,title", f"id=eq.{cid}")
        assert rows and title in (rows[0].get("title") or "")
        await goto_path(page, "/contracts")
        await page.get_by_role("heading", name=re.compile(r"contract|contrato", re.I)).wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
