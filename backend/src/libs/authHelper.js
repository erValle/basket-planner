const bcrypt = require('bcrypt');
const { User } = require('../../models');

const validateUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
};

module.exports = {
  validateUser,
};
