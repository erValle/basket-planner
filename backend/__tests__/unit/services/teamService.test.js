/**
 * Unit tests for teamService
 */

const { StatusCodes } = require('http-status-codes');

// Mock models
jest.mock('../../../models', () => ({
  Team: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  TeamPlayer: {
    count: jest.fn(),
  },
}));

const { Team, TeamPlayer } = require('../../../models');
const teamService = require('../../../src/services/teamService');

describe('teamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTeams', () => {
    it('returns all teams when no filters', async () => {
      const mockTeams = [
        { id: 1, name: 'Team A', clubId: 1 },
        { id: 2, name: 'Team B', clubId: 2 },
      ];
      Team.findAll.mockResolvedValue(mockTeams);

      const result = await teamService.listTeams({});

      expect(Team.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTeams);
    });

    it('filters by clubId', async () => {
      Team.findAll.mockResolvedValue([]);

      await teamService.listTeams({ clubId: 1 });

      expect(Team.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clubId: 1 },
        })
      );
    });
  });

  describe('getTeamById', () => {
    it('returns team with players count when found', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        toJSON: () => ({ id: 1, name: 'Test Team' }),
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      TeamPlayer.count.mockResolvedValue(5);

      const result = await teamService.getTeamById(1);

      expect(Team.findByPk).toHaveBeenCalledWith(1);
      expect(TeamPlayer.count).toHaveBeenCalledWith({ where: { teamId: 1 } });
      expect(result.playersCount).toBe(5);
    });

    it('throws 404 when team not found', async () => {
      Team.findByPk.mockResolvedValue(null);

      await expect(teamService.getTeamById(999)).rejects.toMatchObject({
        status: StatusCodes.NOT_FOUND,
        code: 'TEAM_NOT_FOUND',
      });
    });
  });

  describe('createTeam', () => {
    it('creates team successfully', async () => {
      const mockTeam = { id: 1, name: 'New Team', clubId: 1 };
      Team.create.mockResolvedValue(mockTeam);

      const result = await teamService.createTeam({
        name: 'New Team',
        clubId: 1,
      });

      expect(Team.create).toHaveBeenCalledWith({ name: 'New Team', clubId: 1 });
      expect(result).toEqual(mockTeam);
    });
  });

  describe('updateTeam', () => {
    it('updates team successfully', async () => {
      const updateFn = jest.fn().mockResolvedValue(undefined);
      const mockTeam = {
        id: 1,
        name: 'Old Name',
        active: true,
        playersCount: 0,
        update: updateFn,
        toJSON: () => ({ id: 1, name: 'Old Name', active: true }),
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      TeamPlayer.count.mockResolvedValue(0);

      await teamService.updateTeam(1, { name: 'New Name' });

      expect(updateFn).toHaveBeenCalledWith({ name: 'New Name' });
    });

    it('throws error when activating team with less than 5 players', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test',
        active: false,
        playersCount: 3,
        update: jest.fn(),
        toJSON: () => ({ id: 1, name: 'Test', active: false }),
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      TeamPlayer.count.mockResolvedValue(3); // Less than MIN_ACTIVE_PLAYERS (5)

      await expect(teamService.updateTeam(1, { active: true })).rejects.toMatchObject({
        status: StatusCodes.BAD_REQUEST,
        code: 'TEAM_ACTIVE_REQUIRES_MIN_PLAYERS',
      });
    });

    it('allows activating team with 5 or more players', async () => {
      const updateFn = jest.fn().mockResolvedValue(undefined);
      const mockTeam = {
        id: 1,
        name: 'Test',
        active: false,
        playersCount: 5,
        update: updateFn,
        toJSON: () => ({ id: 1, name: 'Test', active: false }),
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      TeamPlayer.count.mockResolvedValue(5);

      await teamService.updateTeam(1, { active: true });

      expect(updateFn).toHaveBeenCalledWith({ active: true });
    });

    it('throws 404 when team not found', async () => {
      Team.findByPk.mockResolvedValue(null);

      await expect(teamService.updateTeam(999, { name: 'Test' })).rejects.toMatchObject({
        status: StatusCodes.NOT_FOUND,
      });
    });
  });

  describe('deleteTeam', () => {
    it('deletes team successfully', async () => {
      const destroyFn = jest.fn().mockResolvedValue(undefined);
      const mockTeam = {
        id: 1,
        playersCount: 0,
        destroy: destroyFn,
        toJSON: () => ({ id: 1 }),
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      TeamPlayer.count.mockResolvedValue(0);

      await teamService.deleteTeam(1);

      expect(destroyFn).toHaveBeenCalled();
    });

    it('throws 404 when team not found', async () => {
      Team.findByPk.mockResolvedValue(null);

      await expect(teamService.deleteTeam(999)).rejects.toMatchObject({
        status: StatusCodes.NOT_FOUND,
      });
    });
  });
});
