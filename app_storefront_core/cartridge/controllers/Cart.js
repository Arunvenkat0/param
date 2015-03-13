'use strict';

/**
 * TODO
 *
 * @module controller/Cart
 */

/* API Includes */
var ArrayList = require('dw/util/ArrayList');
var Cart = require('~/cartridge/scripts/model/Cart');
var Product = require('~/cartridge/scripts/model/Product');
var ProductListMgr = require('dw/customer/ProductListMgr');
var Transaction = require('~/cartridge/scripts/transaction');

/* Script Modules */
var cartAsset = require('~/cartridge/scripts/model/Content').get('cart');
var guard = require('~/cartridge/scripts/guard');
var cartForm = require('~/cartridge/scripts/model/Form').get('cart');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/view');

/**
 * Renders the basket content.
 */
function show() {

    session.forms.cart.shipments.invalidateFormElement();
    session.forms.login.invalidateFormElement();

    view.get('view/CartView', {cart : Cart.get(), RegistrationStatus : false}).render('checkout/cart/cart');

}

/**
 *
 */
function submitForm() {
    // we have no existing state, so resolve the basket again
    var cart = Cart.get();

    var formResult = cartForm.handleAction({
        'addCoupon'             : function (formgroup) {
            if (formgroup.couponCode.htmlValue) {

                var status = Transaction.autocommit(function () {
                        return cart.addCoupon(formgroup.couponCode.htmlValue);
                    }
                );

                if (status) {
                    return {cart : cart, CouponStatus : status};
                }
                else {
                    return {cart : cart, CouponError : 'NO_ACTIVE_PROMOTION'};
                }
            }
            else {
                return {cart : cart, CouponError : 'COUPON_CODE_MISSING'};
            }
        },
        'calculateTotal'        : function (formgroup) {
            // nothing to do here as re-calculation happens during view anyways
            return {cart : cart};
        },
        'checkoutCart'          : function (formgroup) {
            var validationResult = cart.validateForCheckout();

            if (validationResult.EnableCheckout) {
				//require('./COCustomer').Start();
	            response.redirect(dw.web.URLUtils.https('COCustomer-Start'));

                return null;
            }
            else {
                return {
                    cart           : cart,
                    BasketStatus   : validationResult.BasketStatus,
                    EnableCheckout : validationResult.EnableCheckout
                };
            }
        },
        'continueShopping'      : function (formgroup) {
            continueShopping();
            return null;
        },
        'deleteCoupon'          : function (formgroup) {
            Transaction.autocommit(function () {
                cart.removeCouponLineItem(formgroup.getTriggeredAction().object)
            });

            return {cart : cart};
        },
        'deleteGiftCertificate' : function (formgroup) {
            Transaction.autocommit(function () {
                cart.removeGiftCertificateLineItem(formgroup.getTriggeredAction().object)
            });

            return {cart : cart};
        },
        'deleteProduct'         : function (formgroup) {
            Transaction.autocommit(function () {
                cart.removeProductLineItem(formgroup.getTriggeredAction().object)
            });

            return {cart : cart};
        },
        'editLineItem'          : function (formgroup) {

            var product = Product.get(request.httpParameterMap.pid.stringValue).object;
            var productOptionModel = require('~/cartridge/scripts/util/ProductOptionSelection').getProductOptionSelections(product, request.httpParameterMap).ProductOptionModel;

            Transaction.autocommit(function () {
                cart.updateLineItem(formgroup.getTriggeredAction().object, product, productOptionModel)
                cart.calculate();
            });

            response.renderTemplate('checkout/cart/refreshcart');
            return null;
        },
        'login'                 : function (formgroup) {
            // TODO should not be processed here at all
            var ProcessResult = require('./Login').Process();

            if (ProcessResult.loginSucceeded) {
                response.redirect(dw.web.URLUtils.https('COCustomer-Start'));
                return null;
            }
            else if (ProcessResult.loginFailed) {
                return {cart : cart};
            }
        },
        'logout'                : function (formgroup) {
	        new dw.system.Pipelet('LogoutCustomer').execute();
	        return {cart : cart};
        },
        'register'              : function (formgroup) {
            require('./Account').StartRegister();
            Transaction.autocommit(function () {
                cart.calculate();
            });

            return null;
        },
        'unregistered'          : function (formgroup) {
            require('./COShipping').Start();
            return null;
        },
        'updateCart'            : function (formgroup) {

            Transaction.autocommit(function () {

                // remove zero quantity line items
                for (var i = 0; i < session.forms.cart.shipments.childCount; i++) {
                    var shipmentItem = session.forms.cart.shipments[i];

                    for (var j = 0; j < shipmentItem.items.childCount; j++) {
                        var item = shipmentItem.items[j];

                        if (item.quantity.value === 0) {
                            cart.removeProductLineItem(item.object);
                        }
                    }
                }

                session.forms.cart.shipments.accept();
                cart.checkInStoreProducts();
            });

            return {cart : cart};
        },
        'error'                 : function (formgroup) {
            // no special error handling in case the form is invalid
            return null;
        }
    });

    if (formResult) {
        pageMeta.update(cartAsset);
        view.get('view/CartView', formResult).render('checkout/cart/cart');
    }
}

/**
 * Should be used only for simple UI
 */
function addProduct() {
    var params = request.httpParameterMap;

    if (params.source && params.source.stringValue === 'giftregistry' && params.cartAction && params.cartAction.stringValue === 'update') {
        require('./GiftRegistry').ReplaceProductListItem();
        return;
    }

    if (params.source && params.source.stringValue === 'wishlist' && params.cartAction && params.cartAction.stringValue === 'update') {
        require('./Wishlist').ReplaceProductListItem();
        return;
    }

    var cart = Cart.get(getBasket());

    // update product lineitem
    if (params.uuid.stringValue) {

        var lineItem = cart.getProductLineItemByUUID(params.uuid.stringValue);

        if (lineItem) {

	        var product = Product.get(request.httpParameterMap.pid.stringValue).object;
	        var productOptionModel = require('~/cartridge/scripts/util/ProductOptionSelection').getProductOptionSelections(product, request.httpParameterMap).ProductOptionModel;

            Transaction.autocommit(function () {
                cart.updateLineItem(lineItem, product, productOptionModel)
            });

            if (params.format.stringValue.toLowerCase() === 'ajax') {
                response.renderTemplate('checkout/cart/refreshcart');
                return;
            }
            else {
                response.redirect(dw.web.URLUtils.url('Cart-Show'));
                return;
            }
        }
        else {

            view.get('Cart', {
                Basket : cart
            }).render('checkout/cart/cart');

            return;
        }
    }
    // add product list item
    else if (params.plid.stringValue) {

        var productList = ProductListMgr.getProductList(params.plid.stringValue);
        Transaction.autocommit(function () {
            cart.addProductListItem(productList && productList.getItem(params.itemid.stringValue), params.Quantity.doubleValue, params.cgid.value);
        });

    }
    // add product
    else {

        var previousBonusDiscountLineItems = cart.getBonusDiscountLineItems();

        var product = Product.get(params.pid.stringValue).object;

        if (product.productSet) {
            var childPids = params.childPids.stringValue.split(",");
            var childQtys = params.childQtys.stringValue.split(",");
            var counter = 0;

            for (var i = 0; i < childPids.length; i++) {
                var childProduct = Product.get(childPids[i]).object;

                if (childProduct.productSet) {
                    counter++;
                    continue;
                }

                var childProductOptionModel = require('~/cartridge/scripts/util/ProductOptionSelection').getProductOptionSelections(childProduct, request.httpParameterMap).ProductOptionModel;

                Transaction.autocommit(function () {
                    cart.addProductItem(childProduct, parseInt(childQtys[counter]), params.cgid.value, childProductOptionModel);
                });
                counter++;
            }
        }
        else {
            var productOptionModel = require('~/cartridge/scripts/util/ProductOptionSelection').getProductOptionSelections(product, request.httpParameterMap).ProductOptionModel;

            Transaction.autocommit(function () {
                cart.addProductItem(product, params.Quantity.doubleValue, params.cgid.value, productOptionModel);
            });
        }

        /**
         * When adding a new product to the cart check to see if it has triggered a new bonus discount line item.
         */
        var newBonusDiscountLineItem = cart.getNewBonusDiscountLineItem(previousBonusDiscountLineItems);
    }

    if (params.format.stringValue === 'ajax') {
        view.get('view/CartView', {
            cart                  : cart,
            BonusDiscountLineItem : newBonusDiscountLineItem
        }).render('checkout/cart/minicart');
    }
    else {
        response.redirect(dw.web.URLUtils.url('Cart-Show'));
    }

}

/**
 * Redirects the user to the last visited catalog URL.
 */
function continueShopping() {

	var location = require('~/cartridge/scripts/util/Browsing').lastCatalogURL();

    if (location) {
        response.redirect(location);
    }
    else {
        response.redirect(dw.web.URLUtils.httpHome());
    }

}

/**
 * The cart page provides various actions to be performed, e.g. line item editing, coupon redemption etc.
 */
function miniCart() {

    view.get({Basket : Cart.get().object}).render('checkout/cart/minicart');

}

/**
 * Adds the product with the given ID to the wish list.
 */
function addToWishlist() {
    var productID = request.httpParameterMap.pid.stringValue;

    if (!customer.authenticated) {
        // login via the wishlist login page, but return here
        require('./Wishlist').requireLogin({
            TargetAction     : 'Cart-AddToWishlist',
            TargetParameters : ['pid', productID]
        });
        return;
    }

    require('./Wishlist').AddProduct();

    view.get('view/CartView', {
        cart                   : Cart.get(),
        ProductAddedToWishlist : productID
    }).render('checkout/cart/cart');

}


/**
 * TODO: deprecate
 */
function getExistingBasket() {
    return {
        Basket : Cart.get().object
    };
}


/**
 * Determines an existing basket from the current session. If a basket wasn't found, a new basket is created. If a new
 * basket couldn't be created, the pipeline ends in a named end node "error". Calling pipelines are responsible to
 * properly react on the "error" end node.
 */
function getBasket() {

    return Cart.goc().object;

}


/**
 * Calculates an existing basket. Call this pipeline always if the changes to the basket content is made (e.g. addition
 * or removal of a product or gift certificate or setting of a shipping method).
 */
function calculate() {

    var cart = Cart.get();
    Transaction.autocommit(function () {
        cart.calculate();
    });

    return cart.object;
}

/**
 * Add bonus product to cart.
 */
function addBonusProductJson() {

    var cart = Cart.get();

    // parse bonus product JSON
    var data = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
    var productsJSON = new ArrayList();

    for (var h = 0; h < data.bonusproducts.length; h++) {
        productsJSON.addAt(0, data.bonusproducts[h].product);
    }

    var bonusDiscountLineItem = cart.getBonusDiscountLineItemByUUID(request.httpParameterMap.bonusDiscountLineItemUUID.stringValue);

    Transaction.begin();
    cart.removeBonusDiscountLineItemProducts(bonusDiscountLineItem);

    for (var i = 0; i < productsJSON.length; i++) {

        var product = Product.get(productsJSON[i].pid).object;
        var lineItem = cart.addBonusProduct(bonusDiscountLineItem, product, new ArrayList(productsJSON[i].options), parseInt(productsJSON[i].qty));

        if (lineItem && product) {
            if (product.isBundle()) {

                var childPids = productsJSON[i].childPids.split(",");

                for (var j = 0; j < childPids.length; j++) {
                    var childProduct = Product.get(childPids[j]).object;

                    if (childProduct) {

                        var ScriptResult = new dw.system.Pipelet('Script', {
                            Transactional : false,
                            OnError       : 'PIPELET_ERROR',
                            ScriptFile    : 'cart/UpdateProductOptionSelections.ds'
                        }).execute({
                                SelectedOptions : new dw.util.ArrayList(product.options),
                                Product         : childProduct
                            });

                        var foundLineItem = cart.getBundledProductLineItemByPID(lineItem.getBundledProductLineItems(), (childProduct.isVariant() ? childProduct.masterProduct.ID : childProduct.ID));

                        if (foundLineItem) {
                            new dw.system.Pipelet('ReplaceLineItemProduct').execute({
                                ProductLineItem : foundLineItem,
                                NewProduct      : childProduct
                            });
                        }
                    }
                }
            }
        }
        else {
            Transaction.rollback();

            response.renderJSON({
                success : false
            });
            return;
        }
    }

    calculate();
    Transaction.commit();

    response.renderJSON({
        success : true
    });

}

/**
 * Called during checkout.
 * TODO: Needs to be reviewed once checkout works.
 */
function addCouponJson() {

    var couponCode = request.httpParameterMap.couponCode.stringValue;
    var cart = Cart.get();

    var couponStatus = null;
    Transaction.autocommit(function () {
        couponStatus = cart.addCoupon(couponCode);
    });

    if (request.httpParameterMap.format.stringValue === 'ajax') {

        response.renderJSON({
            status      : couponStatus.code,
            message     : dw.web.Resource.msgf('cart.' + couponStatus.code, 'checkout', null, couponCode),
            success     : !couponStatus.error,
            baskettotal : cart.object.adjustedMerchandizeTotalGrossPrice.value,
            CouponCode  : couponCode
        });
    }
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/Cart~addProduct */
exports.AddProduct = guard.ensure(['post'], addProduct);
/** @see module:controller/Cart~show */
exports.Show = guard.ensure(['get', 'https'], show);
/** @see module:controller/Cart~submitForm */
exports.SubmitForm = guard.ensure(['post', 'https'], submitForm);
/** @see module:controller/Cart~continueShopping */
exports.ContinueShopping = guard.ensure(['post', 'https'], continueShopping);
/** @see module:controller/Cart~addCouponJson */
exports.AddCouponJson = guard.ensure(['get', 'https'], addCouponJson);
/** @see module:controller/Cart~miniCart */
exports.MiniCart = guard.ensure(['get'], miniCart);
/** @see module:controller/Cart~addToWishlist */
exports.AddToWishlist = guard.ensure(['get', 'https'], addToWishlist);
/** @see module:controller/Cart~addBonusProductJson */
exports.AddBonusProduct = guard.ensure(['post'], addBonusProductJson);

/*
 * Local methods
 */
exports.GetExistingBasket = getExistingBasket;
exports.GetBasket = getBasket;
exports.Calculate = calculate;
