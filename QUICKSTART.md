# 🚀 Quick Start Guide - TRIADA

## Inicio Rápido (5 minutos)

### 1. Abrir dos terminales

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
✅ Espera ver: `🚀 TRIADA Backend running on: http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Espera ver: `Local: http://localhost:5173/`

### 2. Abrir el navegador

Navega a: **http://localhost:5173**

¡Listo! Deberías ver el dashboard de TRIADA.

---

## 🧪 Probar el Sistema

### Crear un Propietario (Owner)

```bash
curl -X POST http://localhost:3000/owners \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "phone": "+34 600 123 456"
  }'
```

### Crear una Propiedad

```bash
curl -X POST http://localhost:3000/properties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Villa Paraíso",
    "address": "Calle Sol 123, Marbella"
  }'
```

### Crear una Reserva (⚡ Activa triggers automáticos)

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "María García",
    "email": "maria@example.com",
    "phone": "+34 600 999 888",
    "startDate": "2026-03-01",
    "endDate": "2026-03-07",
    "totalPrice": 1500,
    "status": "CONFIRMED"
  }'
```

**Esto automáticamente:**
1. ✅ Crea la reserva
2. ✅ Crea un contacto en el CRM (María García)
3. ✅ Genera un asiento contable (€1,500 de ingreso)

### Ver los datos

```bash
# Ver todas las reservas
curl http://localhost:3000/bookings

# Ver todos los propietarios
curl http://localhost:3000/owners

# Ver todas las propiedades
curl http://localhost:3000/properties
```

---

## 🔄 Cambiar de SQLite a Supabase

1. Edita `backend/.env`:
```env
# Comenta SQLite
# DATABASE_TYPE=sqlite
# DATABASE_PATH=./triada.db

# Descomenta y configura Supabase
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.PROYECTO.supabase.co:5432/postgres"
```

2. Reinicia el backend:
```bash
# Ctrl+C para detener
npm run start:dev
```

---

## 🎨 Personalizar el Frontend

Los colores principales están en `frontend/src/index.css`:

```css
:root {
  --primary: #6366f1;      /* Cambiar color principal */
  --secondary: #10b981;    /* Cambiar color secundario */
  --accent: #f59e0b;       /* Cambiar color de acento */
}
```

---

## 📱 Acceder desde otro dispositivo

1. Encuentra tu IP local:
```bash
ipconfig  # Windows
ifconfig  # Mac/Linux
```

2. Accede desde otro dispositivo en la misma red:
```
http://TU_IP:5173
```

---

## ❓ Problemas Comunes

### "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [NUMERO] /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### El frontend no carga datos
1. Verifica que el backend esté corriendo
2. Abre la consola del navegador (F12)
3. Busca errores en la pestaña "Console"

### Error de base de datos
```bash
# Elimina la base de datos SQLite y reinicia
cd backend
rm triada.db
npm run start:dev
```

---

## 🎯 Siguiente Paso

Lee el **README.md** completo para entender la arquitectura del sistema.
