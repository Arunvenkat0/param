'use strict';

import config from './config';
import webdriverio from 'webdriverio';

var client = webdriverio.remote({
	desiredCapabilities: {
		browserName: config.client || 'phantomjs'
	},
	logLevel: 'silent'
});

var loggingLevel = 'info';
if (loggingLevel === 'debug') {
	client.on('error', function (e) {
		//jshint devel:true
		console.log('\n\n[WebdriverIO Error start]\n');
		console.log('e.body.value = ', e.body.value);
		console.log('\n[WebDriverIO Error end]\n\n');
	});
}

export default client;
