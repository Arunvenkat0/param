'use strict';

var webdriverio = require('webdriverio');
var Promise = require('promise');

var webdriver = webdriverio.remove({
	desiredCapabilities: {
		browserName: data.browser || 'phantomjs'
	}
});

module.exports = webdriver;

// promise-ify
var methods = [
	'click',
	'deleteCookie',
	'doubleClick',
	'pause',
	'waitForChecked',
	'waitForExist',
	'waitForText'
];

methods.each(function (method) {
	exports[method] = Promise.denodeify(webdriver[method]).bind(webdriver);
});
