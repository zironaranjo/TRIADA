# 🏡 TRIADA - Vacation Rental ERP System

**TRIADA** es un ecosistema SaaS completo para la gestión automatizada de alquileres vacacionales que integra:

- 🏠 **Módulo Operativo** (Channel Manager + Motor de Reservas)
- 💼 **Módulo ERP/Contable** (CRM + Facturación + Conciliación Bancaria)
- 💰 **Módulo Fiduciario** (Trust Accounting + Portal del Propietario)

---

## 🚀 Estado Actual del Proyecto

### ✅ Completado (Stage 1)

- **Backend NestJS** con arquitectura modular
- **Base de datos** configurada (SQLite local / PostgreSQL Supabase)
- **Entidades principales**: Owners, Properties, Bookings, Ledger Entries, Contacts
- **Sincronización automática**: Booking → CRM Contact + Ledger Entry
- **Frontend React** con diseño premium y dark mode
- **Dashboard** con métricas en tiempo real
- **API REST** con CORS habilitado

### 🏗️ En Construcción (Stages 2 & 3)

- Reconciliación de 3 vías (OTA, Stripe, Banco)
- Algoritmo de liquidación automática
- Multicalendario sincronizado
- Portal del Propietario
- Integraciones con Airbnb, Booking.com, Lodgify

---

## 📦 Tecnologías Utilizadas

### Backend
- **NestJS** 11.x - Framework Node.js profesional
- **TypeORM** 0.3.x - ORM para PostgreSQL/SQLite
- **PostgreSQL** (Supabase) / SQLite (desarrollo local)
- **TypeScript** 5.x

### Frontend
- **React** 18.x + **TypeScript**
- **Vite** 7.x - Build tool ultrarrápido
- **React Router** 6.x - Navegación
- **Axios** - Cliente HTTP
- **CSS Vanilla** con design system custom

---

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm
- (Opcional) Cuenta de Supabase para PostgreSQL en la nube

### 1. Clonar el repositorio
```bash
cd TRIADA
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

**Configurar variables de entorno** (`.env`):

```env
# Opción 1: SQLite (desarrollo local - sin configuración adicional)
DATABASE_TYPE=sqlite
DATABASE_PATH=./triada.db

# Opción 2: Supabase (producción)
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

PORT=3000
```

**Iniciar backend:**
```bash
npm run start:dev
```

El backend estará disponible en: **http://localhost:3000**

### 3. Configurar Frontend

```bash
cd ../frontend
npm install
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

---

## 🏗️ Arquitectura del Sistema

### Flujo de Datos (Stage 1 - Implementado)

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIADA ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📅 BOOKING CREATED                                          │
│       │                                                       │
│       ├──► 👤 CRM: Create Contact (Guest)                   │
│       │                                                       │
│       └──► 💰 ACCOUNTING: Create Ledger Entry (Revenue)     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Estructura de Módulos

```
backend/
├── src/
│   ├── owners/          # Gestión de propietarios
│   ├── properties/      # Gestión de propiedades
│   ├── bookings/        # Reservas + Triggers automáticos
│   ├── accounting/      # Contabilidad (Ledger)
│   └── crm/            # Gestión de contactos
```

---

## 🎯 Roadmap de Desarrollo

### ✅ Stage 1: Core Data & Synchronization (COMPLETADO)
- [x] Estructura del proyecto (NestJS + React)
- [x] Base de datos (PostgreSQL/SQLite)
- [x] Entidades principales
- [x] CRUD básico
- [x] Sincronización Booking → CRM + Accounting

### 🔄 Stage 2: Financial Engine & Reconciliation (PRÓXIMO)
- [ ] Integración con Stripe API
- [ ] Lógica de reconciliación de 3 vías
- [ ] Algoritmo de liquidación:
  ```
  Pago Propietario = Ingreso Neto - Comisión Agencia - Gastos
  ```
- [ ] Generación automática de Owner Statements

### 🚀 Stage 3: Interface & Reporting (FUTURO)
- [ ] Dashboard con multicalendario
- [ ] Portal del Propietario (autenticación)
- [ ] Reportes financieros automáticos
- [ ] Integración con Airbnb API
- [ ] Integración con Booking.com API
- [ ] Integración con Lodgify

---

## 📊 Modelo de Datos

### Entidades Principales

**Owner** (Propietario)
```typescript
{
  id: UUID
  firstName: string
  lastName: string
  email: string (unique)
  phone?: string
  properties: Property[]
}
```

**Property** (Propiedad)
```typescript
{
  id: UUID
  name: string
  address: string
  owner: Owner
  bookings: Booking[]
}
```

**Booking** (Reserva)
```typescript
{
  id: UUID
  guestName: string
  startDate: Date
  endDate: Date
  totalPrice: Decimal
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING'
  property: Property
}
```

**LedgerEntry** (Asiento Contable)
```typescript
{
  id: UUID
  bookingId?: string
  description: string
  amount: Decimal
  type: 'DEBIT' | 'CREDIT'
  account: 'BANK' | 'STRIPE' | 'OWNER_BALANCE' | 'AGENCY_COMMISSION'
}
```

**Contact** (Contacto CRM)
```typescript
{
  id: UUID
  name: string
  email: string (unique)
  phone?: string
  source: 'MANUAL' | 'BOOKING'
}
```

---

## 🔌 API Endpoints

### Owners
- `GET /owners` - Listar propietarios
- `GET /owners/:id` - Obtener propietario
- `POST /owners` - Crear propietario

### Properties
- `GET /properties` - Listar propiedades
- `GET /properties/:id` - Obtener propiedad
- `POST /properties` - Crear propiedad

### Bookings
- `GET /bookings` - Listar reservas
- `GET /bookings/:id` - Obtener reserva
- `POST /bookings` - Crear reserva (⚡ Triggers automáticos)

### Accounting
- `GET /accounting/ledger` - Ver libro mayor

### CRM
- `GET /crm/contacts` - Listar contactos

---

## 🎨 Design System

El frontend utiliza un design system custom con:

- **Paleta de colores** profesional (dark mode)
- **Tipografía**: Inter (Google Fonts)
- **Componentes reutilizables**: Cards, Buttons, Badges
- **Animaciones suaves**: fade-in, slide-in
- **Responsive design**

### Variables CSS Principales
```css
--primary: #6366f1
--secondary: #10b981
--accent: #f59e0b
--bg-primary: #0f172a
--bg-secondary: #1e293b
```

---

## 🔐 Seguridad y Mejores Prácticas

- ✅ Variables de entorno para credenciales
- ✅ `.gitignore` configurado (excluye `.env`)
- ✅ CORS habilitado para desarrollo
- ✅ TypeScript strict mode
- ⚠️ **IMPORTANTE**: `synchronize: true` solo para desarrollo (desactivar en producción)

---

## 🐛 Troubleshooting

### Error de conexión a Supabase
Si experimentas errores de DNS con Supabase:
1. Verifica tu conexión a internet
2. Confirma que la URL de Supabase es correcta
3. Usa SQLite temporalmente cambiando `.env`:
   ```env
   DATABASE_TYPE=sqlite
   DATABASE_PATH=./triada.db
   ```

### El frontend no se conecta al backend
- Verifica que el backend esté corriendo en `http://localhost:3000`
- Revisa la consola del navegador para errores CORS
- Confirma que `app.enableCors()` esté en `main.ts`

---

## 📝 Próximos Pasos Recomendados

1. **Conectar Supabase** (cuando la red lo permita)
2. **Implementar Stage 2**: Reconciliación financiera
3. **Añadir autenticación** (JWT + Passport)
4. **Integrar Stripe** para procesamiento de pagos
5. **Conectar APIs de OTAs** (Airbnb, Booking.com)

---

## 👨‍💻 Desarrollo

### Comandos útiles

**Backend:**
```bash
npm run start:dev    # Modo desarrollo (watch)
npm run build        # Compilar para producción
npm run start:prod   # Ejecutar producción
```

**Frontend:**
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
```

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

---

## 🙏 Inspiración

Este proyecto está inspirado en las mejores prácticas de:
- **Lodgify** - Channel Manager y PMS
- **Bexio** - ERP y Contabilidad
- **VRPlatform** - Trust Accounting para Vacation Rentals

---

**Desarrollado con ❤️ para revolucionar la gestión de alquileres vacacionales**
