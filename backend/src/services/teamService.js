const { StatusCodes } = require('http-status-codes');

const { fn, col } = require('sequelize');

const { Team, TeamPlayer } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const MIN_ACTIVE_PLAYERS = 5;

const listTeams = async ({ clubId } = {}) => {
  const where = {};
  if (clubId) where.clubId = clubId;

  return Team.findAll({
    where,
    attributes: {
      include: [[fn('COUNT', col('teamPlayers.userId')), 'playersCount']],
    },
    include: [
      {
        model: TeamPlayer,
        as: 'teamPlayers',
        attributes: [],
        required: false,
      },
    ],
    group: ['Team.id'],
    order: [['id', 'ASC']],
  });
};

const getTeamById = async (id) => {
  const team = await Team.findByPk(id);
  if (!team) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'TEAM_NOT_FOUND', 'Team not found');
  }
  
  // Get players count separately
  const playersCount = await TeamPlayer.count({ where: { teamId: id } });
  
  return {
    ...team.toJSON(),
    playersCount,
  };
};

const createTeam = async (payload) => Team.create(payload);

const updateTeam = async (id, payload) => {
  const team = await getTeamById(id);

  // Business rule: activating a team requires at least N players.
  // Only validate when changing from inactive to active (not when already active)
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'active') && payload.active === true && team.active === false) {
    const playersCount = await TeamPlayer.count({ where: { teamId: team.id } });
    if (playersCount < MIN_ACTIVE_PLAYERS) {
      throw errorUtils.httpError(
        StatusCodes.BAD_REQUEST,
        'TEAM_ACTIVE_REQUIRES_MIN_PLAYERS',
        `Team must have at least ${MIN_ACTIVE_PLAYERS} players to be activated`,
      );
    }
  }

  await team.update(payload);
  return team;
};

const deleteTeam = async (id) => {
  const team = await getTeamById(id);
  await team.destroy();
};

module.exports = {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
};
