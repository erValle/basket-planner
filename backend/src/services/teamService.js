const { StatusCodes } = require('http-status-codes');

const { fn, col } = require('sequelize');

const { Team, TeamPlayer, User } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const MIN_ACTIVE_PLAYERS = 5;

const listTeams = async ({ clubId, category, userClubIds } = {}) => {
  const where = {};

  // Si se especifica un clubId específico, usarlo
  if (clubId) {
    where.clubId = clubId;
  }
  // Si se especifican userClubIds (para filtrar por clubes del usuario), usarlos
  else if (userClubIds && userClubIds.length > 0) {
    const { Op } = require('sequelize');
    where.clubId = { [Op.in]: userClubIds };
  }

  if (category) where.category = category;

  const teams = await Team.findAll({
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

  // Asegurar que playersCount se serializa correctamente
  return teams.map((team) => {
    const plain = team.get({ plain: true });
    plain.playersCount = parseInt(plain.playersCount) || 0;
    return plain;
  });
};

const getTeamById = async (id, { raw = false } = {}) => {
  const team = await Team.findByPk(id, {
    include: [
      {
        model: User,
        as: 'coach',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false,
      },
    ],
  });

  if (!team) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'TEAM_NOT_FOUND', 'Team not found');
  }

  // Get players count separately
  const playersCount = await TeamPlayer.count({ where: { teamId: id } });

  // Return raw model for internal operations (update/delete)
  if (raw) {
    team.playersCount = playersCount;
    return team;
  }

  const teamJson = team.toJSON();

  // Format coach name if exists
  if (teamJson.coach) {
    teamJson.coach.name =
      `${teamJson.coach.firstName || ''} ${teamJson.coach.lastName || ''}`.trim();
  }

  return {
    ...teamJson,
    playersCount,
  };
};

const createTeam = async (payload) => Team.create(payload);

const updateTeam = async (id, payload) => {
  const team = await getTeamById(id, { raw: true });

  // Business rule: activating a team requires at least N players.
  // Only validate when changing from inactive to active (not when already active)
  if (
    payload &&
    Object.prototype.hasOwnProperty.call(payload, 'active') &&
    payload.active === true &&
    team.active === false
  ) {
    const playersCount = await TeamPlayer.count({ where: { teamId: team.id } });
    if (playersCount < MIN_ACTIVE_PLAYERS) {
      throw errorUtils.httpError(
        StatusCodes.BAD_REQUEST,
        'TEAM_ACTIVE_REQUIRES_MIN_PLAYERS',
        `Team must have at least ${MIN_ACTIVE_PLAYERS} players to be activated`
      );
    }
  }

  await team.update(payload);
  return team;
};

const deleteTeam = async (id) => {
  const team = await getTeamById(id, { raw: true });
  await team.destroy();
};

module.exports = {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
};
