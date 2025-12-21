const { StatusCodes } = require('http-status-codes');

const { Club } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listClubs = async ({ name } = {}) => {
  const where = {};
  if (name) where.name = name;
  return Club.findAll({ where });
};

const getClubById = async (id) => {
  const club = await Club.findByPk(id);
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
