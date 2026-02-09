# Backend (Node.js/Express)

API REST en Node.js/Express con Sequelize y PostgreSQL.

## Requisitos

- Node.js: **24.11.0** (recomendado)
- npm: **11.6.1**
- Docker + Docker Compose (para PostgreSQL local)

## Configuración de entorno

1) Copia el archivo de ejemplo:

```bash
cp .env.sample .env
```

2) Completa las variables en `.env`:

- `DB_USER` / `DB_PASSWORD`: credenciales de PostgreSQL
- `DB_HOST`: normalmente `localhost` si usas Docker local
- `DB_NAME`: nombre de la base de datos
- `DB_PORT`: normalmente `5432`
- `JWT_SECRET`: secreto para firmar tokens
- `CORS_ORIGIN`: origen permitido, por ejemplo `http://localhost:4200`
- `SERVER_PORT`: puerto del backend, por defecto `4000`

> Nota: el backend carga `.env` automáticamente (dotenv).

## Levantar la base de datos (Docker)

Desde la carpeta `backend/`:

```bash
docker-compose up -d
```

Si ya lo tenías levantado y quieres reiniciar limpio:

```bash
docker-compose down -v
docker-compose up -d
```

## Instalar dependencias

```bash
npm install
```

## Migraciones y seeders

Ejecuta migraciones:

```bash
npm run migrate
```

Carga datos de ejemplo (seeders):

```bash
npm run seed
```

## Ejecutar el backend

Modo normal:

```bash
npm start
```

Modo desarrollo (reinicio automático):

```bash
npm run dev
```

Si todo está OK deberías ver algo como: `Server is running on port 4000`.

## Tests

```bash
npm test
```

## Endpoints útiles

- Health check: `GET /api/health`
