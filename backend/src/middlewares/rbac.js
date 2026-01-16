/**
 * RBAC Middleware System
 * Provides authentication and authorization middlewares
 */

const { StatusCodes } = require('http-status-codes');
const { tokenDecode } = require('../libs/jwtHelper');
const { hasPermission, hasAnyPermission } = require('../auth/permissions');
const { logAudit } = require('../services/auditService');

// ============================================================================
// TOKEN EXTRACTION
// ============================================================================

/**
 * Extract JWT token from Authorization header
 * @param {Object} req - Express request
 * @returns {string|null} - Token or null
 */
const getToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Validates JWT token and attaches user to req.user
 * Returns 401 if no token or invalid token
 * Returns 403 if user is not active
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

    // Check if user is active
    if (decoded.status && decoded.status !== 'active') {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'USER_NOT_ACTIVE',
        message: 'User account is not active. Please contact support.',
      });
    }

    // Attach user info to request
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

// ============================================================================
// ROLE-BASED AUTHORIZATION MIDDLEWARES
// ============================================================================

/**
 * Checks if user has ANY of the specified roles
 * Returns 403 if user doesn't have required role
 * @param {string[]} roles - Array of allowed roles
 */
const requireAnyRole = (...roles) => (req, res, next) => {
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
    // Log unauthorized access attempt
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
    }).catch(err => console.error('Audit log error:', err));

    return res.status(StatusCodes.FORBIDDEN).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions. Required roles: ' + roles.join(', '),
    });
  }

  next();
};

// ============================================================================
// PERMISSION-BASED AUTHORIZATION MIDDLEWARES
// ============================================================================

/**
 * Checks if user has a specific permission
 * Returns 403 if user doesn't have permission
 * @param {string} permission - Required permission
 */
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
    // Log unauthorized access attempt
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
    }).catch(err => console.error('Audit log error:', err));

    return res.status(StatusCodes.FORBIDDEN).json({
      error: 'FORBIDDEN',
      message: `Insufficient permissions. Required permission: ${permission}`,
    });
  }

  next();
};

/**
 * Checks if user has ANY of the specified permissions
 * Returns 403 if user doesn't have any permission
 * @param {string[]} permissions - Array of permissions
 */
const requireAnyPermission = (...permissions) => (req, res, next) => {
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
    // Log unauthorized access attempt
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
    }).catch(err => console.error('Audit log error:', err));

    return res.status(StatusCodes.FORBIDDEN).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions.',
    });
  }

  next();
};

// ============================================================================
// SCOPE-BASED AUTHORIZATION MIDDLEWARES
// ============================================================================

/**
 * Validates scope-based access using a custom check function
 * The checkFn should return { allowed: boolean, reason?: string }
 * 
 * @param {Function} checkFn - async function(req, res) that validates scope
 * 
 * Example usage:
 * requireScope(async (req) => {
 *   const userId = req.user.id;
 *   const resourceId = req.params.id;
 *   const resource = await fetchResource(resourceId);
 *   
 *   // Admin has global access
 *   if (req.user.role === 'admin') {
 *     return { allowed: true };
 *   }
 *   
 *   // Check if user owns the resource
 *   if (resource.ownerId === userId) {
 *     return { allowed: true };
 *   }
 *   
 *   // Check if user is assigned to the resource's club
 *   const userClub = await getUserClub(userId);
 *   if (userClub.clubId === resource.clubId) {
 *     return { allowed: true };
 *   }
 *   
 *   return { allowed: false, reason: 'Resource not in your scope' };
 * })
 */
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
      // Log unauthorized scope access attempt
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
      }).catch(err => console.error('Audit log error:', err));

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

/**
 * Allows access if user matches path param (self) OR has one of specified roles
 * @param {string} paramName - Name of the path parameter to check (default: 'id')
 * @param {string[]} roles - Array of roles that bypass the self-check
 */
const requireSelfOrRoles = (paramName = 'id', ...roles) => (req, res, next) => {
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

  // If not self, check roles
  return requireAnyRole(...roles)(req, res, next);
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Authentication
  requireAuth,
  
  // Role-based
  requireAnyRole,
  
  // Permission-based
  requirePermission,
  requireAnyPermission,
  
  // Scope-based
  requireScope,
  requireSelfOrRoles,
  
  // Legacy aliases for backward compatibility
  authenticateToken: requireAuth,
  authorizeRoles: requireAnyRole,
  authorizeSelfOrRoles: requireSelfOrRoles,
};
