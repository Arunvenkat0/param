var client = require('webdriverio').remote({
	desiredCapabilities: {
		browserName: 'phantomjs'
	},
	logLevel: 'silent'
});

module.exports = client;
