"""Helpers compartidos para tests Playwright TRIADAK."""
import asyncio
import base64
import json
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta
from typing import Any

from playwright.async_api import Page, async_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:5174")
ADMIN_EMAIL = os.environ.get("E2E_EMAIL", "ziro@zirox.io")
ADMIN_PASSWORD = os.environ.get("E2E_PASSWORD", "ziro1878@")

SUPABASE_URL = os.environ.get(
    "E2E_SUPABASE_URL", "https://dknhrstvlajlktahxeqs.supabase.co"
)
SUPABASE_ANON = os.environ.get(
    "E2E_SUPABASE_ANON",
    "sb_publishable_rV7bQaTazFEffBD0riQ1UQ_JggijzBR",
)
AUTH_STORAGE_KEY = "sb-dknhrstvlajlktahxeqs-auth-token"


def _jwt_sub(token: str) -> str | None:
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload)).get("sub")
    except Exception:
        return None


async def login_admin(page: Page) -> None:
    await login_as(page, ADMIN_EMAIL, ADMIN_PASSWORD, r"/dashboard")


async def login_as(page: Page, email: str, password: str, url_pattern: str) -> None:
    await page.goto(f"{BASE_URL}/login")
    await page.get_by_placeholder(re.compile("example", re.I)).fill(email)
    await page.locator('input[type="password"]').fill(password)
    await page.get_by_role("button", name=re.compile(r"sign in", re.I)).click()
    await page.wait_for_url(re.compile(url_pattern), timeout=45000)
    await asyncio.sleep(6)


async def goto_path(page: Page, path: str) -> None:
    await page.goto(f"{BASE_URL}{path}")
    await page.wait_for_load_state("networkidle", timeout=20000)
    await asyncio.sleep(1)


async def get_access_token(page: Page) -> str | None:
    raw = await page.evaluate(
        f"""() => localStorage.getItem({json.dumps(AUTH_STORAGE_KEY)})"""
    )
    if not raw:
        return None
    try:
        return json.loads(raw).get("access_token")
    except (json.JSONDecodeError, AttributeError):
        return None


async def get_user_id(page: Page) -> str:
    token = await get_access_token(page)
    if not token:
        raise AssertionError("Sin token de sesión")
    uid = _jwt_sub(token)
    if not uid:
        raise AssertionError("No se pudo leer user id del JWT")
    return uid


def _rest_headers(token: str, prefer: str | None = None) -> dict[str, str]:
    h = {
        "apikey": SUPABASE_ANON,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if prefer:
        h["Prefer"] = prefer
    return h


async def rest_get(
    page: Page, table: str, select: str, query: str = ""
) -> list[dict[str, Any]]:
    token = await get_access_token(page)
    if not token:
        return []
    q = f"?select={urllib.parse.quote(select)}"
    if query:
        q += f"&{query}"
    url = f"{SUPABASE_URL}/rest/v1/{table}{q}"
    req = urllib.request.Request(url, headers=_rest_headers(token))
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode())
            return data if isinstance(data, list) else []
    except Exception:
        return []


async def rest_post(page: Page, table: str, body: dict) -> list[dict[str, Any]]:
    token = await get_access_token(page)
    if not token:
        raise AssertionError("Sin token de sesión")
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers=_rest_headers(token, "return=representation"),
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        out = json.loads(res.read().decode())
        return out if isinstance(out, list) else [out]


async def rest_patch(
    page: Page, table: str, match_query: str, body: dict
) -> list[dict[str, Any]]:
    token = await get_access_token(page)
    if not token:
        raise AssertionError("Sin token de sesión")
    url = f"{SUPABASE_URL}/rest/v1/{table}?{match_query}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method="PATCH",
        headers=_rest_headers(token, "return=representation"),
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        if res.status >= 400:
            raise AssertionError(f"PATCH {table} failed: {res.status}")
        raw = res.read().decode()
        if not raw:
            return []
        out = json.loads(raw)
        return out if isinstance(out, list) else [out]


async def first_guest_token(page: Page) -> str | None:
    rows = await rest_get(
        page, "bookings", "guest_token", "guest_token=not.is.null&limit=1"
    )
    if rows and rows[0].get("guest_token"):
        return rows[0]["guest_token"]
    return None


async def first_contract_token(page: Page) -> str | None:
    rows = await rest_get(
        page, "contracts", "sign_token,status", "order=created_at.desc&limit=5"
    )
    for row in rows:
        if row.get("sign_token") and row.get("status") != "signed":
            return row["sign_token"]
    for row in rows:
        if row.get("sign_token"):
            return row["sign_token"]
    return None


async def first_owner_id(page: Page) -> str | None:
    rows = await rest_get(page, "owner", "id", "order=firstName.asc&limit=1")
    return rows[0]["id"] if rows else None


async def first_property_id(page: Page, active_only: bool = True) -> str | None:
    q = "status=eq.active&limit=1" if active_only else "limit=1"
    rows = await rest_get(page, "properties", "id,name", q)
    return rows[0]["id"] if rows else None


async def ensure_active_property(page: Page, name: str | None = None) -> str:
    pid = await first_property_id(page)
    if pid:
        return pid
    oid = await first_owner_id(page)
    if not oid:
        raise AssertionError("No hay propietarios en tabla owner")
    label = name or f"E2E Property {int(time.time())}"
    created = await rest_post(
        page,
        "properties",
        {
            "owner_id": oid,
            "name": label,
            "address": "Calle E2E 1",
            "city": "Madrid",
            "country": "Spain",
            "price_per_night": 120,
            "rooms": 2,
            "max_guests": 4,
            "status": "active",
            "published": False,
        },
    )
    assert created and created[0].get("id"), "No se pudo crear propiedad"
    return created[0]["id"]


async def ensure_booking(
    page: Page,
    guest_name: str | None = None,
    guest_email: str | None = None,
    force_new: bool = False,
) -> dict[str, Any]:
    if not force_new and not guest_name:
        rows = await rest_get(page, "bookings", "id,guest_name,guest_email", "order=created_at.desc&limit=1")
        if rows:
            return rows[0]
    uid = await get_user_id(page)
    prop_id = await ensure_active_property(page)
    guest = guest_name or f"E2E Guest {int(time.time())}"
    email = guest_email or unique_email("booking")
    start, end = future_dates()
    created = await rest_post(
        page,
        "bookings",
        {
            "owner_id": uid,
            "property_id": prop_id,
            "guest_name": guest,
            "guest_email": email,
            "guest_phone": "+34600000000",
            "start_date": start,
            "end_date": end,
            "total_price": 150,
            "status": "pending",
            "platform": "DIRECT",
            "payment_status": "unpaid",
        },
    )
    assert created, "No se pudo crear reserva"
    return created[0]


async def open_first_booking_modal(page: Page) -> None:
    rows = await rest_get(page, "bookings", "guest_name", "order=created_at.desc&limit=1")
    if not rows or not rows[0].get("guest_name"):
        raise AssertionError("No hay reservas")
    guest = rows[0]["guest_name"]
    await goto_path(page, "/bookings")
    list_btn = page.get_by_role("button", name=re.compile(r"list|lista", re.I))
    if await list_btn.count() > 0:
        await list_btn.click()
        await asyncio.sleep(2)
    try:
        await page.get_by_text(guest, exact=False).first.click(timeout=8000)
    except Exception:
        pass
    await page.get_by_text(re.compile(r"change status|cambiar estado", re.I)).wait_for(
        state="visible", timeout=15000
    )


def future_dates() -> tuple[str, str]:
    start = date.today() + timedelta(days=30)
    end = start + timedelta(days=3)
    return start.isoformat(), end.isoformat()


async def browser_page(headless: bool = True):
    pw = await async_playwright().start()
    browser = await pw.chromium.launch(headless=headless)
    context = await browser.new_context(viewport={"width": 1400, "height": 900})
    context.set_default_timeout(30000)
    page = await context.new_page()
    return pw, browser, context, page


async def close_all(pw, browser, context):
    if context:
        await context.close()
    if browser:
        await browser.close()
    if pw:
        await pw.stop()


def unique_email(prefix: str = "e2e") -> str:
    return f"{prefix}.{int(time.time())}@example.com"
