# Basket Planner

Sistema de planificacion de entrenamientos de baloncesto con motor de recomendacion inteligente basado en TensorFlow.js.

## Tabla de Contenidos

- [Descripcion General](#descripcion-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Requisitos del Sistema](#requisitos-del-sistema)
- [Instalacion](#instalacion)
- [Configuracion](#configuracion)
- [Inicializacion de la Base de Datos](#inicializacion-de-la-base-de-datos)
- [Entrenamiento del Modelo de Recomendacion](#entrenamiento-del-modelo-de-recomendacion)
- [Ejecucion](#ejecucion)
- [Usuarios de Prueba](#usuarios-de-prueba)
- [Comandos Disponibles](#comandos-disponibles)
- [API Reference](#api-reference)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Solucion de Problemas](#solucion-de-problemas)
- [Tests](#tests)

---

## Descripcion General

Basket Planner es una aplicacion web fullstack para la gestion y planificacion de entrenamientos de baloncesto. El sistema incluye:

- Gestion de clubes, equipos y jugadores
- Creacion de planificaciones de entrenamiento
- Motor de recomendacion basado en arquitectura Two-Tower (Dual Encoder) con TensorFlow.js
- Sistema de feedback para sesiones de entrenamiento
- Control de acceso basado en roles (RBAC)
- Auditoria de acciones del sistema

### Motor de Recomendacion TFRS

El sistema utiliza un motor de recomendacion hibrido que combina:

- **Red neuronal Two-Tower** (70%): Embeddings de 32 dimensiones para codificar contexto de entrenamiento y caracteristicas de ejercicios
- **Heuristicas expertas** (30%): Reglas basadas en conocimiento de entrenadores profesionales

El modelo genera planificaciones personalizadas considerando:

- Objetivos del entrenamiento (tiro, defensa, manejo de balon, etc.)
- Equipamiento disponible
- Nivel de intensidad
- Distribucion de fases de sesion (calentamiento, tecnica, tactica, recuperacion)

---

## Arquitectura del Sistema

```
basket-planner/
├── backend/           # API REST - Node.js + Express + Sequelize
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── recommender/    # Motor de recomendacion TFRS
│   │   └── validation/
│   ├── migrations/
│   ├── seeders/
│   └── models/
├── frontend/          # SPA - Angular 21 (Standalone Components)
│   └── src/
│       └── app/
└── docs/              # Documentacion adicional
```

### Tecnologias

**Backend:**

- Node.js 24+
- Express.js
- PostgreSQL 14+
- Sequelize ORM
- TensorFlow.js (motor de recomendacion)
- JWT para autenticacion
- Joi para validacion

**Frontend:**

- Angular 21 (Standalone Components)
- PrimeNG 21
- Tailwind CSS 4
- RxJS
- TypeScript 5.9

---

## Requisitos del Sistema

- **Node.js**: 24.0.0 o superior
- **npm**: 11.0.0 o superior
- **PostgreSQL**: 14.0 o superior (o Docker)
- **Docker** (opcional): Para ejecutar PostgreSQL en contenedor

### Verificar versiones instaladas

```bash
node --version    # Debe mostrar v24.x.x o superior
npm --version     # Debe mostrar 11.x.x o superior
```

---

## Instalacion

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/erValle/basket-planner.git
cd basket-planner
```

### Paso 2: Instalar dependencias

Instalar todas las dependencias del proyecto (root, backend y frontend):

```bash
npm run install:all
```

Este comando ejecuta `npm install` en los tres directorios automaticamente.

### Paso 3: Configurar variables de entorno

Crear el archivo de configuracion del backend:

```bash
cd backend
cp .env.sample .env
```

Editar `backend/.env` con los valores apropiados:

```bash
# Base de datos
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_NAME=planificador_basket_db
DB_PORT=5432

# Autenticacion
JWT_SECRET=tu_secreto_jwt_seguro_aqui

# Servidor
SERVER_PORT=4000
CORS_ORIGIN=http://localhost:4000,http://localhost:4200
```

Volver al directorio raiz:

```bash
cd ..
```

---

## Configuracion

### Opcion A: PostgreSQL con Docker (Recomendado)

Iniciar el contenedor de PostgreSQL:

```bash
cd backend
docker-compose up -d
cd ..
```

Esto creara un contenedor con:

- Base de datos: `planificador_basket_db`
- Usuario: `postgres`
- Password: `postgres`
- Puerto: `5432`

Verificar que el contenedor esta ejecutandose:

```bash
docker ps
```

### Opcion B: PostgreSQL instalado localmente

Si tienes PostgreSQL instalado localmente, crear la base de datos manualmente:

```bash
psql -U postgres
CREATE DATABASE planificador_basket_db;
\q
```

Asegurate de que los valores en `backend/.env` coincidan con tu configuracion local.

---

## Inicializacion de la Base de Datos

### Ejecutar migraciones

Las migraciones crean la estructura de tablas:

```bash
npm run db:migrate
```

### Cargar datos iniciales (seeders)

Los seeders cargan datos de ejemplo incluyendo:

- Usuarios de prueba con diferentes roles
- Clubes y equipos de ejemplo
- Catalogo completo de ejercicios de baloncesto
- Equipamiento deportivo
- Planificaciones de ejemplo

```bash
npm run db:seed
```

### Comando combinado

Para ejecutar migraciones y seeders en un solo paso:

```bash
npm run db:setup
```

### Reiniciar base de datos (opcional)

Si necesitas reiniciar la base de datos desde cero:

```bash
npm run db:reset
```

Este comando deshace todas las migraciones, las vuelve a ejecutar y carga los seeders.

---

## Entrenamiento del Modelo de Recomendacion

El motor de recomendacion requiere un modelo entrenado para funcionar. El entrenamiento se realiza con datos sinteticos (warm-start).

### Entrenamiento basico (500 muestras)

```bash
npm run train:model
```

### Entrenamiento completo (1000 muestras)

Para un modelo mas robusto:

```bash
npm run train:model:full
```

El modelo entrenado se guarda en `backend/src/recommender/saved_model/` y se carga automaticamente al iniciar el servidor.

### Verificar el modelo

Puedes probar el modelo ejecutando:

```bash
cd backend
node src/recommender/test-recommender.js
cd ..
```

---

## Ejecucion

### Iniciar toda la aplicacion

Desde el directorio raiz, iniciar backend y frontend simultaneamente:

```bash
npm start
```

Esto arranca:

- **Backend** en `http://localhost:4000`
- **Frontend** en `http://localhost:4200`

### Iniciar en modo desarrollo

Con recarga automatica al detectar cambios:

```bash
npm run dev
```

### Iniciar servicios por separado

Terminal 1 - Backend:

```bash
npm run start:backend
```

Terminal 2 - Frontend:

```bash
npm run start:frontend
```

### Verificar que todo funciona

1. Abrir `http://localhost:4200` en el navegador
2. Iniciar sesion con un usuario de prueba
3. Navegar a la seccion de planificaciones para probar el motor de recomendacion

---

## Usuarios de Prueba

El sistema viene con usuarios precargados para pruebas:

| Email            | Password   | Rol                | Permisos                                          |
| ---------------- | ---------- | ------------------ | ------------------------------------------------- |
| admin@demo.com   | Admin123!  | admin              | Acceso completo al sistema                        |
| td@demo.com      | Coach123!  | technical_director | Gestion de clubes, equipos y usuarios             |
| coach@demo.com   | Coach123!  | coach              | Creacion de planificaciones, gestion de jugadores |
| player1@demo.com | Player123! | player             | Visualizacion de planificaciones asignadas        |
| player2@demo.com | Player123! | player             | Visualizacion de planificaciones asignadas        |

---

## Comandos Disponibles

### Comandos principales (desde directorio raiz)

| Comando                    | Descripcion                                        |
| -------------------------- | -------------------------------------------------- |
| `npm run install:all`      | Instala dependencias de root, backend y frontend   |
| `npm start`                | Inicia backend y frontend simultaneamente          |
| `npm run dev`              | Inicia en modo desarrollo con hot-reload           |
| `npm run db:setup`         | Ejecuta migraciones y seeders                      |
| `npm run db:reset`         | Reinicia la base de datos completamente            |
| `npm run train:model`      | Entrena el modelo de recomendacion (500 muestras)  |
| `npm run train:model:full` | Entrena el modelo de recomendacion (1000 muestras) |
| `npm test`                 | Ejecuta tests de backend y frontend                |

### Comandos de backend (desde /backend)

| Comando           | Descripcion                           |
| ----------------- | ------------------------------------- |
| `npm start`       | Inicia el servidor en modo produccion |
| `npm run dev`     | Inicia con nodemon (hot-reload)       |
| `npm test`        | Ejecuta tests unitarios e integracion |
| `npm run migrate` | Ejecuta migraciones pendientes        |
| `npm run seed`    | Ejecuta seeders                       |

### Comandos de frontend (desde /frontend)

| Comando         | Descripcion                   |
| --------------- | ----------------------------- |
| `npm start`     | Inicia servidor de desarrollo |
| `npm run build` | Build de produccion           |
| `npm test`      | Ejecuta tests unitarios       |

---

## API Reference

### Endpoints principales

**Autenticacion:**

- `POST /api/auth/login` - Iniciar sesion
- `GET /api/auth/me` - Obtener usuario actual

**Motor de Recomendacion:**

- `GET /api/recommender/status` - Estado del modelo y metricas
- `GET /api/recommender/config` - Configuracion del modelo
- `POST /api/training-plans/generate/individual` - Generar planificacion individual
- `POST /api/training-plans/generate/group` - Generar planificacion grupal

**Recursos:**

- `GET/POST/PUT/DELETE /api/clubs` - Gestion de clubes
- `GET/POST/PUT/DELETE /api/teams` - Gestion de equipos
- `GET/POST/PUT/DELETE /api/exercises` - Gestion de ejercicios
- `GET/POST/PUT/DELETE /api/training-plans` - Gestion de planificaciones
- `GET /api/training-plans/:id/versions` - Versiones de una planificacion
- `GET/POST/PUT/DELETE /api/users` - Gestion de usuarios
- `GET /api/players` - Listado de jugadores
- `GET/POST/PUT/DELETE /api/equipment` - Gestion de equipamiento
- `GET/POST /api/plan-assignments` - Asignaciones de planes
- `GET/POST /api/feedbacks` - Gestion de feedback
- `GET /api/metrics` - Metricas del sistema
- `GET /api/audit-logs` - Registros de auditoria
- `GET /api/monitoring` - Monitorizacion del sistema

**Health Check:**

- `GET /api/health` - Estado del servidor

### Ejemplo: Generar planificacion

```bash
curl -X POST http://localhost:4000/api/training-plans/generate/individual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "profile": {
      "playerId": 3,
      "numberOfSessions": 3,
      "sessionDurationMinutes": 90,
      "intensity": "medium"
    },
    "goals": ["shooting", "ball_handling"],
    "constraints": {
      "equipment": ["balon", "canasta", "conos"]
    }
  }'
```

---

## Estructura del Proyecto

```
basket-planner/
├── backend/
│   ├── app.js                 # Configuracion de Express
│   ├── server.js              # Punto de entrada del servidor
│   ├── config/                # Configuracion de la aplicacion
│   ├── migrations/            # Migraciones de Sequelize
│   ├── models/                # Modelos de Sequelize
│   ├── routes/                # Definicion de rutas
│   ├── seeders/               # Datos iniciales
│   ├── scripts/               # Scripts de utilidad
│   ├── src/
│   │   ├── auth/              # Sistema de permisos
│   │   ├── controllers/       # Controladores
│   │   ├── libs/              # Utilidades
│   │   ├── middlewares/       # Middlewares
│   │   ├── recommender/       # Motor de recomendacion TFRS
│   │   ├── services/          # Logica de negocio
│   │   └── validation/        # Esquemas de validacion
│   └── __tests__/             # Tests unitarios e integracion
├── frontend/
│   ├── src/
│   │   └── app/               # Componentes y modulos Angular
│   └── angular.json           # Configuracion de Angular
├── docs/                      # Documentacion adicional
├── package.json               # Scripts y dependencias root
└── README.md                  # Este archivo
```

---

## Solucion de Problemas

### Error: "Cannot find module"

Reinstalar todas las dependencias:

```bash
npm run install:all
```

Si el problema persiste, limpiar e instalar:

```bash
npm run clean:install
```

### Error: "Port already in use"

Liberar el puerto ocupado:

```bash
# Puerto 4000 (backend)
lsof -ti:4000 | xargs kill -9

# Puerto 4200 (frontend)
lsof -ti:4200 | xargs kill -9
```

### Error de conexion a base de datos

1. Verificar que PostgreSQL/Docker esta ejecutandose:

```bash
docker ps
```

2. Verificar configuracion en `backend/.env`

3. Reiniciar el contenedor si es necesario:

```bash
cd backend
docker-compose down
docker-compose up -d
cd ..
```

### Error: "Model not loaded" en recomendacion

Entrenar o reentrenar el modelo:

```bash
npm run train:model
```

### Error en migraciones

Reiniciar la base de datos:

```bash
npm run db:reset
```

### Limpiar cache de npm

```bash
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
npm run install:all
```

---

## Tests

### Ejecutar todos los tests

```bash
npm test
```

### Solo tests de backend

```bash
npm run test:backend
```

### Tests con cobertura

```bash
cd backend
npm test -- --coverage
cd ..
```

### Cobertura actual

- Statements: 92.69%
- Branches: 80.05%
- Functions: 92.59%
- Lines: 93.89%

---

## Documentacion Adicional

- [Backend README](./backend/README.md) - Documentacion especifica del backend
- [Frontend README](./frontend/README.md) - Documentacion especifica del frontend
- [Motor de Recomendacion](./backend/src/recommender/README.md) - Documentacion del modelo TFRS
- [Guia de Despliegue](./backend/DEPLOYMENT_GUIDE.md) - Instrucciones para produccion

---

## Licencia

MIT License - Proyecto academico (TFG)
