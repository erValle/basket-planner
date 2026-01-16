# Modelo de Recomendación de Ejercicios - Basket Planner

## Descripción General

Este es un modelo de recomendación **baseline v0.1.0** basado en **reglas heurísticas** que genera planificaciones de entrenamiento de baloncesto personalizadas. El modelo selecciona ejercicios de una base de datos de 102 ejercicios específicos de baloncesto, considerando objetivos, nivel del jugador, materiales disponibles y restricciones.

## Características

### ✅ Funcionalidades Implementadas

- **Generación de planificaciones individuales y grupales**
- **Filtrado por materiales disponibles**: Solo selecciona ejercicios que se pueden realizar con el equipamiento disponible
- **Filtrado por lesiones**: Evita ejercicios de alto impacto cuando hay lesiones
- **Scoring multi-criterio**: Cada ejercicio se puntúa según:
  - Coincidencia de etiquetas con objetivos (40%)
  - Coincidencia de tipo de ejercicio (25%)
  - Apropiación de dificultad para el nivel (20%)
  - Variedad de tipos en la sesión (10%)
  - Unicidad (evitar repeticiones) (5%)
- **Distribución de sesiones por fases**:
  - Calentamiento (15%)
  - Técnica individual (35%)
  - Táctica/Juego (30%)
  - Condicionamiento (15%)
  - Recuperación (5%)

### 🚫 Limitaciones

- **No es reentrenable**: Los pesos y reglas son fijos
- **No aprende de feedback**: No se adapta basándose en retroalimentación de usuarios
- **Configuración estática**: Los parámetros del modelo están codificados

## Arquitectura

```
src/recommender/
├── models/
│   └── rec-0.1.0-baseline/
│       ├── config.js              # Configuración del modelo
│       ├── exerciseScorer.js      # Sistema de puntuación
│       ├── exerciseFilter.js      # Filtrado por restricciones
│       ├── recommender.js         # Motor principal
│       └── index.js               # Punto de entrada
├── modelManager.js                # Gestor de modelos
└── test-recommender.js           # Script de prueba
```

## Configuración del Modelo

### Pesos de Scoring

```javascript
weights: {
  tagMatch: 0.40,      // Coincidencia de etiquetas
  typeMatch: 0.25,     // Coincidencia de tipo
  difficultyFit: 0.20, // Apropiación de dificultad
  typeVariety: 0.10,   // Variedad de tipos
  uniqueness: 0.05     // Evitar repeticiones
}
```

### Mapeo de Objetivos a Etiquetas

El modelo traduce objetivos de alto nivel a etiquetas específicas de ejercicios:

```javascript
'shooting' → ['tiro', 'catch_and_shoot', 'pull_up', 'tiro_libre', ...]
'defense' → ['defensa', '1v1', 'closeout', 'lateralidad', ...]
'pick_and_roll' → ['pick_and_roll', 'bloqueo_directo', 'lecturas', ...]
```

### Niveles y Dificultad

```javascript
levelToDifficulty: {
  beginner: { min: 1, max: 3 },
  intermediate: { min: 2, max: 4 },
  advanced: { min: 3, max: 5 }
}
```

## Uso

### 1. A través del API

#### Generar planificación individual

```bash
POST /api/planning/generate/individual

{
  "profile": {
    "athleteId": 123,
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
}
```

#### Obtener configuración del modelo

```bash
GET /api/recommender/config
```

#### Ver estado del modelo

```bash
GET /api/recommender/status
```

### 2. Programáticamente

```javascript
const { getActiveModel } = require('./src/recommender/modelManager');
const { getAllExercisesForRecommender } = require('./src/services/exerciseService');

// Obtener modelo y ejercicios
const model = getActiveModel();
const exercises = await getAllExercisesForRecommender();

// Generar planificación
const plan = model.generatePlan(exercises, {
  goals: ['shooting', 'defense'],
  constraints: {
    equipment: ['balon', 'canasta', 'conos'],
    injuries: []
  },
  profile: {
    level: 'intermediate',
    intensity: 'medium',
    sessionDurationMinutes: 90
  },
  numberOfSessions: 3,
  days: ['mon', 'wed', 'fri']
});
```

## Base de Datos de Ejercicios

Los ejercicios están cargados en la tabla `exercises` desde el archivo `db_ejercicios.json` (102 ejercicios).

### Cargar ejercicios en la BD

```bash
cd backend
npx sequelize-cli db:seed --seed 20260105000000-seed-basketball-exercises.js
```

### Estructura de un ejercicio

```json
{
  "nombre": "Tiros a tabla (corto) desde 45°",
  "descripcion": "Serie de tiros cortos usando tablero...",
  "dificultad": {
    "tactica": 1,
    "tecnica": 2,
    "fisica": 2,
    "mental": 2
  },
  "tipo": "TIRO",
  "duracion_segundos": 240,
  "etiquetas": ["tiro", "tablero", "mecanica"],
  "materiales_necesarios": ["balon", "canasta"]
}
```

## Testing

### Ejecutar pruebas del modelo

```bash
cd backend
node src/recommender/test-recommender.js
```

Esto ejecutará 4 pruebas:
1. Planificación enfocada en tiro
2. Planificación enfocada en defensa
3. Planificación con restricciones por lesión
4. Derivación de etiquetas desde objetivos

## Endpoints del API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/recommender/status` | Estado del modelo activo |
| GET | `/api/recommender/config` | Configuración completa del modelo |
| GET | `/api/recommender/models` | Lista de modelos disponibles |
| GET | `/api/recommender/versions` | Versiones del modelo |
| POST | `/api/planning/generate/individual` | Generar planificación individual |
| POST | `/api/planning/generate/group` | Generar planificación grupal |

## Próximos Pasos (Futuras Versiones)

### Versión 0.2.0 - Ajustable
- [ ] Permitir ajustar pesos de scoring vía API
- [ ] Persistir configuraciones personalizadas
- [ ] A/B testing de configuraciones

### Versión 0.3.0 - Con Feedback
- [ ] Recopilar feedback de usuarios sobre ejercicios recomendados
- [ ] Ajustar scoring basándose en feedback histórico
- [ ] Métricas de satisfacción por ejercicio

### Versión 1.0.0 - Machine Learning
- [ ] Modelo de aprendizaje automático reentrenable
- [ ] Entrenamiento con datos históricos
- [ ] Personalización por usuario
- [ ] Predicción de efectividad de ejercicios

## Contribuir

Para agregar nuevos ejercicios:
1. Editar `db_ejercicios.json`
2. Ejecutar el seeder: `npx sequelize-cli db:seed --seed 20260105000000-seed-basketball-exercises.js`

Para modificar la lógica del modelo:
1. Editar archivos en `src/recommender/models/rec-0.1.0-baseline/`
2. Ejecutar pruebas: `node src/recommender/test-recommender.js`

## Licencia

Parte del proyecto Basket Planner.
