'use strict';

var Model = require('ampersand-model');

module.exports = Model.extend({
	props: {
		title: 'string',
		demos: 'array',
		column: {
			type: 'number',
			default: 1
		}
	}
});
