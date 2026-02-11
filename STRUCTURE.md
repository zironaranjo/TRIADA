# TRIADA Project Structure

```
TRIADA/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── owners/            # Owners Module
│   │   │   ├── entities/
│   │   │   │   └── owner.entity.ts
│   │   │   ├── owners.controller.ts
│   │   │   ├── owners.service.ts
│   │   │   └── owners.module.ts
│   │   │
│   │   ├── properties/        # Properties Module
│   │   │   ├── entities/
│   │   │   │   └── property.entity.ts
│   │   │   ├── properties.controller.ts
│   │   │   ├── properties.service.ts
│   │   │   └── properties.module.ts
│   │   │
│   │   ├── bookings/          # Bookings Module (with auto-triggers)
│   │   │   ├── entities/
│   │   │   │   └── booking.entity.ts
│   │   │   ├── bookings.controller.ts
│   │   │   ├── bookings.service.ts
│   │   │   └── bookings.module.ts
│   │   │
│   │   ├── accounting/        # Accounting Module
│   │   │   ├── entities/
│   │   │   │   └── ledger-entry.entity.ts
│   │   │   ├── accounting.controller.ts
│   │   │   ├── accounting.service.ts
│   │   │   └── accounting.module.ts
│   │   │
│   │   ├── crm/              # CRM Module
│   │   │   ├── entities/
│   │   │   │   └── contact.entity.ts
│   │   │   ├── crm.controller.ts
│   │   │   ├── crm.service.ts
│   │   │   └── crm.module.ts
│   │   │
│   │   ├── app.module.ts     # Main application module
│   │   └── main.ts           # Application entry point
│   │
│   ├── .env                   # Environment variables (not in git)
│   ├── .env.example          # Environment template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts     # Axios API client
│   │   │
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   └── Layout.css
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Dashboard.css
│   │   │   ├── Properties.tsx
│   │   │   ├── Bookings.tsx
│   │   │   ├── Owners.tsx
│   │   │   └── Accounting.tsx
│   │   │
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles + Design System
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml         # Orquesta backend, frontend y Caddy (sin DB propia)
└── README.md                  # Documentación principal del proyecto
```

## Key Files

### Backend
- **app.module.ts**: Main module with TypeORM configuration (SQLite/PostgreSQL)
- **bookings.service.ts**: Contains the automatic trigger logic (CRM + Accounting)
- **.env**: Database configuration (switch between SQLite and Supabase)

### Frontend
- **index.css**: Complete design system with CSS variables
- **Layout.tsx**: Main layout with sidebar navigation
- **Dashboard.tsx**: Main dashboard with stats and integrations
- **api/client.ts**: Centralized API client

## Database Files
- **triada.db**: SQLite database (auto-generated when using SQLite)
- Tables are auto-created by TypeORM on first run

## Environment Files
- **.env**: Active configuration (not in git)
- **.env.example**: Template for configuration
