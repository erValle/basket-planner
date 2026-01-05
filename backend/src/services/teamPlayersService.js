const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');

const { Team, TeamPlayer, User } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const assertTeamExists = async (teamId) => {
  const team = await Team.findByPk(teamId);
  if (!team) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'TEAM_NOT_FOUND', 'Team not found');
  }
  return team;
};

const assertPlayerUserExists = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
  }
  if (user.role !== 'player') {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'USER_NOT_PLAYER', 'User is not a player');
  }
  return user;
};

const listTeamPlayers = async (teamId, { search, limit } = {}) => {
  await assertTeamExists(teamId);

  const whereUser = {};
  if (search) {
    whereUser[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return User.findAll({
    attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'position', 'category', 'status'],
    where: whereUser,
    include: [
      {
        model: Team,
        as: 'playerTeams',
        attributes: [],
        through: { attributes: [] },
        where: { id: teamId },
        required: true,
      },
    ],
    limit: limit ? Number(limit) : undefined,
    order: [
      ['lastName', 'ASC'],
      ['firstName', 'ASC'],
      ['id', 'ASC'],
    ],
  });
};

const addPlayerToTeam = async (teamId, userId) => {
  await assertTeamExists(teamId);
  await assertPlayerUserExists(userId);

  const existing = await TeamPlayer.findOne({ where: { teamId, userId } });
  if (existing) return existing;

  return TeamPlayer.create({ teamId, userId });
};

const removePlayerFromTeam = async (teamId, userId) => {
  await assertTeamExists(teamId);

  const row = await TeamPlayer.findOne({ where: { teamId, userId } });
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'TEAM_PLAYER_NOT_FOUND', 'Player is not assigned to this team');
  }

  await row.destroy();
};

const addPlayersToTeamBulk = async (teamId, userIds = []) => {
  await assertTeamExists(teamId);

  const uniqueUserIds = Array.from(new Set((userIds ?? []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)));
  if (!uniqueUserIds.length) {
    return { created: 0, skipped: 0, requested: 0 };
  }

  // Validate all users exist and are players (same rule as single-add).
  const users = await User.findAll({ where: { id: uniqueUserIds } });
  if (users.length !== uniqueUserIds.length) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'One or more users not found');
  }

  const notPlayers = users.filter((u) => u.role !== 'player');
  if (notPlayers.length) {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'USER_NOT_PLAYER', 'One or more users are not players');
  }

  const existing = await TeamPlayer.findAll({ where: { teamId, userId: uniqueUserIds } });
  const existingSet = new Set(existing.map((r) => Number(r.userId)));
  const toCreate = uniqueUserIds.filter((id) => !existingSet.has(id));

  if (toCreate.length) {
    await TeamPlayer.bulkCreate(toCreate.map((userId) => ({ teamId, userId })), { ignoreDuplicates: true });
  }

  return {
    requested: uniqueUserIds.length,
    created: toCreate.length,
    skipped: uniqueUserIds.length - toCreate.length,
  };
};

module.exports = {
  listTeamPlayers,
  addPlayerToTeam,
  addPlayersToTeamBulk,
  removePlayerFromTeam,
};
