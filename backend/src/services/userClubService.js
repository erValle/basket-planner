const { StatusCodes } = require('http-status-codes');

const { UserClub } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listUserClubs = async ({ userId, clubId } = {}) => {
  const where = {};
  if (userId) where.userId = userId;
  if (clubId) where.clubId = clubId;
  return UserClub.findAll({ where });
};

const getUserClubById = async (id) => {
  const row = await UserClub.findByPk(id);
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_CLUB_NOT_FOUND', 'Membership not found');
  }
  return row;
};

const createUserClub = async (payload) => UserClub.create(payload);

const updateUserClub = async (id, payload) => {
  const row = await getUserClubById(id);
  await row.update(payload);
  return row;
};

const deleteUserClub = async (id) => {
  const row = await getUserClubById(id);
  await row.destroy();
};

module.exports = {
  listUserClubs,
  getUserClubById,
  createUserClub,
  updateUserClub,
  deleteUserClub,
};
