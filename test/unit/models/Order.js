'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');

/**
 * Mocks
 */
var mockRequire = require('proxyquire');
var mockAbstractModel = {
    extend: function () {
        return function (input_param) {
            return { some_property: input_param };
        };
    },
    '@noCallThru': true
};

var mockArrayList = { '@noCallThru': true };

var mockOrderMgr = {
    getOrder: function (input_param) {
        return input_param;
    },
    '@noCallThru': true
};

/**
 * Spies
 */
var spyAbstractModel = sinon.spy(mockAbstractModel, 'extend');
var spyOrderMgr = sinon.spy(mockOrderMgr, 'getOrder');

// Mock out module dependencies
var modelsDirectory = '../../../app_storefront_controllers/cartridge/scripts/models/';
var Order = mockRequire(modelsDirectory + 'Order.ds', {
    './AbstractModel': mockAbstractModel,
    'dw/util/ArrayList': mockArrayList,
    'dw/order/OrderMgr': mockOrderMgr
});


describe('Order model', function () {

    it('should extend the AbstractModel class', function () {
        sinon.assert.calledOnce(spyAbstractModel);
    });

    describe('.get()', function () {

        it('should call getOrder when given a string parameter', function () {
            spyOrderMgr.reset();

            Order.get("some param");

            sinon.assert.calledOnce(spyOrderMgr);
        });

        it('should not call getOrder when given a string parameter', function () {
            spyOrderMgr.reset();

            Order.get();

            sinon.assert.notCalled(spyOrderMgr);
        });

        it('should instantiate an Order with an string when given a string', function () {
            var order = Order.get('sunny sky');
            expect(order.some_property).to.equal('sunny sky');
        });

        it('should instantiate an Order with an object when given an object', function () {
            var order = Order.get({ nice: true });
            expect(order.some_property).to.deep.equal({ nice: true });
        });

        it('should instantiate an Order with null when given null', function () {
            var order = Order.get();
            expect(order.some_property).to.be.null;
        });
    });
});
