/**
 * Unit tests for clubService
 */

const { StatusCodes } = require('http-status-codes');

// Mock models
jest.mock('../../../models', () => ({
  Club: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Team: {},
}));

const { Club } = require('../../../models');
const clubService = require('../../../src/services/clubService');

describe('clubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listClubs', () => {
    it('returns all clubs when no filters', async () => {
      const mockClubs = [
        { id: 1, name: 'Club A', active: true },
        { id: 2, name: 'Club B', active: false },
      ];
      Club.findAll.mockResolvedValue(mockClubs);

      const result = await clubService.listClubs({});

      expect(Club.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockClubs);
    });

    it('filters by name', async () => {
      Club.findAll.mockResolvedValue([]);

      await clubService.listClubs({ name: 'Test Club' });

      expect(Club.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: 'Test Club' },
        })
      );
    });
  });

  describe('getClubById', () => {
    it('returns club when found', async () => {
      const mockClub = { id: 1, name: 'Test Club' };
      Club.findByPk.mockResolvedValue(mockClub);

      const result = await clubService.getClubById(1);

      expect(Club.findByPk).toHaveBeenCalled();
      expect(result).toEqual(mockClub);
    });

    it('throws 404 when club not found', async () => {
      Club.findByPk.mockResolvedValue(null);

      await expect(clubService.getClubById(999)).rejects.toMatchObject({
        status: StatusCodes.NOT_FOUND,
        code: 'CLUB_NOT_FOUND',
      });
    });
  });

  describe('createClub', () => {
    it('creates club with active=true when status=active', async () => {
      const mockClub = { id: 1, name: 'New Club', active: true };
      Club.create.mockResolvedValue(mockClub);

      const result = await clubService.createClub({
        name: 'New Club',
        status: 'active',
      });

      expect(Club.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Club',
          active: true,
        })
      );
      expect(result).toEqual(mockClub);
    });

    it('creates club with active=false when status=inactive', async () => {
      const mockClub = { id: 1, name: 'New Club', active: false };
      Club.create.mockResolvedValue(mockClub);

      await clubService.createClub({
        name: 'New Club',
        status: 'inactive',
      });

      expect(Club.create).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false,
        })
      );
    });
  });

  describe('updateClub', () => {
    it('updates club successfully', async () => {
      const mockClub = {
        id: 1,
        name: 'Old Name',
        update: jest.fn().mockResolvedValue(undefined),
      };
      Club.findByPk.mockResolvedValue(mockClub);

      const result = await clubService.updateClub(1, { name: 'New Name' });

      expect(mockClub.update).toHaveBeenCalledWith({ name: 'New Name' });
      expect(result).toEqual(mockClub);
    });

    it('maps status to active field on update', async () => {
      const mockClub = {
        id: 1,
        name: 'Test',
        update: jest.fn().mockResolvedValue(undefined),
      };
      Club.findByPk.mockResolvedValue(mockClub);

      await clubService.updateClub(1, { status: 'inactive' });

      expect(mockClub.update).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    });

    it('throws 404 when club not found', async () => {
      Club.findByPk.mockResolvedValue(null);

      await expect(clubService.updateClub(999, { name: 'Test' })).rejects.toMatchObject({
        status: StatusCodes.NOT_FOUND,
      });
    });
  });

  describe('deleteClub', () => {
    it('deletes club successfully', async () => {
      const mockClub = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      Club.findByPk.mockResolvedValue(mockClub);

      await clubService.deleteClub(1);

      expect(mockClub.destroy).toHaveBeenCalled();
    });

    it('throws 404 when club not found', async () => {
      Club.findByPk.mockResolvedValue(null);

      await expect(clubService.deleteClub(999)).rejects.toMatchObject({
        status: StatusCodes.NOT_FOUND,
      });
    });
  });
});
