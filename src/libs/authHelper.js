const bcrypt = require('bcrypt');
const { User } = require('../../models');

const validateUser = async(email, password) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return null;
    }
    return bcrypt.compare(password, user.passwordHash) ? user : null;
}

module.exports = {
    validateUser
};