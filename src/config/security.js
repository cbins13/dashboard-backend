'use strict';

const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
        },
    },
};

module.exports = helmetOptions;
