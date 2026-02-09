const { StatusCodes } = require('http-status-codes');
const { asyncHandler } = require('../middlewares/asyncHandler');
const clubService = require('../services/clubService');

/**
 * @route GET /api/clubs
 * @desc List all clubs with optional filters
 */
const listClubs = asyncHandler(async (req, res) => {
  const user = req.user;
  let filteredQuery = { ...req.query };

  // Si se solicita incluir todos los clubes (ej: para transferencias)
  // Solo permitido para admin y technical_director
  const includeAll = req.query.includeAll === 'true';
  const canSeeAll = user && ['admin', 'technical_director'].includes(user.role);

  // Si el usuario no es admin y no solicita todos los clubes, filtrar por sus clubes asociados
  if (user && user.role !== 'admin' && !(includeAll && canSeeAll)) {
    const { Op } = require('sequelize');
    const { UserClub } = require('../../models');

    // Obtener los clubes del usuario autenticado (solo membresías activas)
    const userMemberships = await UserClub.findAll({
      where: {
        userId: user.id,
        endDate: { [Op.is]: null },
      },
      attributes: ['clubId'],
    });

    const userClubIds = userMemberships.map((m) => m.clubId);

    // Si el usuario no tiene clubes, devolver lista vacía
    if (userClubIds.length === 0) {
      return res.status(StatusCodes.OK).json([]);
    }

    filteredQuery.userClubIds = userClubIds;
  }

  const clubs = await clubService.listClubs(filteredQuery);
  return res.status(StatusCodes.OK).json(clubs);
});

/**
 * @route GET /api/clubs/:id
 * @desc Get a single club by ID
 */
const getClub = asyncHandler(async (req, res) => {
  const club = await clubService.getClubById(req.params.id);
  return res.status(StatusCodes.OK).json(club);
});

/**
 * @route POST /api/clubs
 * @desc Create a new club
 */
const createClub = asyncHandler(async (req, res) => {
  const club = await clubService.createClub(req.body);
  return res.status(StatusCodes.CREATED).json(club);
});

/**
 * @route PUT /api/clubs/:id
 * @desc Update an existing club
 */
const updateClub = asyncHandler(async (req, res) => {
  const club = await clubService.updateClub(req.params.id, req.body);
  return res.status(StatusCodes.OK).json(club);
});

/**
 * @route DELETE /api/clubs/:id
 * @desc Delete a club
 */
const deleteClub = asyncHandler(async (req, res) => {
  await clubService.deleteClub(req.params.id);
  return res.status(StatusCodes.NO_CONTENT).send();
});

module.exports = { listClubs, getClub, createClub, updateClub, deleteClub };
