const { StatusCodes } = require('http-status-codes');

const { Team } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listTeams = async ({ clubId } = {}) => {
  const where = {};
  if (clubId) where.clubId = clubId;
  return Team.findAll({ where });
};

const getTeamById = async (id) => {
  const team = await Team.findByPk(id);
  if (!team) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'TEAM_NOT_FOUND', 'Team not found');
  }
  return team;
};

const createTeam = async (payload) => Team.create(payload);

const updateTeam = async (id, payload) => {
  const team = await getTeamById(id);
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
