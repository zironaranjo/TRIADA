"""TC029 — Asignar tarea a personal (REST)."""
import asyncio
import time
from datetime import date

from _e2e_helpers import (
    browser_page,
    close_all,
    ensure_active_property,
    goto_path,
    login_admin,
    rest_post,
    unique_email,
)


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        staff = await rest_post(
            page,
            "staff_members",
            {
                "full_name": f"E2E Staff Task {int(time.time())}",
                "email": unique_email("stafftask"),
                "contract_type": "freelance",
                "salary": 0,
                "salary_type": "per_service",
                "status": "active",
            },
        )
        assert staff and staff[0].get("id")
        mid = staff[0]["id"]
        prop_id = await ensure_active_property(page)
        task = await rest_post(
            page,
            "staff_tasks",
            {
                "staff_member_id": mid,
                "property_id": prop_id,
                "task_type": "cleaning",
                "scheduled_date": date.today().isoformat(),
                "status": "pending",
                "cost": 50,
                "checklist": [{"item": "Limpieza salon", "completed": False}],
            },
        )
        assert task and task[0].get("staff_member_id") == mid
        await goto_path(page, "/staff")
        assert "/staff" in page.url
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
