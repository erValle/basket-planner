const { StatusCodes } = require('http-status-codes');

const { fn, col } = require('sequelize');

const { Club, Team } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listClubs = async ({ name } = {}) => {
  const where = {};
  if (name) where.name = name;

  return Club.findAll({
    where,
    attributes: {
      include: [[fn('COUNT', col('teams.id')), 'teamsCount']],
    },
    include: [
      {
        model: Team,
        as: 'teams',
        attributes: [],
        required: false,
      },
    ],
    group: ['Club.id'],
    // Fix for some dialects demanding full group-by on all club columns
    // (sequelize adds them automatically in many cases, but being explicit is safer)
    order: [['id', 'ASC']],
  });
};

const getClubById = async (id) => {
  const club = await Club.findByPk(id, {
    attributes: {
      include: [[fn('COUNT', col('teams.id')), 'teamsCount']],
    },
    include: [
      {
        model: Team,
        as: 'teams',
        attributes: [],
        required: false,
      },
    ],
    group: ['Club.id'],
  });
  if (!club) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'CLUB_NOT_FOUND', 'Club not found');
  }
  return club;
};

const createClub = async (payload) => {
  return Club.create(payload);
};

const updateClub = async (id, payload) => {
  const club = await getClubById(id);
  await club.update(payload);
  return club;
};

const deleteClub = async (id) => {
  const club = await getClubById(id);
  await club.destroy();
};

module.exports = {
  listClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
};
