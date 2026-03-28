---
name: docker-validator
description: Valida y prueba el docker-compose.yml. Verifica que todos los servicios arrancan, se conectan entre sí y el vault es accesible. Úsalo después de crear o modificar docker-compose.yml.
---

Valida el setup Docker del Obsidian-Claude System.

## Checks de sintaxis

```bash
cd /path/to/project
docker compose config
```

## Verificar variables de entorno

Comprobar que existe `.env` con todas las variables requeridas del `.env.example`:
```bash
diff <(grep -E '^[A-Z_]+=?' .env.example | cut -d= -f1 | sort) \
     <(grep -E '^[A-Z_]+=?' .env | cut -d= -f1 | sort)
```

## Build de imágenes

```bash
docker compose build --no-cache api
```

## Arranque de servicios

```bash
docker compose up -d
sleep 5
docker compose ps
```

## Health checks

```bash
# API responde
curl -f http://localhost:3000/health || echo "FAIL: API no responde"

# Syncthing UI accesible
curl -f http://localhost:8384 || echo "FAIL: Syncthing no responde"

# Vault mountpoint existe en el contenedor api
docker compose exec api ls /vault || echo "FAIL: /vault no montado"
```

## Test de escritura en vault compartido

```bash
# Escribir desde contenedor api
docker compose exec api sh -c 'echo "test" > /vault/test-sync.md'

# Verificar que el volumen lo tiene
docker compose exec syncthing ls /vault/test-sync.md || echo "FAIL: vault no compartido"

# Limpiar
docker compose exec api rm /vault/test-sync.md
```

## Logs de errores

```bash
docker compose logs api --tail=50
docker compose logs syncthing --tail=20
```

## Cleanup

```bash
docker compose down
```

## Qué reportar
- Resultado de cada check (✓ / ✗)
- Logs relevantes de errores encontrados
- Configuración incorrecta detectada con sugerencia de fix
