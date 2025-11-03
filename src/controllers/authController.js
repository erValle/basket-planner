const bcrypt = require('bcrypt');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const authHelper  = require('../libs/authHelper');
const jwtHelper = require('../libs/jwtHelper');

const logger = require('../middlewares/logger');

const { User } = require('../../models');
const { auth } = require('../../config/config').development;

const login = async (req, res, next) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'MISSING_CREDENTIALS', message: 'Invalid credentials' });
    }

    const user = await authHelper.validateUser(email, password);

    if(!user){
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }
    if(user.status && user.status !== 'active'){
        return res
            .status(StatusCodes.FORBIDDEN)
            .json({ error: 'USER_NOT_ACTIVE', message: 'User account is not active' });
    }

    const token = jwtHelper.userEncode(user);

    return res.status(StatusCodes.OK).json({ 
        token, 
        tokenType: 'Bearer',
        expiresIn: auth.expiresIn,
        user: {id: user.id, email: user.email, name: user.name, role: user.role, status: user.status}
    });
}

const me = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'email', 'name', 'role', 'status', 'createdAt', 'updatedAt']
        });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
        }
        return res.status(StatusCodes.OK).json({ user });
    } catch (error) {
        logger.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) });
    }
}

const changePassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if(!currentPassword || !newPassword){
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'MISSING_PASSWORDS', message: 'Current password and new password are required' });
    }

    const user = await User.findByPk(req.user.id);
    if(!user){
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if(!(await bcrypt.compare(currentPassword, user.passwordHash))){
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'INVALID_CURRENT_PASSWORD', message: 'Invalid current password' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(StatusCodes.OK).json({ message: 'PASSWORD_CHANGED_SUCCESSFULLY' });
}

module.exports = {
    login,
    me,
    changePassword
};
