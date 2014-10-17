'use strict';

var webdriverio = require('webdriverio');
var Promise = require('promise');
var data = require('globalData');

var webdriver = webdriverio.remote({
	desiredCapabilities: {
		browserName: data.browser || 'phantomjs'
	}
});

// promise-ify
var methods = [
	'click',
	'deleteCookie',
	'doubleClick',
	'elements',
	'end',
	'getText',
	'init',
	'isSelected',
	'moveToObject',
	'setValue',
	'url',
	'localStorage',
	'waitForChecked',
	'waitForExist',
	'waitForText'
];

methods.forEach(function (method) {
	webdriver[method] = Promise.denodeify(webdriver[method]).bind(webdriver);
});

webdriver.store = function (target, value) {
	return webdriver.localStorage('POST', {
		key: value,
		value: target
	});
};

webdriver.storeEval = function (target, value) {
	var v = eval(target);
	return webdriver.localStorage('POST', {
		key: value,
		value: v
	});
};

webdriver.storeText = function (target, value) {
	return webdriver.getText(target).then(function (text) {
		return webdriver.localStorage('POST', {
			key: value,
			value: text
		});
	});
};

webdriver.check = function (target, reverse) {
	return webdriver.isSelected(target).then(function (selected) {
		if ((reverse ? !selected : selected)) {
			return Promise.resolve();
		} else {
			return webdriver.click(target);
		}
	});
};

webdriver.storeXpathCount = function (target, value) {
	return webdriver.elements(target).then(function (res) {
		return webdriver.store(res.value.length, value);
	});
};

module.exports = webdriver;
