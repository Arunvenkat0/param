'use strict';

var util = require('./util');

var page = {
	title : '',
	type : '',
	params : util.getQueryStringParams(window.location.search.substr(1)),
	redirect : function (newURL) {
		setTimeout('window.location.href="' + newURL + '"', 0);
	},
	refresh : function() {
		setTimeout('window.location.assign(window.location.href);', 500);
	}
};

module.exports = page;