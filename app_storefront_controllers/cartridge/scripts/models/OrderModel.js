'use strict';

/**
* Module for ordering functionality.
* @module models/OrderModel
*/

/* API Includes */
var AbstractModel = require('./AbstractModel');
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

var Email = require('./EmailModel');

/**
 * Order helper class providing enhanced order functionality.
 * @class module:models/OrderModel~OrderModel
 * @extends module:models/AbstractModel
 *
 * @param {dw.order.Order} obj The order object to enhance/wrap.
 */
var OrderModel = AbstractModel.extend({
    /**
     * Creates gift certificates for all gift certificate line items in the order
     * and sends an email to the gift certificate receiver
     *
     * @alias module:models/OrderModel~OrderModel/createGiftCertificates
     * @returns {Boolean} false if unable to create gift certificate, true otherwise
     */
    createAndSendGiftCertificates: function () {
        var giftCertificateLineItems = this.getGiftCertificateLineItems();
        var orderNo = this.getOrderNo();

        for (var i = 0; i < giftCertificateLineItems.length; i++) {
            var giftCertificateLineItem = giftCertificateLineItems[i];
            var newGiftCertificate;

            Transaction.wrap(function () {
                newGiftCertificate = GiftCertificateMgr.createGiftCertificate(giftCertificateLineItem.netPrice.value);
                newGiftCertificate.setRecipientEmail(giftCertificateLineItem.recipientEmail);
                newGiftCertificate.setRecipientName(giftCertificateLineItem.recipientName);
                newGiftCertificate.setSenderName(giftCertificateLineItem.senderName);
                newGiftCertificate.setMessage(giftCertificateLineItem.message);
                newGiftCertificate.setOrderNo(orderNo);
            });

            if (!newGiftCertificate) {
                return false;
            }
            Email.get('mail/giftcert', newGiftCertificate.recipientEmail)
                .setSubject(Resource.msg('resource.ordergcemsg', 'email', null) + ' ' + newGiftCertificate.senderName)
                .send({
                    GiftCertificate: newGiftCertificate
                });
        }

        return true;
    },

    /**
     * Submits an order
     *
     * @transactional
     * @return {Object} object If order cannot be placed, object.error is set to true. Ortherwise, object.order_created is true, and object.Order is set to the order.
     */
    submit: function () {
        var self = this;
        var orderPlacementStatus = Transaction.wrap(function () {
            var status = OrderMgr.placeOrder(self);
            if (status === Status.ERROR) {
                OrderMgr.failOrder(self);
                return status;
            }
            self.setConfirmationStatus(self.CONFIRMATION_STATUS_CONFIRMED);
            return status;
        });

        if (orderPlacementStatus === Status.ERROR) {
            return {error: true};
        }
        var giftCertficiatesStatus = self.createAndSendGiftCertificates();
        if (!giftCertficiatesStatus) {
            OrderMgr.failOrder(self);
            return {error: true};
        }

        Email.get('mail/orderconfirmation', self.getCustomerEmail())
            .setSubject((Resource.msg('order.orderconfirmation-email.001', 'order', null) + ' ' + self.getOrderNo()).toString())
            .send({
                Order: self
            });

        // Mark order as EXPORT_STATUS_READY.
        Transaction.wrap(function () {
            self.setExportStatus(Order.EXPORT_STATUS_READY);
            self.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        });

        return {
            Order: self,
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
