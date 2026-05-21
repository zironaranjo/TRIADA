# Multi-tenancy TRIADAK

Cada **agencia** es una fila en `accounts`. Los usuarios se vinculan con `account_members` (un usuario = una agencia en v1).

## Aplicar en Supabase (obligatorio)

1. Dashboard → **SQL Editor**
2. Ejecutar en orden:
   - `supabase/migrations/014_multi_tenancy.sql`
3. **Deploy frontend** (AuthContext + `ensureAccountMembership`)

## Comportamiento tras migrar

| Usuario | Qué ve |
|---------|--------|
| **Tú (primer admin / cuenta principal)** | Todos los datos existentes (backfill a "Cuenta principal") |
| **Hermano / Gmail nuevo** | Cuenta nueva vacía (otro tenant) |
| **Propietario** (email en tabla `owner`) | Datos de la agencia donde está ese owner |
| **Trabajador** (email en `staff_members`) | Datos de esa agencia |

## Seguridad extra recomendada

- Supabase → **Authentication** → desactivar registro público o solo invitaciones, hasta tener billing/invites.
- Revisar `account_members` en Table Editor si alguien no debería tener acceso.

## Tablas con `account_id`

`properties`, `owner`, `bookings`, `contacts`, `expenses`, `staff_members`, `staff_tasks`, `message_logs`, `contracts`, (+ `contact_notes`, `sync_logs` si existen).

`platform_connections` usa **`agency_account_id`** (no `account_id`) porque `account_id` TEXT ya guarda el ID de Airbnb/Booking.

RLS: `account_id = current_account_id()` para usuarios `authenticated`.

## Invitar equipo (Settings → Equipo)

1. Admin invita email → fila en `account_invites` + enlace mágico Supabase.
2. La persona entra → `acceptPendingInvite` crea `account_members` en **tu** `account_id`.
3. RLS impide ver datos de otras agencias.

Ejecutar también: `supabase/migrations/015_account_invites.sql`
