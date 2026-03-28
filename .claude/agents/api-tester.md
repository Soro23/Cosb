---
name: api-tester
description: Ejecuta tests de integración contra la API real. Úsalo después de implementar endpoints del backend para verificar que funcionan correctamente con el vault y Claude.
---

Ejecuta tests de integración completos contra la API del Obsidian-Claude System.

## Prerequisitos

Verificar que el servidor está corriendo:
```bash
curl http://localhost:3000/health 2>/dev/null || echo "API no disponible"
```

Si no está corriendo, intentar arrancar:
```bash
cd backend && node src/server.js &
sleep 2
```

## Tests a ejecutar en orden

### 1. Login
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test"}' | jq -r '.token')
echo "Token: $TOKEN"
```

### 2. Crear nota
```bash
curl -s -X POST http://localhost:3000/api/note/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Idea para mejorar el sistema de notas con IA","folder":"Ideas"}' | jq
```

### 3. Búsqueda en vault
```bash
curl -s -X POST http://localhost:3000/api/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"IA notas"}' | jq
```

### 4. Consulta RAG
```bash
curl -s -X POST http://localhost:3000/api/chat/ask \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"¿Qué ideas tengo sobre IA?"}' | jq
```

### 5. Guardar conversación
```bash
curl -s -X POST http://localhost:3000/api/conversation/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hola"},{"role":"assistant","content":"¡Hola!"}]}' | jq
```

### 6. Estructura del vault
```bash
curl -s http://localhost:3000/api/vault/structure \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Criterios de éxito
- Todos los endpoints devuelven 200
- Login devuelve JWT válido
- Crear nota devuelve path del archivo creado
- Búsqueda devuelve array de resultados (puede estar vacío si vault está vacío)
- RAG devuelve answer y sources
- Conversación devuelve filename

## Qué reportar
- Qué tests pasaron ✓
- Qué tests fallaron ✗ con el error completo
- Sugerencias de fix para los fallos
