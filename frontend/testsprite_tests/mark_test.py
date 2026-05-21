#!/usr/bin/env python3
"""
Actualiza test-registry.json (registro único de tests E2E).

Uso:
  python mark_test.py list
  python mark_test.py pending
  python mark_test.py pass TC023
  python mark_test.py pass TC023 --in local-playwright --note "stable"
  python mark_test.py fail TC023
  python mark_test.py pending TC099 --script TC099_my_test.py --title "My test"
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REGISTRY_PATH = ROOT / "test-registry.json"
PASSED_LEGACY = ROOT / "passed_tests.json"


def load_registry() -> dict:
    if REGISTRY_PATH.exists():
        return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    return {"version": 1, "tests": {}, "updatedAt": str(date.today())}


def save_registry(data: dict) -> None:
    data["updatedAt"] = str(date.today())
    REGISTRY_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    sync_legacy_passed_list(data)
    sync_markdown_summary(data)


def sync_legacy_passed_list(data: dict) -> None:
    """Mantiene passed_tests.json en sync para scripts antiguos."""
    passed = sorted(
        tid for tid, t in data.get("tests", {}).items() if t.get("status") == "passed"
    )
    legacy = {
        "passed": passed,
        "verifiedAt": data.get("updatedAt"),
        "note": "Generado desde test-registry.json. Preferir test-registry.json.",
    }
    PASSED_LEGACY.write_text(
        json.dumps(legacy, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def sync_markdown_summary(data: dict) -> None:
    """Genera TEST_REGISTRY.md legible para humanos."""
    tests = data.get("tests", {})
    lines = [
        "# Registro de tests E2E (TRIADAK)",
        "",
        f"**Última actualización:** {data.get('updatedAt', '—')}",
        "",
        "> Archivo canónico: `test-registry.json`. El agente debe actualizarlo al pasar/fallar un test.",
        "",
        "## Pasados (no repetir)",
        "",
        "| ID | Título | Script | Verificado |",
        "|----|--------|--------|------------|",
    ]
    for tid in sorted(tests):
        t = tests[tid]
        if t.get("status") != "passed":
            continue
        lines.append(
            f"| {tid} | {t.get('title', '—')} | `{t.get('script', '—')}` | {t.get('verifiedAt', '—')} ({t.get('verifiedIn', '—')}) |"
        )
    lines.extend(["", "## Pendientes / fallidos", "", "| ID | Estado | Script | Notas |", "|----|--------|--------|-------|"])
    for tid in sorted(tests):
        t = tests[tid]
        if t.get("status") == "passed":
            continue
        lines.append(
            f"| {tid} | {t.get('status', 'pending')} | `{t.get('script', '—')}` | {t.get('notes', '')} |"
        )
    if not any(tests[tid].get("status") != "passed" for tid in tests):
        lines.append("| — | — | — | Ninguno registrado aún |")
    lines.extend([
        "",
        "## Comandos",
        "",
        "```bash",
        "python mark_test.py list          # ver todo",
        "python mark_test.py pending       # solo los que faltan",
        "python mark_test.py pass TC023    # marcar OK",
        "python mark_test.py fail TC023    # volver a cola",
        "python run_pending_tests.py       # ejecutar solo pendientes",
        "```",
        "",
    ])
    (ROOT / "TEST_REGISTRY.md").write_text("\n".join(lines), encoding="utf-8")


def discover_scripts() -> dict[str, str]:
    out = {}
    for path in sorted(ROOT.glob("TC*.py")):
        m = re.match(r"(TC\d+)_", path.name)
        if m:
            out[m.group(1)] = path.name
    return out


def cmd_list(data: dict) -> None:
    tests = data.get("tests", {})
    discovered = discover_scripts()
    print(f"Registro: {REGISTRY_PATH}\n")
    for tid in sorted(set(tests) | set(discovered)):
        t = tests.get(tid, {})
        status = t.get("status", "pending")
        script = t.get("script") or discovered.get(tid, "—")
        title = t.get("title", "")
        mark = {"passed": "OK", "failed": "FAIL", "pending": "...", "flaky": "~"}.get(status, status)
        print(f"  [{mark}] {tid}  {script}  {title}")


def cmd_pending(data: dict) -> None:
    tests = data.get("tests", {})
    discovered = discover_scripts()
    pending = []
    for tid, script in discovered.items():
        if tests.get(tid, {}).get("status") != "passed":
            pending.append((tid, script))
    if not pending:
        print("No hay tests pendientes (todos los scripts conocidos están passed).")
        return
    print("Pendientes de ejecutar / no passed:")
    for tid, script in pending:
        print(f"  {tid}  {script}")


def cmd_pass(data: dict, test_id: str, verified_in: str, notes: str) -> None:
    tests = data.setdefault("tests", {})
    entry = tests.setdefault(test_id, {})
    discovered = discover_scripts()
    if not entry.get("script") and test_id in discovered:
        entry["script"] = discovered[test_id]
    entry["status"] = "passed"
    entry["verifiedAt"] = str(date.today())
    entry["verifiedIn"] = verified_in
    if notes:
        entry["notes"] = notes
    save_registry(data)
    print(f"Registrado PASS: {test_id}")


def cmd_fail(data: dict, test_id: str, notes: str) -> None:
    tests = data.setdefault("tests", {})
    entry = tests.setdefault(test_id, {})
    entry["status"] = "failed"
    if notes:
        entry["notes"] = notes
    save_registry(data)
    print(f"Registrado FAIL: {test_id} (volverá a la cola de pendientes)")


def cmd_register(data: dict, test_id: str, script: str, title: str) -> None:
    tests = data.setdefault("tests", {})
    tests[test_id] = {
        "status": "pending",
        "script": script,
        "title": title or test_id,
    }
    save_registry(data)
    print(f"Registrado pendiente: {test_id}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Registro de tests E2E TRIADAK")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="Listar todos los tests")
    sub.add_parser("pending", help="Listar tests no passed")

    p_pass = sub.add_parser("pass", help="Marcar test como passed")
    p_pass.add_argument("test_id")
    p_pass.add_argument("--in", dest="verified_in", default="local-playwright")
    p_pass.add_argument("--note", default="")

    p_fail = sub.add_parser("fail", help="Marcar test como failed")
    p_fail.add_argument("test_id")
    p_fail.add_argument("--note", default="")

    p_add = sub.add_parser("register", help="Añadir test nuevo como pending")
    p_add.add_argument("test_id")
    p_add.add_argument("--script", required=True)
    p_add.add_argument("--title", default="")

    args = parser.parse_args()
    data = load_registry()

    if args.command == "list":
        sync_markdown_summary(data)
        cmd_list(data)
    elif args.command == "pending":
        cmd_pending(data)
    elif args.command == "pass":
        cmd_pass(data, args.test_id, args.verified_in, args.note)
    elif args.command == "fail":
        cmd_fail(data, args.test_id, args.note)
    elif args.command == "register":
        cmd_register(data, args.test_id, args.script, args.title)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
