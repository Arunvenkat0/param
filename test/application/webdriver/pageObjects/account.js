'use strict';

import client from '../client';
import config from '../config';

const basePath = '/account';

export function navigateTo (path = basePath) {
	return client.url(config.url + path);
}
