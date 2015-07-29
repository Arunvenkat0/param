'use strict';

import _ from 'lodash';

function msg (val) {
	return val;
}
function msgf () {
	return _.chain(arguments)
		.values()
		.compact()
		.value()
		.join(' ');
}

module.exports = {
	msg: msg,
	msgf: msgf
};
