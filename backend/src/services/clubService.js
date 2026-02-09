const { StatusCodes } = require('http-status-codes');

const { fn, col } = require('sequelize');

const { Club, Team } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listClubs = async ({ name, userClubIds } = {}) => {
  const where = {};
  if (name) where.name = name;

  // Si se especifican userClubIds, filtrar por ellos
  if (userClubIds && userClubIds.length > 0) {
    const { Op } = require('sequelize');
    where.id = { [Op.in]: userClubIds };
  }

  const clubs = await Club.findAll({
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
    order: [['id', 'ASC']],
    raw: false,
  });

  // Convert to plain JSON and ensure teamsCount is a number
  return clubs.map((club) => {
    const plainClub = club.get({ plain: true });
    return {
      ...plainClub,
      teamsCount: parseInt(plainClub.teamsCount, 10) || 0,
    };
  });
};

const getClubById = async (id, { raw = false } = {}) => {
  const club = await Club.findOne({
    where: { id },
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

  // Return raw model for internal operations (update/delete)
  if (raw) {
    return club;
  }

  // Convert to plain JSON and ensure teamsCount is a number
  const plainClub = club.get({ plain: true });
  return {
    ...plainClub,
    teamsCount: parseInt(plainClub.teamsCount, 10) || 0,
  };
};

const createClub = async (payload) => {
  // Map frontend 'status' to model 'active' field
  const data = { ...payload };
  if (data.status !== undefined) {
    data.active = data.status === 'active';
    delete data.status;
  }
  return Club.create(data);
};

const updateClub = async (id, payload) => {
  const club = await getClubById(id, { raw: true });
  // Map frontend 'status' to model 'active' field
  const data = { ...payload };
  if (data.status !== undefined) {
    data.active = data.status === 'active';
    delete data.status;
  }
  await club.update(data);
  return club;
};

const deleteClub = async (id) => {
  const club = await getClubById(id, { raw: true });
  await club.destroy();
};

module.exports = {
  listClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
};
