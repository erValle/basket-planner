# Frontend (Angular)

SPA en Angular 21 con Standalone Components y PrimeNG.

## Requisitos

- Node.js: **20.0.0 o superior**
- npm: **10.0.0 o superior**

## Instalar dependencias

```bash
npm install
```

## Servidor de desarrollo

```bash
npm start
```

Abre el navegador en `http://localhost:4200`. La aplicacion se recarga automaticamente al modificar archivos.

> El proxy (`proxy.conf.json`) redirige las peticiones `/api` al backend en `http://localhost:4000`.

## Build de produccion

```bash
npm run build
```

Los artefactos se generan en `dist/frontend/`.

## Tests

```bash
npm test
```

## Estructura

```
src/
├── app/
│   ├── components/     # Componentes reutilizables
│   ├── constants/      # Constantes de la aplicacion
│   ├── core/           # Guards, interceptors, servicios base, auth
│   ├── layout/         # Shell y navegacion principal
│   ├── modals/         # Modales reutilizables
│   ├── models/         # Interfaces y tipos TypeScript
│   ├── pages/          # Paginas/vistas de la aplicacion
│   └── services/       # Servicios API (comunicacion con backend)
├── main.ts             # Punto de entrada
└── styles.css          # Estilos globales
```

## Tecnologias

- Angular 21 (Standalone Components)
- PrimeNG 21 (componentes UI)
- Tailwind CSS 4
- RxJS
- TypeScript 5.9
