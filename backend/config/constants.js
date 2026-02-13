/**
 * Application-wide constants
 */

const ENCRYPTION_CONST = {
  SALT_ROUNDS: 10,
};

/**
 * Standard error codes used across the application.
 * Use these codes for consistent error responses.
 */
const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Entity-specific
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CLUB_NOT_FOUND: 'CLUB_NOT_FOUND',
  TEAM_NOT_FOUND: 'TEAM_NOT_FOUND',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  EXERCISE_NOT_FOUND: 'EXERCISE_NOT_FOUND',
  EQUIPMENT_NOT_FOUND: 'EQUIPMENT_NOT_FOUND',
  PLANNING_NOT_FOUND: 'PLANNING_NOT_FOUND',
  VERSION_NOT_FOUND: 'VERSION_NOT_FOUND',
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

/**
 * Standard error messages for user-facing responses.
 */
const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: 'Autenticación requerida',
  [ERROR_CODES.FORBIDDEN]: 'Acceso denegado',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Credenciales inválidas',
  [ERROR_CODES.TOKEN_EXPIRED]: 'La sesión ha expirado',
  [ERROR_CODES.TOKEN_INVALID]: 'Token inválido',
  [ERROR_CODES.VALIDATION_ERROR]: 'Error de validación',
  [ERROR_CODES.NOT_FOUND]: 'Recurso no encontrado',
  [ERROR_CODES.ALREADY_EXISTS]: 'El recurso ya existe',
  [ERROR_CODES.CONFLICT]: 'Conflicto con el estado actual',
  [ERROR_CODES.USER_NOT_FOUND]: 'Usuario no encontrado',
  [ERROR_CODES.CLUB_NOT_FOUND]: 'Club no encontrado',
  [ERROR_CODES.TEAM_NOT_FOUND]: 'Equipo no encontrado',
  [ERROR_CODES.PLAYER_NOT_FOUND]: 'Jugador no encontrado',
  [ERROR_CODES.EXERCISE_NOT_FOUND]: 'Ejercicio no encontrado',
  [ERROR_CODES.EQUIPMENT_NOT_FOUND]: 'Material no encontrado',
  [ERROR_CODES.PLANNING_NOT_FOUND]: 'Planificación no encontrada',
  [ERROR_CODES.VERSION_NOT_FOUND]: 'Versión no encontrada',
  [ERROR_CODES.ASSIGNMENT_NOT_FOUND]: 'Asignación no encontrada',
  [ERROR_CODES.INTERNAL_ERROR]: 'Error interno del servidor',
  [ERROR_CODES.DATABASE_ERROR]: 'Error de base de datos',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Servicio no disponible',
};

/**
 * Pagination defaults
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

/**
 * User roles in the system
 */
const ROLES = {
  ADMIN: 'admin',
  TECHNICAL_DIRECTOR: 'technical_director',
  COACH: 'coach',
  PLAYER: 'player',
};

/**
 * Player positions (Spanish)
 */
const POSITIONS = {
  BASE: 'base',
  ESCOLTA: 'escolta',
  ALERO: 'alero',
  ALA_PIVOT: 'ala-pivot',
  PIVOT: 'pivot',
};

/**
 * Player categories (Spanish)
 */
const CATEGORIES = {
  SENIOR: 'senior',
  JUVENIL: 'juvenil',
  INFANTIL: 'infantil',
};

module.exports = {
  ENCRYPTION_CONST,
  ERROR_CODES,
  ERROR_MESSAGES,
  PAGINATION,
  ROLES,
  POSITIONS,
  CATEGORIES,
};
