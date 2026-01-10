/**
 * RBAC Permissions System
 * Single source of truth for all permissions in the application
 */

// ============================================================================
// PERMISSION CONSTANTS (Atomic permissions grouped by domain)
// ============================================================================

const PERMISSIONS = {
  // Authentication
  AUTH_LOGIN: 'auth:login',
  AUTH_CHANGE_PASSWORD: 'auth:change_password',
  AUTH_VIEW_PROFILE: 'auth:view_profile',

  // Users Management
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_READ_OWN: 'users:read_own',
  USERS_UPDATE: 'users:update',
  USERS_UPDATE_OWN: 'users:update_own',
  USERS_DELETE: 'users:delete',
  USERS_LIST: 'users:list',

  // Clubs
  CLUBS_CREATE: 'clubs:create',
  CLUBS_READ: 'clubs:read',
  CLUBS_UPDATE: 'clubs:update',
  CLUBS_UPDATE_OWN: 'clubs:update_own',
  CLUBS_DELETE: 'clubs:delete',
  CLUBS_LIST: 'clubs:list',

  // Teams
  TEAMS_CREATE: 'teams:create',
  TEAMS_CREATE_CLUB: 'teams:create_club', // Limited to club scope
  TEAMS_READ: 'teams:read',
  TEAMS_UPDATE: 'teams:update',
  TEAMS_UPDATE_CLUB: 'teams:update_club', // Limited to club scope
  TEAMS_UPDATE_ASSIGNED: 'teams:update_assigned', // Limited to assigned teams
  TEAMS_DELETE: 'teams:delete',
  TEAMS_LIST: 'teams:list',
  TEAMS_ADD_PLAYERS: 'teams:add_players',
  TEAMS_REMOVE_PLAYERS: 'teams:remove_players',

  // Players
  PLAYERS_CREATE: 'players:create',
  PLAYERS_CREATE_CLUB: 'players:create_club', // Limited to club scope
  PLAYERS_READ: 'players:read',
  PLAYERS_READ_OWN: 'players:read_own',
  PLAYERS_UPDATE: 'players:update',
  PLAYERS_UPDATE_CLUB: 'players:update_club', // Limited to club scope
  PLAYERS_UPDATE_OWN: 'players:update_own',
  PLAYERS_DELETE: 'players:delete',
  PLAYERS_LIST: 'players:list',
  PLAYERS_TRANSFER: 'players:transfer',
  PLAYERS_TRANSFER_CLUB: 'players:transfer_club', // Limited to club scope
  PLAYERS_VIEW_HISTORY: 'players:view_history',
  PLAYERS_VIEW_OWN_HISTORY: 'players:view_own_history',

  // Exercises
  EXERCISES_CREATE: 'exercises:create',
  EXERCISES_READ: 'exercises:read',
  EXERCISES_UPDATE: 'exercises:update',
  EXERCISES_DELETE: 'exercises:delete',
  EXERCISES_LIST: 'exercises:list',

  // Equipment (Material)
  EQUIPMENT_CREATE: 'equipment:create',
  EQUIPMENT_CREATE_CLUB: 'equipment:create_club', // Limited to club scope
  EQUIPMENT_READ: 'equipment:read',
  EQUIPMENT_UPDATE: 'equipment:update',
  EQUIPMENT_UPDATE_CLUB: 'equipment:update_club', // Limited to club scope
  EQUIPMENT_DELETE: 'equipment:delete',
  EQUIPMENT_LIST: 'equipment:list',

  // Training Plans (Planifications)
  PLANS_CREATE: 'plans:create',
  PLANS_CREATE_INDIVIDUAL: 'plans:create_individual', // For assigned players
  PLANS_CREATE_GROUP: 'plans:create_group', // For assigned teams
  PLANS_READ: 'plans:read',
  PLANS_READ_OWN: 'plans:read_own',
  PLANS_UPDATE: 'plans:update',
  PLANS_UPDATE_ASSIGNED: 'plans:update_assigned', // Limited to created or assigned
  PLANS_DELETE: 'plans:delete',
  PLANS_LIST: 'plans:list',
  PLANS_EXPORT: 'plans:export',
  PLANS_EXPORT_OWN: 'plans:export_own',

  // Plan Versions
  VERSIONS_CREATE: 'versions:create',
  VERSIONS_READ: 'versions:read',
  VERSIONS_READ_OWN: 'versions:read_own',
  VERSIONS_UPDATE: 'versions:update',
  VERSIONS_DELETE: 'versions:delete',
  VERSIONS_ACTIVATE: 'versions:activate',
  VERSIONS_RESTORE: 'versions:restore',
  VERSIONS_LIST: 'versions:list',

  // Plan Assignments
  ASSIGNMENTS_CREATE: 'assignments:create',
  ASSIGNMENTS_READ: 'assignments:read',
  ASSIGNMENTS_READ_OWN: 'assignments:read_own',
  ASSIGNMENTS_UPDATE: 'assignments:update',
  ASSIGNMENTS_DELETE: 'assignments:delete',
  ASSIGNMENTS_LIST: 'assignments:list',

  // Feedback
  FEEDBACK_CREATE: 'feedback:create',
  FEEDBACK_READ: 'feedback:read',
  FEEDBACK_UPDATE: 'feedback:update',
  FEEDBACK_DELETE: 'feedback:delete',
  FEEDBACK_LIST: 'feedback:list',
  FEEDBACK_STATS: 'feedback:stats',

  // Metrics
  METRICS_CREATE: 'metrics:create',
  METRICS_READ: 'metrics:read',
  METRICS_UPDATE: 'metrics:update',
  METRICS_DELETE: 'metrics:delete',
  METRICS_LIST: 'metrics:list',

  // Recommender System
  RECOMMENDER_TRAIN: 'recommender:train',
  RECOMMENDER_STATUS: 'recommender:status',
  RECOMMENDER_CONFIG: 'recommender:config',
  RECOMMENDER_MODELS: 'recommender:models',
  RECOMMENDER_ACTIVATE: 'recommender:activate',

  // Monitoring
  MONITORING_VIEW: 'monitoring:view',
  MONITORING_EXPORT: 'monitoring:export',

  // Audit Logs
  AUDIT_READ: 'audit:read',
  AUDIT_LIST: 'audit:list',

  // User-Club Relationships
  USER_CLUBS_CREATE: 'user_clubs:create',
  USER_CLUBS_READ: 'user_clubs:read',
  USER_CLUBS_UPDATE: 'user_clubs:update',
  USER_CLUBS_DELETE: 'user_clubs:delete',
  USER_CLUBS_LIST: 'user_clubs:list',
};

// ============================================================================
// ROLE-BASED PERMISSION MAPPING
// ============================================================================

const ROLE_PERMISSIONS = {
  // ADMIN: Full access to everything
  admin: [
    // Auth
    PERMISSIONS.AUTH_LOGIN,
    PERMISSIONS.AUTH_CHANGE_PASSWORD,
    PERMISSIONS.AUTH_VIEW_PROFILE,
    
    // Users
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_READ_OWN,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_UPDATE_OWN,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_LIST,
    
    // Clubs
    PERMISSIONS.CLUBS_CREATE,
    PERMISSIONS.CLUBS_READ,
    PERMISSIONS.CLUBS_UPDATE,
    PERMISSIONS.CLUBS_DELETE,
    PERMISSIONS.CLUBS_LIST,
    
    // Teams
    PERMISSIONS.TEAMS_CREATE,
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.TEAMS_UPDATE,
    PERMISSIONS.TEAMS_DELETE,
    PERMISSIONS.TEAMS_LIST,
    PERMISSIONS.TEAMS_ADD_PLAYERS,
    PERMISSIONS.TEAMS_REMOVE_PLAYERS,
    
    // Players
    PERMISSIONS.PLAYERS_CREATE,
    PERMISSIONS.PLAYERS_READ,
    PERMISSIONS.PLAYERS_UPDATE,
    PERMISSIONS.PLAYERS_DELETE,
    PERMISSIONS.PLAYERS_LIST,
    PERMISSIONS.PLAYERS_TRANSFER,
    PERMISSIONS.PLAYERS_VIEW_HISTORY,
    
    // Exercises
    PERMISSIONS.EXERCISES_CREATE,
    PERMISSIONS.EXERCISES_READ,
    PERMISSIONS.EXERCISES_UPDATE,
    PERMISSIONS.EXERCISES_DELETE,
    PERMISSIONS.EXERCISES_LIST,
    
    // Equipment
    PERMISSIONS.EQUIPMENT_CREATE,
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.EQUIPMENT_UPDATE,
    PERMISSIONS.EQUIPMENT_DELETE,
    PERMISSIONS.EQUIPMENT_LIST,
    
    // Plans
    PERMISSIONS.PLANS_CREATE,
    PERMISSIONS.PLANS_CREATE_INDIVIDUAL,
    PERMISSIONS.PLANS_CREATE_GROUP,
    PERMISSIONS.PLANS_READ,
    PERMISSIONS.PLANS_UPDATE,
    PERMISSIONS.PLANS_DELETE,
    PERMISSIONS.PLANS_LIST,
    PERMISSIONS.PLANS_EXPORT,
    
    // Versions
    PERMISSIONS.VERSIONS_CREATE,
    PERMISSIONS.VERSIONS_READ,
    PERMISSIONS.VERSIONS_UPDATE,
    PERMISSIONS.VERSIONS_DELETE,
    PERMISSIONS.VERSIONS_ACTIVATE,
    PERMISSIONS.VERSIONS_RESTORE,
    PERMISSIONS.VERSIONS_LIST,
    
    // Assignments
    PERMISSIONS.ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_UPDATE,
    PERMISSIONS.ASSIGNMENTS_DELETE,
    PERMISSIONS.ASSIGNMENTS_LIST,
    
    // Feedback
    PERMISSIONS.FEEDBACK_CREATE,
    PERMISSIONS.FEEDBACK_READ,
    PERMISSIONS.FEEDBACK_UPDATE,
    PERMISSIONS.FEEDBACK_DELETE,
    PERMISSIONS.FEEDBACK_LIST,
    PERMISSIONS.FEEDBACK_STATS,
    
    // Metrics
    PERMISSIONS.METRICS_CREATE,
    PERMISSIONS.METRICS_READ,
    PERMISSIONS.METRICS_UPDATE,
    PERMISSIONS.METRICS_DELETE,
    PERMISSIONS.METRICS_LIST,
    
    // Recommender
    PERMISSIONS.RECOMMENDER_TRAIN,
    PERMISSIONS.RECOMMENDER_STATUS,
    PERMISSIONS.RECOMMENDER_CONFIG,
    PERMISSIONS.RECOMMENDER_MODELS,
    PERMISSIONS.RECOMMENDER_ACTIVATE,
    
    // Monitoring
    PERMISSIONS.MONITORING_VIEW,
    PERMISSIONS.MONITORING_EXPORT,
    
    // Audit
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_LIST,
    
    // User-Clubs
    PERMISSIONS.USER_CLUBS_CREATE,
    PERMISSIONS.USER_CLUBS_READ,
    PERMISSIONS.USER_CLUBS_UPDATE,
    PERMISSIONS.USER_CLUBS_DELETE,
    PERMISSIONS.USER_CLUBS_LIST,
  ],

  // TECHNICAL DIRECTOR: Club-scoped management
  technical_director: [
    // Auth
    PERMISSIONS.AUTH_LOGIN,
    PERMISSIONS.AUTH_CHANGE_PASSWORD,
    PERMISSIONS.AUTH_VIEW_PROFILE,
    
    // Users (limited)
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_READ_OWN,
    PERMISSIONS.USERS_UPDATE_OWN,
    PERMISSIONS.USERS_LIST,
    
    // Clubs (limited to own club)
    PERMISSIONS.CLUBS_READ,
    PERMISSIONS.CLUBS_UPDATE_OWN,
    PERMISSIONS.CLUBS_LIST,
    
    // Teams (limited to club)
    PERMISSIONS.TEAMS_CREATE_CLUB,
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.TEAMS_UPDATE_CLUB,
    PERMISSIONS.TEAMS_LIST,
    PERMISSIONS.TEAMS_ADD_PLAYERS,
    PERMISSIONS.TEAMS_REMOVE_PLAYERS,
    
    // Players (limited to club)
    PERMISSIONS.PLAYERS_CREATE_CLUB,
    PERMISSIONS.PLAYERS_READ,
    PERMISSIONS.PLAYERS_UPDATE_CLUB,
    PERMISSIONS.PLAYERS_LIST,
    PERMISSIONS.PLAYERS_TRANSFER_CLUB,
    PERMISSIONS.PLAYERS_VIEW_HISTORY,
    
    // Exercises
    PERMISSIONS.EXERCISES_CREATE,
    PERMISSIONS.EXERCISES_READ,
    PERMISSIONS.EXERCISES_UPDATE,
    PERMISSIONS.EXERCISES_LIST,
    
    // Equipment (limited to club)
    PERMISSIONS.EQUIPMENT_CREATE_CLUB,
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.EQUIPMENT_UPDATE_CLUB,
    PERMISSIONS.EQUIPMENT_LIST,
    
    // Plans (limited to club players/teams)
    PERMISSIONS.PLANS_CREATE_INDIVIDUAL,
    PERMISSIONS.PLANS_CREATE_GROUP,
    PERMISSIONS.PLANS_READ,
    PERMISSIONS.PLANS_UPDATE_ASSIGNED,
    PERMISSIONS.PLANS_LIST,
    PERMISSIONS.PLANS_EXPORT,
    
    // Versions
    PERMISSIONS.VERSIONS_CREATE,
    PERMISSIONS.VERSIONS_READ,
    PERMISSIONS.VERSIONS_UPDATE,
    PERMISSIONS.VERSIONS_ACTIVATE,
    PERMISSIONS.VERSIONS_RESTORE,
    PERMISSIONS.VERSIONS_LIST,
    
    // Assignments
    PERMISSIONS.ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_UPDATE,
    PERMISSIONS.ASSIGNMENTS_DELETE,
    PERMISSIONS.ASSIGNMENTS_LIST,
    
    // Feedback
    PERMISSIONS.FEEDBACK_CREATE,
    PERMISSIONS.FEEDBACK_READ,
    PERMISSIONS.FEEDBACK_UPDATE,
    PERMISSIONS.FEEDBACK_DELETE,
    PERMISSIONS.FEEDBACK_LIST,
    PERMISSIONS.FEEDBACK_STATS,
    
    // Metrics
    PERMISSIONS.METRICS_CREATE,
    PERMISSIONS.METRICS_READ,
    PERMISSIONS.METRICS_UPDATE,
    PERMISSIONS.METRICS_DELETE,
    PERMISSIONS.METRICS_LIST,
    
    // User-Clubs
    PERMISSIONS.USER_CLUBS_CREATE,
    PERMISSIONS.USER_CLUBS_READ,
    PERMISSIONS.USER_CLUBS_UPDATE,
    PERMISSIONS.USER_CLUBS_DELETE,
    PERMISSIONS.USER_CLUBS_LIST,
  ],

  // COACH: Team-scoped management
  coach: [
    // Auth
    PERMISSIONS.AUTH_LOGIN,
    PERMISSIONS.AUTH_CHANGE_PASSWORD,
    PERMISSIONS.AUTH_VIEW_PROFILE,
    
    // Users (read only own)
    PERMISSIONS.USERS_READ_OWN,
    PERMISSIONS.USERS_UPDATE_OWN,
    
    // Clubs (read only)
    PERMISSIONS.CLUBS_READ,
    PERMISSIONS.CLUBS_LIST,
    
    // Teams (limited to assigned teams)
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.TEAMS_UPDATE_ASSIGNED,
    PERMISSIONS.TEAMS_LIST,
    PERMISSIONS.TEAMS_ADD_PLAYERS,
    PERMISSIONS.TEAMS_REMOVE_PLAYERS,
    
    // Players (limited to assigned teams/club)
    PERMISSIONS.PLAYERS_READ,
    PERMISSIONS.PLAYERS_UPDATE_CLUB,
    PERMISSIONS.PLAYERS_LIST,
    PERMISSIONS.PLAYERS_VIEW_HISTORY,
    
    // Exercises
    PERMISSIONS.EXERCISES_CREATE,
    PERMISSIONS.EXERCISES_READ,
    PERMISSIONS.EXERCISES_UPDATE,
    PERMISSIONS.EXERCISES_LIST,
    
    // Equipment (read and update for club)
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.EQUIPMENT_UPDATE_CLUB,
    PERMISSIONS.EQUIPMENT_LIST,
    
    // Plans (limited to assigned players)
    PERMISSIONS.PLANS_CREATE_INDIVIDUAL,
    PERMISSIONS.PLANS_CREATE_GROUP,
    PERMISSIONS.PLANS_READ,
    PERMISSIONS.PLANS_UPDATE_ASSIGNED,
    PERMISSIONS.PLANS_LIST,
    PERMISSIONS.PLANS_EXPORT,
    
    // Versions
    PERMISSIONS.VERSIONS_CREATE,
    PERMISSIONS.VERSIONS_READ,
    PERMISSIONS.VERSIONS_UPDATE,
    PERMISSIONS.VERSIONS_ACTIVATE,
    PERMISSIONS.VERSIONS_RESTORE,
    PERMISSIONS.VERSIONS_LIST,
    
    // Assignments
    PERMISSIONS.ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_UPDATE,
    PERMISSIONS.ASSIGNMENTS_DELETE,
    PERMISSIONS.ASSIGNMENTS_LIST,
    
    // Feedback
    PERMISSIONS.FEEDBACK_CREATE,
    PERMISSIONS.FEEDBACK_READ,
    PERMISSIONS.FEEDBACK_LIST,
    PERMISSIONS.FEEDBACK_STATS,
  ],

  // PLAYER: Read-only with self access
  player: [
    // Auth
    PERMISSIONS.AUTH_LOGIN,
    PERMISSIONS.AUTH_CHANGE_PASSWORD,
    PERMISSIONS.AUTH_VIEW_PROFILE,
    
    // Users (own only)
    PERMISSIONS.USERS_READ_OWN,
    PERMISSIONS.USERS_UPDATE_OWN,
    
    // Clubs (read only)
    PERMISSIONS.CLUBS_READ,
    PERMISSIONS.CLUBS_LIST,
    
    // Teams (read only)
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.TEAMS_LIST,
    
    // Players (own only)
    PERMISSIONS.PLAYERS_READ_OWN,
    PERMISSIONS.PLAYERS_UPDATE_OWN,
    PERMISSIONS.PLAYERS_VIEW_OWN_HISTORY,
    
    // Exercises (read only)
    PERMISSIONS.EXERCISES_READ,
    PERMISSIONS.EXERCISES_LIST,
    
    // Equipment (read only)
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.EQUIPMENT_LIST,
    
    // Plans (own only)
    PERMISSIONS.PLANS_READ_OWN,
    PERMISSIONS.PLANS_EXPORT_OWN,
    
    // Versions (own only)
    PERMISSIONS.VERSIONS_READ_OWN,
    
    // Assignments (own only)
    PERMISSIONS.ASSIGNMENTS_READ_OWN,
    
    // Feedback
    PERMISSIONS.FEEDBACK_CREATE,
    PERMISSIONS.FEEDBACK_READ,
  ],

  // USER: Minimal access (for users without role yet)
  user: [
    PERMISSIONS.AUTH_LOGIN,
    PERMISSIONS.AUTH_CHANGE_PASSWORD,
    PERMISSIONS.AUTH_VIEW_PROFILE,
    PERMISSIONS.USERS_READ_OWN,
    PERMISSIONS.USERS_UPDATE_OWN,
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const rolePermissions = ROLE_PERMISSIONS[role];
  if (!rolePermissions) return false;
  return rolePermissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
function hasAnyPermission(role, permissions) {
  if (!role || !permissions || permissions.length === 0) return false;
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has ALL of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
function hasAllPermissions(role, permissions) {
  if (!role || !permissions || permissions.length === 0) return false;
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]}
 */
function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
};
