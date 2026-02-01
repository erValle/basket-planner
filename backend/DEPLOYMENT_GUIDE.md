# 🚀 Guía de Deployment - Modelo de Recomendación

## Pre-requisitos

- ✅ Base de datos PostgreSQL configurada
- ✅ Node.js v24.x instalado
- ✅ Variables de entorno configuradas en `.env`

## Pasos para Deployment

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Ejecutar Migraciones

```bash
npx sequelize-cli db:migrate
```

### 3. Cargar Ejercicios en la Base de Datos

```bash
npx sequelize-cli db:seed --seed 20260105000000-seed-basketball-exercises.js
```

**Resultado esperado:**
```
✅ Insertados 102 ejercicios
```

### 4. Verificar la Instalación

Ejecutar el script de prueba:

```bash
node src/recommender/test-recommender.js
```

**Resultado esperado:**
```
🧪 Iniciando prueba del modelo de recomendación...
✅ Modelo activo: rec-0.1.0-baseline
✅ Ejercicios cargados: 102
📋 Prueba 1: Planificación individual - Foco en tiro
   Sesiones generadas: 3
   ...
✅ Todas las pruebas completadas exitosamente!
```

### 5. Ver Ejemplos de Uso

```bash
node src/recommender/example-usage.js
```

### 6. Iniciar el Servidor

```bash
npm run dev
```

## Verificación Post-Deployment

### 1. Verificar Endpoints del API

```bash
# Status del modelo
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/recommender/status

# Configuración del modelo
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/recommender/config

# Modelos disponibles
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/recommender/models
```

### 2. Generar una Planificación de Prueba

```bash
curl -X POST http://localhost:3000/api/planning/generate/individual \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "playerId": 1,
      "level": "intermediate",
      "maxSessionsPerWeek": 3,
      "sessionDurationMinutes": 90,
      "intensity": "medium"
    },
    "goals": ["shooting", "ball_handling"],
    "constraints": {
      "days": ["mon", "wed", "fri"],
      "equipment": ["balon", "canasta", "conos"],
      "injuries": []
    }
  }'
```

**Respuesta esperada:** JSON con 3 sesiones generadas con ejercicios reales.

## Troubleshooting

### Problema: No se encuentran ejercicios

**Síntoma:**
```
Error: No hay ejercicios disponibles con las restricciones especificadas
```

**Solución:**
```bash
# Re-ejecutar el seeder
npx sequelize-cli db:seed:undo --seed 20260105000000-seed-basketball-exercises.js
npx sequelize-cli db:seed --seed 20260105000000-seed-basketball-exercises.js
```

### Problema: Error al cargar el JSON

**Síntoma:**
```
Error: Cannot find module 'db_ejercicios.json'
```

**Solución:**
Verificar que el archivo `db_ejercicios.json` existe en el directorio raíz del proyecto:
```bash
ls -la /path/to/basket-planner/db_ejercicios.json
```

### Problema: Modelo no genera suficientes ejercicios

**Posible causa:** Restricciones demasiado estrictas (materiales o lesiones)

**Solución:**
- Ampliar la lista de equipamiento disponible
- Verificar que los materiales están correctamente normalizados

## Monitoreo

### Logs a Revisar

```bash
# Ver logs del servidor
tail -f logs/app.log

# Buscar errores del modelo
grep "recommender" logs/app.log
```

### Métricas a Monitorear

- **Tiempo de generación**: < 100ms por planificación
- **Tasa de éxito**: 100% (con restricciones razonables)
- **Cobertura de ejercicios**: Variedad en los ejercicios seleccionados

## Actualizaciones Futuras

### Para agregar nuevos ejercicios:

1. Editar `db_ejercicios.json`
2. Ejecutar: `npx sequelize-cli db:seed --seed 20260105000000-seed-basketball-exercises.js`
3. No requiere reiniciar el servidor (usa fallback a JSON si es necesario)

### Para ajustar configuración del modelo:

1. Editar `src/recommender/models/rec-0.1.0-baseline/config.js`
2. Reiniciar el servidor
3. Ejecutar pruebas: `node src/recommender/test-recommender.js`

## Rollback

Si necesitas volver atrás:

```bash
# Deshacer el seeder
npx sequelize-cli db:seed:undo --seed 20260105000000-seed-basketball-exercises.js

# El sistema seguirá funcionando usando el JSON como fallback
```

## Checklist de Deployment ✅

- [ ] Migraciones ejecutadas
- [ ] Seeder de ejercicios ejecutado (102 ejercicios cargados)
- [ ] Pruebas del modelo ejecutadas exitosamente
- [ ] Endpoints del API verificados
- [ ] Generación de planificación de prueba exitosa
- [ ] Logs sin errores
- [ ] Documentación revisada

## Soporte

Para problemas o preguntas:
- Revisar documentación en `src/recommender/README.md`
- Ejecutar pruebas: `node src/recommender/test-recommender.js`
- Ver ejemplos: `node src/recommender/example-usage.js`

---

**Versión del Modelo:** rec-0.1.0-baseline  
**Fecha de Deployment:** 5 de enero de 2026  
**Status:** ✅ Producción Ready
