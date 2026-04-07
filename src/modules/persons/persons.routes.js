'use strict';

const { Router } = require('express');
const { requireAccessCategory } = require('../../middleware/authorizeAccess');
const validate = require('../../middleware/validate');
const personsController = require('./persons.controller');
const { createPersonSchema, updatePersonSchema } = require('./persons.validator');

const router = Router();

router.get('/', requireAccessCategory('PERSON_MANAGEMENT'), personsController.getPersons);
router.get('/:personId', requireAccessCategory('PERSON_MANAGEMENT'), personsController.getPerson);
router.post('/', requireAccessCategory('PERSON_MANAGEMENT'), validate(createPersonSchema), personsController.createPerson);
router.patch('/:personId', requireAccessCategory('PERSON_MANAGEMENT'), validate(updatePersonSchema), personsController.updatePerson);
router.delete('/:personId', requireAccessCategory('PERSON_MANAGEMENT'), personsController.deletePerson);

module.exports = router;
