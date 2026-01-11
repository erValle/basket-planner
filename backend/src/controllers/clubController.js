const { StatusCodes } = require('http-status-codes');
const { asyncHandler } = require('../middlewares/asyncHandler');
const clubService = require('../services/clubService');

/**
 * @route GET /api/clubs
 * @desc List all clubs with optional filters
 */
const listClubs = asyncHandler(async (req, res) => {
  const clubs = await clubService.listClubs(req.query);
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
