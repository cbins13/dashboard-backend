'use strict';

const AppError = require('../common/errors/AppError');
const authRepository = require('../modules/auth/auth.repository');

const requireAccess = (moduleCode, categoryCode) => {
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

            const targetModule = moduleCode.toUpperCase();
            const targetCategory = categoryCode ? categoryCode.toUpperCase() : null;

            const hasAccess = access.roles.some((role) =>
                role.modules.some((module) => {
                    if (module.code.toUpperCase() !== targetModule) {
                        return false;
                    }

                    if (!targetCategory) {
                        return true;
                    }

                    return module.categories.some(
                        (category) => category.code.toUpperCase() === targetCategory
                    );
                })
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

module.exports = { requireAccess };