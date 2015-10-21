'use strict';

/**
 * This controller provides functions to add and remove products and coupons in the cart.
 * Also provides functions for the continue shopping button and minicart.
 *
 * @module controllers/Cart
 */

/* API Includes */
var ArrayList = require('dw/util/ArrayList');
var ISML = require('dw/template/ISML');
var ProductListMgr = require('dw/customer/ProductListMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Redirects the user to the last visited catalog URL.
 */
function continueShopping() {

    var location = require('~/cartridge/scripts/util/Browsing').lastCatalogURL();

    if (location) {
        response.redirect(location);
    } else {
        response.redirect(URLUtils.httpHome());
    }
}

/**
 * Invalidates the login and shipment forms. Renders the basket content.
 */
function show() {
    var cartForm = app.getForm('cart');
    app.getForm('login').invalidate();

    cartForm.get('shipments').invalidate();

    app.getView('Cart', {
        cart: app.getModel('Cart').get(),
        RegistrationStatus: false
    }).render('checkout/cart/cart');

}

/**
 * Form handler for the cart form.
 */
function submitForm() {
    // There is no existing state, so resolve the basket again.
    var cart, formResult, cartForm, cartAsset, pageMeta;
    cartForm = app.getForm('cart');
    cart = app.getModel('Cart').goc();

    formResult = cartForm.handleAction({
        //Add a coupon if a coupon was entered correctly and is active.
        'addCoupon': function (formgroup) {
            var status, result;
            if (formgroup.couponCode.htmlValue) {

                status = Transaction.wrap(function () {
                    return cart.addCoupon(formgroup.couponCode.htmlValue);
                });

                if (status) {
                    result = {
                        cart: cart,
                        CouponStatus: status
                    };
                } else {
                    result = {
                        cart: cart,
                        CouponError: 'NO_ACTIVE_PROMOTION'
                    };
                }
            } else {
                result = {
                    cart: cart,
                    CouponError: 'COUPON_CODE_MISSING'
                };
            }
            return result;

        },
        'calculateTotal': function () {
            // Nothing to do here as re-calculation happens during view anyways
            return {
                cart: cart
            };
        },
        'checkoutCart': function () {
            var validationResult, result;

            validationResult = cart.validateForCheckout();

            if (validationResult.EnableCheckout) {
                //app.getController('COCustomer').Start();
                response.redirect(URLUtils.https('COCustomer-Start'));

            } else {
                result = {
                    cart: cart,
                    BasketStatus: validationResult.BasketStatus,
                    EnableCheckout: validationResult.EnableCheckout
                };
            }
            return result;
        },
        'continueShopping': function () {
            continueShopping();
            return null;
        },
        'deleteCoupon': function (formgroup) {
            Transaction.wrap(function () {
                cart.removeCouponLineItem(formgroup.getTriggeredAction().object);
            });

            return {
                cart: cart
            };
        },
        'deleteGiftCertificate': function (formgroup) {
            Transaction.wrap(function () {
                cart.removeGiftCertificateLineItem(formgroup.getTriggeredAction().object);
            });

            return {
                cart: cart
            };
        },
        'deleteProduct': function (formgroup) {
            Transaction.wrap(function () {
                cart.removeProductLineItem(formgroup.getTriggeredAction().object);
            });

            return {
                cart: cart
            };
        },
        'editLineItem': function (formgroup) {
            var product, productOptionModel;
            product = app.getModel('Product').get(request.httpParameterMap.pid.stringValue).object;
            productOptionModel = product.updateOptionSelection(request.httpParameterMap);

            Transaction.wrap(function () {
                cart.updateLineItem(formgroup.getTriggeredAction().object, product, request.httpParameterMap.Quantity.doubleValue, productOptionModel);
                cart.calculate();
            });

            ISML.renderTemplate('checkout/cart/refreshcart');
            return null;
        },
        'login': function () {
            // TODO should not be processed here at all
            var success, result;
            success = app.getController('Login').Process();

            if (success) {
                response.redirect(URLUtils.https('COCustomer-Start'));
            } else if (!success) {
                result = {
                    cart: cart
                };
            }
            return result;
        },
        'logout': function () {
            var CustomerMgr = require('dw/customer/CustomerMgr');
            CustomerMgr.logoutCustomer();
            return {
                cart: cart
            };
        },
        'register': function () {
            app.getController('Account').StartRegister();
            Transaction.wrap(function () {
                cart.calculate();
            });

            return null;
        },
        'unregistered': function () {
            app.getController('COShipping').Start();
            return null;
        },
        'updateCart': function () {

            Transaction.wrap(function () {
                var shipmentItem, item;

                // remove zero quantity line items
                for (var i = 0; i < session.forms.cart.shipments.childCount; i++) {
                    shipmentItem = session.forms.cart.shipments[i];

                    for (var j = 0; j < shipmentItem.items.childCount; j++) {
                        item = shipmentItem.items[j];

                        if (item.quantity.value === 0) {
                            cart.removeProductLineItem(item.object);
                        }
                    }
                }

                session.forms.cart.shipments.accept();
                cart.checkInStoreProducts();
            });

            return {
                cart: cart
            };
        },
        'error': function () {
            return null;
        }
    });

    if (formResult) {
        cartAsset = app.getModel('Content').get('cart');

        pageMeta = require('~/cartridge/scripts/meta');
        pageMeta.update(cartAsset);

        app.getView('Cart', formResult).render('checkout/cart/cart');
    }
}

/**
 * Adds a product to the cart.
 */
function addProduct() {
    var cart = app.getModel('Cart').goc();
    var params = request.httpParameterMap;
    var format = params.format.stringValue.toLowerCase();
    var Product = app.getModel('Product');
    var productOptionModel;
    var product;
    var template = 'checkout/cart/minicart';
    var newBonusDiscountLineItem;

    if (params.source && params.source.stringValue === 'giftregistry' && params.cartAction && params.cartAction.stringValue === 'update') {
        app.getController('GiftRegistry').ReplaceProductListItem();
        return;
    }

    if (params.source && params.source.stringValue === 'wishlist' && params.cartAction && params.cartAction.stringValue === 'update') {
        app.getController('Wishlist').ReplaceProductListItem();
        return;
    }

    // Updates a product line item.
    if (params.uuid.stringValue) {
        var lineItem = cart.getProductLineItemByUUID(params.uuid.stringValue);
        if (lineItem) {
            var productModel = Product.get(request.httpParameterMap.pid.stringValue);
            product = productModel.object;
            var quantity = parseInt(params.Quantity.value);
            productOptionModel = productModel.updateOptionSelection(request.httpParameterMap);

            Transaction.wrap(function () {
                cart.updateLineItem(lineItem, product, quantity, productOptionModel);
            });

            if (format === 'ajax') {
                template = 'checkout/cart/refreshcart';
            }
        } else {
            app.getView('Cart', {Basket: cart}).render('checkout/cart/cart');
        }
    } else if (params.plid.stringValue) {
        // Adds a product to a product list.
        var productList = ProductListMgr.getProductList(params.plid.stringValue);
        cart.addProductListItem(productList && productList.getItem(params.itemid.stringValue), params.Quantity.doubleValue, params.cgid.value);
    } else {
        // Adds a product.
        product = Product.get(params.pid.stringValue);
        var previousBonusDiscountLineItems = cart.getBonusDiscountLineItems();

        if (product.object.isProductSet()) {
            var childPids = params.childPids.stringValue.split(',');
            var childQtys = params.childQtys.stringValue.split(',');
            var counter = 0;

            for (var i = 0; i < childPids.length; i++) {
                var childProduct = Product.get(childPids[i]);

                if (childProduct.object && !childProduct.isProductSet()) {
                    var childProductOptionModel = childProduct.updateOptionSelection(request.httpParameterMap);
                    cart.addProductItem(childProduct.object, parseInt(childQtys[counter], 10), params.cgid.value, childProductOptionModel);
                }
                counter++;
            }
        } else {
            productOptionModel = product.updateOptionSelection(request.httpParameterMap);
            cart.addProductItem(product.object, params.Quantity.doubleValue, params.cgid.value, productOptionModel);
        }

        // When adding a new product to the cart, check to see if it has triggered a new bonus discount line item.
        newBonusDiscountLineItem = cart.getNewBonusDiscountLineItem(previousBonusDiscountLineItems);
    }

    if (format === 'ajax') {
        app.getView('Cart', {
            cart: cart,
            BonusDiscountLineItem: newBonusDiscountLineItem
        }).render(template);
    } else {
        response.redirect(URLUtils.url('Cart-Show'));
    }
}

/**
 * Displays the current items in the cart in the minicart panel.
 */
function miniCart() {

    var cart = app.getModel('Cart').get();
    app.getView({
        Basket: cart ? cart.object : null
    }).render('checkout/cart/minicart');

}

/**
 * Adds the product with the given ID to the wish list.
 */
function addToWishlist() {
    var productID, product, productOptionModel, productList, Product;
    Product = app.getModel('Product');

    productID = request.httpParameterMap.pid.stringValue;
    product = Product.get(productID).object;
    productOptionModel = product.updateOptionSelection(request.httpParameterMap);

    productList = app.getModel('ProductList').get();
    productList.addProduct(product, request.httpParameterMap.Quantity.doubleValue, productOptionModel);

    app.getView('Cart', {
        cart: app.getModel('Cart').get(),
        ProductAddedToWishlist: productID
    }).render('checkout/cart/cart');

}

/**
 * Adds bonus product to cart.
 */
function addBonusProductJson() {
    var h, i, j, cart, data, productsJSON, bonusDiscountLineItem, product, lineItem, childPids, childProduct, ScriptResult, foundLineItem, Product;
    cart = app.getModel('Cart').goc();
    Product = app.getModel('Product');

    // parse bonus product JSON
    data = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
    productsJSON = new ArrayList();

    for (h = 0; h < data.bonusproducts.length; h += 1) {
        productsJSON.addAt(0, data.bonusproducts[h].product);
    }

    bonusDiscountLineItem = cart.getBonusDiscountLineItemByUUID(request.httpParameterMap.bonusDiscountLineItemUUID.stringValue);

    Transaction.begin();
    cart.removeBonusDiscountLineItemProducts(bonusDiscountLineItem);

    for (i = 0; i < productsJSON.length; i += 1) {

        product = Product.get(productsJSON[i].pid).object;
        lineItem = cart.addBonusProduct(bonusDiscountLineItem, product, new ArrayList(productsJSON[i].options), parseInt(productsJSON[i].qty, 10));

        if (lineItem && product) {
            if (product.isBundle()) {

                childPids = productsJSON[i].childPids.split(',');

                for (j = 0; j < childPids.length; j += 1) {
                    childProduct = Product.get(childPids[j]).object;

                    if (childProduct) {

                        // TODO: CommonJSify cart/UpdateProductOptionSelections.ds and import here

                        var UpdateProductOptionSelections = require('app_storefront_core/cartridge/scripts/cart/UpdateProductOptionSelections');
                        ScriptResult = UpdateProductOptionSelections.update({
                            SelectedOptions:  new ArrayList(productsJSON[i].options),
                            Product: childProduct
                        });

                        foundLineItem = cart.getBundledProductLineItemByPID(lineItem.getBundledProductLineItems(),
                            (childProduct.isVariant() ? childProduct.masterProduct.ID : childProduct.ID));

                        if (foundLineItem) {
                            foundLineItem.replaceProduct(childProduct);
                        }
                    }
                }
            }
        } else {
            Transaction.rollback();

            let r = require('~/cartridge/scripts/util/Response');
            r.renderJSON({
                success: false
            });
            return;
        }
    }

    cart.calculate();
    Transaction.commit();

    let r = require('~/cartridge/scripts/util/Response');
    r.renderJSON({
        success: true
    });
}

/**
 * Adds a coupon to the cart using JSON. Called during checkout.
 */
function addCouponJson() {
    var couponCode, cart, couponStatus;

    couponCode = request.httpParameterMap.couponCode.stringValue;
    cart = app.getModel('Cart').goc();

    Transaction.wrap(function () {
        couponStatus = cart.addCoupon(couponCode);
    });

    if (request.httpParameterMap.format.stringValue === 'ajax') {
        let r = require('~/cartridge/scripts/util/Response');
        r.renderJSON({
            status: couponStatus.code,
            message: Resource.msgf('cart.' + couponStatus.code, 'checkout', null, couponCode),
            success: !couponStatus.error,
            baskettotal: cart.object.adjustedMerchandizeTotalGrossPrice.value,
            CouponCode: couponCode
        });
    }
}

/*
* Module exports
*/

/*
* Exposed methods.
*/
/** @see module:controllers/Cart~addProduct */
exports.AddProduct = guard.ensure(['post'], addProduct);
/** @see module:controllers/Cart~show */
exports.Show = guard.ensure(['https'], show);
/** @see module:controllers/Cart~submitForm */
exports.SubmitForm = guard.ensure(['post', 'https'], submitForm);
/** @see module:controllers/Cart~continueShopping */
exports.ContinueShopping = guard.ensure(['https'], continueShopping);
/** @see module:controllers/Cart~addCouponJson */
exports.AddCouponJson = guard.ensure(['get', 'https'], addCouponJson);
/** @see module:controllers/Cart~miniCart */
exports.MiniCart = guard.ensure(['get'], miniCart);
/** @see module:controllers/Cart~addToWishlist */
exports.AddToWishlist = guard.ensure(['get', 'https', 'loggedIn'], addToWishlist, {
    scope: 'wishlist'
});
/** @see module:controllers/Cart~addBonusProductJson */
exports.AddBonusProduct = guard.ensure(['post'], addBonusProductJson);
