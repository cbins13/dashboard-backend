'use strict';

const crypto = require('node:crypto');
const { securityPolicy } = require('../../config/security');

const normalize = (value) => String(value || '').trim().toLowerCase();

const buildFingerprintParts = (req) => ({
    userAgent: normalize(req.headers['user-agent']),
    ip: normalize(req.ip || req.socket.remoteAddress),
    acceptLanguage: normalize(req.headers['accept-language']),
    acceptEncoding: normalize(req.headers['accept-encoding']),
});

const fingerprintHash = (parts) =>
    crypto
        .createHash('sha256')
        .update(`${parts.userAgent}|${parts.ip}|${parts.acceptLanguage}|${parts.acceptEncoding}`)
        .digest('hex');

const scoreDeviceSimilarity = (expected, actual) => {
    const w = securityPolicy.deviceBinding.weights;
    let score = 0;

    if (expected.userAgent === actual.userAgent) score += w.userAgent;
    if (expected.ip === actual.ip) score += w.ip;
    if (expected.acceptLanguage === actual.acceptLanguage) score += w.acceptLanguage;
    if (expected.acceptEncoding === actual.acceptEncoding) score += w.acceptEncoding;

    return score;
};

module.exports = {
    buildFingerprintParts,
    fingerprintHash,
    scoreDeviceSimilarity,
};
