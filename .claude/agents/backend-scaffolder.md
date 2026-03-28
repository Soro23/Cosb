---
name: backend-scaffolder
description: Genera la estructura completa del backend Node.js. Úsalo al inicio del desarrollo para crear todos los archivos base: server.js, routes, middleware, services, Dockerfile y .env.example.
---

Genera la estructura completa del backend para el Obsidian-Claude System según las especificaciones del CLAUDE.md.

## Archivos a crear

### `backend/src/server.js`
Express server con:
- Import de rutas: auth, note, search, chat, conversation, vault
- Middleware: cors, express.json(), errorHandler, authMiddleware (en rutas protegidas)
- Rate limiting: 100 req/15min por IP con express-rate-limit
- Puerto desde `process.env.PORT || 3000`

### `backend/src/middleware/auth.js`
Middleware JWT que:
- Lee Bearer token del header Authorization
- Verifica con jsonwebtoken usando JWT_SECRET
- Rechaza con 401 si inválido o ausente

### `backend/src/middleware/errorHandler.js`
Middleware de errores global que:
- Loguea el error
- Devuelve `{ error: message }` con status apropiado
- En producción no expone stack traces

### `backend/src/routes/auth.routes.js`
`POST /api/auth/login` — verifica usuario/password de env vars, devuelve JWT con 7d de expiración

### `backend/src/routes/note.routes.js`
`POST /api/note/create` — usa noteFormatterAgent + vault.service para guardar nota

### `backend/src/routes/search.routes.js`
`POST /api/search` — usa vaultSearchAgent

### `backend/src/routes/chat.routes.js`
`POST /api/chat/ask` — usa ragAgent

### `backend/src/routes/conversation.routes.js`
`POST /api/conversation/save` — usa conversationSaverAgent

### `backend/src/routes/vault.routes.js`
`GET /api/vault/structure` — lista carpetas y archivos del vault

### `backend/src/services/vault.service.js`
Funciones:
- `writeNote(folder, filename, content)` — escribe archivo en vault, crea carpeta si no existe
- `readNote(filepath)` — lee archivo del vault
- `listStructure()` — lista carpetas y archivos recursivamente
- Validar que el path no salga del VAULT_PATH (prevenir path traversal)

### `backend/Dockerfile`
Node 20 Alpine, copia package.json, npm ci --only=production, expone puerto 3000

### `backend/.env.example`
```
ANTHROPIC_API_KEY=sk-ant-xxx
JWT_SECRET=cambia-esto-por-un-secreto-seguro
NODE_ENV=development
PORT=3000
VAULT_PATH=/vault
APP_USERNAME=admin
APP_PASSWORD=cambia-esto
```

### `backend/src/config/env.js`
Valida que todas las variables de entorno requeridas estén presentes al arrancar.

## Dependencias a añadir en package.json
- express
- cors
- express-rate-limit
- jsonwebtoken
- dotenv

## Notas
- Los agentes ya están creados en `backend/src/agents/`
- Usar ES modules (type: "module" ya está en package.json)
- Seguir las especificaciones de endpoints del CLAUDE.md
