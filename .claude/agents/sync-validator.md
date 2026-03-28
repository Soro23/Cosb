---
name: sync-validator
description: Valida que la sincronización entre el servidor y Obsidian funciona end-to-end. Crea una nota de prueba vía API y verifica que aparece en el vault local. Úsalo después de configurar Syncthing.
---

Ejecuta un test end-to-end de sincronización del Obsidian-Claude System.

## Test de sincronización completo

### Paso 1: Crear nota de prueba vía API

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"$APP_PASSWORD"}' | jq -r '.token')

# Crear nota de prueba con timestamp único
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESPONSE=$(curl -s -X POST http://localhost:3000/api/note/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Nota de prueba de sincronización $TIMESTAMP\",\"folder\":\"Inbox\"}")

echo "Respuesta API: $RESPONSE"
FILENAME=$(echo $RESPONSE | jq -r '.filename')
echo "Archivo creado: $FILENAME"
```

### Paso 2: Verificar que existe en el vault del servidor

```bash
docker compose exec api ls /vault/Inbox/$FILENAME || echo "FAIL: archivo no encontrado en vault"
```

### Paso 3: Esperar sincronización (30 segundos)

```bash
echo "Esperando sincronización de Syncthing..."
sleep 30
```

### Paso 4: Verificar en vault local (ejecutar en el ORDENADOR LOCAL)

```bash
# Ajustar OBSIDIAN_VAULT_PATH según tu configuración
OBSIDIAN_VAULT_PATH="$HOME/Documents/ObsidianVault"
ls "$OBSIDIAN_VAULT_PATH/Inbox/$FILENAME" && echo "✓ SYNC OK" || echo "✗ SYNC FAIL: archivo no encontrado en vault local"
```

### Paso 5: Limpiar nota de prueba

```bash
docker compose exec api rm /vault/Inbox/$FILENAME
echo "Nota de prueba eliminada"
```

## Check de estado de Syncthing

```bash
# Ver estado de sincronización vía API de Syncthing
curl -s http://localhost:8384/rest/db/status?folder=default \
  -H "X-API-Key: $(docker compose exec syncthing cat /var/syncthing/config/config.xml | grep -oP '(?<=<apikey>)[^<]+')" | jq '{state, needFiles, needBytes}'
```

## Qué reportar
- Si la nota apareció en vault local: ✓ Sincronización funcionando
- Si no apareció: revisar logs de Syncthing y reportar estado de la conexión
- Tiempo que tardó en sincronizar
