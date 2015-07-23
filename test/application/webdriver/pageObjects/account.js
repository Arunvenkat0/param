'use strict';

import client from '../client';
const basePath = '/account';

export function navigateTo () {
	return client.url(basePath);
}
