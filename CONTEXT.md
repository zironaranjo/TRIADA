# 🔄 TRIADA - Context File for AI Continuation

> **Última actualización:** 4 de Febrero 2026, 19:00
> **Autor:** Antigravity (Sesión con @zironaranjo)

---

## 📍 Estado Actual del Proyecto

### ✅ STAGE 1: COMPLETADO (100%)

| Componente | Estado | Descripción |
|------------|--------|-------------|
| Backend NestJS | ✅ | API REST funcional con 5 módulos |
| Frontend React | ✅ | Dashboard con diseño premium |
| Base de datos | ✅ | SQLite local + config para Supabase |
| Automatización | ✅ | Booking → CRM + Ledger Entry |
| Repositorio GitHub | ✅ | github.com/zironaranjo/TRIADA |
| Skills (3) | ✅ | Architect, Guardian, DevOps |
| Documentación | ✅ | README, QUICKSTART, GUIA_VISUAL, etc. |

### 🔄 STAGE 2: PENDIENTE (Motor Financiero)

| Tarea | Prioridad | Descripción |
|-------|-----------|-------------|
| Integración Stripe | ALTA | Webhooks para recibir pagos |
| Reconciliación 3 vías | ALTA | OTA ↔ Stripe ↔ Banco |
| Algoritmo de liquidación | ALTA | Calcular pago a propietarios |
| Owner Statements | MEDIA | Generar reportes mensuales PDF |

### 🚀 STAGE 3: FUTURO (Interfaz Avanzada)

| Tarea | Prioridad | Descripción |
|-------|-----------|-------------|
| Multicalendario | ALTA | Vista unificada de reservas |
| Portal del Propietario | ALTA | Login + Dashboard personal |
| Integración Airbnb API | MEDIA | Sync bidireccional |
| Integración Booking.com | MEDIA | Sync bidireccional |
| Reportes avanzados | BAJA | Gráficos, exportación Excel/PDF |

---

## 🏗️ Arquitectura Actual

```
TRIADA/
├── backend/                 # NestJS API (Puerto 3000)
│   ├── src/
│   │   ├── owners/         # CRUD Propietarios
│   │   ├── properties/     # CRUD Propiedades
│   │   ├── bookings/       # CRUD + Triggers automáticos ⚡
│   │   ├── accounting/     # Ledger (Asientos contables)
│   │   └── crm/           # Contactos
│   └── triada.db          # SQLite (desarrollo)
│
├── frontend/               # React + Vite (Puerto 5173)
│   └── src/
│       ├── pages/         # Dashboard, Bookings, etc.
│       ├── components/    # Layout, etc.
│       └── api/          # Cliente Axios
│
└── .agent/skills/         # 3 Skills profesionales
    ├── architect/         # Clean Architecture
    ├── guardian/          # Seguridad
    └── devops/           # Despliegue
```

---

## ⚡ Lógica de Negocio Implementada

### Trigger Automático (bookings.service.ts)
Cuando se crea una reserva:
1. Se guarda la reserva en DB
2. Se crea automáticamente un **Contact** en el CRM
3. Se crea automáticamente un **LedgerEntry** (asiento contable)

```typescript
// Pseudocódigo del flujo actual
async create(booking) {
  const saved = await this.bookingRepo.save(booking);
  
  // Trigger 1: CRM
  await this.crmService.createContact({
    name: booking.guestName,
    email: booking.email,
    source: 'BOOKING'
  });
  
  // Trigger 2: Accounting
  await this.accountingService.createEntry({
    bookingId: saved.id,
    amount: booking.totalPrice,
    type: 'CREDIT',
    account: 'OWNER_BALANCE'
  });
  
  return saved;
}
```

---

## 🎯 Próximos Pasos Recomendados (Stage 2)

### 1. Integración Stripe
**Objetivo:** Recibir notificaciones de pagos reales.

**Pasos:**
1. Crear cuenta en Stripe (modo test)
2. Instalar `stripe` npm package
3. Crear endpoint `/webhooks/stripe` para recibir eventos
4. Al recibir `payment_intent.succeeded`:
   - Crear LedgerEntry tipo `DEBIT` en cuenta `STRIPE`
   - Marcar la reserva como `PAID`

### 2. Reconciliación de 3 Vías
**Objetivo:** Cruzar datos de OTA, Stripe y Banco.

**Lógica:**
```
Para cada reserva:
  - ¿Existe pago en Stripe? ✅/❌
  - ¿El monto coincide con la reserva? ✅/❌
  - ¿Aparece en el extracto bancario? ✅/❌

Si todo coincide → Estado: RECONCILED
Si hay discrepancia → Estado: PENDING_REVIEW
```

### 3. Algoritmo de Liquidación
**Fórmula:**
```
Pago Propietario = Ingreso Bruto 
                  - Comisión Plataforma (ej: Airbnb 3%)
                  - Comisión Agencia (ej: 20%)
                  - Gastos (limpieza, mantenimiento)
```

---

## 🔧 Configuración Necesaria

### Backend (.env)
```env
# Actual (SQLite)
DATABASE_TYPE=sqlite
DATABASE_PATH=./triada.db

# Futuro (Supabase)
# DATABASE_URL=postgresql://...

# Futuro (Stripe)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Comandos para Arrancar
```bash
# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev
```

---

## 📚 Skills Disponibles

Lee estos archivos para entender los estándares del proyecto:

1. `.agent/skills/architect/SKILL.md` - Cómo estructurar el código
2. `.agent/skills/guardian/SKILL.md` - Seguridad y calidad
3. `.agent/skills/devops/SKILL.md` - Despliegue y Docker

---

## 💡 Notas del Desarrollador Anterior

1. **Base de datos:** Usamos SQLite porque hubo problemas de DNS con Supabase. Cuando esté disponible, cambiar en `.env`.

2. **Endpoints CRM/Accounting:** Los métodos `findAll()` están implementados pero retornan placeholder. Los datos SÍ se guardan, solo hay que exponerlos correctamente.

3. **Frontend:** El Dashboard muestra datos de prueba cuando la API no responde. Conectar con datos reales cuando el backend esté poblado.

4. **Script check.ps1:** Creado para que el usuario revise cambios antes de push a GitHub. Tiene un bug de encoding que hay que arreglar.

---

## 🤝 Cómo Continuar

1. Clona el repo: `git clone https://github.com/zironaranjo/TRIADA.git`
2. Instala dependencias: `cd backend && npm install && cd ../frontend && npm install`
3. Copia `.env.example` a `.env` en backend
4. Lee este archivo (`CONTEXT.md`) para entender el estado
5. Lee las Skills en `.agent/skills/`
6. Pregunta al usuario qué quiere implementar primero del Stage 2

---

**¡Buena suerte, futuro Antigravity! 🚀**
