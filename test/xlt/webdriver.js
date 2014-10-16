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
	'getText',
	'pause',
	'url',
	'sessionStorage',
	'waitForChecked',
	'waitForExist',
	'waitForText'
];

methods.each(function (method) {
	exports[method] = Promise.denodeify(webdriver[method]).bind(webdriver);
});

exports.store = function (target, value) {
	return exports.sessionStorage('POST', {
		key: value,
		value: target
	});
};

exports.storeEval = function (target, value) {
	var v = eval(target);
	return exports.sessionStorage('POST', {
		key: value,
		value: v
	});
};

exports.storeText = function (target, value) {
	return exports.getText(target).then(function (text) {
		return exports.sessionStorage('POST', {
			key: value,
			value: text
		});
	});
};
