#!/usr/bin/env python3
"""Ejecuta solo tests E2E que NO tienen status passed en test-registry.json."""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REGISTRY_PATH = ROOT / "test-registry.json"


def load_registry() -> dict:
    if REGISTRY_PATH.exists():
        return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    return {"tests": {}}


def discover_scripts() -> dict[str, str]:
    out = {}
    for path in sorted(ROOT.glob("TC*.py")):
        m = re.match(r"(TC\d+)_", path.name)
        if m and path.name not in ("mark_test.py",):
            out[m.group(1)] = path.name
    return out


def get_passed_ids(data: dict) -> set[str]:
    return {
        tid
        for tid, t in data.get("tests", {}).items()
        if t.get("status") == "passed"
    }


def main() -> int:
    data = load_registry()
    passed = get_passed_ids(data)
    discovered = discover_scripts()

    pending = [
        (tid, discovered[tid])
        for tid in sorted(discovered)
        if tid not in passed
    ]

    if not pending:
        print("Todos los scripts TC*.py están passed en test-registry.json.")
        print(f"OK: {', '.join(sorted(passed)) or '—'}")
        print("Para re-ejecutar uno: python mark_test.py fail TC023")
        return 0

    print(f"Omitiendo (passed): {', '.join(sorted(passed)) or '—'}")
    print(f"Ejecutando: {', '.join(t for t, _ in pending)}\n")

    failed = []
    for tid, script in pending:
        path = ROOT / script
        print(f"=== {tid} ===")
        r = subprocess.run([sys.executable, str(path)], cwd=str(ROOT))
        if r.returncode != 0:
            failed.append(tid)
            print(f"FAILED {tid}\n")
        else:
            print(f"PASSED {tid} — ejecuta: python mark_test.py pass {tid}\n")

    if failed:
        print("Fallaron:", ", ".join(failed))
        print("Opcional: python mark_test.py fail <ID>")
        return 1
    print("Todos pasaron. Marca cada uno: python mark_test.py pass <ID>")
    return 0


if __name__ == "__main__":
    sys.exit(main())
