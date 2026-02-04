---
name: Security & Quality Assurance
description: Protocolos de seguridad, validación de datos y testing para aplicaciones críticas.
---

# 🛡️ The Guardian: Protocolos de Seguridad y Calidad

Esta skill asegura que el código sea robusto, seguro y libre de errores críticos.

## 1. Seguridad (Security First)

### Backend
- **Validación de Inputs:** NUNCA confíes en lo que envía el cliente.
  - Usa `class-validator` en todos los DTOs.
  - Sanitiza strings para evitar inyección SQL (TypeORM ya lo hace, pero cuidado con `queryBuilder`).
- **Autenticación:**
  - Protege todas las rutas privadas con `Guards`.
  - Usa JWT para sesiones stateless.
- **Variables de Entorno:**
  - JAMÁS subas `.env` al repositorio.
  - Usa `ConfigService` para acceder a variables, no `process.env` directo.

### Frontend
- **XSS (Cross Site Scripting):**
  - No uses `dangerouslySetInnerHTML` a menos que sea estrictamente necesario y sanitizado.
- **Dependencias:**
  - Evita librerías pesadas si una función nativa lo resuelve.

## 2. Manejo de Errores (Error Handling)

### La Regla de los 3 Pasos
1. **Capturar:** Usa bloques `try/catch`.
2. **Loggear:** Registra el error internamente (console.error o servicio de logs) con contexto.
3. **Responder:** Envía un mensaje limpio al usuario (no el stack trace).

```typescript
try {
  // operación peligrosa
} catch (error) {
  this.logger.error(`Fallo al crear usuario: ${error.message}`, error.stack);
  throw new InternalServerErrorException('No se pudo procesar la solicitud');
}
```

## 3. Checklist de Calidad (Definition of Done)

Antes de dar una tarea por terminada, verifica:

- [ ] ¿El código compila sin warnings?
- [ ] ¿Se han eliminado los `console.log` de depuración?
- [ ] ¿Las variables tienen nombres descriptivos (`userList` en vez de `ul`)?
- [ ] ¿Se han manejado los casos borde (arrays vacíos, nulos, undefined)?
- [ ] ¿El código está formateado (Prettier/ESLint)?

---
**Filosofía:** "La calidad no es un acto, es un hábito."
