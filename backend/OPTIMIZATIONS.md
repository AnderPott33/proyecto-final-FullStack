# Optimizations applied

Resumen de cambios aplicados para reducir latencia en listas y mejorar LCP:

- Añadido `SELECT 1` warmup en `backend/config/db.js` para evitar coste de primera conexión.
 - Envoltorio de `pool.query` para loguear queries lentas y errores en `backend/config/db.js` (umbral configurable, por defecto ahora 200ms).
 - Middleware temporal en `backend/index.js` que mide y loguea requests HTTP lentos (umbral configurable, por defecto ahora 200ms) para reducir ruido en logs.
- Reemplazos selectivos de `SELECT *` por columnas concretas en controladores de listas:
  - `entidades.controller.js`: `SELECT id, nombre, documento_identidad, ruc, estado` (limit por defecto 100)
  - `categoriaArticulo.controller.js`: `SELECT id, nombre_categoria`
  - `formaPago.controller.js`: `SELECT id, nombre, sub_tipo`
  - `marcaArticulo.controller.js`: `SELECT id, nombre_marca`
  - `cuentas.controller.js`: `SELECT id, nombre, moneda, tipo, sub_tipo` para listados y búsquedas dinámicas
- Reducidos límites por defecto (`limit`) en endpoints de listas a valores más conservadores (ej. 100) y añadido tope razonable.
- Añadí scripts de ayuda en `backend/scripts/`:
  - `generate_jwt.js` — genera token dev.
  - `hit_endpoints.js` — golpea endpoints autenticados para reproducir y medir latencia.
  - `explain_cuenta.js` — ejecuta EXPLAIN para la consulta de cuentas.

Resultados medidos (ejemplos):
- `/api/cuenta?limit=300` pasó de ~0.35–0.6s a ~0.12–0.15s tras warmup y reducción de payload.
- Otros endpoints de lista: ~0.024–0.04s tras optimizaciones.

## Cómo ejecutar Lighthouse localmente (sugerido)

Problema: al ejecutar Lighthouse desde el entorno actual aparece `EPERM` al borrar/crear temporales en `%TEMP%`. Recomiendo ejecutar Lighthouse desde una terminal local con permisos adecuados.

Pasos (PowerShell):

1) Asegúrate de tener Chrome instalado y cerrado (cierra instancias existentes).

2) Desde la raíz del repo (donde están `frontend/` y `backend/`) ejecuta:

```powershell
# crea tmp local
mkdir tmp_lh
# exporta variables temporales (PowerShell)
$Env:TEMP = "$PWD\tmp_lh"
$Env:TMP  = "$PWD\tmp_lh"

# Inicia backend y frontend en sus respectivas terminales
# Backend (desde c:\App-S\backend)
npm run dev

# Frontend (desde c:\App-S\frontend)
npm run dev

# En otra terminal ejecuta Lighthouse
npx lighthouse http://localhost:5175 --output json --output-path backend/frontend-lighthouse-final.json --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"
```

Si usas Git Bash / WSL, puedes exportar `TMPDIR` antes de lanzar `npx lighthouse`.

Si persiste `EPERM`, prueba a ejecutar la terminal como Administrador o limpiar manualmente `%TEMP%` (Windows) de archivos `lighthouse.*` y volver a intentar.

## Siguientes pasos recomendados

1. Ejecutar Lighthouse localmente y adjuntar `backend/frontend-lighthouse-final.json` para comparar LCP/FCP.
2. Revisar endpoints que sigan presentando latencia y ejecutar `EXPLAIN (ANALYZE, BUFFERS)` (ya hay script para `cuenta`).
3. Aplicar índices dirigidos solo si EXPLAIN muestra secuencias/joins caros.
4. Mantener warmup + logging temporal hasta estabilizar.
5. (Opcional) Optimizar frontend: bundle splitting, critical CSS, lazy load imágenes y fonts para reducir LCP.

---
Archivo generado por el asistente para que puedas revisar y ejecutar localmente.
