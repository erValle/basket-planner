/**
 * Unit tests for userService
 */

const { StatusCodes } = require('http-status-codes');

// Mock models
jest.mock('../../../models', () => ({
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock auditLogService
jest.mock('../../../src/services/auditLogService', () => ({
  createAuditLog: jest.fn().mockResolvedValue(null),
}));

const { User } = require('../../../models');
const userService = require('../../../src/services/userService');

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('returns all users when no filters', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@test.com', role: 'admin' },
        { id: 2, email: 'user2@test.com', role: 'coach' },
      ];
      User.findAll.mockResolvedValue(mockUsers);

      const result = await userService.listUsers({});

      expect(User.findAll).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual(mockUsers);
    });

    it('filters by email with iLike', async () => {
      User.findAll.mockResolvedValue([]);

      await userService.listUsers({ email: 'test' });

      expect(User.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          email: expect.any(Object),
        }),
      });
    });

    it('filters by role', async () => {
      User.findAll.mockResolvedValue([]);

      await userService.listUsers({ role: 'coach' });

      expect(User.findAll).toHaveBeenCalledWith({
        where: { role: 'coach' },
      });
    });

    it('filters by role=none with null check', async () => {
      User.findAll.mockResolvedValue([]);

      await userService.listUsers({ role: 'none' });

      expect(User.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          role: expect.any(Object),
        }),
      });
    });

    it('filters by status', async () => {
      User.findAll.mockResolvedValue([]);

      await userService.listUsers({ status: 'active' });

      expect(User.findAll).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });
  });

  describe('getUserById', () => {
    it('returns user when found', async () => {
      const mockUser = { id: 1, email: 'test@test.com' };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.getUserById(1);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('throws 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.getUserById(999)).rejects.toMatchObject({
        status: StatusCodes.NOT_FOUND,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('createUser', () => {
    it('creates user with hashed password', async () => {
      const mockUser = { id: 1, email: 'new@test.com', firstName: 'John', lastName: 'Doe' };
      User.create.mockResolvedValue(mockUser);

      const result = await userService.createUser({
        email: 'new@test.com',
        name: 'John Doe',
        password: 'password123',
        role: 'player',
        status: 'active',
      });

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@test.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: expect.any(String),
        role: 'player',
        status: 'active',
      }));
      expect(result).toEqual(mockUser);
    });

    it('throws error when password is missing', async () => {
      await expect(
        userService.createUser({ email: 'test@test.com', name: 'Test' })
      ).rejects.toMatchObject({
        status: StatusCodes.BAD_REQUEST,
        code: 'PASSWORD_REQUIRED',
      });
    });

    it('throws conflict error on duplicate email', async () => {
      const error = new Error('Duplicate');
      error.name = 'SequelizeUniqueConstraintError';
      User.create.mockRejectedValue(error);

      await expect(
        userService.createUser({ email: 'exists@test.com', name: 'Test', password: 'pass123' })
      ).rejects.toMatchObject({
        status: StatusCodes.CONFLICT,
        code: 'EMAIL_ALREADY_EXISTS',
      });
    });

    it('throws validation error on Sequelize validation failure', async () => {
      const error = new Error('Validation');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: 'Email is invalid' }];
      User.create.mockRejectedValue(error);

      await expect(
        userService.createUser({ email: 'invalid', name: 'Test', password: 'pass123' })
      ).rejects.toMatchObject({
        status: StatusCodes.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('updateUser', () => {
    it('updates user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'old@test.com',
        firstName: 'Old',
        lastName: 'Name',
        role: 'player',
        status: 'active',
        update: jest.fn().mockImplementation(function(updates) {
          Object.assign(this, updates);
          return Promise.resolve(this);
        }),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.updateUser(1, { email: 'new@test.com' });

      expect(mockUser.update).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@test.com',
      }));
      expect(result.email).toBe('new@test.com');
    });

    it('throws 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.updateUser(999, { email: 'test@test.com' })).rejects.toMatchObject({
        status: StatusCodes.NOT_FOUND,
      });
    });
  });

  describe('deleteUser', () => {
    it('deletes user successfully', async () => {
      const mockUser = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await userService.deleteUser(1);

      expect(mockUser.destroy).toHaveBeenCalled();
    });

    it('throws 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.deleteUser(999)).rejects.toMatchObject({
        status: StatusCodes.NOT_FOUND,
      });
    });
  });
});
