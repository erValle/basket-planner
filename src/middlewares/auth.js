const jwt = require('jsonwebtoken');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const { tokenDecode } = require('../libs/jwtHelper');

const getToken = (req) => req.headers.authorization && req.headers.authorization.split(' ')[1];

const authenticateToken = (req, res, next) => {
    const token = getToken(req);

    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: getReasonPhrase(StatusCodes.UNAUTHORIZED) });
    }

    try {
        const user = tokenDecode(token);

        if(user.status && user.status !== 'active'){
            return res
                .status(StatusCodes.FORBIDDEN)
                .json({ error: 'USER_NOT_ACTIVE', message: 'User account is not active' });
        }

        req.user = {id: parseInt(user.sub, 10), email: user.email, name: user.name, role: user.role, status: user.status};

        next();

    } catch (error) {
        return res.status(StatusCodes.FORBIDDEN).json({ error: getReasonPhrase(StatusCodes.FORBIDDEN) });
    }
};

module.exports = {
    authenticateToken
};
