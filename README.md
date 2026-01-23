# Basket Planner

Sistema de planificación de entrenamientos de baloncesto con recomendación inteligente de ejercicios.

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Instalación

**Opción A: Setup automático (Recomendado)**

```bash
# En Linux/macOS
./setup.sh

# En Windows
setup.bat
```

Este script hará automáticamente:
- ✅ Verificar Node.js y npm
- ✅ Instalar todas las dependencias (root + backend + frontend)
- ✅ Crear archivo .env si no existe
- ✅ Mostrar instrucciones para configurar la base de datos

**Opción B: Setup manual**

**1. Clonar el repositorio:**
```bash
git clone <repository-url>
cd basket-planner
```

**2. Instalar TODAS las dependencias (root + backend + frontend):**
```bash
npm run install:all
```

Este comando instalará automáticamente:
- ✅ Dependencias del proyecto raíz (concurrently)
- ✅ Dependencias del backend (Express, Sequelize, etc.)
- ✅ Dependencias del frontend (Angular, PrimeNG, etc.)

**3. Configurar variables de entorno:**

Crear archivo `.env` en `backend/` basado en `.env.example`

**4. Configurar base de datos:**
```bash
cd backend
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
cd ..
```

### Ejecución

#### Arrancar ambos servicios simultáneamente (Recomendado)

```bash
# Desde el directorio raíz
npm start
```

Este comando arranca:
- 🔵 **Backend** en `http://localhost:4000`
- 🟣 **Frontend** en `http://localhost:4200`

#### Arrancar servicios por separado

```bash
# Terminal 1 - Backend
npm run start:backend

# Terminal 2 - Frontend
npm run start:frontend
```

### Modo Desarrollo (con hot-reload)

```bash
# Desde el directorio raíz
npm run dev
```

---

## 📋 Comandos Disponibles

### Desde el directorio raíz

```bash
npm run install:all      # Instala dependencias de root + backend + frontend
npm start               # Arranca backend y frontend simultáneamente
npm run dev             # Arranca en modo desarrollo con hot-reload
npm run start:backend   # Solo arranca el backend
npm run start:frontend  # Solo arranca el frontend
```

### Backend (desde /backend)

```bash
npm start               # Arranca el servidor en producción
npm run dev             # Arranca con nodemon (hot-reload)
npm test                # Ejecuta tests
npm run db:migrate      # Ejecuta migraciones
npm run db:seed         # Ejecuta seeders
```

### Frontend (desde /frontend)

```bash
npm start               # Arranca servidor de desarrollo (ng serve)
npm run build           # Build de producción
npm test                # Ejecuta tests unitarios
npm run lint            # Ejecuta linter
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
# Reinstalar todas las dependencias
npm run install:all
```

### Error: "Port already in use"
```bash
# Backend (puerto 4000)
lsof -ti:4000 | xargs kill -9

# Frontend (puerto 4200)
lsof -ti:4200 | xargs kill -9
```

### Error de base de datos
```bash
cd backend
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### Limpiar caché de npm
```bash
# En cada carpeta (root, backend, frontend)
rm -rf node_modules package-lock.json
npm install
```

---

## 📁 Estructura del Proyecto

```
basket-planner/
├── backend/           # API REST con Node.js + Express + Sequelize
├── frontend/          # App Angular 18+ standalone
├── frontendMockUps/   # Prototipos UI
├── package.json       # Scripts para arranque conjunto
└── README.md          # Este archivo
```

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- PostgreSQL + Sequelize ORM
- Sistema de auditoría
- Recomendador de ejercicios (modelo baseline)

### Frontend
- Angular 18+ (Standalone Components)
- PrimeNG UI Components
- RxJS
- Sistema de permisos RBAC

## 📚 Documentación Adicional

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Sistema de Feedback](./SISTEMA_FEEDBACK_COMPLETADO.md)
- [Flujos de Prueba](./FLUJOS_PRUEBA_COMPLETOS.md)
- [Tests](./TESTS_SUMMARY.md)

## 👥 Roles del Sistema

- **Admin**: Acceso completo
- **Technical Director**: Gestión de clubes y equipos
- **Coach**: Creación de planificaciones y gestión de jugadores
- **Player**: Visualización de planificaciones asignadas

## 🔐 Usuarios de Prueba

Ver archivo de configuración del backend para credenciales de prueba.

## 📝 Licencia

Proyecto académico - TFG
