/**
 * Sistema de Middlewares RBAC
 * Proporciona middlewares de autenticacion y autorizacion
 */

const { StatusCodes } = require('http-status-codes');
const { tokenDecode } = require('../libs/jwtHelper');
const { hasPermission, hasAnyPermission } = require('../auth/permissions');
const { logAudit } = require('../services/auditService');

// EXTRACCION DE TOKEN


const getToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};

// MIDDLEWARE DE AUTENTICACION

/**
 * Valida el token JWT y adjunta el usuario a req.user
 * Devuelve 401 si no hay token o es invalido
 * Devuelve 403 si el usuario no esta activo
 */
const requireAuth = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid token.',
    });
  }

  try {
    const decoded = tokenDecode(token);

    // Verificar si el usuario esta activo
    if (decoded.status && decoded.status !== 'active') {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'USER_NOT_ACTIVE',
        message: 'User account is not active. Please contact support.',
      });
    }

    // Adjuntar informacion del usuario a la peticion
    req.user = {
      id: parseInt(decoded.sub, 10),
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || null,
      status: decoded.status,
    };

    next();
  } catch (error) {
    return res.status(StatusCodes.FORBIDDEN).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

// MIDDLEWARES DE AUTORIZACION BASADOS EN ROLES

/**
 * Comprueba si el usuario tiene ALGUNO de los roles especificados.
 * Devuelve 403 si el usuario no tiene el rol requerido.
 * @param {string[]} roles - Array de roles permitidos
 */
const requireAnyRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!req.user.role) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'NO_ROLE_ASSIGNED',
        message: 'User has no role assigned. Please contact an administrator.',
      });
    }

    if (!roles.includes(req.user.role)) {
      // Registrar intento de acceso no autorizado
      logAudit({
        userId: req.user.id,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entityType: 'ENDPOINT',
        entityId: req.path,
        metadata: {
          method: req.method,
          userRole: req.user.role,
          requiredRoles: roles,
        },
        status: 'DENIED',
      }).catch((err) => console.error('Audit log error:', err));

      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions. Required roles: ' + roles.join(', '),
      });
    }

    next();
  };

// MIDDLEWARES DE AUTORIZACION BASADOS EN PERMISOS


const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  if (!req.user.role) {
    return res.status(StatusCodes.FORBIDDEN).json({
      error: 'NO_ROLE_ASSIGNED',
      message: 'User has no role assigned. Please contact an administrator.',
    });
  }

  if (!hasPermission(req.user.role, permission)) {
    // Registrar intento de acceso no autorizado
    logAudit({
      userId: req.user.id,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      entityType: 'PERMISSION',
      entityId: permission,
      metadata: {
        method: req.method,
        path: req.path,
        userRole: req.user.role,
      },
      status: 'DENIED',
    }).catch((err) => console.error('Audit log error:', err));

    return res.status(StatusCodes.FORBIDDEN).json({
      error: 'FORBIDDEN',
      message: `Insufficient permissions. Required permission: ${permission}`,
    });
  }

  next();
};

const requireAnyPermission =
  (...permissions) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!req.user.role) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'NO_ROLE_ASSIGNED',
        message: 'User has no role assigned. Please contact an administrator.',
      });
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      // Registrar intento de acceso no autorizado
      logAudit({
        userId: req.user.id,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entityType: 'PERMISSIONS',
        entityId: permissions.join(','),
        metadata: {
          method: req.method,
          path: req.path,
          userRole: req.user.role,
        },
        status: 'DENIED',
      }).catch((err) => console.error('Audit log error:', err));

      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions.',
      });
    }

    next();
  };

// MIDDLEWARES DE AUTORIZACION BASADOS EN AMBITO


const requireScope = (checkFn) => async (req, res, next) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  try {
    const result = await checkFn(req, res);

    if (!result || typeof result.allowed !== 'boolean') {
      console.error('requireScope: checkFn must return { allowed: boolean, reason?: string }');
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'INTERNAL_ERROR',
        message: 'Authorization check failed.',
      });
    }

    if (!result.allowed) {
      // Registrar intento de acceso de ambito no autorizado
      logAudit({
        userId: req.user.id,
        action: 'UNAUTHORIZED_SCOPE_ACCESS',
        entityType: 'SCOPE_CHECK',
        entityId: req.path,
        metadata: {
          method: req.method,
          userRole: req.user.role,
          reason: result.reason || 'Scope check failed',
        },
        status: 'DENIED',
      }).catch((err) => console.error('Audit log error:', err));

      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'FORBIDDEN',
        message: result.reason || 'You do not have access to this resource.',
      });
    }

    next();
  } catch (error) {
    console.error('requireScope error:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'INTERNAL_ERROR',
      message: 'Authorization check failed.',
    });
  }
};


const requireSelfOrRoles =
  (paramName = 'id', ...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    const isSelf = String(req.user.id) === String(req.params[paramName]);

    if (isSelf) {
      return next();
    }

    // Si no es el propio usuario, comprobar roles
    return requireAnyRole(...roles)(req, res, next);
  };

// EXPORTACIONES

module.exports = {
  // Autenticacion
  requireAuth,

  // Basados en roles
  requireAnyRole,

  // Basados en permisos
  requirePermission,
  requireAnyPermission,

  // Basados en ambito
  requireScope,
  requireSelfOrRoles,
};
