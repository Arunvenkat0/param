'use strict';

import minimist from 'minimist';
import getConfig from '@tridnguyen/config';
import _ from 'lodash';

let opts = minimist(process.argv.slice(2));

var config = _.assign(getConfig('./config.json', {
	client: 'phantomjs'
}), _.pick(opts, ['client', 'url', 'host', 'port']));

export default config;
