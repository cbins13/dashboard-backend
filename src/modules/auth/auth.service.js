'use strict';

const AppError = require('../../common/errors/AppError');
const { createAccessToken } = require('../../infrastructure/security/jwt');
const { verifyPassword } = require('../../infrastructure/security/password');
const authRepository = require('./auth.repository');

const login = async (credentials, sequelize) => {
    const { username, email, password } = credentials;

    const user = username
        ? await authRepository.findUserByUsername(sequelize, username)
        : await authRepository.findUserByEmail(sequelize, email);

    // Always return identical error for user-not-found and wrong-password
    // to prevent username enumeration.
    if (!user) {
        throw new AppError(401, 'Invalid credentials.');
    }

    const passwordMatch = await verifyPassword(password, user.passwordHash);

    if (!passwordMatch) {
        throw new AppError(401, 'Invalid credentials.');
    }

    const payload = { userId: user.id, username: user.username };
    const accessToken = createAccessToken(payload);

    return {
        accessToken,
        user: { id: user.id, username: user.username },
    };
};

const logout = async (context) => {
    // Phase 1: stateless logout — the client simply discards the access token.
    // Revocation hooks (token blacklist, refresh-token table invalidation)
    // attach here in a future auth-hardening phase without changing the route contract.
    return { success: true };
};

module.exports = { login, logout };
