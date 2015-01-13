'use strict';

var Handlebars = require('hbsfy/runtime');

Handlebars.registerHelper('debug', function (stuff) {
	console.log(stuff);
});
