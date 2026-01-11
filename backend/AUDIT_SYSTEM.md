# Sistema de Auditoría - Basket Planner

## Descripción General

El sistema de auditoría registra **únicamente acciones de negocio relevantes**, evitando la sobrecarga de registrar todas las peticiones HTTP. Esto asegura que los logs sean significativos, manejables y útiles para auditoría y análisis.

## ⚠️ Nota Importante: Limpieza de Logs Antiguos

Si has actualizado desde una versión anterior que registraba todas las peticiones HTTP, probablemente tengas miles de registros innecesarios en la base de datos. Para limpiarlos:

```bash
cd backend
node scripts/clean-http-audit-logs.js
```

Este script:
- ✅ Elimina todos los registros de `http_request.success` y `http_request.error`
- ✅ Conserva todos los logs de acciones de negocio
- ✅ Muestra estadísticas antes y después de la limpieza
- ✅ Es seguro ejecutarlo múltiples veces

## Cambios Implementados

### 1. Eliminación del Middleware de Auditoría HTTP
- ❌ **Eliminado**: `auditRequestMiddleware` que registraba todas las peticiones HTTP
- ✅ **Motivo**: Generaba demasiados registros irrelevantes (GET, OPTIONS, health checks, etc.)
- ✅ **Ubicación**: Eliminado de `backend/app.js`

### 2. Whitelist de Acciones Permitidas
Se ha implementado una lista blanca (`ALLOWED_AUDIT_ACTIONS`) que contiene únicamente las acciones de negocio que deben ser registradas:

#### Categorías de Acciones Permitidas:

**👤 Usuarios (`user.*`)**
- `user.created` - Registro de nuevo usuario
- `user.login` - Inicio de sesión
- `user.logout` - Cierre de sesión
- `user.updated` - Actualización de datos
- `user.deleted` - Eliminación de usuario
- `user.password_changed` - Cambio de contraseña
- `user.role_changed` - Cambio de rol

**📋 Planes de Entrenamiento (`training_plan.*`)**
- `training_plan.created` - Creación manual
- `training_plan.updated` - Actualización
- `training_plan.deleted` - Eliminación
- `training_plan.generated` - Generación automática
- `training_plan.duplicated` - Duplicación

**📄 Versiones de Planes (`training_plan_version.*`)**
- `training_plan_version.created` - Nueva versión
- `training_plan_version.published` - Publicación
- `training_plan_version.activated` - Activación

**🎯 Asignaciones (`plan_assignment.*`)**
- `plan_assignment.created` - Asignación a jugador
- `plan_assignment.viewed_by_player` - Visualización por jugador
- `plan_assignment.updated` - Actualización
- `plan_assignment.deleted` - Eliminación
- `plan_assignment.status_changed` - Cambio de estado

**💬 Feedback (`feedback.*`)**
- `feedback.created` - Nuevo feedback
- `feedback.updated` - Actualización
- `feedback.deleted` - Eliminación

**🏢 Clubes (`club.*`)**
- `club.created` - Creación
- `club.updated` - Actualización
- `club.deleted` - Eliminación

**👥 Equipos (`team.*`)**
- `team.created` - Creación
- `team.updated` - Actualización
- `team.deleted` - Eliminación
- `team.player_added` - Añadir jugador
- `team.player_removed` - Eliminar jugador

**🏋️ Ejercicios (`exercise.*`)**
- `exercise.created` - Creación
- `exercise.updated` - Actualización
- `exercise.deleted` - Eliminación

**⚙️ Equipamiento (`equipment.*`)**
- `equipment.created` - Creación
- `equipment.updated` - Actualización
- `equipment.deleted` - Eliminación

## Comportamiento del Sistema

### Acciones Permitidas
- ✅ Se registran en la base de datos
- ✅ Aparecen en el panel de auditoría
- ✅ Incluyen metadata relevante

### Acciones No Permitidas
- ⚠️ Se ignoran silenciosamente
- ⚠️ NO rompen el flujo de ejecución
- ⚠️ Retornan `null` sin lanzar error

### Ejemplo de Uso

```javascript
// Esto SE registrará
await auditLogService.createAuditLog({
  user: req.user,
  requestId: req.requestId,
  action: 'training_plan.created',
  entity: 'TrainingPlan',
  entityId: plan.id,
  metadata: { name: plan.name }
});

// Esto NO se registrará (se ignora silenciosamente)
await auditLogService.createAuditLog({
  user: req.user,
  action: 'http_request.success', // ❌ No está en la whitelist
  entity: 'HttpRequest',
  // ...
});
```

## Integraciones Implementadas

### 1. Autenticación (`authController.js`)
- ✅ Login de usuario
- ✅ Cambio de contraseña

### 2. Asignaciones de Planes (`planAssignmentController.js`)
- ✅ Visualización de plan por jugador (cuando el usuario autenticado es el asignado)

### 3. Servicios Existentes
Los siguientes servicios ya tienen auditoría implementada:
- ✅ `userService.js` - Creación y actualización de usuarios
- ✅ `trainingPlanService.js` - CRUD de planes
- ✅ `trainingPlanVersionService.js` - Gestión de versiones
- ✅ `planningGenerationService.js` - Generación automática

## Ventajas del Sistema Actual

1. **📉 Reducción de Volumen**: Solo se registran acciones significativas
2. **🎯 Claridad**: Los logs son fáciles de entender y analizar
3. **⚡ Performance**: Menor carga en la base de datos
4. **🔍 Auditoría Significativa**: Trazabilidad real de acciones de negocio
5. **🛡️ No Invasivo**: Las acciones no permitidas se ignoran sin romper flujos

## Mantenimiento

### Limpieza de Logs Antiguos de HTTP

Si actualizas desde una versión anterior, limpia los logs de HTTP antiguos:

```bash
node scripts/clean-http-audit-logs.js
```

**Resultado esperado:**
- Elimina registros de `http_request.*`
- Conserva todas las acciones de negocio
- Reduce significativamente el tamaño de la tabla `audit_logs`

### Añadir Nueva Acción de Auditoría

1. **Añadir a la whitelist** en `auditLogService.js`:
```javascript
const ALLOWED_AUDIT_ACTIONS = new Set([
  // ... acciones existentes
  'nueva_entidad.nueva_accion',
]);
```

2. **Registrar en el controlador/servicio**:
```javascript
await auditLogService.createAuditLog({
  user: req.user,
  requestId: req.requestId,
  action: 'nueva_entidad.nueva_accion',
  entity: 'NuevaEntidad',
  entityId: entidad.id,
  metadata: { /* datos relevantes */ }
});
```

### Consultar Acciones Permitidas

```javascript
const { ALLOWED_AUDIT_ACTIONS } = require('./services/auditLogService');

// Verificar si una acción está permitida
if (ALLOWED_AUDIT_ACTIONS.has('user.login')) {
  console.log('Acción permitida');
}

// Listar todas las acciones
console.log(Array.from(ALLOWED_AUDIT_ACTIONS));
```

## Consideraciones de Seguridad

- 🔒 Los logs NO contienen contraseñas ni datos sensibles
- 🔒 Solo se registra información necesaria para auditoría
- 🔒 Los usuarios solo pueden ver sus propias acciones (salvo admin)
- 🔒 Los logs son inmutables (no se pueden editar)

## Testing

El sistema de auditoría es compatible con el modo de testing:
- En tests sin DB, `createAuditLog` retorna `null` sin error
- Las acciones no permitidas retornan `null` sin romper tests
- Se puede verificar que las acciones correctas están en la whitelist

```javascript
// Test example
const { ALLOWED_AUDIT_ACTIONS } = require('../services/auditLogService');

describe('Audit System', () => {
  it('should include user.login in allowed actions', () => {
    expect(ALLOWED_AUDIT_ACTIONS.has('user.login')).toBe(true);
  });
});
```

## Archivos Modificados

1. ✅ `backend/app.js` - Eliminado middleware HTTP
2. ✅ `backend/src/services/auditLogService.js` - Añadida whitelist y validación
3. ✅ `backend/src/controllers/authController.js` - Auditoría de login y cambio de contraseña
4. ✅ `backend/src/controllers/planAssignmentController.js` - Auditoría de visualización por jugador

## Conclusión

El sistema de auditoría ahora está optimizado para registrar únicamente acciones de negocio significativas, proporcionando:
- ✅ Trazabilidad completa de operaciones importantes
- ✅ Reducción de sobrecarga en la base de datos
- ✅ Logs claros y útiles para auditoría
- ✅ Mantenibilidad y extensibilidad
