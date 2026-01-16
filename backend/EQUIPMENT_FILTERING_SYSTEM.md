# Sistema de Filtrado de Ejercicios por Equipamiento

## Resumen de Cambios

Se ha implementado un sistema completo para asegurar que las planificaciones de entrenamiento solo utilicen ejercicios que sean posibles realizar con el equipamiento disponible en el sistema.

## Archivos Creados

### 1. Scripts de Inicialización (Opcionales)

#### `backend/scripts/seed-equipment.js`
Script independiente para insertar 13 items de equipamiento básico para baloncesto:
- Balones de baloncesto (30 unidades)
- Conos de entrenamiento (50 unidades)
- Canastas (6 unidades)
- Petos (20 unidades)
- Foam pads (10 unidades)
- Pizarra táctica (4 unidades)
- Cronómetros/Apps (5 unidades)
- Colchonetas (15 unidades)
- Bandas elásticas (20 unidades)
- Foam rollers (10 unidades)
- Cajones pliométricos (8 unidades)
- Tarjetas de colores (10 unidades)
- Silbatos/Apps (5 unidades)

**Características importantes:**
- Cada item incluye un campo `characteristics` con aliases para mapear con los materiales de los ejercicios
- Se asigna automáticamente al primer club disponible (o se puede especificar con `--club-id`)
- Todos los items tienen `status: 'available'`
- No inserta duplicados (verifica por nombre y club)
- Es completamente **opcional** y puede ejecutarse independientemente

**Uso:**
```bash
# Insertar con club automático
node scripts/seed-equipment.js

# Insertar en club específico
node scripts/seed-equipment.js --club-id=2

# Ver ayuda
node scripts/seed-equipment.js --help
```

#### `backend/scripts/seed-exercises.js`
Script independiente para insertar ejercicios de baloncesto:
- Limpia ejercicios existentes si se usa la opción `--clear`
- Permite elegir entre versión reducida (29 ejercicios) o completa (102 ejercicios)
- Cada ejercicio tiene asociados los materiales necesarios en el campo `tags`
- No inserta duplicados (verifica por nombre)
- Es completamente **opcional** y puede ejecutarse independientemente

**Uso:**
```bash
# Insertar ejercicios (versión reducida - 29 ejercicios)
node scripts/seed-exercises.js

# Insertar ejercicios (versión completa - 102 ejercicios)
node scripts/seed-exercises.js --file=db_ejercicios.json

# Limpiar y reemplazar ejercicios existentes
node scripts/seed-exercises.js --clear

# Ver ayuda
node scripts/seed-exercises.js --help
```

Ver documentación completa en `backend/scripts/README.md`

### 2. Base de Datos de Ejercicios Reducida

#### `db_ejercicios_reducido.json`
Archivo JSON con 29 ejercicios seleccionados que cubren:
- **Técnica de bote** (2 ejercicios)
- **Finalización** (3 ejercicios)
- **Tiro** (4 ejercicios)
- **Pase** (2 ejercicios)
- **Táctica de ataque** (3 ejercicios)
- **Defensa** (4 ejercicios)
- **Rebote** (1 ejercicio)
- **Transiciones** (2 ejercicios)
- **Juego reducido** (2 ejercicios)
- **Trabajo de poste** (1 ejercicio)
- **Condicionamiento físico** (3 ejercicios)
- **Movilidad y recuperación** (2 ejercicios)

## Modificaciones en el Código

### `backend/src/services/planningGenerationService.js`

#### Nuevas funciones añadidas:

1. **`getAvailableEquipmentAliases(clubId)`**
   - Obtiene todo el equipamiento disponible del club
   - Extrae los aliases de cada item (tanto del nombre como del campo `characteristics`)
   - Retorna un Set con todos los alias de equipamiento disponible
   - Incluye mapeo inteligente de nombres a aliases (ej: "Balón de baloncesto" → "balon", "2_balones")

2. **`filterExercisesByEquipment(exercises, availableEquipment)`**
   - Filtra la lista de ejercicios según el equipamiento disponible
   - Verifica que todos los materiales necesarios del ejercicio estén disponibles
   - Si un ejercicio no requiere materiales, siempre se incluye
   - Si no hay restricción de equipamiento (Set vacío), devuelve todos los ejercicios

#### Modificaciones en funciones existentes:

- **`generateIndividual(input, auditCtx)`**: Ahora filtra ejercicios por equipamiento antes de generar el plan
- **`generateGroup(input, auditCtx)`**: Igual que individual, filtra ejercicios por equipamiento

**Flujo de filtrado:**
```javascript
// 1. Obtener equipamiento disponible
const availableEquipment = await getAvailableEquipmentAliases(clubId);

// 2. Obtener todos los ejercicios activos
let allExercises = await getAllExercisesForRecommender({ active: true });

// 3. Filtrar por equipamiento
allExercises = filterExercisesByEquipment(allExercises, availableEquipment);

// 4. Generar plan con ejercicios filtrados
const generatedPlan = recommender.generatePlan(allExercises, planParams);
```

### `frontend/src/app/services/exercises.api.ts`
- Añadido filtrado de parámetros `undefined` para evitar errores de validación en el backend

### `frontend/src/app/services/equipment.api.ts`
- Añadido filtrado de parámetros `undefined`

### `frontend/src/app/services/teams.api.ts`
- Añadido filtrado de parámetros `undefined`

## Cómo Usar

### Ejecutar los Seeders

```bash
# Desde el directorio backend

# 1. Insertar equipamiento
npx sequelize-cli db:seed --seed 20260108010000-seed-basketball-equipment.js

# 2. Insertar ejercicios
npx sequelize-cli db:seed --seed 20260108020000-seed-basketball-exercises-reduced.js
```

### Verificar la Instalación

```bash
# Contar ejercicios
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT COUNT(*) FROM exercises;"

# Contar equipamiento
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT COUNT(*) FROM equipment;"

# Ver equipamiento con sus alias
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT name, characteristics FROM equipment;"
```

## Mapeo de Materiales

El sistema mapea automáticamente los nombres de equipamiento a los alias usados en los ejercicios:

| Nombre en BD | Aliases |
|--------------|---------|
| Balón de baloncesto | `balon`, `2_balones` |
| Conos de entrenamiento | `conos` |
| Canasta de baloncesto | `canasta` |
| Petos de entrenamiento | `petos` |
| Foam pad / Almohadilla | `foam_pad` |
| Pizarra táctica | `pizarra_tactica` |
| Cronómetro / App | `cronometro_o_app` |
| Colchonetas | `colchoneta` |
| Bandas elásticas | `banda_elastica` |
| Foam roller | `foam_roller` |
| Cajón pliométrico | `cajon_pliometria` |
| Tarjetas de colores | `tarjetas_colores` |
| Silbato / App señal | `silbato_o_app_senal` |

## Beneficios

1. **Planificaciones realistas**: Solo se generan planes con ejercicios que realmente se pueden realizar
2. **Gestión de recursos**: El sistema conoce qué equipamiento está disponible
3. **Escalabilidad**: Fácil añadir nuevo equipamiento o ejercicios
4. **Flexibilidad**: Si no hay restricciones de equipamiento, se usan todos los ejercicios
5. **Trazabilidad**: Logs informativos sobre cuántos ejercicios están disponibles después del filtrado

## Ejemplo de Salida

```
ℹ️  Ejercicios disponibles después de filtrar por equipamiento: 26
```

Este mensaje aparece en los logs del servidor cuando se genera una planificación, indicando cuántos ejercicios están disponibles después de aplicar el filtro de equipamiento.

## Notas Importantes

- El equipamiento se asigna automáticamente al primer club disponible
- Si no hay clubs en la base de datos, el seeder de equipamiento no insertará nada
- Los ejercicios que no requieren materiales siempre están disponibles
- El filtrado es inclusivo: un ejercicio se incluye solo si TODOS sus materiales están disponibles
