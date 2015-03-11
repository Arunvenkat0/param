'use strict';

/**
 * TODO
 *
 * @module controller/Cart
 */

/* API Includes */
var Cart = require('~/cartridge/scripts/model/Cart');
var Product = require('~/cartridge/scripts/model/Product');
var ProductListMgr = require('dw/customer/ProductListMgr');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var cartAsset = require('~/cartridge/scripts/model/Content').get('cart');
var guard = require('~/cartridge/scripts/guard');
var cartForm = require('~/cartridge/scripts/model/Form').get('cart');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/view');

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

    if (params.uuid.stringValue) {

        var lineItem = cart.getProductLineItemByUUID(params.uuid.stringValue);

        if (!lineItem) {

            view.get('Cart', {
                Basket : cart
            }).render('checkout/cart/cart');

            return;
        }
	    else {

	        editLineItem(lineItem);

	        if (params.format.stringValue.toLowerCase() === 'ajax') {
		        response.renderTemplate('checkout/cart/refreshcart', {});
		        return;
	        }
	        else {
		        response.redirect(dw.web.URLUtils.url('Cart-Show'));
		        return;
	        }
        }
    }
    else if (params.plid.stringValue) {

        var productList = ProductListMgr.getProductList(params.plid.stringValue);
        cart.addProductListItem(productList && productList.getItem(params.itemid.stringValue), params.Quantity.doubleValue, params.cgid.value);

    }
    else {

        cart.addProductItem(Product.get(params.pid.stringValue).object, params.Quantity.doubleValue, params.cgid.value);

    }

    if (params.format.stringValue === 'ajax') {
        view.get('view/CartView', {
            cart : cart
        }).render('checkout/cart/minicart');
    }
    else {
        response.redirect(dw.web.URLUtils.url('Cart-Show'));
    }

}

/**
 * Renders the basket content.
 */
function Show() {

    session.forms.cart.shipments.invalidateFormElement();
    session.forms.login.invalidateFormElement();

    view.get('view/CartView', {cart : Cart.get(), RegistrationStatus : false}).render('checkout/cart/cart');

}

function submitForm() {
    // we have no existing state, so resolve the basket again
    var cart = Cart.get();

    // TODO this should actually trigger a redirect to avoid multiple form
    // submissions!

    var formResult = cartForm.handleAction({
        'addCoupon'             : function (formgroup) {
            if (formgroup.couponCode.htmlValue) {
                var status = cart.addCoupon(formgroup.couponCode.htmlValue);

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
            return {cart : cart};
        },
        'checkoutCart'          : function (formgroup) {
            var startCheckoutResult = startCheckout();
            if (!startCheckoutResult.error) {
                return null;
            }
            return {cart : cart};
        },
        'continueShopping'      : function (formgroup) {
            continueShopping();
            return null;
        },
        'deleteCoupon'          : function (formgroup) {
            cart.removeCouponLineItem(formgroup.getTriggeredAction().object);
            return {cart : cart};
        },
        'deleteGiftCertificate' : function (formgroup) {
            cart.removeGiftCertificateLineItem(formgroup.getTriggeredAction().object);
            return {cart : cart};
        },
        'deleteProduct'         : function (formgroup) {
            cart.removeProductLineItem(formgroup.getTriggeredAction().object);
            return {cart : cart};
        },
        'editLineItem'          : function (formgroup) {
            var editLineItemResult = editLineItem(formgroup.getTriggeredAction().object);

            if (editLineItemResult) {
                cart.calculate();
                response.renderTemplate('checkout/cart/refreshcart');
                return null;
            }

            return {cart : cart};
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
            require('./Login').Logout();
            return null;
        },
        'register'              : function (formgroup) {
            require('./Account').StartRegister();
            cart.calculate();
            response.redirect(dw.web.URLUtils.https('Cart-Show'));

            return null;
        },
        'unregistered'          : function (formgroup) {
            require('./COShipping').Start();
            return null;
        },
        'updateCart' : function (formgroup) {

            // remove zero quantity line items
            for (var i = 0; i < session.forms.cart.shipments.length; i++) {
                var shipmentItem = session.forms.cart.shipments;

                for (var j = 0; j < shipmentItem.items; j++) {
                    var item = shipmentItem.items[j];

                    if (item.quantity.value === 0) {
                        cart.removeProductLineItem(item.object);
                    }
                }
            }

            session.forms.cart.shipments.accept();
            checkInStoreProducts(cart.object);

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
 * Redirects the user to the last visited catalog URL as implemented in the custom script.
 */
function continueShopping() {

    var location = null;
    var list = session.getClickStream().getClicks();
    for (var i = list.size() - 1; i >= 0; i--) {
        var click = list[i];
        switch (click.getPipelineName()) {
            case "Product-Show":
            case "Search-Show":
                // catalog related click
                // replace well-known http parameter names "source" and "format" to avoid loading partial page markup only
                location = 'http://' + click.host + click.url.replace(/source=/g, "src=").replace(/format=/g, "frmt=");
        }
    }

    if (location) {
        response.redirect(location);
    }
    else {
        response.redirect(URLUtils.httpHome());
    }

}

/**
 * Updates an existing product line item with a new product, new options, and/or a new quantity. params: just like
 * miniaddproduct i.e. pid, options, quantiy.
 */
function editLineItem(CurrentLineItem) {

    if (!product) {
        product = Product.get(request.httpParameterMap.pid.stringValue);
    }

	var productOptionSelections = require('~/cartridge/scripts/util/ProductOptionSelection').getProductOptionSelections(product, request.httpParameterMap);

    new dw.system.Pipelet('ReplaceLineItemProduct').execute({
        ProductLineItem    : CurrentLineItem,
        NewProduct         : product,
        Quantity           : request.httpParameterMap.Quantity.doubleValue,
        ProductOptionModel : productOptionSelections.ProductOptionModel
    });

    if (product.bundle) {
        replaceBundleLineItemProducts(CurrentLineItem);
        return;
    }

}

/**
 * Determines some needed objects based on the current form values.
 */

/**
 * By default, when a bundle is added to cart all its sub products gets added too, but if those products happens to be
 * variants then we have to manually replace the master products with the selected variants which gets passed in the
 * http params as childPids along with any options. Params: CurrentHttpParameterMap.childPids - comma separated list of
 * pids of the bundled products which are variations
 */
function replaceBundleLineItemProducts(bundleLineItem) {
    var params = request.httpParameterMap;
	var cart = Cart.get();

    if (!params.childPids.stringValue) {
        return;
    }
	else {
	    var childPids = params.childPids.stringValue.split(",");

	    for(var i = 0; i < childPids.length; i++) {
            var childProduct = Product.get(childPids[i]).object;

            if (childProduct) {
                // why is this needed ?
                require('~/cartridge/scripts/util/ProductOptionSelection').getProductOptionSelections(childProduct, request.httpParameterMap);

                var foundLineItem = null;
	            foundLineItem = cart.getBundledProductLineItemByPID(bundleLineItem, (childProduct.isVariant() ? childProduct.masterProduct.ID : childProduct.ID));

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


/**
 * The cart page provides various actions to be performed, e.g. line item editing, coupon redemption etc.
 */
function miniCart() {

    response.renderTemplate('checkout/cart/minicart', {
        Basket : Cart.get().object
    });

}


/**
 * Adds multiple products to the basket. Uses multiple product IDs separated by comma.
 */
function addProductSetProducts() {
    var params = request.httpParameterMap;
	var cart = Cart.get();

    var childPids = params.childPids.stringValue.split(",");
    var childQtys = params.childQtys.stringValue.split(",");
    var counter = 0;

	for(var i = 0; i < childPids.length; i++) {
		var childProduct = Product.get(childPids[i]).object;

        if (childProduct.productSet) {
            counter++;
            continue;
        }

		var childProductOptionModel = require('~/cartridge/scripts/util/ProductOptionSelection').getProductOptionSelections(childProduct, request.httpParameterMap).ProductOptionModel;

        var AddProductToBasketResult = new dw.system.Pipelet('AddProductToBasket').execute({
            Basket             : cart.object,
            Product            : childProduct,
            ProductOptionModel : childProductOptionModel,
            Quantity           : parseInt(childQtys[counter]),
            Category           : dw.catalog.CatalogMgr.getCategory(params.cgid.value)
        });
        counter++;
    }
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

    var AddProductResult = require('./Wishlist').AddProduct();

    view.get('view/CartView', {
        cart                   : Cart.get(),
        ProductAddedToWishlist : productID
    }).render('checkout/cart/cart');

}


/**
 * Determines an existing basket from the current session. If a basket wasn't found, the pipeline ends in a named end
 * node "error". This node can be used in other pipelines such as the checkout pipelines in order to access the basket.
 * This pipeline does not create a new basket. Calling pipelines are responsible to properly react on the "error" end
 * node.
 */
function getExistingBasket() {

    return Cart.get().object;

}


/**
 * Determines an existing basket from the current session. If a basket wasn't found, a new basket is created. If a new
 * basket couldn't be created, the pipeline ends in a named end node "error". Calling pipelines are responsible to
 * properly react on the "error" end node.
 */
function getBasket() {

    var GetBasketResult = new dw.system.Pipelet('GetBasket', {
        Create : true
    }).execute();

    if (GetBasketResult.result == PIPELET_ERROR) {
        return null;
    }

    return GetBasketResult.Basket;
}


/**
 * Calculates an existing basket. Call this pipeline always if the changes to the basket content is made (e.g. addition
 * or removal of a product or gift certificate or setting of a shipping method).
 */
function calculate() {

    var txn = require('dw/system/Transaction');
    txn.begin();

    var cart = Cart.get();
    cart.calculate();

    txn.commit();

    return cart.object;
}

/**
 * Start the checkout process.
 */
function startCheckout() {
    var basket = calculate();

    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile    : 'cart/ValidateCartForCheckout.ds',
        Transactional : false
    }).execute({
            Basket      : Basket,
            ValidateTax : false
        });
    if (ScriptResult.result == PIPELET_ERROR) {
        return {
            error : true
        };
    }
    var BasketStatus = ScriptResult.BasketStatus;
    var EnableCheckout = ScriptResult.EnableCheckout;

	require('./COCustomer').Start();

    return;
}


/**
 * Add bonus product to cart.
 */
function addBonusProduct() {
    var CurrentHttpParameterMap = request.httpParameterMap;

	Transaction.begin();

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError       : 'PIPELET_ERROR',
        ScriptFile    : 'cart/ParseBonusProductsJSON.ds'
    }).execute();
    if (ScriptResult.result == PIPELET_ERROR) {
        txn.rollback();

        response.renderJSON({
            success : false
        });
        return;
    }
    var Products = ScriptResult.Products;

    var Basket = getBasket();


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError       : 'PIPELET_ERROR',
        ScriptFile    : 'cart/GetBonusDiscountLineItem.ds'
    }).execute({
            uuid                   : CurrentHttpParameterMap.bonusDiscountLineItemUUID.stringValue,
            BonusDiscountLineItems : Basket.bonusDiscountLineItems
        });
    if (ScriptResult.result == PIPELET_ERROR) {
        txn.rollback();

        response.renderJSON({
            success : false
        });
        return;
    }
    var BonusDiscountLineItem = ScriptResult.BonusDiscountLineItem;


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError       : 'PIPELET_ERROR',
        ScriptFile    : 'cart/RemoveBonusDiscountLineItemProducts.ds'
    }).execute({
            bonusDiscountLineItem : BonusDiscountLineItem,
            Basket                : Basket
        });
    if (ScriptResult.result == PIPELET_ERROR) {
        txn.rollback();

        response.renderJSON({
            success : false
        });
        return;
    }


    for each(var product
in
    Products
)
    {
        var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
            ProductID : product.pid
        });
        if (GetProductResult.result == PIPELET_ERROR) {
            txn.rollback();

            response.renderJSON({
                success : false
            });
            return;
        }
        var Product = GetProductResult.Product;


        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional : false,
            OnError       : 'PIPELET_ERROR',
            ScriptFile    : 'cart/UpdateProductOptionSelections.ds',
        }).execute({
                SelectedOptions : new dw.util.ArrayList(product.options),
                Product         : Product
            });
        if (ScriptResult.result == PIPELET_ERROR) {
            txn.rollback();

            response.renderJSON({
                success : false
            });
            return;
        }
        var ProductOptionModel = ScriptResult.ProductOptionModel;


        var AddBonusProductToBasketResult = new dw.system.Pipelet('AddBonusProductToBasket').execute({
            Basket                : Basket,
            BonusDiscountLineItem : BonusDiscountLineItem,
            Product               : Product,
            Quantity              : parseInt(product.qty),
            ProductOptionModel    : ProductOptionModel
        });
        if (AddBonusProductToBasketResult.result == PIPELET_ERROR) {
            txn.rollback();

            response.renderJSON({
                success : false
            });
            return;
        }
        var ProductLineItem = AddBonusProductToBasketResult.ProductLineItem;


        if (Product.bundle) {
            addBonusProductBundle();
        }
    }

    calculate();

    response.renderJSON({
        success : true
    });

	Transaction.commit();
}


/**
 * Add a sub product to the bonus product bundle.
 */
function addBonusProductBundle() {
    var childPids = product.childPids.split(",");

    for each(var childPid
in
    childPids
)
    {
        var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
            ProductID : childPid
        });
        if (GetProductResult.result == PIPELET_ERROR) {
            continue;
        }
        var ChildProduct = GetProductResult.Product;


        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional : false,
            OnError       : 'PIPELET_ERROR',
            ScriptFile    : 'cart/UpdateProductOptionSelections.ds'
        }).execute({
                SelectedOptions : new dw.util.ArrayList(product.options),
                Product         : ChildProduct,
            });
        if (ScriptResult.result == PIPELET_ERROR) {
            continue;
        }
        var ProductOptionModel = ScriptResult.ProductOptionModel;


        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional : false,
            OnError       : 'PIPELET_ERROR',
            ScriptFile    : 'cart/FindLineItem.ds'
        }).execute({
                pid              : (ChildProduct.isVariant() ? ChildProduct.masterProduct.ID : ChildProduct.ID),
                ProductLineItems : ProductLineItem.bundledProductLineItems
            });
        if (ScriptResult.result == PIPELET_ERROR) {
            continue;
        }
        var FoundLineItem = ScriptResult.FoundLineItem;


        if (empty(FoundLineItem)) {
            continue;
        }


        new dw.system.Pipelet('ReplaceLineItemProduct').execute({
            ProductLineItem : FoundLineItem,
            NewProduct      : ChildProduct
        });
    }
}


/**
 * When adding a new product to the cart check to see if it has triggered a new bonus discount line item.
 */
function newBonusDiscountLineItem(Basket, PreviousBonusDiscountLineItems) {
    var BonusDiscountLineItems = Basket.getBonusDiscountLineItems();


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError       : 'PIPELET_ERROR',
        ScriptFile    : 'cart/CheckForNewBonusDiscountLineItem.ds'
    }).execute({
            NewBonusDiscountLineItems      : BonusDiscountLineItems,
            PreviousBonusDiscountLineItems : PreviousBonusDiscountLineItems,
        });
    if (ScriptResult.result == PIPELET_ERROR) {
        return null;
    }

    return {
        BonusDiscountLineItem : ScriptResult.BonusDiscountLineItem
    };
}

function addCouponJson() {
    var couponCode = request.httpParameterMap.couponCode.stringValue;

	var couponStatus = Cart.get().addCoupon(couponCode);

    if (request.httpParameterMap.format.stringValue === 'ajax') {

	    response.renderJSON({
		    status      : couponStatus.code,
		    message     : dw.web.Resource.msgf('cart.' + couponStatus.code, 'checkout', null, couponCode),
		    success     : !couponStatus.error,
		    baskettotal : Basket.adjustedMerchandizeTotalGrossPrice.value,
		    CouponCode  : couponCode
	    });
    }
}

/**
 * This Pipeline will check the instore qty against the store inventory in the case that the pli's qtyt has been
 * updated.
 */
function checkInStoreProducts(basket) {
    if (!dw.system.Site.getCurrent().getCustomPreferenceValue('enableStorePickUp')) {
        return null;
    }

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : true,
        OnError       : 'PIPELET_ERROR',
        ScriptFile    : 'cart/storepickup/CheckStoreInLineItem.ds'
    }).execute({
            Basket : basket
        });
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/Cart~addProduct */
exports.AddProduct = guard.filter(['post'], addProduct);
/** @see module:controller/Cart~show */
exports.Show = guard.filter(['get', 'https'], Show);
/** @see module:controller/Cart~submitForm */
exports.SubmitForm = guard.filter(['post', 'https'], submitForm);
/** @see module:controller/Cart~continueShopping */
exports.ContinueShopping = guard.filter(['post', 'https'], continueShopping);
/** @see module:controller/Cart~addCouponJson */
exports.AddCouponJson = guard.filter(['get', 'https'], addCouponJson);
/** @see module:controller/Cart~miniCart */
exports.MiniCart = guard.filter(['get'], miniCart);
/** @see module:controller/Cart~addToWishlist */
exports.AddToWishlist = guard.filter(['get', 'https'], addToWishlist);
/** @see module:controller/Cart~addBonusProduct */
exports.AddBonusProduct = guard.filter(['post'], addBonusProduct);

/*
 * Local methods
 */
exports.GetExistingBasket = getExistingBasket;
exports.GetBasket = getBasket;
exports.Calculate = calculate;
