"""TC003 — Firmar contrato público (o ver ya firmado)."""
import asyncio
import re

from _e2e_helpers import BASE_URL, browser_page, close_all, first_contract_token, login_admin


async def run_test():
    pw, browser, context, page = await browser_page()
    try:
        await login_admin(page)
        token = await first_contract_token(page)
        assert token, "No hay contratos con sign_token"
        await page.goto(f"{BASE_URL}/contract/{token}")
        await asyncio.sleep(2)
        success = page.locator(".bg-emerald-900\\/20, [class*='emerald']")
        if await success.count() > 0:
            return
        invalid = page.get_by_text(re.compile(r"invalid|inválido|not found", re.I))
        if await invalid.count() > 0:
            raise AssertionError("Token de contrato inválido")
        await page.locator('input[type="text"]').first.fill("E2E Guest Signer")
        await page.locator('input[type="checkbox"]').first.check()
        await page.locator("button.bg-violet-600").click()
        await page.get_by_text(re.compile(r"success|signed|firmado", re.I)).first.wait_for(
            state="visible", timeout=20000
        )
    finally:
        await close_all(pw, browser, context)


asyncio.run(run_test())
