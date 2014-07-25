'use strict';

var util = require('./util')

page = {
	title : '',
	type : '',
	setContext : function (o) {
		$.extend(this, o);
	},
	params : util.getQueryStringParams(window.location.search.substr(1)),
	redirect : function (newURL) {
		setTimeout('window.location.href="' + newURL + '"', 0);
	},
	refresh : function() {
		setTimeout('window.location.assign(window.location.href);', 500);
	}
};

module.exports = page;