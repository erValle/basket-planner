/**
 * Unit tests for RBAC middleware - Essential tests only
 */

const { StatusCodes } = require('http-status-codes');

// Mock jwt helper
jest.mock('../../../src/libs/jwtHelper', () => ({
  tokenDecode: jest.fn(),
}));

// Mock audit service
jest.mock('../../../src/services/auditService', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

const { tokenDecode } = require('../../../src/libs/jwtHelper');
const { requireAuth, requireAnyRole } = require('../../../src/middlewares/rbac');

describe('RBAC Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('requireAuth', () => {
    it('returns 401 when no Authorization header', () => {
      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';
      tokenDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(next).not.toHaveBeenCalled();
    });

    it('sets req.user and calls next when token is valid', () => {
      req.headers.authorization = 'Bearer valid-token';
      tokenDecode.mockReturnValue({
        sub: '1',
        email: 'test@test.com',
        role: 'admin',
        status: 'active',
      });

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toMatchObject({
        id: 1,
        email: 'test@test.com',
        role: 'admin',
      });
    });
  });

  describe('requireAnyRole', () => {
    it('returns 401 when req.user is not set', () => {
      const middleware = requireAnyRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user role is not allowed', () => {
      req.user = { id: 1, role: 'player' };
      const middleware = requireAnyRole('admin', 'coach');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next when user has allowed role', () => {
      req.user = { id: 1, role: 'admin' };
      const middleware = requireAnyRole('admin', 'coach');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
