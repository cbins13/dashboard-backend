'use strict';

const AppError = require('../common/errors/AppError');
const authRepository = require('../modules/auth/auth.repository');

const requireAccessCategory = (categoryCode) => {
    return async (req, res, next) => {
        try {
            const userId = req.auth?.userId;

            if (!userId) {
                throw new AppError(401, 'Authentication required.');
            }

            const access = await authRepository.findUserAccessById(req.app.locals.db.sequelize, userId);

            if (!access) {
                throw new AppError(403, 'Access denied.');
            }

            const targetCategory = categoryCode.toUpperCase();

            const hasAccess = access.roles.some((role) =>
                role.categories.some(
                    (category) => category.code.toUpperCase() === targetCategory
                )
            );

            if (!hasAccess) {
                throw new AppError(403, 'Access denied.');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = { requireAccessCategory };