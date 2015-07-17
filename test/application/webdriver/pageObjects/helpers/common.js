'use strict';

import client from '../../client';
// using Q to be compliant with webdriver.
// should switch to native Promise if it is used in webdriver v3
// https://github.com/webdriverio/webdriverio/issues/498
import Q from 'q';

export function getPageTitle() {
	return Q.Promise(resolve => {
		client.getTitle()
			.then(title => resolve(title.split('|')[0].trim()));
	});
}

export function checkElementEquals (selector, value) {
	return client.getText(selector)
		.then(text => text === value);
}
