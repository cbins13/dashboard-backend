'use strict';

const crypto = require('node:crypto');
const AppError = require('../../common/errors/AppError');
const { createAccessToken, createRefreshToken, verifyRefreshToken } = require('../../infrastructure/security/jwt');
const { verifyPassword } = require('../../infrastructure/security/password');
const { buildFingerprintParts, fingerprintHash, scoreDeviceSimilarity } = require('../../infrastructure/security/deviceBinding');
const {
    createRefreshFamily,
    rotateRefreshToken,
    revokeRefreshFamily,
    getRefreshFamily,
} = require('../../infrastructure/security/tokenManagement');
const { generateCsrfToken } = require('../../middleware/csrfProtection');
const { clearLoginFailures, recordLoginFailure } = require('../../middleware/rateLimiter');
const { securityPolicy } = require('../../config/security');
const authRepository = require('./auth.repository');

const resolveUserAccess = async (sequelize, userId, fallbackUsername) => {
    const access = await authRepository.findUserAccessById(sequelize, userId);

    if (!access) {
        throw new AppError(404, 'User not found.');
    }

    return {
        ...access,
        username: access.username || fallbackUsername,
    };
};

const login = async (credentials, sequelize, req) => {
    const { username, email, password } = credentials;

    const user = username
        ? await authRepository.findUserByUsername(sequelize, username)
        : await authRepository.findUserByEmail(sequelize, email);

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = req.rateLimitContext?.key || `${ip}:${username || email || 'anonymous'}`;

    // Always return identical error for user-not-found and wrong-password
    // to prevent username enumeration.
    if (!user) {
        recordLoginFailure(ip, key);
        throw new AppError(401, 'Invalid credentials.');
    }

    if (user.userstatus !== 'ACTIVE' || Number(user.archived) === 1) {
        recordLoginFailure(ip, key);
        throw new AppError(403, 'User account is inactive.');
    }

    const passwordMatch = await verifyPassword(password, user.password);

    if (!passwordMatch) {
        recordLoginFailure(ip, key);
        throw new AppError(401, 'Invalid credentials.');
    }

    clearLoginFailures(key);

    const sessionId = crypto.randomUUID();
    const fingerprintParts = buildFingerprintParts(req);
    const deviceHash = fingerprintHash(fingerprintParts);
    const refreshFamily = createRefreshFamily({
        userId: user.id,
        sessionId,
        deviceHash,
        deviceParts: fingerprintParts,
    });

    const accessToken = createAccessToken({
        userId: user.id,
        username: user.username,
        sessionId,
        familyId: refreshFamily.familyId,
        tokenType: 'access',
    });
    const refreshToken = createRefreshToken({
        userId: user.id,
        username: user.username,
        sessionId,
        familyId: refreshFamily.familyId,
        tokenId: refreshFamily.tokenId,
        version: refreshFamily.version,
        tokenType: 'refresh',
    });
    const csrfToken = generateCsrfToken(sessionId);

    const access = await resolveUserAccess(sequelize, user.id, user.username);

    return {
        accessToken,
        refreshToken,
        csrfToken,
        sessionId,
        familyId: refreshFamily.familyId,
        user: access,
    };
};

const refresh = async (refreshToken, req, sequelize) => {
    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.tokenType !== 'refresh') {
        throw new AppError(403, 'Refresh token invalid or unacceptable.');
    }

    const family = getRefreshFamily(decoded.familyId);

    if (!family || family.revoked) {
        throw new AppError(403, 'Refresh token invalid or unacceptable.');
    }

    const actualParts = buildFingerprintParts(req);
    const expectedHash = family.deviceHash;
    const actualHash = fingerprintHash(actualParts);
    const score = expectedHash === actualHash ? 100 : scoreDeviceSimilarity(family.deviceParts, actualParts);

    if (score < securityPolicy.deviceBinding.hijackThreshold) {
        revokeRefreshFamily(decoded.familyId);
        throw new AppError(403, 'Suspicious session detected.');
    }

    if (score < securityPolicy.deviceBinding.suspiciousThreshold) {
        // Current implementation only logs by returning a stricter denial.
        throw new AppError(403, 'Session verification failed.');
    }

    const rotation = rotateRefreshToken({
        familyId: decoded.familyId,
        tokenId: decoded.tokenId,
        nextDeviceHash: actualHash,
        nextDeviceParts: actualParts,
    });

    if (!rotation.ok) {
        throw new AppError(403, 'Refresh token replay detected.');
    }

    const accessToken = createAccessToken({
        userId: decoded.userId,
        username: decoded.username,
        sessionId: decoded.sessionId,
        familyId: decoded.familyId,
        tokenType: 'access',
    });

    const nextRefreshToken = createRefreshToken({
        userId: decoded.userId,
        username: decoded.username,
        sessionId: decoded.sessionId,
        familyId: decoded.familyId,
        tokenId: rotation.tokenId,
        version: rotation.version,
        tokenType: 'refresh',
    });

    const access = await resolveUserAccess(sequelize, decoded.userId, decoded.username);

    return {
        accessToken,
        refreshToken: nextRefreshToken,
        csrfToken: generateCsrfToken(decoded.sessionId),
        sessionId: decoded.sessionId,
        familyId: decoded.familyId,
        user: access,
    };
};

const me = async (sequelize, userId) => {
    return resolveUserAccess(sequelize, userId);
};

const logout = async (payload) => {
    revokeRefreshFamily(payload.familyId);
    return { success: true };
};

module.exports = { login, refresh, logout, me };
