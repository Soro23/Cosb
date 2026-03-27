# Obsidian-Claude System

## Índice

1. [Visión del proyecto](#visión-del-proyecto)
2. [Problema que resuelve](#problema-que-resuelve)
3. [Arquitectura general](#arquitectura-general)
4. [Stack tecnológico](#stack-tecnológico)
5. [Componentes del sistema](#componentes-del-sistema)
6. [Flujos de trabajo](#flujos-de-trabajo)
7. [Estructura de repositorios](#estructura-de-repositorios)
8. [Infraestructura](#infraestructura)
9. [Seguridad](#seguridad)
10. [Roadmap](#roadmap)

---

## Visión del proyecto

Sistema integrado que permite interactuar con Claude desde cualquier dispositivo (especialmente móvil) y que automáticamente sincronice el conocimiento generado con un vault de Obsidian, convirtiéndolo en un verdadero "segundo cerebro" accesible y actualizable desde cualquier lugar.

### Objetivos principales

- **Captura ubicua**: Crear notas hablando desde el móvil, en cualquier momento y lugar
- **Consulta inteligente**: Preguntar a Claude sobre el contenido de tu vault (RAG)
- **Sincronización automática**: Todo lo que crees se sincroniza automáticamente con Obsidian
- **Conversaciones persistentes**: Guardar chats importantes como notas estructuradas
- **Sin fricción**: Mínima interacción manual, máxima automatización

---

## Problema que resuelve

### Situación actual

- Obsidian funciona perfectamente como segundo cerebro en ordenador
- La captura móvil es manual: hablar con Claude → copiar → pegar en Obsidian
- No hay forma de consultar el vault desde móvil usando Claude
- Las conversaciones con Claude se pierden si no las copias manualmente

### Solución propuesta

- App móvil dedicada que habla con tu propia API
- API en servidor 24/7 que integra Claude + vault de Obsidian
- Sincronización bidireccional automática entre servidor y ordenador (Syncthing)
- Speech-to-text integrado para captura por voz
- RAG sobre el vault para consultas inteligentes

---

## Arquitectura general

```
┌─────────────────┐
│   App Móvil     │
│  (React Native) │
│                 │
│  - Speech input │
│  - Nueva nota   │
│  - Consultar    │
│  - Conversación │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────────────────────┐
│    Servidor (Docker)            │
│                                 │
│  ┌──────────────────────────┐  │
│  │   API Backend (Node.js)  │  │
│  │   - Express/Fastify      │  │
│  │   - Anthropic SDK        │  │
│  │   - JWT Auth             │  │
│  └──────────┬───────────────┘  │
│             │                   │
│             ▼                   │
│  ┌──────────────────────────┐  │
│  │  Vault (Docker Volume)   │  │
│  │  /vault/                 │  │
│  │    ├── Inbox/            │  │
│  │    ├── Ideas/            │  │
│  │    ├── Conversaciones/   │  │
│  │    └── ...               │  │
│  └──────────┬───────────────┘  │
│             │                   │
│             ▼                   │
│  ┌──────────────────────────┐  │
│  │  Syncthing               │  │
│  │  (Sincronización)        │  │
│  └──────────┬───────────────┘  │
└─────────────┼───────────────────┘
              │ Bidireccional
              ▼
     ┌────────────────────┐
     │  Ordenador Local   │
     │                    │
     │  Syncthing Client  │
     │         ▼          │
     │  Obsidian Vault    │
     └────────────────────┘
```

### Flujo de datos

1. **Usuario → App móvil**: Voz o texto
2. **App → API**: Request HTTP con contenido
3. **API → Claude**: Procesa con Anthropic API
4. **API → Vault**: Guarda archivo .md en vault local
5. **Syncthing**: Detecta cambio y sincroniza
6. **Ordenador**: Obsidian refleja el cambio automáticamente

---

## Stack tecnológico

### Backend (API)

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js (alternativa: Fastify)
- **IA**: Anthropic SDK (`@anthropic-ai/sdk`)
- **Autenticación**: JWT (jsonwebtoken)
- **Búsqueda**: ripgrep (para búsquedas rápidas en vault)
- **Alternativa RAG avanzado**: 
  - Embeddings: OpenAI embeddings o sentence-transformers
  - Vector DB: Chroma o simple JSON con cosine similarity

### Mobile (App)

- **Framework**: React Native + Expo
- **Lenguaje**: TypeScript
- **UI**: React Native Paper o NativeBase
- **Speech-to-Text**: 
  - Expo Speech (expo-speech)
  - Alternativa: Web Speech API
  - Alternativa cloud: Whisper API (OpenAI)
- **Estado**: Zustand o Context API
- **HTTP Client**: Fetch API nativo
- **Storage local**: AsyncStorage (para JWT)

### Infraestructura

- **Contenedores**: Docker + Docker Compose
- **Sincronización**: Syncthing
- **Reverse Proxy** (opcional): Nginx o Traefik
- **SSL**: Let's Encrypt (si API expuesta públicamente)
- **OS Servidor**: Linux (Ubuntu/Debian)

### Vault

- **Formato**: Markdown (.md)
- **Estructura**: Obsidian vault estándar
- **Metadata**: YAML frontmatter
- **Templates**: Plantillas predefinidas por tipo de nota

---

## Componentes del sistema

### 1. API Backend (`/backend`)

#### Endpoints principales

```
POST /api/auth/login
  - Autenticación de usuario
  - Retorna JWT

POST /api/note/create
  - Crea nueva nota en el vault
  - Body: { content, folder, filename? }
  - Claude procesa y formatea el contenido
  - Guarda en vault
  - Response: { success, path, content }

POST /api/search
  - Busca en el vault usando ripgrep
  - Body: { query }
  - Response: { results: [{ file, matches, context }] }

POST /api/chat/ask
  - Consulta al vault usando RAG
  - Body: { question }
  - Busca contexto relevante en vault
  - Claude responde usando ese contexto
  - Response: { answer, sources: [] }

POST /api/conversation/save
  - Guarda conversación completa
  - Body: { messages: [], title? }
  - Formatea como nota estructurada
  - Guarda en Conversaciones/
  - Response: { success, path }

GET /api/vault/structure
  - Retorna estructura de carpetas del vault
  - Response: { folders: [], files: [] }
```

#### Servicios internos

```javascript
services/
  ├── claude.js         // Wrapper Anthropic API
  ├── vault.js          // CRUD en filesystem del vault
  ├── search.js         // Búsqueda con ripgrep
  ├── rag.js            // RAG: embeddings + contexto
  └── templates.js      // Plantillas para notas
```

#### Estructura de nota generada

```markdown
---
created: 2026-03-27T14:30:00
tags: [idea, móvil, voz]
source: mobile-app
---

# Título de la nota

Contenido procesado por Claude...

## Referencias
- [[otra-nota]]
```

### 2. App Móvil (`/mobile`)

#### Pantallas principales

```
src/
  screens/
    ├── HomeScreen.tsx           // 3 botones principales
    ├── NewNoteScreen.tsx        // Crear nota con voz
    ├── SearchScreen.tsx         // Consultar vault
    ├── ConversationScreen.tsx   // Chat con Claude
    └── SettingsScreen.tsx       // Config API, carpetas, etc
```

#### Flujo NewNoteScreen

1. Usuario presiona botón micrófono
2. Graba audio (Expo Audio)
3. Convierte a texto (Speech-to-text)
4. Muestra texto para editar/confirmar
5. Presiona "Guardar"
6. Llama a `POST /api/note/create`
7. Muestra confirmación "✓ Guardado en Obsidian"

#### Flujo SearchScreen

1. Usuario escribe o habla pregunta
2. Llama a `POST /api/chat/ask`
3. API busca contexto en vault
4. Claude genera respuesta
5. Muestra respuesta + fuentes
6. Opción: "Guardar esta conversación"

### 3. Syncthing

#### Configuración

- **Folder compartido**: `/vault` (en servidor)
- **Sincronización**: Bidireccional
- **Conflictos**: Mantener ambas versiones
- **Ignore patterns**: `.obsidian/workspace*`, `.trash/`

#### Dispositivos

1. **Servidor Docker**: Syncthing container con `/vault` montado
2. **Ordenador**: Syncthing desktop → carpeta local de Obsidian

---

## Flujos de trabajo

### Flujo 1: Crear nota desde móvil

```
Usuario habla
    ↓
[Speech-to-Text en app]
    ↓
Texto mostrado para confirmar
    ↓
Usuario confirma y elige carpeta (Inbox/Ideas/etc)
    ↓
POST /api/note/create
    ↓
API: Claude formatea el texto
    ↓
API: Escribe archivo en /vault/Inbox/2026-03-27-idea.md
    ↓
Syncthing detecta cambio
    ↓
Sincroniza con ordenador
    ↓
Obsidian muestra la nueva nota
```

### Flujo 2: Consultar el vault

```
Usuario pregunta: "¿Qué apuntes tengo sobre React Native?"
    ↓
POST /api/chat/ask
    ↓
API: Busca "React Native" en vault (ripgrep)
    ↓
API: Encuentra 3 notas relevantes
    ↓
API: Envía contexto a Claude
    ↓
Claude: Resume y responde basándose en esas notas
    ↓
API: Retorna respuesta + enlaces a notas fuente
    ↓
App: Muestra respuesta con chips clicables por nota
```

### Flujo 3: Guardar conversación

```
Usuario chatea con Claude (varios mensajes)
    ↓
Usuario presiona "Guardar conversación"
    ↓
POST /api/conversation/save
    ↓
API: Formatea mensajes como markdown estructurado
    ↓
API: Guarda en /vault/Conversaciones/2026-03-27-chat-react.md
    ↓
Syncthing sincroniza
    ↓
Disponible en Obsidian
```

---

## Estructura de repositorios

### Monorepo (recomendado)

```
obsidian-claude-system/
├── README.md
├── CLAUDE.md                    # Este archivo
├── .gitignore
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json            # Si usas TypeScript
│   ├── .env.example
│   │
│   └── src/
│       ├── server.js
│       ├── config/
│       │   ├── env.js
│       │   └── anthropic.js
│       ├── middleware/
│       │   ├── auth.js
│       │   └── errorHandler.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── note.routes.js
│       │   ├── search.routes.js
│       │   ├── chat.routes.js
│       │   └── conversation.routes.js
│       ├── services/
│       │   ├── claude.service.js
│       │   ├── vault.service.js
│       │   ├── search.service.js
│       │   ├── rag.service.js
│       │   └── template.service.js
│       └── utils/
│           ├── logger.js
│           └── markdown.js
│
├── mobile/
│   ├── package.json
│   ├── app.json
│   ├── babel.config.js
│   ├── tsconfig.json
│   ├── App.tsx
│   │
│   └── src/
│       ├── navigation/
│       │   └── AppNavigator.tsx
│       ├── screens/
│       │   ├── HomeScreen.tsx
│       │   ├── NewNoteScreen.tsx
│       │   ├── SearchScreen.tsx
│       │   ├── ConversationScreen.tsx
│       │   └── SettingsScreen.tsx
│       ├── components/
│       │   ├── VoiceRecorder.tsx
│       │   ├── NotePreview.tsx
│       │   └── ChatMessage.tsx
│       ├── api/
│       │   ├── client.ts
│       │   └── endpoints.ts
│       ├── store/
│       │   └── authStore.ts
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           ├── speech.ts
│           └── formatting.ts
│
└── infrastructure/
    ├── syncthing/
    │   └── config.xml.example
    ├── nginx/
    │   └── nginx.conf.example
    └── scripts/
        ├── setup.sh
        ├── backup-vault.sh
        └── deploy.sh
```

---

## Infraestructura

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: ./backend
    container_name: obsidian-claude-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - VAULT_PATH=/vault
    volumes:
      - vault-data:/vault
    networks:
      - obsidian-network

  syncthing:
    image: syncthing/syncthing:latest
    container_name: obsidian-syncthing
    restart: unless-stopped
    ports:
      - "8384:8384"      # Web UI
      - "22000:22000"    # Sync
      - "21027:21027/udp"
    volumes:
      - vault-data:/vault
      - syncthing-config:/var/syncthing/config
    environment:
      - PUID=1000
      - PGID=1000
    networks:
      - obsidian-network

volumes:
  vault-data:
  syncthing-config:

networks:
  obsidian-network:
```

### Variables de entorno

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-xxx
JWT_SECRET=tu-secreto-super-seguro-aquí
NODE_ENV=production
PORT=3000
VAULT_PATH=/vault

# Opcional: para RAG avanzado
OPENAI_API_KEY=sk-xxx  # Si usas embeddings de OpenAI
```

---

## Seguridad

### Autenticación

- **JWT**: Token firmado con secret
- **Expiración**: 7 días (configurable)
- **Refresh tokens**: Implementar si se necesita persistencia larga
- **Almacenamiento móvil**: AsyncStorage (encriptado en iOS/Android)

### API

- **HTTPS obligatorio** en producción
- **Rate limiting**: express-rate-limit (100 req/15min por IP)
- **CORS**: Solo app móvil permitida
- **Validación input**: express-validator o Zod
- **Sanitización**: Prevenir path traversal en nombres de archivo

### Vault

- **Permisos**: API solo puede escribir en vault, no borrar (soft delete)
- **Backup**: Script diario de backup del vault
- **Git opcional**: Vault como repo git para historial

### Syncthing

- **Contraseña UI**: Cambiar default
- **Firewall**: Exponer solo puertos necesarios
- **Encriptación**: Todo el tráfico Syncthing va encriptado

---

## Roadmap

### MVP (Fase 1) - 2 semanas

- [x] Arquitectura definida
- [ ] Backend básico (Express + Anthropic + filesystem)
- [ ] Endpoint crear nota
- [ ] Endpoint búsqueda simple (ripgrep)
- [ ] Docker compose con Syncthing
- [ ] App móvil: pantalla crear nota
- [ ] App móvil: speech-to-text básico
- [ ] Sincronización funcionando

### Fase 2 - 1 mes

- [ ] RAG: consulta inteligente al vault
- [ ] Embeddings + vector search
- [ ] Guardar conversaciones
- [ ] App móvil: pantalla de búsqueda/consulta
- [ ] App móvil: pantalla de chat
- [ ] Templates para diferentes tipos de nota
- [ ] Frontmatter automático

### Fase 3 - Mejoras

- [ ] Notificaciones push cuando se guarda nota
- [ ] OCR de imágenes → texto → nota
- [ ] Adjuntar imágenes a notas
- [ ] Búsqueda por etiquetas
- [ ] Vista previa de notas en app móvil
- [ ] Editar notas desde móvil
- [ ] Backlinks automáticos
- [ ] Sugerencias de enlaces relacionados

### Fase 4 - Avanzado

- [ ] Modo offline: cola de sincronización
- [ ] Multi-usuario (diferentes vaults)
- [ ] Integración con calendario (crear eventos)
- [ ] Integración con tareas (crear TODOs en Obsidian)
- [ ] Web UI (alternativa a app móvil)
- [ ] Shortcuts de iOS/Android
- [ ] Widget de captura rápida

---

## Casos de uso

### 1. Captura de ideas

> **Escenario**: Voy caminando y se me ocurre una idea para un proyecto

1. Saco el móvil
2. Abro app → "Nueva nota"
3. Hablo: "Idea: crear un plugin de Obsidian que integre..."
4. Confirmo
5. Se guarda en `Ideas/2026-03-27-plugin-obsidian.md`
6. Cuando llego al ordenador, está en Obsidian

### 2. Consulta rápida

> **Escenario**: Necesito recordar algo que anoté hace tiempo

1. Abro app → "Consultar"
2. Pregunto: "¿Qué framework decidí usar para el backend del proyecto X?"
3. Claude busca en mis notas y responde: "Según tu nota del 15 de marzo, decidiste usar Fastify por..."
4. Veo el enlace a la nota original

### 3. Reflexión diaria

> **Escenario**: Quiero hacer journaling al final del día

1. Abro app → "Nueva nota"
2. Hablo durante 2 minutos sobre mi día
3. Claude lo estructura como journal entry
4. Se guarda en `Journal/2026-03-27.md`
5. Con etiquetas de emociones/eventos extraídas automáticamente

### 4. Conversación profunda

> **Escenario**: Tengo una conversación larga con Claude sobre un tema

1. Abro app → "Conversación"
2. Chateamos durante 15 minutos sobre arquitectura de software
3. Presiono "Guardar conversación"
4. Se guarda estructurada en `Conversaciones/2026-03-27-arquitectura.md`
5. Puedo referenciarla después con `[[2026-03-27-arquitectura]]`

---

## Notas técnicas

### Speech-to-Text: Opciones

1. **Expo Speech** (gratis, local)
   - Limitado a idiomas soportados por OS
   - Puede tener calidad variable

2. **Web Speech API** (gratis, navegador)
   - Funciona en web views
   - Requiere conexión

3. **Whisper API** (OpenAI, pago)
   - Mejor calidad
   - Multiidioma excelente
   - ~$0.006 por minuto

### RAG: Opciones

**Simple (MVP)**:
```javascript
// Buscar con ripgrep
const results = execSync(`rg -i "${query}" /vault --json`);
// Tomar top 3 resultados
// Enviar a Claude como contexto
```

**Avanzado**:
```javascript
// 1. Pre-procesar vault: generar embeddings de cada nota
// 2. Al consultar: embedding de la pregunta
// 3. Cosine similarity → top K notas
// 4. Enviar contexto a Claude
```

### Estructura de nota ideal

```markdown
---
created: 2026-03-27T14:30:00
updated: 2026-03-27T14:30:00
tags: [tag1, tag2]
source: mobile-app
type: idea | note | conversation | journal
---

# Título

## Contexto
Breve contexto si es necesario

## Contenido principal
El contenido procesado por Claude

## Referencias
- [[nota-relacionada]]
- [[otra-nota]]

## Metadatos adicionales
- Ubicación: Si se capturó ubicación GPS
- Estado emocional: Si se detectó
```

---

## Preguntas frecuentes

**¿Puedo usar esto sin servidor propio?**
Sí, podrías usar servicios serverless (Railway, Render, Fly.io) para el backend. Syncthing se complica, pero podrías usar OneDrive/Dropbox API directamente.

**¿Funciona sin internet?**
No en el MVP. Fase avanzada: modo offline con cola de sincronización.

**¿Cuánto cuesta en API calls?**
- Claude Sonnet: ~$3 por millón de tokens input, ~$15 por millón output
- Uso típico: ~10-20 llamadas/día × 1000 tokens promedio = ~$0.30-0.60/mes

**¿Puedo compartir el vault con otras personas?**
Sí, Syncthing soporta múltiples dispositivos. Pero la app móvil actual es single-user.

**¿Y si quiero usar otro modelo (GPT, Gemini)?**
La abstracción en `services/claude.js` permite cambiar el proveedor fácilmente.

---

## Contribuciones

Este es un proyecto personal de Aitor, pero está documentado para potencial open source o colaboración futura.

### Principios de diseño

1. **Simplicidad primero**: MVP funcional antes que features complejas
2. **Developer experience**: Código limpio, bien documentado
3. **User experience**: Mínima fricción en la app móvil
4. **Extensibilidad**: Fácil añadir nuevos tipos de notas o integraciones

---

## Autor

**Aitor**
- Desarrollador full-stack (JS/TS/React Native/Node.js)
- Obsidian power user
- Entusiasta de second brain systems

---

*Última actualización: 2026-03-27*
