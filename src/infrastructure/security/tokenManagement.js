'use strict';

const crypto = require('node:crypto');

const refreshFamilyStore = new Map();
const revokedAccessTokenIds = new Map();

const newId = () => crypto.randomUUID();

const createRefreshFamily = ({ userId, sessionId, deviceHash, deviceParts }) => {
    const familyId = newId();
    const tokenId = newId();

    refreshFamilyStore.set(familyId, {
        familyId,
        userId,
        sessionId,
        deviceHash,
        deviceParts,
        revoked: false,
        tokens: new Map([[tokenId, { status: 'active', version: 1 }]]),
    });

    return { familyId, tokenId, version: 1 };
};

const rotateRefreshToken = ({ familyId, tokenId, nextDeviceHash, nextDeviceParts }) => {
    const family = refreshFamilyStore.get(familyId);

    if (!family || family.revoked) {
        return { ok: false, reason: 'family_revoked' };
    }

    const tokenEntry = family.tokens.get(tokenId);

    if (tokenEntry?.status !== 'active') {
        family.revoked = true;
        return { ok: false, reason: 'refresh_reuse_detected' };
    }

    tokenEntry.status = 'consumed';

    const nextTokenId = newId();
    const nextVersion = tokenEntry.version + 1;

    family.tokens.set(nextTokenId, { status: 'active', version: nextVersion });

    if (nextDeviceHash) {
        family.deviceHash = nextDeviceHash;
    }

    if (nextDeviceParts) {
        family.deviceParts = nextDeviceParts;
    }

    return { ok: true, familyId, tokenId: nextTokenId, version: nextVersion };
};

const revokeRefreshFamily = (familyId) => {
    const family = refreshFamilyStore.get(familyId);
    if (!family) return false;
    family.revoked = true;
    return true;
};

const getRefreshFamily = (familyId) => refreshFamilyStore.get(familyId) || null;

const revokeAccessTokenJti = (jti, expUnixSeconds) => {
    revokedAccessTokenIds.set(jti, expUnixSeconds);
};

const isAccessTokenRevoked = (jti) => {
    const expiresAt = revokedAccessTokenIds.get(jti);
    if (!expiresAt) return false;

    const nowUnix = Math.floor(Date.now() / 1000);
    if (nowUnix > expiresAt) {
        revokedAccessTokenIds.delete(jti);
        return false;
    }

    return true;
};

module.exports = {
    createRefreshFamily,
    rotateRefreshToken,
    revokeRefreshFamily,
    getRefreshFamily,
    revokeAccessTokenJti,
    isAccessTokenRevoked,
};
