'use strict';

/** @module views/CartView */
var View = require('./View');

var Cart = require('~/cartridge/scripts/models/CartModel');
var Transaction = require('dw/system/Transaction');

/** @lends module:views/CartView~CartView.prototype */
var CartView = View.extend({

    /**
     * TODO
     */
    prepareView: function() {

        var cart = this.Basket;
        if (cart) {

            // refresh shipments
            session.forms.cart.shipments.copyFrom(cart.shipments);
            // refresh coupons
            session.forms.cart.coupons.copyFrom(cart.couponLineItems);

            Transaction.wrap(function () {
                Cart.get(cart).calculate();
            });

            var validationResult = Cart.get(cart).validateForCheckout();
            this.EnableCheckout = validationResult.EnableCheckout;
            this.BasketStatus = validationResult.BasketStatus;
            this.WishList = customer.authenticated ? require('~/cartridge/scripts/models/ProductListModel').get() : null;
        }

        return;
    },

    /**
     * View for store locator functionality.
     * @extends module:views/View~View
     * @constructs module:views/CartView~CartView
     */
    init: function (params) {
        var URLUtils = require('dw/web/URLUtils');

        this._super(params);
        this.Basket = params.cart ? params.cart.object : null;

        /** backward compatibility to URLUtils.continueURL() methods in old templates **/
        this.ContinueURL = URLUtils.abs('Cart-SubmitForm');

        return this;
    },

    render: function (params) {

        this.prepareView();
        return this._super(params);
    }

});

module.exports = CartView;
