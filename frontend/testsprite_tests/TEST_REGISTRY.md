# Registro de tests E2E (TRIADAK)

**Última actualización:** 2026-05-21

> Archivo canónico: `test-registry.json`. El agente debe actualizarlo al pasar/fallar un test.

## Pasados (no repetir)

| ID | Título | Script | Verificado |
|----|--------|--------|------------|
| TC001 | — | `TC001_Admin_signs_in_and_reaches_the_main_dashboard.py` | 2026-05-21 (batch-local) |
| TC002 | — | `TC002_Create_a_new_booking_and_see_it_appear_in_the_schedule.py` | 2026-05-21 (batch-local) |
| TC003 | — | `TC003_Guest_signs_a_shared_contract_link.py` | 2026-05-21 (batch-local) |
| TC004 | — | `TC004_Owner_signs_in_and_reaches_the_owner_portal.py` | 2026-05-21 (batch-local) |
| TC005 | — | `TC005_Worker_signs_in_and_reaches_the_worker_tasks_portal.py` | 2026-05-21 (batch-local) |
| TC006 | — | `TC006_Access_the_bookings_workspace_and_view_existing_reservations.py` | 2026-05-21 (batch-local) |
| TC007 | — | `TC007_Guest_views_check_in_details_from_a_valid_token_link.py` | 2026-05-21 (batch-local) |
| TC008 | — | `TC008_Create_and_send_a_contract_for_a_booking.py` | 2026-05-21 (batch-local) |
| TC009 | — | `TC009_Worker_completes_a_task_checklist_item.py` | 2026-05-21 (batch-local) |
| TC010 | — | `TC010_Owner_accesses_their_dashboard_and_views_owned_property_activity.py` | 2026-05-21 (batch-local) |
| TC011 | — | `TC011_Admin_lands_on_the_correct_dashboard_after_login.py` | 2026-05-21 (batch-local) |
| TC012 | — | `TC012_Update_a_booking_status_from_the_bookings_workspace.py` | 2026-05-21 (batch-local) |
| TC013 | — | `TC013_Worker_reports_property_damage_from_a_task.py` | 2026-05-21 (batch-local) |
| TC014 | — | `TC014_Owner_uses_the_owner_portal_and_views_statements.py` | 2026-05-21 (batch-local) |
| TC015 | — | `TC015_Cancel_a_booking_from_the_bookings_workspace.py` | 2026-05-21 (batch-local) |
| TC016 | — | `TC016_Worker_views_daily_tasks_and_monthly_earnings.py` | 2026-05-21 (batch-local) |
| TC017 | — | `TC017_Worker_completes_assigned_tasks_and_reports_damage.py` | 2026-05-21 (batch-local) |
| TC018 | — | `TC018_Admin_creates_a_property_with_operational_details.py` | 2026-05-21 (batch-local) |
| TC019 | Owner downloads a monthly statement | `TC019_Owner_downloads_a_monthly_statement.py` | 2026-05-20 (local-playwright) |
| TC020 | — | `TC020_View_finance_totals_and_add_an_expense.py` | 2026-05-21 (batch-local) |
| TC021 | — | `TC021_Edit_booking_details_and_keep_changes_saved.py` | 2026-05-21 (batch-local) |
| TC022 | — | `TC022_Admin_reviews_dashboard_analytics_after_sign_in.py` | 2026-05-21 (batch-local) |
| TC023 | Owner reviews property list and occupancy | `TC023_Owner_reviews_the_property_list_and_occupancy_details.py` | 2026-05-20 (local-playwright) |
| TC024 | — | `TC024_Admin_updates_an_existing_property.py` | 2026-05-21 (batch-local) |
| TC025 | — | `TC025_Admin_reviews_analytics_and_navigates_into_bookings_and_properties.py` | 2026-05-21 (batch-local) |
| TC026 | — | `TC026_Add_a_staff_member.py` | 2026-05-21 (batch-local) |
| TC027 | Access owner management and add a new owner | `TC027_Access_owner_management_and_add_a_new_owner.py` | 2026-05-20 (local-playwright) |
| TC028 | — | `TC028_Admin_opens_the_properties_section_from_the_dashboard.py` | 2026-05-21 (batch-local) |
| TC029 | — | `TC029_Assign_a_task_to_a_staff_member.py` | 2026-05-21 (batch-local) |
| TC030 | — | `TC030_Open_an_owner_profile_and_review_linked_properties.py` | 2026-05-21 (batch-local) |

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
