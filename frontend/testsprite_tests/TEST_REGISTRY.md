# Registro de tests E2E (TRIADAK)

**Última actualización:** 2026-05-20

> Archivo canónico: `test-registry.json`. El agente debe actualizarlo al pasar/fallar un test.

## Pasados (no repetir)

| ID | Título | Script | Verificado |
|----|--------|--------|------------|
| TC019 | Owner downloads a monthly statement | `TC019_Owner_downloads_a_monthly_statement.py` | 2026-05-20 (local-playwright) |
| TC023 | Owner reviews property list and occupancy | `TC023_Owner_reviews_the_property_list_and_occupancy_details.py` | 2026-05-20 (local-playwright) |
| TC027 | Access owner management and add a new owner | `TC027_Access_owner_management_and_add_a_new_owner.py` | 2026-05-20 (local-playwright) |

## Pendientes / fallidos

| ID | Estado | Script | Notas |
|----|--------|--------|-------|
| — | — | — | Ninguno registrado aún |

## Comandos

```bash
python mark_test.py list          # ver todo
python mark_test.py pending       # solo los que faltan
python mark_test.py pass TC023    # marcar OK
python mark_test.py fail TC023    # volver a cola
python run_pending_tests.py       # ejecutar solo pendientes
```
