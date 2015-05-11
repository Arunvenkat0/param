var config = require('../config');


class Base {
	constructor(client, loggingLevel='info'){
		this.client = client;
		this.loggingLevel = loggingLevel;
		this.host = config.url;
		this.basePath = '/';

		if (this.loggingLevel === 'debug') {
			this.client.on('error', function (e) {
				console.log('\n\n[WebdriverIO Error start]\n');
				console.log('e.body.value = ', e.body.value);
				console.log('\n[WebDriverIO Error end]\n\n');
			});
		}
	}

	navigateTo (path = this.basePath) {
		var url = this.host + path;
		return this.client.url(url);
	}
}


module.exports = Base;
