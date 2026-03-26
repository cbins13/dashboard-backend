// Seed script for creating an admin user account.
// Credentials are read from environment variables with safe dev-only defaults.
// Run: npm run seed:admin
//
// Environment variables (all optional — defaults are for local development only):
//   ADMIN_USERNAME    (default: 'admin')
//   ADMIN_PASSWORD    (default: 'Admin@1234!')
//   ADMIN_DISPLAYNAME (default: 'Administrator')

require('dotenv').config();

const { initDatabase, getModels, getSequelize } = require('../db/connectionPool');
const { resolveConfiguredSchema, resolveSchema, withTargetSchema } = require('../db/schemaContext');
const { getModelSchema } = require('../models/modelSchemas');
const { hashPassword } = require('../src/infrastructure/security/password');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234!';
const ADMIN_DISPLAYNAME = process.env.ADMIN_DISPLAYNAME || 'Administrator';

const resolveAdminSchema = () => {
    const configuredUserSchema = getModelSchema('Users');
    const explicitSchema = process.env.ORACLE_TARGET_SCHEMA;

    if (!configuredUserSchema) {
        return resolveConfiguredSchema();
    }

    if (!explicitSchema) {
        return configuredUserSchema;
    }

    const requestedSchema = resolveSchema(explicitSchema, 'ORACLE_TARGET_SCHEMA');

    if (requestedSchema !== configuredUserSchema) {
        throw new Error(
            `Users is pinned to schema ${configuredUserSchema} and cannot target ${requestedSchema}.`
        );
    }

    return configuredUserSchema;
};

const run = async () => {
    const sequelize = getSequelize();

    try {
        await initDatabase();
        const { User } = getModels();
        const targetSchema = resolveAdminSchema();

        const hashedPassword = await hashPassword(ADMIN_PASSWORD);
        const now = new Date();

        const [user, created] = await withTargetSchema(sequelize, targetSchema, async (transaction) => {
            const existing = await User.findOne({
                where: { username: ADMIN_USERNAME },
                transaction,
            });

            if (existing) {
                return [existing, false];
            }

            const created = await User.create(
                {
                    username: ADMIN_USERNAME,
                    password: hashedPassword,
                    displayname: ADMIN_DISPLAYNAME,
                    userstatus: 'ACTIVE',
                    archived: 0,
                    createdon: now,
                    updatedon: now,
                },
                { transaction }
            );

            return [created, true];
        });

        await withTargetSchema(sequelize, targetSchema, async (transaction) => {
            const [roles] = await sequelize.query(
                `SELECT ID FROM ROLE WHERE CODE = 'ADMINISTRATOR'`,
                { transaction }
            );

            const adminRoleId = roles[0]?.ID;

            if (!adminRoleId) {
                throw new Error(
                    'ADMINISTRATOR role not found. Run migrations before seed:admin.'
                );
            }

            await sequelize.query(
                `INSERT INTO USER_ROLE (USER_ID, ROLE_ID, CREATEDON, UPDATEDON)
                 SELECT :userId, :roleId, SYSTIMESTAMP, SYSTIMESTAMP
                 FROM DUAL
                 WHERE NOT EXISTS (
                   SELECT 1 FROM USER_ROLE WHERE USER_ID = :userId AND ROLE_ID = :roleId
                 )`,
                {
                    replacements: { userId: user.id, roleId: adminRoleId },
                    transaction,
                }
            );
        });

        if (created) {
            console.log(`Admin account created: username="${user.username}" (id=${user.id}) in schema ${targetSchema}.`);
        } else {
            console.log(`Admin account already exists: username="${user.username}" (id=${user.id}) — no changes made.`);
        }

        console.log(`Admin role ensured for user "${user.username}".`);
    } catch (error) {
        console.error('Admin seed failed:', error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

run();
