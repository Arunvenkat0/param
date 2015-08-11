'use strict';

import config from './config';
import webdriverio from 'webdriverio';

let client = webdriverio.remote({
	desiredCapabilities: {
		browserName: config.client
	},
	logLevel: 'silent',
	host: config.host || '0.0.0.0',
	port: config.port || 4444,
	baseUrl: config.url,
	waitforTimeout: 20000
});

let loggingLevel = 'info';
if (loggingLevel === 'debug') {
	client.on('error', function (e) {
		//jshint devel:true
		console.log('\n\n[WebdriverIO Error start]\n');
		console.log('e.body.value = ', e.body.value);
		console.log('\n[WebDriverIO Error end]\n\n');
	});
}

export default client;
