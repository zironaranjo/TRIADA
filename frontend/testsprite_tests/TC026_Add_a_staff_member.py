"""TC026 — Añadir miembro de personal (REST)."""
import asyncio
import time

from _e2e_helpers import (
    browser_page,
    close_all,
    goto_path,
    login_admin,
    rest_post,
    unique_email,
)


async def run_test():
    name = f"E2E Staff {int(time.time())}"
    email = unique_email("staff")
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        created = await rest_post(
            page,
            "staff_members",
            {
                "full_name": name,
                "email": email,
                "phone": "+34600000001",
                "contract_type": "freelance",
                "salary": 0,
                "salary_type": "per_service",
                "status": "active",
            },
        )
        assert created and created[0].get("full_name") == name
        await goto_path(page, "/staff")
        assert "/staff" in page.url
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
