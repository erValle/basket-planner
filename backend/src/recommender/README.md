# Motor de Recomendacion TFRS - Basket Planner

## Descripcion General

Motor de recomendacion hibrido basado en TensorFlow.js que genera planificaciones de entrenamiento de baloncesto personalizadas. Combina una red neuronal Two-Tower (70%) con heuristicas expertas (30%) para seleccionar ejercicios de una base de datos de 102 ejercicios especificos de baloncesto.

## Caracteristicas

- **Generacion de planificaciones individuales y grupales**
- **Red neuronal Two-Tower** con embeddings de 32 dimensiones
- **Sistema de scoring hibrido** (TFRS + heuristicas)
- **Entrenamiento con warm-start** usando datos sinteticos
- **Filtrado por materiales disponibles y lesiones**
- **Estrategia de repeticion inteligente** basada en adecuacion
- **Distribucion de sesiones por fases**: calentamiento (15%), tecnica (35%), tactica (30%), acondicionamiento (15%), recuperacion (5%)

## Arquitectura

```
src/recommender/
├── config.js              # Configuracion del modelo
├── exerciseScorer.js      # Sistema de puntuacion (TFRS + heuristico)
├── exerciseFilter.js      # Filtrado por restricciones
├── recommender.js         # Motor principal de generacion
├── tfrsModel.js           # Modelo TensorFlow Two-Tower
├── trainer.js             # Entrenamiento del modelo
├── modelManager.js        # Gestor de modelos
├── index.js               # Punto de entrada
├── example-usage.js       # Ejemplos de uso
├── test-recommender.js    # Script de prueba
└── saved_model/           # Modelo entrenado persistido
```

## Uso

### A traves del API

```bash
# Generar planificacion individual
POST /api/training-plans/generate/individual

# Estado del modelo
GET /api/recommender/status

# Configuracion del modelo
GET /api/recommender/config
```

### Programaticamente

```javascript
const recommender = require('./src/recommender');
const { getAllExercisesForRecommender } = require('./src/services/exerciseService');

const exercises = await getAllExercisesForRecommender();
await recommender.initializeModel(exercises, true);

const plan = await recommender.generatePlan(exercises, {
  goals: ['shooting', 'defense'],
  constraints: { equipment: ['balon', 'canasta', 'conos'] },
  profile: { intensity: 'medium', sessionDurationMinutes: 90 },
  numberOfSessions: 3,
});
```

## Entrenamiento del Modelo

```bash
# Entrenamiento basico (500 muestras)
cd backend
node scripts/train-tfrs-model.js --warm-start --samples 500

# Entrenamiento completo (1000 muestras)
node scripts/train-tfrs-model.js --warm-start --samples 1000
```

El modelo entrenado se guarda en `src/recommender/saved_model/` y se carga automaticamente al iniciar el servidor.

## Testing

```bash
node src/recommender/test-recommender.js
```

## Contribuir

Para agregar nuevos ejercicios:

1. Editar `db_ejercicios.json`
2. Ejecutar el seeder: `npx sequelize-cli db:seed --seed 20260105000000-seed-basketball-exercises.js`

Para modificar la configuracion del modelo:

1. Editar `src/recommender/config.js`
2. Ejecutar pruebas: `node src/recommender/test-recommender.js`

## Licencia

Parte del proyecto Basket Planner.
