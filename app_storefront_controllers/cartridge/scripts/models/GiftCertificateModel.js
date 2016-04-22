'use strict';

var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');

/**
 * Create a gift certificate for a gift certificate line item in the order
 * @param {dw.order.GiftCertificateLineItem} giftCertificateLineItem
 * @param {String} orderNo the order number of the order to associate gift certificate to
 * @return {dw.order.GiftCertificate}
 */
function createGiftCertificateFromLineItem(giftCertificateLineItem, orderNo) {
    var giftCertificate = GiftCertificateMgr.createGiftCertificate(giftCertificateLineItem.netPrice.value);
    giftCertificate.setRecipientEmail(giftCertificateLineItem.recipientEmail);
    giftCertificate.setRecipientName(giftCertificateLineItem.recipientName);
    giftCertificate.setSenderName(giftCertificateLineItem.senderName);
    giftCertificate.setMessage(giftCertificateLineItem.message);
    giftCertificate.setOrderNo(orderNo);

    return giftCertificate;
}

module.exports = {
    createGiftCertificateFromLineItem: createGiftCertificateFromLineItem
};
