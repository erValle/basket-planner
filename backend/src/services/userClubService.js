const { StatusCodes } = require('http-status-codes');

const { Op } = require('sequelize');

const { UserClub, User, Club, sequelize } = require('../../models');
const errorUtils = require('../libs/errorHelper');
const auditLogService = require('./auditLogService');

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
  enrollExistingUserAsPlayer,
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

    const effectiveStart = startDate ? new Date(startDate) : new Date();
    const closeAt = closePreviousAt ? new Date(closePreviousAt) : effectiveStart;

    // Find current active primary membership (endDate is null) and lock it.
    const currentPrimary = await UserClub.findOne({
      where: { userId, isPrimary: true, endDate: { [Op.is]: null } },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let closed = null;
    if (currentPrimary) {
      await currentPrimary.update({ endDate: closeAt }, { transaction: t });
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
        startDate: effectiveStart,
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

/**
 * Enroll an existing user (role is null) as a player and create a primary membership.
 * If clubId is not provided, use the actor's active primary club.
 */
async function enrollExistingUserAsPlayer({ userId, clubId, startDate } = {}, auditCtx = {}) {
  if (!sequelize) {
    throw new Error('Database not initialized');
  }

  return sequelize.transaction(async (t) => {
    const user = await User.findByPk(userId, { attributes: ['id', 'role', 'status'], transaction: t, lock: t.LOCK.UPDATE });
    if (!user) {
      throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
    }

    if (user.role) {
      throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'USER_ALREADY_HAS_ROLE', 'User already has a role');
    }

    // Determine default club
    let effectiveClubId = clubId ? Number(clubId) : null;
    if (!effectiveClubId) {
      const actorId = auditCtx?.actor?.id;
      if (!actorId) {
        throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'ACTOR_REQUIRED', 'Actor required to derive default club');
      }

      const actorPrimary = await UserClub.findOne({
        where: { userId: actorId, isPrimary: true, endDate: { [Op.is]: null } },
        transaction: t,
      });

      if (!actorPrimary) {
        throw errorUtils.httpError(
          StatusCodes.BAD_REQUEST,
          'ACTOR_HAS_NO_PRIMARY_CLUB',
          'Actor has no active primary club'
        );
      }
      effectiveClubId = actorPrimary.clubId;
    }

    // Ensure the club exists (FK might already enforce, but be explicit)
    const club = await Club.findByPk(effectiveClubId, { attributes: ['id', 'name'], transaction: t });
    if (!club) {
      throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'CLUB_NOT_FOUND', 'Club not found');
    }

    // Promote user to player
    await user.update({ role: 'player', status: user.status === 'pending' ? 'active' : user.status }, { transaction: t });

    const effectiveStart = startDate ? new Date(startDate) : new Date();

    // Create membership as primary (and ensure no other active primary exists)
    await UserClub.update(
      { isPrimary: false },
      { where: { userId: user.id, isPrimary: true, endDate: { [Op.is]: null } }, transaction: t }
    );

    const membership = await UserClub.create(
      {
        userId: user.id,
        clubId: club.id,
        isPrimary: true,
        startDate: effectiveStart,
        endDate: null,
      },
      { transaction: t }
    );

    Promise.resolve(
      auditLogService.createAuditLog({
        user: auditCtx.actor,
        requestId: auditCtx.requestId,
        action: 'player.enrolled',
        entity: 'User',
        entityId: user.id,
        metadata: { clubId: club.id, clubName: club.name, membershipId: membership.id },
      })
    ).catch(() => {});

    return {
      user: { id: user.id, role: user.role, status: user.status },
      membership: toMembershipDto({
        ...membership.toJSON(),
        club: { id: club.id, name: club.name },
      }),
    };
  });
}
