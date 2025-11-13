const jwt = require('jsonwebtoken');
const { auth } = require('../../config/config').development;

const JWT_ISSUER = 'tfg-api';
const JWT_AUDIENCE = 'tfg-web';

const tokenDecode = (token) => jwt.verify(token, auth.secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
});
const dataEncode = (data) => jwt.sign(data, auth.secret, {
    expiresIn: auth.expiresIn, 
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
});

const userEncode = (user) => {
    const {
        id, email, name, role, status
    } = user;

    const tokenData = {
        sub: String(id), email, name, role, status
    };

    return dataEncode(tokenData);
}

module.exports = {
    tokenDecode,
    dataEncode,
    userEncode
};