var config = require('./config');
var Promise = require('promise');

var client = require('webdriverio').remote({
	desiredCapabilities: {
		browserName: config.client || 'phantomjs'
	},
	logLevel: 'silent'
});

var toPromisify = [
	'click',
	'getAttribute',
	'getTitle',
	'waitForExist'
]

// toPromisify.forEach(function (m) {
// 	client[m] = Promise.denodeify(client[m]).bind(client);
// });

module.exports = client;
