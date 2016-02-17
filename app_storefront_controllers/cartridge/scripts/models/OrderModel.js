'use strict';

/**
* Module for ordering functionality.
* @module models/OrderModel
*/

/* API Includes */
var AbstractModel = require('./AbstractModel');
var ArrayList = require('dw/util/ArrayList');
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Order helper class providing enhanced order functionality.
 * @class module:models/OrderModel~OrderModel
 * @extends module:models/AbstractModel
 *
 * @param {dw.order.Order} obj The order object to enhance/wrap.
 */
var OrderModel = AbstractModel.extend(
    /** @lends module:models/OrderModel~OrderModel.prototype */
    {
        /**
         * Creates gift certificates for all gift certificate line items in the order.
         *
         * @alias module:models/OrderModel~OrderModel/createGiftCertificates
         * @returns {dw.util.ArrayList} List containing all created gift certificates, null in case of an error.
         */
        createGiftCertificates: function () {

            var giftCertificates = new ArrayList();
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
                    return null;
                }

                giftCertificates.add(newGiftCertificate);
            }

            return giftCertificates;
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
