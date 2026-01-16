const { Op } = require('sequelize');

const { StatusCodes } = require('http-status-codes');

const { User, UserClub, Club, Team } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listPlayers = async ({ search, clubId, teamId, withoutTeam, limit, userClubIds } = {}) => {
  const where = { role: 'player' };

  if (search) {
    // Support searching by name/email. Some parts of the codebase use name, others firstName/lastName.
    where[Op.or] = [
      { email: { [Op.iLike]: `%${search}%` } },
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Runtime-optimized response:
  // - Keep the main query to a single SELECT with JOINs.
  // - Only select the fields the frontend needs.
  // - Return a denormalized shape to avoid extra round-trips.
  const include = [
    {
      model: UserClub,
      as: 'userClubs',
      required: Boolean(clubId) || Boolean(userClubIds),
      where: clubId 
        ? { clubId } 
        : userClubIds 
          ? { clubId: { [Op.in]: userClubIds } }
          : undefined,
      attributes: ['clubId'],
      include: [
        {
          model: Club,
          as: 'club',
          attributes: ['id', 'name'],
        },
      ],
    },
    {
      model: Team,
      as: 'playerTeams',
      required: Boolean(teamId) && !withoutTeam,
      where: teamId ? { id: teamId } : undefined,
      through: { attributes: [] },
      attributes: ['id', 'name', 'category', 'clubId'],
    },
  ];

  const rows = await User.findAll({
    where,
    attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'position', 'category', 'maxCategory', 'height', 'dateOfBirth'],
    include,
    limit: limit ? Number(limit) : undefined,
    order: [
      ['lastName', 'ASC'],
      ['firstName', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  // Filter out players with teams if withoutTeam is true
  let filteredRows = rows;
  if (withoutTeam) {
    filteredRows = rows.filter((u) => {
      const json = u.toJSON();
      return !Array.isArray(json.playerTeams) || json.playerTeams.length === 0;
    });
  }

  // Denormalize (fast client rendering, minimal mapping)
  return filteredRows.map((u) => {
    const json = u.toJSON();
    const clubs = Array.isArray(json.userClubs)
      ? json.userClubs
          .map((uc) => (uc.club ? { id: uc.club.id, name: uc.club.name } : null))
          .filter(Boolean)
      : [];
    const teams = Array.isArray(json.playerTeams)
      ? json.playerTeams.map((t) => ({ id: t.id, name: t.name, category: t.category, clubId: t.clubId }))
      : [];

    return {
      id: json.id,
      firstName: json.firstName,
      lastName: json.lastName,
      name: `${json.firstName} ${json.lastName}`.trim(),
      email: json.email,
      role: json.role,
      status: json.status,
      position: json.position,
      category: json.category,
      maxCategory: json.maxCategory,
      height: json.height,
      dateOfBirth: json.dateOfBirth,
      clubs,
      teams,
    };
  });
};

const getPlayerHistory = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id', 'role'] });
  if (!user) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'PLAYER_NOT_FOUND', 'Player not found');
  }
  if (user.role !== 'player') {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'USER_NOT_A_PLAYER', 'User is not a player');
  }

  const rows = await UserClub.findAll({
    where: { userId },
    attributes: ['id', 'userId', 'clubId', 'isPrimary', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
    include: [
      {
        model: Club,
        as: 'club',
        attributes: ['id', 'name'],
      },
    ],
    order: [
      ['startDate', 'DESC'],
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  return rows.map((r) => {
    const json = r.toJSON();
    return {
      id: json.id,
      userId: json.userId,
      clubId: json.clubId,
      isPrimary: json.isPrimary,
      startDate: json.startDate,
      endDate: json.endDate,
      club: json.club ? { id: json.club.id, name: json.club.name } : null,
    };
  });
};

module.exports = { listPlayers, getPlayerHistory };

// --- Enrollment / restricted update helpers ---

const getActivePrimaryClubIdForUser = async (userId, { transaction } = {}) => {
  const primary = await UserClub.findOne({
    where: { userId, isPrimary: true, endDate: { [Op.is]: null } },
    attributes: ['clubId'],
    transaction,
  });
  return primary ? primary.clubId : null;
};

/**
 * Enroll an existing no-role user as a player.
 * Rules:
 * - Target user must exist and have role=null.
 * - Actor can be admin/technical_director/coach.
 * - For coach: clubId is forced to coach's active primary club.
 * - For admin/technical_director: clubId can be provided; if omitted, no membership is created.
 *
 * Returns: { userId, role: 'player', membershipCreated: boolean, clubId?: number }
 */
const enrollExistingUserAsPlayer = async (
  actor,
  { userId, clubId, startDate } = {},
  { transaction } = {},
) => {
  const target = await User.findByPk(userId, { transaction });
  if (!target) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
  }

  if (target.role !== null) {
    throw errorUtils.httpError(
      StatusCodes.BAD_REQUEST,
      'USER_ALREADY_HAS_ROLE',
      'User already has a role'
    );
  }

  let effectiveClubId = clubId ? Number(clubId) : null;

  if (actor?.role === 'coach') {
    // Coach: always default to coach primary club.
    effectiveClubId = await getActivePrimaryClubIdForUser(actor.id, { transaction });
    if (!effectiveClubId) {
      throw errorUtils.httpError(
        StatusCodes.BAD_REQUEST,
        'COACH_NO_PRIMARY_CLUB',
        "Coach doesn't have an active primary club"
      );
    }
  }

  // Make user a player.
  await target.update({ role: 'player' }, { transaction });

  // Create membership if we have an effective club.
  let membershipCreated = false;
  if (effectiveClubId) {
    const club = await Club.findByPk(effectiveClubId, { transaction });
    if (!club) {
      throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'CLUB_NOT_FOUND', 'Club not found');
    }

    // If user already has an active primary (shouldn't happen for role=null, but be safe), don't create another.
    const existingPrimary = await UserClub.findOne({
      where: { userId, isPrimary: true, endDate: { [Op.is]: null } },
      transaction,
    });

    if (!existingPrimary) {
      await UserClub.create(
        {
          userId,
          clubId: effectiveClubId,
          isPrimary: true,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: null,
        },
        { transaction },
      );
      membershipCreated = true;
    }
  }

  return {
    userId: target.id,
    role: 'player',
    membershipCreated,
    clubId: effectiveClubId ?? undefined,
  };
};

/**
 * Restricted update for player sports fields.
 */
const updatePlayerProfile = async (userId, payload = {}, { transaction } = {}) => {
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'PLAYER_NOT_FOUND', 'Player not found');
  }
  if (user.role !== 'player') {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'USER_NOT_A_PLAYER', 'User is not a player');
  }

  const allowed = {
    status: payload.status,
    position: payload.position,
    category: payload.category,
    maxCategory: payload.maxCategory,
    height: payload.height,
    dateOfBirth: payload.dateOfBirth,
  };

  await user.update(allowed, { transaction });

  // Return the same shape listPlayers returns for consistency.
  const json = user.toJSON();
  return {
    id: json.id,
    firstName: json.firstName,
    lastName: json.lastName,
    name: `${json.firstName} ${json.lastName}`.trim(),
    email: json.email,
    role: json.role,
    status: json.status,
    position: json.position,
    category: json.category,
    maxCategory: json.maxCategory,
    height: json.height,
    dateOfBirth: json.dateOfBirth,
  };
};

module.exports.enrollExistingUserAsPlayer = enrollExistingUserAsPlayer;
module.exports.updatePlayerProfile = updatePlayerProfile;
