'use strict';

var Handlebars = require('hbsfy/runtime');

Handlebars.registerPartial('color', require('../templates/color.hbs'));

Handlebars.registerHelper('debug', function (stuff) {
	console.log(stuff);
});
