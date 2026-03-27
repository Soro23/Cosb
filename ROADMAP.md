# Obsidian-Claude System — Roadmap de Ejecución

## Resumen ejecutivo

Sistema integrado de tres sub-proyectos que, combinados, permiten capturar notas por voz desde el móvil, consultarlas con IA y sincronizarlas automáticamente con un vault de Obsidian.

| Sub-proyecto | Tecnología | Estado |
|---|---|---|
| **Backend** | Node.js 20, TypeScript, Express, Anthropic SDK | No iniciado |
| **Mobile** | React Native, Expo, TypeScript, Android | No iniciado |
| **Infrastructure** | Docker Compose, Syncthing, Nginx | No iniciado |

**Disponibilidad**: tiempo completo (~6-8h/día)
**Estrategia**: los 3 sub-proyectos avanzan **en paralelo**, con hitos de integración semanales.

### Decisiones de diseño fijadas

- Backend en **TypeScript**
- Mobile: **Android** en Fase 1
- Speech-to-Text: **nativo del OS** en MVP, Whisper (OpenAI) en Fase 2
- RAG: **ripgrep** en MVP, embeddings vectoriales en Fase 2
- Servidor: **ya disponible** (Linux, Docker instalado)

---

## Hitos de integración coordinados

Los tres sub-proyectos deben avanzar sincronizados para que los puntos de integración no bloqueen a ninguno.

| Semana | Backend | Mobile | Infrastructure | Integración |
|--------|---------|--------|---------------|-------------|
| **S1** | Setup + Auth + Vault CRUD | Setup + Nav + LoginScreen | docker-compose.yml + .env | API arranca en Docker |
| **S2** | `/note/create` + `/search` | NewNoteScreen + STT nativo | Syncthing vault sync | Flujo nota móvil → vault |
| **S3** | `/chat/ask` + `/conversation/save` | SearchScreen + ConversationScreen | Nginx + SSL + healthchecks | Flujo RAG end-to-end |
| **S4** | Rate limit + Zod + tests | Settings + polish + APK | Backup scripts + deploy.sh | MVP completo desplegado |

### Criterios de aceptación del MVP (Semana 4)

1. `docker compose up` → API y Syncthing arrancan sin errores
2. `POST /api/auth/login` → devuelve JWT válido
3. `POST /api/note/create` (con JWT) → archivo `.md` aparece en vault → Syncthing lo sincroniza → visible en Obsidian del ordenador
4. `POST /api/search` → devuelve resultados reales del vault
5. `POST /api/chat/ask` → Claude responde usando contexto de notas del vault
6. App Android: grabar voz → transcribir → guardar → archivo aparece en Obsidian

---

## Sub-proyecto 1: Backend (`/backend`)

**Stack**: Node.js 20 LTS · TypeScript · Express.js · Anthropic SDK · JWT · ripgrep · Zod · Vitest

### Estructura de archivos objetivo

```
backend/
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── server.ts
    ├── config/
    │   └── env.ts
    ├── middleware/
    │   ├── auth.ts
    │   └── errorHandler.ts
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── note.routes.ts
    │   ├── search.routes.ts
    │   ├── chat.routes.ts
    │   └── conversation.routes.ts
    ├── services/
    │   ├── claude.service.ts
    │   ├── vault.service.ts
    │   ├── search.service.ts
    │   ├── rag.service.ts
    │   └── template.service.ts
    └── utils/
        ├── logger.ts
        └── markdown.ts
```

---

### Fase 1 — MVP (Semanas 1–4)

#### Semana 1: Cimientos

- [ ] Init proyecto TypeScript (tsconfig strict, ESM, paths)
- [ ] Express server con middlewares base: CORS, helmet, morgan, body-parser
- [ ] `config/env.ts`: carga y valida variables de entorno con Zod
- [ ] `utils/logger.ts`: logger estructurado (pino o winston)
- [ ] JWT auth:
  - [ ] `POST /api/auth/login` — valida credencial única, devuelve JWT (7d)
  - [ ] `middleware/auth.ts` — verifica token en cabecera Authorization
- [ ] `vault.service.ts`:
  - [ ] `createFile(path, content)` — escribe archivo en vault
  - [ ] `readFile(path)` — lee archivo
  - [ ] `listFolder(folder)` — lista archivos de una carpeta
  - [ ] `getStructure()` — árbol completo del vault
  - [ ] Sanitización de rutas: prevenir path traversal
- [ ] `.env.example` con todas las variables necesarias
- [ ] `middleware/errorHandler.ts`: manejador de errores centralizado

**Entregable S1**: servidor arranca, login devuelve JWT, operaciones básicas de vault funcionan.

---

#### Semana 2: Crear notas y buscar

- [ ] `claude.service.ts`:
  - [ ] `formatNote(rawText, type)` — envía a Claude, devuelve markdown formateado
  - [ ] `askWithContext(question, context)` — consulta con contexto del vault
  - [ ] Configuración de model, max_tokens, system prompt
- [ ] `template.service.ts`:
  - [ ] Plantillas por tipo: `idea`, `journal`, `note`, `conversation`
  - [ ] Generación de frontmatter YAML (fecha, tags, source, type)
- [ ] `POST /api/note/create`:
  - [ ] Recibe `{ content, folder, filename? }`
  - [ ] Claude formatea el texto
  - [ ] Genera frontmatter automático
  - [ ] Guarda en vault con nombre `YYYY-MM-DD-slug.md`
  - [ ] Responde `{ success, path, content }`
- [ ] `GET /api/vault/structure`: devuelve árbol de carpetas y archivos
- [ ] `search.service.ts`:
  - [ ] Wrapper de ripgrep: `search(query, vaultPath)`
  - [ ] Parseo de salida JSON de ripgrep
  - [ ] Extracción de contexto (±3 líneas)
- [ ] `POST /api/search`:
  - [ ] Recibe `{ query }`
  - [ ] Devuelve `{ results: [{ file, matches, context }] }`

**Entregable S2**: se puede crear una nota desde curl y aparece en el vault. La búsqueda devuelve resultados reales.

---

#### Semana 3: RAG y conversaciones

- [ ] `rag.service.ts` (versión ripgrep):
  - [ ] `getContext(question)` — busca con ripgrep, toma top 5 resultados
  - [ ] Formatea contexto como bloque de texto con fuentes
  - [ ] Devuelve `{ context, sources: string[] }`
- [ ] `POST /api/chat/ask`:
  - [ ] Recibe `{ question }`
  - [ ] Obtiene contexto del vault via `rag.service`
  - [ ] Envía pregunta + contexto a Claude
  - [ ] Devuelve `{ answer, sources: [] }`
- [ ] `POST /api/conversation/save`:
  - [ ] Recibe `{ messages: Message[], title? }`
  - [ ] Formatea como nota estructurada markdown
  - [ ] Guarda en `vault/Conversaciones/YYYY-MM-DD-titulo.md`
  - [ ] Responde `{ success, path }`
- [ ] Frontmatter automático con tags extraídos del contenido (heurística simple)

**Entregable S3**: flujo RAG completo funciona en local. Se pueden guardar conversaciones.

---

#### Semana 4: Seguridad, calidad y Dockerfile

- [ ] Rate limiting: `express-rate-limit` — 100 req/15min por IP
- [ ] Validación de inputs con Zod en todos los endpoints
- [ ] Sanitización extra en nombres de archivo (whitelist de caracteres)
- [ ] Tests con Vitest:
  - [ ] Unit tests: `vault.service`, `search.service`, `template.service`
  - [ ] Integration tests: endpoints principales con supertest
- [ ] `Dockerfile` multi-stage (build → production, imagen mínima)
- [ ] `.dockerignore`

**Entregable S4**: backend listo para producción, tests pasan, imagen Docker construye correctamente.

---

### Fase 2 — RAG avanzado (Semanas 5–8)

- [ ] Elegir proveedor de embeddings: OpenAI `text-embedding-3-small` o modelo local
- [ ] `rag.service.ts` v2:
  - [ ] Pre-procesar vault: generar y cachear embeddings de cada nota
  - [ ] Al consultar: embedding de la pregunta → cosine similarity → top K notas
  - [ ] Invalidar caché cuando Syncthing detecta cambio (filesystem watcher)
- [ ] Vector store: JSON persistido en disco para empezar; migrar a Chroma si el vault supera ~1000 notas
- [ ] Background job: re-indexar vault al arrancar y cuando cambia un archivo

---

### Fase 3 — Mejoras (Semana 9+)

- [ ] Streaming responses via Server-Sent Events
- [ ] Backlinks automáticos: al crear nota, buscar notas relacionadas y añadir referencias
- [ ] Sugerencias de `[[wikilinks]]` al guardar
- [ ] Endpoint OCR: recibe imagen → extrae texto → crea nota
- [ ] Abstracción multi-modelo: interfaz `AIProvider` para cambiar de Claude a otro LLM

---

## Sub-proyecto 2: Mobile (`/mobile`)

**Stack**: React Native · Expo SDK 51+ · TypeScript · React Navigation · Zustand · AsyncStorage · Android

### Estructura de archivos objetivo

```
mobile/
├── package.json
├── app.json
├── babel.config.js
├── tsconfig.json
├── App.tsx
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx
    ├── screens/
    │   ├── LoginScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── NewNoteScreen.tsx
    │   ├── SearchScreen.tsx
    │   ├── ConversationScreen.tsx
    │   └── SettingsScreen.tsx
    ├── components/
    │   ├── VoiceRecorder.tsx
    │   ├── NotePreview.tsx
    │   └── ChatMessage.tsx
    ├── api/
    │   ├── client.ts
    │   └── endpoints.ts
    ├── store/
    │   └── authStore.ts
    ├── types/
    │   └── index.ts
    └── utils/
        ├── speech.ts
        └── formatting.ts
```

---

### Fase 1 — MVP (Semanas 1–4)

#### Semana 1: Cimientos y autenticación

- [ ] Init Expo project: `npx create-expo-app mobile --template expo-template-blank-typescript`
- [ ] Configurar `app.json`: nombre, bundle identifier, Android target SDK
- [ ] React Navigation:
  - [ ] Stack Navigator raíz (Login → App)
  - [ ] Bottom Tab Navigator (Home, Search, Conversation, Settings)
- [ ] `api/client.ts`:
  - [ ] Fetch wrapper con base URL configurable
  - [ ] Inyección automática de JWT en cabecera `Authorization`
  - [ ] Manejo de errores HTTP (401 → logout, 5xx → toast)
- [ ] `api/endpoints.ts`: tipado TypeScript de todos los requests y responses
- [ ] `store/authStore.ts` con Zustand:
  - [ ] Estado: `token`, `isAuthenticated`
  - [ ] Acciones: `login(token)`, `logout()`
  - [ ] Persistencia en AsyncStorage
- [ ] `LoginScreen.tsx`:
  - [ ] Campo de contraseña + botón login
  - [ ] Llama a `POST /api/auth/login`
  - [ ] Guarda JWT y redirige a Home
- [ ] `types/index.ts`: interfaces compartidas (Note, Message, SearchResult, etc.)

**Entregable S1**: app arranca en Android, se puede hacer login y el token queda guardado.

---

#### Semana 2: Crear notas con voz

- [ ] `utils/speech.ts`:
  - [ ] `startRecording()` / `stopRecording()` usando `expo-av` o `@react-native-voice/voice`
  - [ ] Transcripción con Speech Recognition nativo de Android
  - [ ] Fallback: input de texto si STT no disponible
- [ ] `VoiceRecorder.tsx`:
  - [ ] Botón micrófono animado (pulsa → graba → suelta → transcribe)
  - [ ] Estado visual: idle / recording / transcribing / done
  - [ ] Devuelve texto transcrito via callback
- [ ] `HomeScreen.tsx`:
  - [ ] 3 botones grandes: "Nueva nota", "Consultar vault", "Conversar"
  - [ ] Navegación a cada pantalla
- [ ] `NewNoteScreen.tsx`:
  - [ ] `VoiceRecorder` integrado
  - [ ] TextInput editable con el texto transcrito
  - [ ] Picker de carpeta destino: Inbox / Ideas / Journal / Conversaciones
  - [ ] Botón "Guardar en Obsidian"
  - [ ] Llama a `POST /api/note/create`
  - [ ] Feedback visual: spinner → "✓ Guardado en Obsidian"
- [ ] `SettingsScreen.tsx` básico:
  - [ ] Input para URL de la API
  - [ ] Botón logout
  - [ ] Guardar settings en AsyncStorage

**Entregable S2**: se puede grabar voz, editar el texto y guardarlo como nota en Obsidian desde el móvil.

---

#### Semana 3: Búsqueda y conversación

- [ ] `SearchScreen.tsx`:
  - [ ] Input de texto + botón de voz para la pregunta
  - [ ] Llama a `POST /api/chat/ask`
  - [ ] Muestra la respuesta de Claude formateada
  - [ ] Chips clicables por cada nota fuente (`sources[]`)
  - [ ] Estado de carga con skeleton
- [ ] `ConversationScreen.tsx`:
  - [ ] `FlatList` de mensajes con scroll automático al último
  - [ ] Input de texto + botón voz para cada mensaje
  - [ ] Mensajes enviados a `POST /api/chat/ask` con historial acumulado
  - [ ] Botón "Guardar conversación" → llama a `POST /api/conversation/save`
  - [ ] Feedback "✓ Guardado en Obsidian"
- [ ] `ChatMessage.tsx`:
  - [ ] Burbuja de mensaje (usuario vs. Claude) con estilos diferenciados
  - [ ] Soporte básico de markdown en respuestas de Claude

**Entregable S3**: flujo completo RAG funciona desde el móvil. Se pueden guardar conversaciones.

---

#### Semana 4: Polish y build

- [ ] `NotePreview.tsx`: preview de markdown con `react-native-markdown-display`
- [ ] Error handling global: pantalla de error + retry para fallos de red
- [ ] Estados de carga en todas las pantallas (ActivityIndicator o skeleton)
- [ ] Feedback háptico en acciones importantes (`expo-haptics`)
- [ ] Pruebas en dispositivo físico Android (o emulador)
- [ ] Ajuste de permisos Android en `app.json`: micrófono, internet
- [ ] Build APK de prueba con EAS Build o `expo build:android`
- [ ] Fix de bugs encontrados en pruebas

**Entregable S4**: APK instalable en Android, flujo completo funciona en dispositivo real.

---

### Fase 2 — Mejoras (Semanas 5–8)

- [ ] Toggle en Settings: STT nativo vs. Whisper API (OpenAI)
  - [ ] `utils/speech.ts` v2: soporte para Whisper (`POST audio → /v1/audio/transcriptions`)
- [ ] Offline queue: operaciones pendientes en AsyncStorage cuando no hay red
  - [ ] Al recuperar conexión: enviar cola automáticamente
- [ ] Vista previa de notas del vault: `GET /api/vault/structure` → lista de notas
- [ ] Edición de notas: `PUT /api/note/:path` (requiere nuevo endpoint en backend)
- [ ] Filtros de búsqueda por etiquetas

---

### Fase 3 — Avanzado (Semana 9+)

- [ ] Widget de captura rápida para Android (Expo Widgets o módulo nativo)
- [ ] Notificaciones push con FCM (`expo-notifications`)
- [ ] Intent de "compartir" desde otras apps → abre NewNoteScreen con el contenido
- [ ] Adjuntar foto → OCR en backend → crear nota con texto extraído

---

## Sub-proyecto 3: Infrastructure (`/infrastructure`)

**Stack**: Docker Compose · Syncthing · Nginx · Let's Encrypt (certbot) · bash scripts · servidor Linux existente

### Estructura de archivos objetivo

```
/                              ← raíz del repositorio
├── docker-compose.yml
├── .env.example
├── .gitignore
└── infrastructure/
    ├── syncthing/
    │   ├── config.xml.example
    │   └── .stignore.example
    ├── nginx/
    │   └── nginx.conf.example
    └── scripts/
        ├── setup.sh
        ├── backup-vault.sh
        └── deploy.sh
```

---

### Fase 1 — MVP (Semanas 1–4)

#### Semana 1: Docker y configuración base

- [ ] `.gitignore` raíz:
  - [ ] `node_modules/`, `dist/`, `.env`, `vault-data/`, `*.log`
  - [ ] `.obsidian/workspace*`, `.trash/`
- [ ] `.env.example` con todas las variables:
  ```
  ANTHROPIC_API_KEY=sk-ant-xxx
  JWT_SECRET=cambia-esto
  NODE_ENV=production
  PORT=3000
  VAULT_PATH=/vault
  ```
- [ ] `docker-compose.yml`:
  - [ ] Servicio `api`: build desde `./backend`, volumen vault, red interna
  - [ ] Servicio `syncthing`: imagen oficial, volumen vault compartido, puertos 8384/22000
  - [ ] Volume `vault-data` compartido entre ambos servicios
  - [ ] Network `obsidian-network` interna
  - [ ] `restart: unless-stopped` en ambos servicios
  - [ ] `healthcheck` en servicio `api`
- [ ] `infrastructure/scripts/setup.sh`:
  - [ ] Instala Docker y Docker Compose si no están
  - [ ] Crea directorio de trabajo y copia `.env.example` → `.env`
  - [ ] Primer `docker compose pull`
  - [ ] Instrucciones finales en pantalla
- [ ] Verificar que `docker compose up` arranca sin errores en servidor

**Entregable S1**: stack Docker arranca en el servidor. API responde en puerto 3000.

---

#### Semana 2: Syncthing y sincronización del vault

- [ ] `infrastructure/syncthing/config.xml.example`:
  - [ ] Configuración mínima documentada (folder path, GUI password)
- [ ] `infrastructure/syncthing/.stignore.example`:
  ```
  .obsidian/workspace
  .obsidian/workspace.json
  .obsidian/workspaces.json
  .trash/
  *.tmp
  ```
- [ ] Configurar Syncthing en el servidor:
  - [ ] Acceder a UI en `http://servidor:8384`
  - [ ] Cambiar contraseña de la GUI
  - [ ] Añadir carpeta `/vault` compartida
- [ ] Configurar Syncthing en el ordenador local:
  - [ ] Instalar cliente Syncthing
  - [ ] Vincular los dos dispositivos (intercambiar Device IDs)
  - [ ] Apuntar carpeta local al vault de Obsidian
- [ ] Verificar sincronización bidireccional:
  - [ ] Crear archivo en servidor → aparece en Obsidian del ordenador
  - [ ] Crear nota en Obsidian → aparece en `/vault` del servidor
- [ ] Ajustar permisos del volumen Docker (UID/GID del proceso Syncthing)

**Entregable S2**: sincronización bidireccional funcionando. Flujo completo nota móvil → vault → Obsidian.

---

#### Semana 3: Nginx, SSL y observabilidad

- [ ] `infrastructure/nginx/nginx.conf.example`:
  - [ ] Reverse proxy hacia el contenedor `api` en puerto 3000
  - [ ] Redirect HTTP → HTTPS
  - [ ] Rate limiting a nivel Nginx (`limit_req_zone`)
  - [ ] Cabeceras de seguridad: HSTS, X-Frame-Options, X-Content-Type-Options
  - [ ] Bloques `server` con `server_name` parametrizable
- [ ] SSL con Let's Encrypt:
  - [ ] Instalar certbot en el servidor
  - [ ] Obtener certificado para el dominio
  - [ ] Configurar renovación automática (`certbot renew --quiet`)
- [ ] Health check endpoint en la API (`GET /health` → `{ status: "ok", version }`)
- [ ] Docker healthcheck en `docker-compose.yml` apuntando a `/health`
- [ ] Configurar rotación de logs Docker (`json-file` con `max-size` y `max-file`)

**Entregable S3**: API accesible via HTTPS con dominio propio. Nginx gestiona SSL.

---

#### Semana 4: Operaciones y resiliencia

- [ ] `infrastructure/scripts/backup-vault.sh`:
  - [ ] Comprime `/vault` en `tar.gz` con timestamp
  - [ ] Guarda en directorio de backups (configurable)
  - [ ] Elimina backups de más de N días
  - [ ] Añadir al cron del servidor: diariamente a las 3:00 AM
- [ ] `infrastructure/scripts/deploy.sh`:
  - [ ] `git pull origin main`
  - [ ] `docker compose build --no-cache api`
  - [ ] `docker compose up -d --force-recreate api`
  - [ ] Espera health check antes de declarar éxito
- [ ] Script de monitorización básica:
  - [ ] Ping al endpoint `/health` cada 5 minutos
  - [ ] Si falla 3 veces → envía alerta (curl a webhook o email)
- [ ] Documentar proceso de recovery en caso de fallo del servidor

**Entregable S4**: operaciones de producción cubiertas (backup, deploy, monitorización).

---

### Fase 2 — Robustez (Semanas 5–8)

- [ ] Vault como repositorio git:
  - [ ] `git init` en `/vault`
  - [ ] Cron: `git add -A && git commit -m "auto: $(date)"` cada hora
  - [ ] Historial completo de cambios en notas
- [ ] Watchdog para la API:
  - [ ] Si `/health` no responde → `docker compose restart api`
  - [ ] Notificación de reinicio
- [ ] Métricas básicas:
  - [ ] Número de requests/día (parseo de logs Nginx)
  - [ ] Tiempo de respuesta promedio
  - [ ] Tasa de errores 5xx
- [ ] Automatizar renovación SSL con cron mensual

---

### Fase 3 — Avanzado (Semana 9+)

- [ ] Migrar de Nginx a Traefik:
  - [ ] Auto-SSL sin configurar certbot manualmente
  - [ ] Dashboard de rutas y servicios
- [ ] Soporte multi-vault / multi-usuario:
  - [ ] Un volumen por usuario, Docker network por usuario
- [ ] Pipeline CI básico: lint + test en cada push al repositorio
- [ ] Documentación completa de disaster recovery con pasos probados

---

## Registro de decisiones (ADR)

| # | Decisión | Alternativas consideradas | Motivo |
|---|---|---|---|
| 1 | TypeScript en backend | JavaScript puro | Tipado estático → menos bugs, mejor DX con Anthropic SDK |
| 2 | Android en Fase 1 | iOS, ambas plataformas | Simplifica build inicial; iOS en Fase 2 |
| 3 | STT nativo OS en MVP | Whisper API | Sin coste, sin dependencia externa para validar el flujo |
| 4 | ripgrep para RAG en MVP | Embeddings, Chroma | Suficiente para vaults pequeños/medianos; implementación en horas |
| 5 | Monorepo único | Repositorios separados | Facilita coordinar cambios entre sub-proyectos |
| 6 | Express.js | Fastify, Hono | Ecosistema más amplio, más ejemplos con Anthropic SDK |
| 7 | Syncthing | rsync, OneDrive, Dropbox | Bidireccional, offline-first, sin límites de almacenamiento, open source |

---

*Última actualización: 2026-03-27*
