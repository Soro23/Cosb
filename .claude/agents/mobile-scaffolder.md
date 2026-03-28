---
name: mobile-scaffolder
description: Inicializa el proyecto React Native + Expo con TypeScript. Crea todas las pantallas vacías, navegación configurada, cliente API y stores. Úsalo al inicio del desarrollo mobile.
---

Crea la estructura completa del proyecto mobile para el Obsidian-Claude System según las especificaciones del CLAUDE.md.

## Setup inicial

El proyecto Expo YA debe estar inicializado en `mobile/`. Si no existe, ejecuta:
```bash
cd mobile && npx create-expo-app . --template blank-typescript
```

## Dependencias a instalar

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install expo-av expo-speech
npm install zustand
```

## Archivos a crear

### `mobile/src/navigation/AppNavigator.tsx`
Stack navigator con pantallas:
- Login (sin auth header)
- Home, NewNote, Search, Conversation, Settings (con header)
Leer JWT de AsyncStorage al iniciar. Si existe → Home, si no → Login.

### `mobile/src/screens/HomeScreen.tsx`
3 botones grandes:
- "Nueva nota" (micrófono icon) → NewNoteScreen
- "Consultar vault" (búsqueda icon) → SearchScreen
- "Conversación" (chat icon) → ConversationScreen
Botón settings en header.

### `mobile/src/screens/NewNoteScreen.tsx`
- Botón micrófono para grabar (expo-av)
- Muestra texto transcrito para editar
- Picker de carpeta: Inbox, Ideas, Journal, Tasks
- Botón "Guardar" → POST /api/note/create
- Feedback: "✓ Guardado en Obsidian"

### `mobile/src/screens/SearchScreen.tsx`
- Input de búsqueda
- Lista de resultados con nombre de archivo y snippet
- Tap en resultado → muestra contenido

### `mobile/src/screens/ConversationScreen.tsx`
- Lista de mensajes (user/assistant)
- Input de texto
- Botón "Guardar conversación" → POST /api/conversation/save

### `mobile/src/screens/SettingsScreen.tsx`
- Input URL de la API
- Campo username/password para login
- Botón logout

### `mobile/src/screens/LoginScreen.tsx`
- Campos usuario y contraseña
- POST /api/auth/login → guarda JWT en AsyncStorage

### `mobile/src/api/client.ts`
```typescript
// Fetch wrapper con JWT automático y manejo de errores
export const apiClient = { get, post }
```

### `mobile/src/api/endpoints.ts`
Todas las llamadas a la API tipadas con TypeScript.

### `mobile/src/store/authStore.ts`
Zustand store con: token, isAuthenticated, login(), logout()

### `mobile/src/types/index.ts`
Tipos TypeScript: Note, SearchResult, Message, Conversation, VaultStructure

## Notas
- Usar expo-speech para speech-to-text en MVP (gratuito, local)
- AsyncStorage para persistir JWT
- URL de la API configurable desde SettingsScreen
