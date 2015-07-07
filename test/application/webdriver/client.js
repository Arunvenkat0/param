'use strict';

import config from './config';
import webdriverio from 'webdriverio';

import minimist from 'minimist';

let opts = minimist(process.argv.slice(2));

let client = webdriverio.remote({
	desiredCapabilities: {
		browserName: opts.browser || config.client || 'phantomjs'
	},
	logLevel: 'silent'
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
