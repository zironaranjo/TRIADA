#!/usr/bin/env python3
"""
Ejecuta tests E2E pendientes (no passed en test-registry.json).
Los que pasan se registran automáticamente con mark_test.py pass.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REGISTRY_PATH = ROOT / "test-registry.json"
RUN_LOG_DIR = ROOT / "test-runs"
MARK_SCRIPT = ROOT / "mark_test.py"

SKIP_IDS = {"TC019", "TC023", "TC027"}  # ya validados en prod


def load_registry() -> dict:
    if REGISTRY_PATH.exists():
        return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    return {"version": 1, "tests": {}}


def discover_scripts() -> dict[str, str]:
    out = {}
    for path in sorted(ROOT.glob("TC*.py")):
        m = re.match(r"(TC\d+)_", path.name)
        if m:
            out[m.group(1)] = path.name
    return out


def get_passed_ids(data: dict) -> set[str]:
    passed = {
        tid
        for tid, t in data.get("tests", {}).items()
        if t.get("status") == "passed"
    }
    return passed | SKIP_IDS


def title_from_script(script: str) -> str:
    base = script.replace(".py", "").split("_", 1)
    return base[1].replace("_", " ") if len(base) > 1 else script


def register_pass(tid: str, script: str, verified_in: str) -> None:
    subprocess.run(
        [
            sys.executable,
            str(MARK_SCRIPT),
            "pass",
            tid,
            "--in",
            verified_in,
            "--note",
            f"Auto-registrado tras run_pending_tests ({script})",
        ],
        cwd=str(ROOT),
        check=False,
    )


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--verified-in",
        default="local-playwright",
        help="Etiqueta para test-registry (ej. production-manual)",
    )
    parser.add_argument(
        "--no-auto-register",
        action="store_true",
        help="No marcar pass automáticamente",
    )
    parser.add_argument(
        "--ids",
        nargs="*",
        help="Solo estos IDs (ej. TC001 TC011)",
    )
    args = parser.parse_args()

    data = load_registry()
    passed = get_passed_ids(data)
    discovered = discover_scripts()

    pending = [
        (tid, discovered[tid])
        for tid in sorted(discovered)
        if tid not in passed and (not args.ids or tid in args.ids)
    ]

    if not pending:
        print("No hay tests pendientes.")
        print(f"Ya OK: {', '.join(sorted(passed))}")
        return 0

    RUN_LOG_DIR.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    log_path = RUN_LOG_DIR / f"run-{stamp}.json"
    results: list[dict] = []

    print(f"Omitiendo: {', '.join(sorted(passed))}")
    print(f"Pendientes ({len(pending)}): {', '.join(t for t, _ in pending)}\n")

    failed: list[str] = []
    for tid, script in pending:
        print(f"=== {tid} ({script}) ===")
        r = subprocess.run(
            [sys.executable, str(ROOT / script)],
            cwd=str(ROOT),
            timeout=300,
        )
        ok = r.returncode == 0
        entry = {"id": tid, "script": script, "status": "passed" if ok else "failed"}
        results.append(entry)

        if ok:
            print(f"PASSED {tid}")
            if not args.no_auto_register:
                register_pass(tid, script, args.verified_in)
        else:
            failed.append(tid)
            print(f"FAILED {tid}")
        print()

    summary = {
        "at": stamp,
        "verifiedIn": args.verified_in,
        "passed": [x["id"] for x in results if x["status"] == "passed"],
        "failed": failed,
        "results": results,
    }
    log_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (RUN_LOG_DIR / "latest.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )

    print("--- Resumen ---")
    print(f"Pass: {len(summary['passed'])} -> {', '.join(summary['passed']) or '-'}")
    print(f"Fail: {len(failed)} -> {', '.join(failed) or '-'}")
    print(f"Log: {log_path}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
