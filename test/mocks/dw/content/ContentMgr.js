'use strict';

module.exports = {
	getContent: function (cid) {
		return {
			custom: {
				body: cid
			}
		};
	}
}
