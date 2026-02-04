# 🎯 TRIADA - Guía Visual del Proyecto

## 📁 Estructura de Archivos

```
TRIADA/
│
├── 📄 README.md                    ← Documentación principal
├── 📄 QUICKSTART.md                ← Guía de inicio rápido
├── 📄 RESUMEN_EJECUTIVO.md         ← Resumen completo del proyecto
├── 📄 STRUCTURE.md                 ← Estructura de archivos
├── 📄 VERIFICACION.md              ← Lista de verificación
├── 📄 docker-compose.yml           ← PostgreSQL (opcional)
│
├── 📂 backend/                     ← Servidor NestJS
│   ├── 📂 src/
│   │   ├── 📂 owners/             ← Módulo de Propietarios
│   │   ├── 📂 properties/         ← Módulo de Propiedades
│   │   ├── 📂 bookings/           ← Módulo de Reservas ⚡
│   │   ├── 📂 accounting/         ← Módulo de Contabilidad
│   │   ├── 📂 crm/                ← Módulo de CRM
│   │   ├── app.module.ts          ← Configuración principal
│   │   └── main.ts                ← Punto de entrada
│   ├── .env                        ← Configuración (NO en git)
│   ├── .env.example               ← Plantilla de configuración
│   └── triada.db                  ← Base de datos SQLite
│
└── 📂 frontend/                    ← Aplicación React
    ├── 📂 src/
    │   ├── 📂 api/                ← Cliente HTTP
    │   ├── 📂 components/         ← Componentes reutilizables
    │   ├── 📂 pages/              ← Páginas de la app
    │   ├── App.tsx                ← Componente principal
    │   ├── main.tsx               ← Punto de entrada
    │   └── index.css              ← Design System
    └── index.html                 ← HTML principal
```

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
│                            │                                     │
│                            ▼                                     │
│                    ┌──────────────┐                             │
│                    │   FRONTEND   │                             │
│                    │  React App   │                             │
│                    │ localhost:   │                             │
│                    │    5173      │                             │
│                    └──────┬───────┘                             │
│                           │                                      │
│                           │ HTTP Request                         │
│                           ▼                                      │
│                    ┌──────────────┐                             │
│                    │   BACKEND    │                             │
│                    │  NestJS API  │                             │
│                    │ localhost:   │                             │
│                    │    3000      │                             │
│                    └──────┬───────┘                             │
│                           │                                      │
│              ┌────────────┼────────────┐                        │
│              │            │            │                         │
│              ▼            ▼            ▼                         │
│         ┌────────┐  ┌─────────┐  ┌─────────┐                  │
│         │  CRM   │  │ACCOUNTING│  │BOOKINGS │                  │
│         │Module  │  │ Module   │  │ Module  │                  │
│         └───┬────┘  └────┬─────┘  └────┬────┘                  │
│             │            │             │                         │
│             └────────────┼─────────────┘                        │
│                          │                                       │
│                          ▼                                       │
│                   ┌─────────────┐                               │
│                   │  DATABASE   │                               │
│                   │   SQLite    │                               │
│                   │  triada.db  │                               │
│                   └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Automatización Implementada

```
┌──────────────────────────────────────────────────────────────┐
│  EVENTO: Nueva Reserva Creada                                │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  BookingsService.create()            │
        │  1. Guardar reserva en DB            │
        └──────────────┬───────────────────────┘
                       │
        ┌──────────────┴───────────────┐
        │                              │
        ▼                              ▼
┌───────────────┐            ┌─────────────────┐
│ CRM TRIGGER   │            │ ACCOUNTING      │
│               │            │ TRIGGER         │
│ Crear Contact │            │                 │
│ - Nombre      │            │ Crear Ledger    │
│ - Email       │            │ Entry           │
│ - Teléfono    │            │ - Descripción   │
│ - Source:     │            │ - Monto         │
│   BOOKING     │            │ - Tipo: CREDIT  │
└───────────────┘            │ - Cuenta:       │
                             │   OWNER_BALANCE │
                             └─────────────────┘
```

---

## 🎨 Paleta de Colores

```css
/* Colores Principales */
🟣 Primary:    #6366f1  (Índigo vibrante)
🟢 Secondary:  #10b981  (Verde éxito)
🟠 Accent:     #f59e0b  (Naranja cálido)

/* Fondos (Dark Mode) */
⬛ BG Primary:   #0f172a  (Azul muy oscuro)
⬛ BG Secondary: #1e293b  (Azul oscuro)
⬛ BG Tertiary:  #334155  (Gris azulado)

/* Textos */
⬜ Text Primary:   #f1f5f9  (Blanco suave)
⬜ Text Secondary: #cbd5e1  (Gris claro)
⬜ Text Muted:     #94a3b8  (Gris medio)

/* Estados */
✅ Success: #10b981  (Verde)
⚠️  Warning: #f59e0b  (Naranja)
❌ Error:   #ef4444  (Rojo)
ℹ️  Info:    #3b82f6  (Azul)
```

---

## 📊 Dashboard - Componentes Visuales

```
┌─────────────────────────────────────────────────────────────┐
│  TRIADA                                    [Usuario]         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Dashboard                                                   │
│  Visión general de tu negocio de alquileres vacacionales    │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 📅       │  │ 🏠       │  │ 👥       │  │ 💰       │   │
│  │ Reservas │  │Propiedad │  │Propieta  │  │ Ingresos │   │
│  │ Totales  │  │  Activas │  │  rios    │  │ Totales  │   │
│  │   0      │  │    0     │  │    0     │  │  €0.00   │   │
│  │ +12% ↑   │  │  +2 ↑    │  │   --     │  │ +18% ↑   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ 🔗 Integraciones     │  │ 📊 Actividad         │        │
│  │                      │  │    Reciente          │        │
│  │ 🏡 Airbnb     ✅     │  │                      │        │
│  │ 🌐 Booking.com ✅    │  │ 📅 Nueva reserva     │        │
│  │ 📱 Lodgify    ✅     │  │    Hace 2 horas      │        │
│  │ 💳 Stripe     ✅     │  │                      │        │
│  │                      │  │ 💰 Pago recibido     │        │
│  └──────────────────────┘  │    Hace 5 horas      │        │
│                             └──────────────────────┘        │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🎯 Próximos Pasos Recomendados                       │  │
│  │                                                        │  │
│  │ ✅ Conecta tu primera propiedad                       │  │
│  │    Añade propiedades para empezar a gestionar        │  │
│  │    reservas                    [Añadir Propiedad]    │  │
│  │                                                        │  │
│  │ 📊 Configura reportes automáticos                    │  │
│  │    Recibe informes financieros mensuales por email   │  │
│  │                                   [Configurar]        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Modelo de Base de Datos

```
┌─────────────────┐
│     OWNER       │
├─────────────────┤
│ id (UUID) PK    │
│ firstName       │
│ lastName        │
│ email (unique)  │
│ phone           │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────┐
│   PROPERTY      │
├─────────────────┤
│ id (UUID) PK    │
│ name            │
│ address         │
│ ownerId FK      │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────┐
│    BOOKING      │
├─────────────────┤
│ id (UUID) PK    │
│ guestName       │
│ startDate       │
│ endDate         │
│ totalPrice      │
│ status          │
│ propertyId FK   │
└─────────────────┘

┌─────────────────┐
│    CONTACT      │
├─────────────────┤
│ id (UUID) PK    │
│ name            │
│ email (unique)  │
│ phone           │
│ source          │
│ createdAt       │
└─────────────────┘

┌─────────────────┐
│  LEDGER_ENTRY   │
├─────────────────┤
│ id (UUID) PK    │
│ bookingId       │
│ description     │
│ amount          │
│ type            │
│ account         │
│ createdAt       │
└─────────────────┘
```

---

## 🚀 Comandos Rápidos

### Iniciar el Proyecto
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev
```

### URLs Importantes
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:3000
- 📊 API Owners: http://localhost:3000/owners
- 📅 API Bookings: http://localhost:3000/bookings

### Crear Datos de Prueba
```powershell
# Crear propietario
$owner = @{
    firstName = "Juan"
    lastName = "Pérez"
    email = "juan@example.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/owners" `
    -Method POST -Body $owner -ContentType "application/json"

# Crear reserva (activa triggers)
$booking = @{
    guestName = "María García"
    email = "maria@example.com"
    startDate = "2026-03-01"
    endDate = "2026-03-07"
    totalPrice = 1500
    status = "CONFIRMED"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/bookings" `
    -Method POST -Body $booking -ContentType "application/json"
```

---

## 📈 Roadmap Visual

```
✅ STAGE 1: CORE DATA & SYNCHRONIZATION (COMPLETADO)
│
├─ ✅ Estructura del proyecto
├─ ✅ Base de datos
├─ ✅ Entidades principales
├─ ✅ CRUD básico
└─ ✅ Sincronización automática

🔄 STAGE 2: FINANCIAL ENGINE (PRÓXIMO)
│
├─ ⏳ Integración Stripe
├─ ⏳ Reconciliación 3 vías
├─ ⏳ Algoritmo de liquidación
└─ ⏳ Owner Statements

🚀 STAGE 3: INTERFACE & REPORTING (FUTURO)
│
├─ 📅 Multicalendario
├─ 👥 Portal del Propietario
├─ 🏡 Integración Airbnb
├─ 🌐 Integración Booking.com
└─ 📊 Reportes avanzados
```

---

## 🎓 Tecnologías Usadas

### Backend Stack
```
NestJS 11.x
    ↓
TypeORM 0.3.x
    ↓
PostgreSQL / SQLite
    ↓
TypeScript 5.x
```

### Frontend Stack
```
React 18.x
    ↓
TypeScript 5.x
    ↓
Vite 7.x
    ↓
Axios + React Router
```

---

## 📞 Soporte

### Archivos de Documentación
- 📘 `README.md` - Documentación completa
- 🚀 `QUICKSTART.md` - Inicio rápido
- 📊 `RESUMEN_EJECUTIVO.md` - Resumen del proyecto
- 🏗️ `STRUCTURE.md` - Estructura de archivos
- ✅ `VERIFICACION.md` - Lista de verificación
- 🎨 `GUIA_VISUAL.md` - Este archivo

### Comandos de Ayuda
```bash
# Ver versiones
node --version
npm --version

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Limpiar caché
npm cache clean --force
```

---

**¡Disfruta construyendo TRIADA! 🚀**

*Última actualización: 3 de febrero de 2026*
