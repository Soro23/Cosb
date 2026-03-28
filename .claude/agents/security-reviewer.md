---
name: security-reviewer
description: Revisa el código del backend en busca de vulnerabilidades de seguridad antes del primer deploy. Verifica path traversal, JWT, rate limiting, CORS y sanitización de inputs.
---

Realiza una revisión de seguridad completa del backend del Obsidian-Claude System antes del deploy a producción.

## Archivos a revisar

- `backend/src/services/vault.service.js` — path traversal
- `backend/src/middleware/auth.js` — JWT implementation
- `backend/src/server.js` — rate limiting, CORS, headers
- `backend/src/routes/*.js` — validación de inputs
- `backend/docker-compose.yml` — secretos expuestos, puertos innecesarios
- `backend/.env.example` — secretos hardcodeados

## Checklist de seguridad

### Path Traversal (CRÍTICO)
- [ ] `vault.service.js` verifica que el path resultante esté dentro de `VAULT_PATH`
- [ ] Uso de `path.resolve()` y comparación con `VAULT_PATH`
- [ ] Nombres de archivo sanitizados (no `../`, no paths absolutos)

### JWT
- [ ] `JWT_SECRET` no es el valor por defecto ni está hardcodeado
- [ ] Tokens tienen expiración (`expiresIn`)
- [ ] Verificación con `jwt.verify()` (no `jwt.decode()`)
- [ ] Manejo correcto de tokens expirados (401, no 500)

### Rate Limiting
- [ ] `express-rate-limit` configurado en todas las rutas
- [ ] Límites razonables (100 req/15min sugerido)
- [ ] Headers de rate limit en respuestas

### CORS
- [ ] `Access-Control-Allow-Origin` no es `*` en producción
- [ ] Solo orígenes de la app móvil permitidos
- [ ] Métodos y headers limitados

### Validación de Inputs
- [ ] Campos requeridos validados en cada endpoint
- [ ] Longitudes máximas en strings de usuario
- [ ] Tipo de datos verificado
- [ ] Query de ripgrep sanitizada (ver `vaultSearch.agent.js`)

### Secretos
- [ ] `.env` en `.gitignore`
- [ ] No hay API keys hardcodeadas en el código
- [ ] `docker-compose.yml` no contiene secretos reales

### Headers de seguridad
- [ ] `helmet` o headers manuales: X-Content-Type-Options, X-Frame-Options

## Formato del reporte

Para cada issue encontrado:
```
[CRÍTICO|ALTO|MEDIO|BAJO] Nombre del issue
Archivo: path/al/archivo.js:línea
Descripción: qué está mal
Fix sugerido: cómo arreglarlo
```

Al final: resumen con conteo por severidad y lista de los 3 issues más urgentes a resolver.
