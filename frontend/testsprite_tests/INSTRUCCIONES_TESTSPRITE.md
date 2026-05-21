# Tests E2E — registro central

## Archivo principal (agente y humanos)

| Archivo | Uso |
|---------|-----|
| **`test-registry.json`** | Fuente única: `passed`, `failed`, `pending` por test |
| **`TEST_REGISTRY.md`** | Resumen legible (se regenera solo) |
| **`mark_test.py`** | Marcar pass/fail desde terminal o agente |
| **`run_pending_tests.py`** | Ejecutar solo los que no están `passed` |

Regla Cursor: `.cursor/rules/e2e-test-registry.mdc`

## Cuando un test pasa

```powershell
cd frontend\testsprite_tests
python mark_test.py pass TC023 --note "estable en local"
```

## Cuando falla otra vez

```powershell
python mark_test.py fail TC023
```

## Ver estado

```powershell
python mark_test.py list      # todo
python mark_test.py pending   # cola (no passed)
```

## TestSprite

- Leer `test-registry.json` y **SKIP** todos con `"status": "passed"`.
- `testIds`: solo IDs pendientes (no los passed).
- Tras un pass en nube/local: `python mark_test.py pass TC0XX`.

## Preview local

```powershell
cd frontend
npm run build
npm run preview -- --host 127.0.0.1 --port 5174
```

Login tests: `ziro@zirox.io` / `ziro1878@`
