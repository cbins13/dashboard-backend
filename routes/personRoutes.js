const express = require('express');
const { resolveRequestSchema, withTargetSchema } = require('../db/schemaContext');
const { getModelSchema } = require('../models/modelSchemas');

const router = express.Router();

const getDatabaseContext = (req, res) => {
    const dbContext = req.app.locals.db;

    if (!dbContext?.models?.Person || !dbContext?.sequelize) {
        res.status(503).json({ message: 'Person model is not available.' });
        return null;
    }

    return dbContext;
};

const resolveSchemaOrRespond = (req, res) => {
    const configuredPersonSchema = getModelSchema('Person');

    if (configuredPersonSchema) {
        const explicitlyRequestedSchema = req.get('x-db-schema') || req.query.schema;

        if (!explicitlyRequestedSchema) {
            return configuredPersonSchema;
        }

        try {
            const { resolveSchema } = require('../db/schemaContext');
            const resolvedRequestedSchema = resolveSchema(explicitlyRequestedSchema, 'Requested schema');

            if (resolvedRequestedSchema !== configuredPersonSchema) {
                throw new Error(
                    `Person is pinned to schema ${configuredPersonSchema} and cannot target ${resolvedRequestedSchema}.`
                );
            }

            return configuredPersonSchema;
        } catch (error) {
            res.status(400).json({ message: error.message });
            return null;
        }
    }

    try {
        return resolveRequestSchema(req);
    } catch (error) {
        res.status(400).json({ message: error.message });
        return null;
    }
};

const parsePersonId = (value) => {
    const personId = Number.parseInt(value, 10);

    if (Number.isNaN(personId) || personId < 1) {
        return null;
    }

    return personId;
};

const validateName = (name, isPartial) => {
    if (name === undefined) {
        return isPartial ? {} : { error: 'name is required.' };
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
        return { error: 'name must be a non-empty string.' };
    }

    return { value: name.trim() };
};

const validateAge = (age) => {
    if (age === undefined) {
        return {};
    }

    if (age === null) {
        return { value: null };
    }

    if (Number.isInteger(age)) {
        return { value: age };
    }

    return { error: 'age must be an integer or null.' };
};

const validateHeight = (height) => {
    if (height === undefined) {
        return {};
    }

    if (height === null) {
        return { value: null };
    }

    if (typeof height === 'number' && Number.isFinite(height)) {
        return { value: height };
    }

    return { error: 'height must be a number or null.' };
};

const buildPersonPayload = (body, isPartial = false) => {
    const payload = {};
    const nameValidation = validateName(body.name, isPartial);

    if (nameValidation.error) {
        return { error: nameValidation.error };
    }

    if (nameValidation.value !== undefined) {
        payload.name = nameValidation.value;
    }

    const ageValidation = validateAge(body.age);

    if (ageValidation.error) {
        return { error: ageValidation.error };
    }

    if (ageValidation.value !== undefined || body.age === null) {
        payload.age = ageValidation.value;
    }

    const heightValidation = validateHeight(body.height);

    if (heightValidation.error) {
        return { error: heightValidation.error };
    }

    if (heightValidation.value !== undefined || body.height === null) {
        payload.height = heightValidation.value;
    }

    if (isPartial && Object.keys(payload).length === 0) {
        return {
            error: 'Provide at least one of name, age, or height to update the person.',
        };
    }

    return { payload };
};

router.get('/', async (req, res) => {
    const dbContext = getDatabaseContext(req, res);
    const targetSchema = resolveSchemaOrRespond(req, res);

    if (!dbContext || !targetSchema) {
        return;
    }

    try {
        const persons = await withTargetSchema(
            dbContext.sequelize,
            targetSchema,
            (transaction) =>
                dbContext.models.Person.findAll({
                    order: [['id', 'ASC']],
                    transaction,
                })
        );

        res.set('x-db-schema', targetSchema);
        res.status(200).json(persons);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch persons.', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    const dbContext = getDatabaseContext(req, res);
    const targetSchema = resolveSchemaOrRespond(req, res);
    const personId = parsePersonId(req.params.id);

    if (!dbContext || !targetSchema) {
        return;
    }

    if (!personId) {
        res.status(400).json({ message: 'Person id must be a positive integer.' });
        return;
    }

    try {
        const person = await withTargetSchema(
            dbContext.sequelize,
            targetSchema,
            (transaction) => dbContext.models.Person.findByPk(personId, { transaction })
        );

        if (!person) {
            res.status(404).json({ message: 'Person not found.' });
            return;
        }

        res.set('x-db-schema', targetSchema);
        res.status(200).json(person);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch person.', error: error.message });
    }
});

router.post('/', async (req, res) => {
    const dbContext = getDatabaseContext(req, res);
    const targetSchema = resolveSchemaOrRespond(req, res);

    if (!dbContext || !targetSchema) {
        return;
    }

    const { payload, error } = buildPersonPayload(req.body);

    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    try {
        const person = await withTargetSchema(
            dbContext.sequelize,
            targetSchema,
            (transaction) => dbContext.models.Person.create(payload, { transaction })
        );

        res.set('x-db-schema', targetSchema);
        res.status(201).json(person);
    } catch (createError) {
        res.status(500).json({ message: 'Failed to create person.', error: createError.message });
    }
});

router.put('/:id', async (req, res) => {
    const dbContext = getDatabaseContext(req, res);
    const targetSchema = resolveSchemaOrRespond(req, res);
    const personId = parsePersonId(req.params.id);

    if (!dbContext || !targetSchema) {
        return;
    }

    if (!personId) {
        res.status(400).json({ message: 'Person id must be a positive integer.' });
        return;
    }

    const { payload, error } = buildPersonPayload(req.body, true);

    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    try {
        const person = await withTargetSchema(dbContext.sequelize, targetSchema, async (transaction) => {
            const existingPerson = await dbContext.models.Person.findByPk(personId, {
                transaction,
            });

            if (!existingPerson) {
                return null;
            }

            await existingPerson.update(payload, { transaction });
            return existingPerson;
        });

        if (!person) {
            res.status(404).json({ message: 'Person not found.' });
            return;
        }

        res.set('x-db-schema', targetSchema);
        res.status(200).json(person);
    } catch (updateError) {
        res.status(500).json({ message: 'Failed to update person.', error: updateError.message });
    }
});

router.delete('/:id', async (req, res) => {
    const dbContext = getDatabaseContext(req, res);
    const targetSchema = resolveSchemaOrRespond(req, res);
    const personId = parsePersonId(req.params.id);

    if (!dbContext || !targetSchema) {
        return;
    }

    if (!personId) {
        res.status(400).json({ message: 'Person id must be a positive integer.' });
        return;
    }

    try {
        const personDeleted = await withTargetSchema(
            dbContext.sequelize,
            targetSchema,
            async (transaction) => {
                const existingPerson = await dbContext.models.Person.findByPk(personId, {
                    transaction,
                });

                if (!existingPerson) {
                    return false;
                }

                await existingPerson.destroy({ transaction });
                return true;
            }
        );

        if (!personDeleted) {
            res.status(404).json({ message: 'Person not found.' });
            return;
        }

        res.set('x-db-schema', targetSchema);
        res.status(204).send();
    } catch (deleteError) {
        res.status(500).json({ message: 'Failed to delete person.', error: deleteError.message });
    }
});

module.exports = router;