---
name: DevOps & Deployment
description: Protocolos para despliegue, CI/CD, Docker y gestión de infraestructura en producción.
---

# ⚡ The DevOps: Infraestructura y Despliegue Profesional

Esta skill define cómo preparar, desplegar y mantener aplicaciones en producción de forma segura y escalable.

## 1. Gestión de Entornos

### Los 3 Entornos Sagrados
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ DEVELOPMENT │ -> │   STAGING   │ -> │ PRODUCTION  │
│   (Local)   │    │  (Testing)  │    │   (Live)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

- **Development:** Tu máquina. SQLite o DB local. Errores visibles.
- **Staging:** Réplica de producción. Datos de prueba. Para testing.
- **Production:** El servidor real. Datos reales. SIN ERRORES VISIBLES.

### Variables de Entorno por Ambiente
Usa archivos `.env` específicos:
```
.env.development    # Solo para tu máquina
.env.staging        # Para el servidor de pruebas
.env.production     # Para el servidor real (NUNCA en git)
```

## 2. Docker (Contenedorización)

### Estructura de Archivos Docker
```
proyecto/
├── Dockerfile              # Imagen de la aplicación
├── docker-compose.yml      # Orquestación local
├── docker-compose.prod.yml # Orquestación producción
└── .dockerignore           # Archivos a excluir
```

### Dockerfile Base para NestJS
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Reglas de Oro para Docker
1. **Multi-stage builds:** Compilar en una imagen, ejecutar en otra más liviana.
2. **No root:** Ejecuta la app como usuario no-root por seguridad.
3. **Health checks:** Siempre incluye un endpoint `/health` para verificar que la app está viva.

## 3. CI/CD (Integración y Despliegue Continuo)

### Flujo de Trabajo Estándar
```
Push a GitHub -> Tests Automáticos -> Build Docker -> Deploy a Servidor
```

### GitHub Actions Básico (.github/workflows/deploy.yml)
```yaml
name: Deploy TRIADA
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm ci && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: echo "Aquí va tu script de deploy"
```

## 4. Base de Datos en Producción

### Reglas Críticas
1. **NUNCA uses `synchronize: true` en producción.** Puede destruir datos.
2. **Usa Migraciones:** Crea scripts de migración para cambios de esquema.
   ```bash
   npm run typeorm migration:generate -n NombreDeLaMigracion
   npm run typeorm migration:run
   ```
3. **Backups:** Configura backups automáticos diarios.

### Conexión Segura
```typescript
// app.module.ts (producción)
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Para Supabase/Heroku
  synchronize: false, // ¡CRÍTICO!
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
})
```

## 5. Monitoreo y Logging

### Qué Monitorear
- **Uptime:** ¿La aplicación está respondiendo?
- **Latencia:** ¿Cuánto tarda en responder?
- **Errores:** ¿Cuántos errores 500 hay?
- **Recursos:** CPU, Memoria, Disco.

### Herramientas Recomendadas
- **Logging:** Winston (NestJS) o servicios como Datadog, LogRocket.
- **Uptime:** UptimeRobot (gratis), Pingdom.
- **APM:** New Relic, Sentry (para errores).

### Endpoint de Health Check
```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

## 6. Checklist de Despliegue

Antes de hacer deploy a producción:

- [ ] ¿Los tests pasan localmente?
- [ ] ¿Las variables de entorno están configuradas en el servidor?
- [ ] ¿`synchronize: false` está activo?
- [ ] ¿El backup de la DB está programado?
- [ ] ¿El endpoint `/health` responde correctamente?
- [ ] ¿Los logs están configurados para no exponer datos sensibles?

## 7. Comandos Útiles

```bash
# Ver logs de Docker
docker logs -f nombre_contenedor

# Reiniciar contenedor
docker restart nombre_contenedor

# Ver uso de recursos
docker stats

# Conectar a la DB de producción (con cuidado)
psql $DATABASE_URL
```

---
**Filosofía:** "Si no está automatizado, va a fallar eventualmente."
