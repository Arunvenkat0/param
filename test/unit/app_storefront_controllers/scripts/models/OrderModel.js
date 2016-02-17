'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');

/**
 * Mocks
 */
var proxyquire = require('proxyquire').noCallThru();
var AbstractModel = {
    extend: function () {
        return function (inputParam) {
            return {orderNo: inputParam};
        };
    }
};

var OrderMgr = {
    getOrder: function (inputParam) {
        return inputParam;
    }
};

var ArrayList = require('../../../../mocks/dw/util/ArrayList');
var GiftCertificateMgr = require('../../../../mocks/dw/order/GiftCertificateMgr');
var Transaction = require('../../../../mocks/dw/system/Transaction');

/**
 * Spies
 */
var spyAbstractModel = sinon.spy(AbstractModel, 'extend');
var spyOrderMgr = sinon.spy(OrderMgr, 'getOrder');

// Mock out module dependencies
var modelsDirectory = '../../../../../app_storefront_controllers/cartridge/scripts/models/';
var OrderModel = proxyquire(modelsDirectory + 'OrderModel.js', {
    './AbstractModel': AbstractModel,
    'dw/util/ArrayList': ArrayList,
    'dw/order/OrderMgr': OrderMgr,
    'dw/order/GiftCertificateMgr': GiftCertificateMgr,
    'dw/system/Transaction': Transaction
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
            expect(order.orderNo).to.be.null;
        });
    });
});
