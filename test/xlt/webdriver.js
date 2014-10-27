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
	'isExisting',
	'moveToObject',
	'pause',
	'setValue',
	'url',
	'localStorage',
	'waitForChecked',
	'waitForExist',
	'waitForText'
];

methods.forEach(function (method) {
	webdriver[method + 'P'] = Promise.denodeify(webdriver[method]).bind(webdriver);
});

webdriver.checkP = function (target, reverse) {
	return webdriver.isSelectedP(target).then(function (selected) {
		if ((reverse ? !selected : selected)) {
			return Promise.resolve();
		} else {
			return webdriver.clickP(target);
		}
	});
};

webdriver.storeP = function (data, target, value) {
	data[value] = target;
	return webdriver.localStorageP('POST', {
		key: value,
		value: target
	});
};

webdriver.storeEvalP = function (data, target, value) {
	// var v = eval(target);
	var v = target; // should have been evaluated by now
	data[value] = v;
	return webdriver.localStorageP('POST', {
		key: value,
		value: v
	});
};

webdriver.storeTextP = function (data, target, value) {
	return webdriver.getTextP(target).then(function (text) {
		data[value] = text;
		return webdriver.localStorageP('POST', {
			key: value,
			value: text
		});
	});
};

webdriver.storeXpathCountP = function (data, target, value) {
	return webdriver.elementsP(target).then(function (res) {
		return webdriver.storeP(data, res.value.length, value);
	});
};

module.exports = webdriver;
