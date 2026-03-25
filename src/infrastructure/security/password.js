'use strict';

const bcrypt = require('bcrypt');

const COST_FACTOR = 12;

const hashPassword = (plain) => bcrypt.hash(plain, COST_FACTOR);

const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { hashPassword, verifyPassword };
