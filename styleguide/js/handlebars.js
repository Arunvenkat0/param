'use strict';

var Handlebars = require('hbsfy/runtime');

Handlebars.registerPartial('demoWithCode', require('../templates/partials/demoWithCode.hbs'));

Handlebars.registerHelper('debug', function (stuff) {
	console.log(stuff);
});
