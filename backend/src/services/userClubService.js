const { StatusCodes } = require('http-status-codes');

const { Op } = require('sequelize');

const { UserClub, User, Club, sequelize } = require('../../models');
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

const createUserClub = async (payload) => {
  console.log('📝 Creating UserClub with payload:', payload);
  try {
    const result = await UserClub.create(payload);
    console.log('✅ UserClub created successfully:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Error creating UserClub:', error.message);
    console.error('Payload was:', payload);
    throw error;
  }
};

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
  transferPlayerToClub,
};

// --- CU014 helpers ---

const toMembershipDto = (row) => {
  if (!row) return null;
  const json = row.toJSON ? row.toJSON() : row;
  return {
    id: json.id,
    userId: json.userId,
    clubId: json.clubId,
    isPrimary: json.isPrimary,
    startDate: json.startDate,
    endDate: json.endDate,
    club: json.club ? { id: json.club.id, name: json.club.name } : null,
  };
};

/**
 * Transfer player to a club.
 * - Player can belong to multiple clubs
 * - There should be a single ACTIVE primary membership
 * - This operation closes the active primary membership (if any), then creates a new one.
 */
async function transferPlayerToClub(userId, { clubId, startDate, closePreviousAt, makePrimary = true } = {}) {
  if (!sequelize) {
    // In test mode without DB this will be null; let it surface as 500 like other endpoints.
    throw new Error('Database not initialized');
  }

  return sequelize.transaction(async (t) => {
    const user = await User.findByPk(userId, { attributes: ['id', 'role'], transaction: t });
    if (!user) {
      throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'PLAYER_NOT_FOUND', 'Player not found');
    }
    if (user.role !== 'player') {
      throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'USER_NOT_A_PLAYER', 'User is not a player');
    }

    // Convert string dates to proper format (ISO date string for DATEONLY)
    const toIsoDateString = (date) => {
      if (!date) return new Date().toISOString().split('T')[0];
      if (typeof date === 'string') return date;
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    const effectiveStartStr = toIsoDateString(startDate);
    const closeAtStr = toIsoDateString(closePreviousAt || startDate);

    // Find current active primary membership (endDate is null) and lock it.
    const currentPrimary = await UserClub.findOne({
      where: { userId, isPrimary: true, endDate: { [Op.is]: null } },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let closed = null;
    if (currentPrimary) {
      await currentPrimary.update({ endDate: closeAtStr }, { transaction: t });
      closed = currentPrimary;
    }

    // If we are making the new membership primary, ensure no other active primary remains.
    if (makePrimary) {
      await UserClub.update(
        { isPrimary: false },
        {
          where: {
            userId,
            isPrimary: true,
            endDate: { [Op.is]: null },
          },
          transaction: t,
        }
      );
    }

    const created = await UserClub.create(
      {
        userId,
        clubId,
        isPrimary: Boolean(makePrimary),
        startDate: effectiveStartStr,
        endDate: null,
      },
      { transaction: t }
    );

    const rows = await UserClub.findAll({
      where: { id: [closed?.id, created.id].filter(Boolean) },
      include: [{ model: Club, as: 'club', attributes: ['id', 'name'] }],
      transaction: t,
    });

    const byId = new Map(rows.map((r) => [String(r.id), r]));

    return {
      closedMembership: closed ? toMembershipDto(byId.get(String(closed.id)) || closed) : null,
      newMembership: toMembershipDto(byId.get(String(created.id)) || created),
    };
  });
}
