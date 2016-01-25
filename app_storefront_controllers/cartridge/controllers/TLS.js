'use strict';

/**
 * Controller that renders the home page.
 *
 * @module controllers/TLS
 *
 * These empty pipelines are called by the client-side TLS detectors to collect reporting information
 */

var guard = require('~/cartridge/scripts/guard');

/**
 * @function BadTLS called when a bad TLS browser is detected
 */
function BadTLS() {}

/**
 * @function BadBrowser called when a bad TLS browser is detected
 */
function BadBrowser() {}

/*
 * Export the publicly available controller methods
 */

/* @see module:controllers/TLS-BadTLS */
exports.BadTLS = guard.ensure(['get'], BadTLS);

/* @see module:controllers/TLS-BadBrowser */
exports.BadBrowser = guard.ensure(['get'], BadBrowser);