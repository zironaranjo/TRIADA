---
name: Clean Architecture & Best Practices
description: Guía experta para escribir software escalable, mantenible y profesional en el stack TRIADA (NestJS + React).
---

# 🧠 The Architect: Estándares de Ingeniería de Software

Esta skill define CÓMO se debe escribir código en este proyecto. No es una sugerencia, es la ley.

## 1. Principios Fundamentales (The Golden Rules)

- **Single Responsibility (SRP):** Un archivo/clase/función debe tener UNA sola razón para cambiar.
  - *Mal:* Un Controller que valida datos, llama a la DB y envía emails.
  - *Bien:* Controller -> DTO (Validación) -> Service (Lógica) -> Repository (DB).
- **Explicit is better than Implicit:** No uses `any`. Define interfaces y tipos para todo.
- **Fail Fast:** Valida los datos de entrada al principio de la función. Lanza excepciones específicas.

## 2. Backend (NestJS) Standards

### Estructura de Módulos (Vertical Slicing)
Cada módulo debe ser autocontenido.
```
src/module-name/
├── dto/                  # Data Transfer Objects (Validación de entrada)
│   ├── create-item.dto.ts
│   └── update-item.dto.ts
├── entities/             # Definición de Base de Datos
│   └── item.entity.ts
├── interfaces/           # Contratos de TypeScript
│   └── item.interface.ts
├── module-name.controller.ts  # Rutas HTTP (Solo orquesta, no piensa)
├── module-name.service.ts     # Lógica de Negocio (Aquí vive la magia)
└── module-name.module.ts      # Inyección de Dependencias
```

### Reglas para Services
- NUNCA devuelvas la entidad de base de datos directamente al frontend si contiene datos sensibles (password, hashes).
- Usa `async/await` siempre.
- Maneja los errores con `try/catch` y lanza `HttpException` personalizadas si es necesario.

## 3. Frontend (React) Standards

### Componentes (Atomic Design Simplificado)
- **Atoms:** Botones, Inputs, Textos (UI puro, sin lógica de negocio).
- **Molecules:** Formularios, Tarjetas de producto (UI + Datos simples).
- **Organisms:** Dashboard, Tablas complejas (Lógica completa).
- **Pages:** Vistas completas (Conectan organismos con la API).

### Gestión de Estado
- Usa `Custom Hooks` para separar la lógica de la vista.
  - *Mal:* Hacer `fetch` dentro de `useEffect` en el componente visual.
  - *Bien:* `useBookings()` retorna `{ bookings, loading, error }`.

## 4. Flujo de Trabajo (Workflow)

Cuando se te pida implementar una feature:
1. **Analiza:** ¿Qué entidades se ven afectadas?
2. **Diseña:** Crea interfaces y DTOs primero.
3. **Implementa:** Backend primero, luego Frontend.
4. **Refactoriza:** Verifica si duplicaste código.

---
**Recordatorio:** Eres un Ingeniero Senior. Tu código debe ser tan limpio que se explique solo.
