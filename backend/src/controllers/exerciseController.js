const { Exercise } = require('../../models');
const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const getAllExercises = async (req, res, next) => {
    try {
        const { name, category, difficulty, isActive } = req.query;
        const where = {};

        if (name) {
            where.name = { [Op.iLike]: `%${name}%` };
        }
        if (category) {
            where.category = category;
        }
        if (difficulty) {
            where.difficulty = difficulty;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const exercises = await Exercise.findAll({ where });
        res.status(StatusCodes.OK).json(exercises);
    } catch (error){
        logger.error('Error fetching exercises:', error);
        next(error);
    }
};

const getExerciseById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const exercise = await Exercise.findByPk(id);
        if (!exercise) {
            return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found'));
        }
        res.status(StatusCodes.OK).json(exercise);
    } catch (error) {
        logger.error('Error fetching exercise:', error);
        next(error);
    }
};

const createExercise = async (req, res, next) => {
    const {
        name,
        description,
        category,
        difficulty,
        duration,
        isActive,
        tags,
        mediaUrl,
        weights
    } = req.body;
    try {
        const newExercise = await Exercise.create({
            name,
            description,
            category,
            difficulty,
            duration,
            isActive,
            tags,
            mediaUrl,
            weights
        });
        res.status(StatusCodes.CREATED).json(newExercise);
    } catch (error) {
        logger.error('Error creating exercise:', error);
        next(error);
    }
};

const updateExercise = async (req, res, next) => {
    const { id } = req.params;
    const {
        name,
        description,
        category,
        difficulty,
        duration,
        isActive,
        tags,
        mediaUrl,
        weights
    } = req.body;
    try {
        const exercise = await Exercise.findByPk(id);
        if (!exercise) {
            return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found'));
        }
        await exercise.update({
            name,
            description,
            category,
            difficulty,
            duration,
            isActive,
            tags,
            mediaUrl,
            weights
        });
        res.status(StatusCodes.OK).json(exercise);
    } catch (error) {
        logger.error('Error updating exercise:', error);
        next(error);
    }
};

const deleteExercise = async (req, res, next) => {
    const { id } = req.params;
    try {
        const exercise = await Exercise.findByPk(id);
        if (!exercise) {
            return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found'));
        }
        await exercise.destroy();
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        logger.error('Error deleting exercise:', error);
        next(error);
    }
};

module.exports = {
    getAllExercises,
    getExerciseById,
    createExercise,
    updateExercise,
    deleteExercise,
};