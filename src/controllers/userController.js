const SALT_ROUNDS = 10;

const { User } = require('../../models');
const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');


const getAllUsers = async (req, res) => {
    try {
        const { email, role, status } = req.query;
        const where = {};
        
        if (email) {
            where.email = { [Op.iLike]: `%${email}%` };
        }
        if(role) {
            where.role = role;
        }
        if(status) {
            where.status = status;
        }

        const users = await User.findAll({ where });
        res.status(StatusCodes.OK).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
        }
        res.status(StatusCodes.OK).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

const createUser = async (req, res) => {
    const { email, name, password, role, status } = req.body;
    if (!password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Password is required' });
    }
    try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = await User.create({ email, name, passwordHash, role, status });
        res.status(StatusCodes.CREATED).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, name, password, role, status } = req.body;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
        }
        const updates = { email, name, role, status };
        if (password) {
            updates.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        }
        await user.update(updates);
        res.status(StatusCodes.OK).json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
        }
        await user.destroy();
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
