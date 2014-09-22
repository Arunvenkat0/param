var client = require('./browser/client');
var assert = require('assert');

describe('navigation menu', function () {
	before(function (done) {
		client.init().url('http://dev10-sitegenesis-dw.demandware.net/on/demandware.store/Sites-SiteGenesis-Site', done);
	});
	it('check navigation menu', function (done) {
		client.getAttribute('#navigation .menu-category .level-1', 'innerHTML', function (err, res) {
			assert.deepEqual(res, [
				'New Arrivals',
				'Womens',
				'Mens',
				'Electronics',
				'Gift Certificates',
				'Top Seller'
			]);
			done();
		});
	});
	after(function (done) {
		client.end();
		done();
	});
});
