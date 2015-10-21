'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');

/**
 * Mocks
 */
var mockRequire = require('proxyquire');
var mockAbstractModel = {
    extend: function () {
        return function (inputParam) {
            return {orderNo: inputParam};
        };
    },
    '@noCallThru': true
};

var mockArrayList = {'@noCallThru': true};

var mockOrderMgr = {
    getOrder: function (inputParam) {
        return inputParam;
    },
    '@noCallThru': true
};

/**
 * Spies
 */
var spyAbstractModel = sinon.spy(mockAbstractModel, 'extend');
var spyOrderMgr = sinon.spy(mockOrderMgr, 'getOrder');

// Mock out module dependencies
var modelsDirectory = '../../../../../app_storefront_controllers/cartridge/scripts/models/';
var OrderModel = mockRequire(modelsDirectory + 'OrderModel.js', {
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

            OrderModel.get('some param');

            sinon.assert.calledOnce(spyOrderMgr);
        });

        it('should not call getOrder when not given a string parameter', function () {
            spyOrderMgr.reset();

            OrderModel.get();

            sinon.assert.notCalled(spyOrderMgr);
        });

        it('should instantiate an Order with an string when given a string', function () {
            var order = OrderModel.get('sunny sky');
            expect(order.orderNo).to.equal('sunny sky');
        });

        it('should instantiate an Order with an object when given an object', function () {
            var order = OrderModel.get({nice: true});
            expect(order.orderNo).to.deep.equal({nice: true});
        });

        it('should instantiate an Order with null when given null', function () {
            var order = OrderModel.get();
            /* jshint expr:true */
            expect(order.orderNo).to.be.null;
        });
    });
});
