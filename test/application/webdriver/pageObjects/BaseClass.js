var config = require('../config');


class BaseClass {
	constructor(client){
		this.client = client;
		this.host = config.url;
		this.basePath = '/'
	}

	navigateTo (path = this.basePath) {
		var url = this.host + path;
		return this.client.url(url);
	}
}


module.exports = BaseClass;
