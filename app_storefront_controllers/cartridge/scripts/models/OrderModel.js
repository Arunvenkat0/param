'use strict';

/**
* Module for ordering functionality.
* @module models/OrderModel
*/

/* API Includes */
var AbstractModel = require('./AbstractModel');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

var Email = require('./EmailModel');
var GiftCertificate = require('./GiftCertificateModel');

function placeOrder(order) {
    var placeOrderStatus = OrderMgr.placeOrder(order);
    if (placeOrderStatus === Status.ERROR) {
        OrderMgr.failOrder(order);
        throw new Error('Failed to place order.');
    }
    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    order.setExportStatus(Order.EXPORT_STATUS_READY);
}
/**
 * Order helper class providing enhanced order functionality.
 * @class module:models/OrderModel~OrderModel
 * @extends module:models/AbstractModel
 *
 * @param {dw.order.Order} obj The order object to enhance/wrap.
 */
var OrderModel = AbstractModel.extend({
    /**
     * Submits an order
     *
     * @transactional
     * @return {Object} object If order cannot be placed, object.error is set to true. Ortherwise, object.order_created is true, and object.Order is set to the order.
     */
    submit: function () {
        var order = this;
        Transaction.begin();
        try {
            placeOrder(order);
        } catch (e) {
            Transaction.rollback();
            return {
                error: true,
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
            };
        }

        // Creates gift certificates for all gift certificate line items in the order
        // and sends an email to the gift certificate receiver
        order.getGiftCertificateLineItems().map(function (lineItem) {
            return GiftCertificate.createGiftCertificateFromLineItem(lineItem, order.getOrderNo());
        }).forEach(GiftCertificate.sendGiftCertificateEmail);

        Email.get('mail/orderconfirmation', order.getCustomerEmail())
            .setSubject((Resource.msg('order.orderconfirmation-email.001', 'order', null) + ' ' + order.getOrderNo()).toString())
            .send({
                Order: order
            });

        Transaction.commit();

        return {
            Order: order,
            order_created: true
        };
    }
});

/**
 * Gets a new instance for a given order or order number.
 *
 * @alias module:models/OrderModel~OrderModel/get
 * @param parameter {dw.order.Order | String} The order object to enhance/wrap or the order ID of the order object.
 * @returns {module:models/OrderModel~OrderModel}
 */
OrderModel.get = function (parameter) {
    var obj = null;
    if (typeof parameter === 'string') {
        obj = OrderMgr.getOrder(parameter);
    } else if (typeof parameter === 'object') {
        obj = parameter;
    }
    return new OrderModel(obj);
};

/** The order class */
module.exports = OrderModel;
