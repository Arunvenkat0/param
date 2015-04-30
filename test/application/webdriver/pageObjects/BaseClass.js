class BaseClass {
	constructor(client){
		this.client = client;
	}

	navigateTo (url) {
		return this.client.url(url);
	}
}


module.exports = BaseClass;
