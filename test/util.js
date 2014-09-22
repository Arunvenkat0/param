var test = require('tape');
var util = require('../app_storefront_richUI/cartridge/js/util');

test('append param to url', function (t) {
	t.equal(util.appendParamToURL('http://example.com', 'color', 'blue'), 'http://example.com?color=blue');
	t.equal(util.appendParamToURL('http://example.com?color=red', 'size', 'large'), 'http://example.com?color=red&size=large');
	t.end();
});
