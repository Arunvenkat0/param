var g = require('./dw/guard');

/**
 * Should be used only for simple UI
 */
function AddProduct()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    if (CurrentHttpParameterMap.source && CurrentHttpParameterMap.source.stringValue=='giftregistry' && CurrentHttpParameterMap.cartAction && CurrentHttpParameterMap.cartAction.stringValue=='update')
    {
        var GiftRegistryController = require('./GiftRegistry');
    	GiftRegistryController.ReplaceProductListItem();
        return;
    }

    if (CurrentHttpParameterMap.source && CurrentHttpParameterMap.source.stringValue=='wishlist' && CurrentHttpParameterMap.cartAction && CurrentHttpParameterMap.cartAction.stringValue=='update')
    {
    	var WishlistController = require('./Wishlist');
        WishlistController.ReplaceProductListItem();
        return;
    }

    if (!empty(CurrentHttpParameterMap.uuid.stringValue))
    {
        updateLineItem();
        return;
    }

    
    var addItemResult = addItem();

    if (CurrentHttpParameterMap.format.stringValue == 'ajax')
    {
        response.renderTemplate('checkout/cart/minicart', {
        	Basket: addItemResult.Basket
        	// TODO ProductLineItem
        	// TODO BonusLineItem
        });
        return;
    }

    var Location = dw.web.URLUtils.url('Cart-Show');
    response.renderTemplate('util/redirect', {
    	Location: Location
    });
    return;
}

/**
 * Renders the basket content.
 */
function Show()
{
    show({});
}

function show(args)
{
    var CurrentForms = session.forms;

    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.cart.shipments);
    form.clearFormElement(CurrentForms.login);

    
    var CouponStatus = null;

    var GetExistingBasketResult = GetExistingBasket();
    var Basket = GetExistingBasketResult.Basket;

    showBasket({
        Basket: Basket,
        ProductAddedToWishlist: args.ProductAddedToWishlist
    });
}

/**
 * This is the internal loopback from the basket form.
 */
function showBasket(args)
{
    var Basket = args.Basket;
    
    var prepareViewResult = prepareView({
        Basket: Basket
    });
    var EnableCheckout = prepareViewResult.EnableCheckout;

    var web = require('./dw/web');
    web.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("cart"));
    
    showCart({
        EnableCheckout: EnableCheckout,
        Basket: Basket,
        ProductAddedToWishlist: args.ProductAddedToWishlist,
        WishList: prepareViewResult.WishList
    });
}

function showCart(args)
{
    var EnableCheckout = args.EnableCheckout;
    var Basket = args.Basket;
    
    response.renderTemplate('checkout/cart/cart', {
        EnableCheckout: EnableCheckout,
        Basket: Basket,
        ProductAddedToWishlist: args.ProductAddedToWishlist,
        RegistrationStatus: false
    });
}

function SubmitForm()
{
	// we have no existing state, so resolve the basket again
    var GetExistingBasketResult = GetExistingBasket();
    var Basket = GetExistingBasketResult.Basket;
    
    // TODO this should actually trigger a redirect to avoid multiple form
    // submissions!

    var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'addCoupon')
	    {
	        var CouponCode = CurrentForms.cart.couponCode.htmlValue;

	        var AddCouponResult = AddCoupon(CouponCode);
	        showBasket({
	            Basket: Basket
	        });
	        return;
	    }
	    else if (TriggeredAction.formId == 'calculateTotal')
	    {
	        var CalculateResult = Calculate();
	        showBasket({
                Basket: Basket
            });
	        return;
	    }
	    else if (TriggeredAction.formId == 'checkoutCart')
	    {
	        var startCheckoutResult = startCheckout();
	        if (startCheckoutResult.error)
	        {
	            showBasket({
	                Basket: Basket
	            });
	        }
	        return;
	    }
	    else if (TriggeredAction.formId == 'continueShopping')
	    {
	        ContinueShopping();
	        return;
	    }
	    else if (TriggeredAction.formId == 'deleteCoupon')
	    {
	    	new dw.system.Pipelet('RemoveCouponLineItem').execute({
	            CouponLineItem: TriggeredAction.object
	        });

	        var CalculateResult = Calculate();
	        
	        showBasket({
                Basket: Basket
            });
	        return;
	    }
	    else if (TriggeredAction.formId == 'deleteGiftCertificate')
	    {
	        new dw.system.Pipelet('RemoveGiftCertificateLineItem').execute({
	            GiftCertificateLineItem: TriggeredAction.object
	        });

	        var CalculateResult = Calculate();

	        showBasket({
                Basket: Basket
            });
	        return;
	    }
	    else if (TriggeredAction.formId == 'deleteProduct')
	    {
	        new dw.system.Pipelet('RemoveProductLineItem').execute({
	            ProductLineItem: TriggeredAction.object
	        });

	        var CalculateResult = Calculate();

	        showBasket({
                Basket: Basket
            });
	        return;
	    }
	    else if (TriggeredAction.formId == 'editLineItem')
	    {
	        var CurrentLineItem = TriggeredAction.object;

	        var editLineItemResult = editLineItem();
	        if (editLineItemResult != null)
	        {
		        var CalculateResult = Calculate();
	        	
		        response.renderTemplate('checkout/cart/refreshcart', {
		        });
		        return;
	        }

	        var CalculateResult = Calculate();

	        showBasket({
                Basket: Basket
            });
	        return;
	    }
	    else if (TriggeredAction.formId == 'login')
	    {
	        // TODO should not be processed here at all
	        var LoginController = require('./Login');
	        var ProcessResult = LoginController.Process();
	        
	        if (ProcessResult.loginSucceeded)
	        {
	            // TODO useless
	            var GetBasketResult = new dw.system.Pipelet('GetBasket', {
	                Create: true
	            }).execute({
	                Basket: Basket,
	                StoredBasket: StoredBasket
	            });

	            response.redirect(dw.web.URLUtils.https('COCustomer-Start'));
	            return;
	       	}
	        else if (ProcessResult.loginFailed)
	        {
		        var CalculateResult = Calculate();

		        showBasket({
	                Basket: CalculateResult.Basket
	            });
		        return;
	        }
	    }
	    else if (TriggeredAction.formId == 'logout')
	    {
	    	var LoginController = require('./Login');
	        LoginController.Logout();
	        return;
	    }
	    else if (TriggeredAction.formId == 'register')
	    {
	        // TODO what happens there?
	        // require registration?
	        var RegisterResult = Account.Register();

	        var CalculateResult = Calculate();

	        // TODO fix this
	        response.redirect(dw.web.URLUtils.https('Cart-Show'));
	        return;
	    }
	    else if (TriggeredAction.formId == 'unregistered')
	    {
	        COShipping.Start();
	        return;
	    }
	    else if (TriggeredAction.formId == 'updateCart')
	    {
	        updateCart(Basket);
	        showBasket({
                Basket: Basket
            });
	        return;
	    }
	}
	
	showBasket({
        Basket: Basket
    });
}


/**
 * Redirects the user to the last visited catalog URL as implemented in the custom script.
 */
function ContinueShopping()
{
    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile: 'cart/ContinueShopping.ds',
        Transactional: false
    }).execute();
    var Location = ScriptResult.Location;

    
    response.renderTemplate('util/redirect', {
    	Location: Location
    });
}

/**
 * Updates an existing product line item with a new product, new options, and/or a new quantity. params: just like
 * miniaddproduct i.e. pid, options, quantiy.
 */
function editLineItem()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    if (empty(Product))
    {
        var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
            ProductID: CurrentHttpParameterMap.pid.stringValue
        });
        if (GetProductResult.result == PIPELET_ERROR)
        {
        	return;
        }
        Product = GetProductResult.Product;
    }


    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
        Product: Product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;
    

    new dw.system.Pipelet('ReplaceLineItemProduct').execute({
        ProductLineItem: CurrentLineItem,
        NewProduct: Product,
        Quantity: CurrentHttpParameterMap.Quantity.doubleValue,
        ProductOptionModel: ProductOptionModel
    });

    
    if (Product.bundle)
    {
        replaceBundleLineItemProducts();
        return;
    }
}

/**
 * Determines some needed objects based on the current form values.
 */
function prepareView(args)
{
    var CurrentForms = session.forms;

    var Basket = args.Basket;
    if (Basket == null)
    {
    	return {};
    }

    // refresh shipments
    var form = require('./dw/form');
    form.updateFormWithObject(CurrentForms.cart.shipments, Basket.shipments);

    // refresh coupons
    form.updateFormWithObject(CurrentForms.cart.coupons, Basket.couponLineItems, true);

    
    var EnableCheckout = null;
    
    if (!(BasketStatus != null && BasketStatus.getStatus() == 1))
    {
        var CalculateResult = Calculate();

        var ScriptResult = new dw.system.Pipelet('Script', {
            ScriptFile: 'cart/ValidateCartForCheckout.ds',
            Transactional: false
        }).execute({
            Basket: Basket,
            ValidateTax: false
        });
        var BasketStatus = ScriptResult.BasketStatus;
        EnableCheckout = ScriptResult.EnableCheckout;
    }

    var fetchWishListResult = fetchWishList();
    
    return {
    	EnableCheckout: EnableCheckout,
    	WishList: fetchWishListResult.ProductList
    };
}

/**
 * By default, when a bundle is added to cart all its sub products gets added too, but if those products happens to be
 * variants then we have to manually replace the master products with the selected variants which gets passed in the
 * http params as childPids along with any options. Params: CurrentHttpParameterMap.childPids - comma separated list of
 * pids of the bundled products which are variations
 */
function replaceBundleLineItemProducts()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    if (empty(CurrentHttpParameterMap.childPids.stringValue))
    {
    	return;
    }

    var childPids = CurrentHttpParameterMap.childPids.stringValue.split(",");
    
    for each(var childPid in childPids)
	{
	    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
	        ProductID: childPid
	    });
	    if (GetProductResult.result == PIPELET_ERROR)
	    {
	    	continue;
	   	}
        var ChildProduct = GetProductResult.Product;

        
	    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
	        Product: ChildProduct
	    });
	    var ChildProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;

	    
	    var ScriptResult = new dw.system.Pipelet('Script', {
	        Transactional: false,
	        OnError: 'PIPELET_ERROR',
	        ScriptFile: 'cart/FindLineItem.ds'
	    }).execute({
	        pid: (ChildProduct.isVariant() ? ChildProduct.masterProduct.ID: ChildProduct.ID),
	        ProductLineItems: ProductLineItem.bundledProductLineItems
	    });
	    if (ScriptResult.result == PIPELET_ERROR)
	    {
	    	continue;
	   	}
        var FoundLineItem = ScriptResult.FoundLineItem;

        
	    if (empty(FoundLineItem))
	    {
	    	continue;
	    }

	    
	    new dw.system.Pipelet('ReplaceLineItemProduct').execute({
	        ProductLineItem: FoundLineItem,
	        NewProduct: ChildProduct
	    });
	}
}


/**
 * The cart page provides various actions to be performed, e.g. line item editing, coupon redemption etc.
 */
function MiniCart()
{
    var GetExistingBasketResult = GetExistingBasket();
    var Basket = (GetExistingBasketResult.error) ? null : GetExistingBasketResult.Basket;

    response.renderTemplate('checkout/cart/minicart', {
    	Basket: Basket
    });
}


/**
 * Adds multiple products to the basket. Uses multiple product IDs separated by comma.
 */
function addProductSetProducts()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var childPids = CurrentHttpParameterMap.childPids.stringValue.split(",");
    var childQtys = CurrentHttpParameterMap.childQtys.stringValue.split(",");
    var counter = 0;
    
    for each (var childPid in childPids)
    {
        var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
            ProductID: childPid
        });
        if (GetProductResult.result == PIPELET_ERROR)
        {
        	counter++;
        	continue;
        }
        var ChildProduct = Product;
    	
        if (ChildProduct.productSet)
        {
        	counter++;
        	continue;        	
        }

        
        var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
            Product: ChildProduct
        });
        var ChildProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;

        
        var AddProductToBasketResult = new dw.system.Pipelet('AddProductToBasket').execute({
            Basket: Basket,
            Product: ChildProduct,
            ProductOptionModel: ChildProductOptionModel,
            Quantity: parseInt(childQtys[counter]),
            Category: dw.catalog.CatalogMgr.getCategory(CurrentHttpParameterMap.cgid.value)
        });
    	counter++;
    }
}


/**
 * Adds the product with the given ID to the wish list.
 */
function AddToWishlist()
{
    var ProductID = request.httpParameterMap.pid.stringValue;
    
    var WishlistController = require('./Wishlist');

    if (!customer.authenticated)
    {
        // login via the wishlist login page, but return here
        WishlistController.requireLogin({
            TargetAction : 'Cart-AddToWishlist',
            TargetParameters: ['pid', ProductID]
        });
        return;
    }

    var AddProductResult = WishlistController.AddProduct();
    
    show({
        ProductAddedToWishlist: ProductID
    });
}


/**
 * Inserts the Wish List into the pipeline dictionary if the customer is authenticated.
 */
function fetchWishList()
{
    var WishList = null;

    if (customer.authenticated)
    {
        // TODO so who needs this at all?
        var wl = require('./lib/wishlist');
        WishList = wl.fetchWishList();
    }
    
    return {
        WishList: WishList
    };
}


/**
 * Determines an existing basket from the current session. If a basket wasn't found, the pipeline ends in a named end
 * node "error". This node can be used in other pipelines such as the checkout pipelines in order to access the basket.
 * This pipeline does not create a new basket. Calling pipelines are responsible to properly react on the "error" end
 * node.
 */
function GetExistingBasket()
{
    var GetBasketResult = new dw.system.Pipelet('GetBasket', {
        Create: false
    }).execute();
    if (GetBasketResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
   	}
    
    return {
        Basket : GetBasketResult.Basket,
        StoredBasket : GetBasketResult.StoredBasket
    };
}


/**
 * Determines an existing basket from the current session. If a basket wasn't found, a new basket is created. If a new
 * basket couldn't be created, the pipeline ends in a named end node "error". Calling pipelines are responsible to
 * properly react on the "error" end node.
 */
function GetBasket()
{
    var GetBasketResult = new dw.system.Pipelet('GetBasket', {
        Create: true
    }).execute();
    if (GetBasketResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
   	}
    
    return {
        Basket : GetBasketResult.Basket,
        StoredBasket : GetBasketResult.StoredBasket
    };
}


/**
 * Calculates an existing basket. Call this pipeline always if the changes to the basket content is made (e.g. addition
 * or removal of a product or gift certificate or setting of a shipping method).
 */
function Calculate()
{
    var BasketStatus = null;

    var GetExistingBasketResult = GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        return {
            error: true
        };
    }
    var Basket = GetExistingBasketResult.Basket;
    
    
    new dw.system.Pipelet('Script', {
        ScriptFile: 'cart/CalculateCart.ds',
        Transactional: true
    }).execute({
        Basket: Basket
    });

    return {
        Basket: Basket
    };
}
    
/**
 * Start the checkout process.
 */
function startCheckout()
{
    var CalculateResult = Calculate();
    var Basket = CalculateResult.Basket;
    
    
    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile: 'cart/ValidateCartForCheckout.ds',
        Transactional: false
    }).execute({
        Basket: Basket,
        ValidateTax: false
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
    }
    var BasketStatus = ScriptResult.BasketStatus;
    var EnableCheckout = ScriptResult.EnableCheckout;

    
    // TODO should this be a redirect?
    // or should we have one single controller method which controls the WHOLE checkout process?
    // this would ensure that no steps can be reached directly which are actually not accessible (yet)
    var COCustomerController = require('./COCustomer');
    COCustomerController.Start();
    
    return {};
}


/**
 * Add bonus product to cart.
 */
function AddBonusProduct()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    
    
    var txn = require('dw/system/Transaction');
    txn.begin();

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/ParseBonusProductsJSON.ds'
    }).execute();
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	txn.rollback();
    	
        response.renderJSON({
            success: false
        });
        return;
    }
    var Products = ScriptResult.Products;

    
    var GetBasketResult = GetBasket();
    var Basket = GetBasketResult.Basket;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/GetBonusDiscountLineItem.ds'
    }).execute({
        uuid: CurrentHttpParameterMap.bonusDiscountLineItemUUID.stringValue,
        BonusDiscountLineItems: Basket.bonusDiscountLineItems
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	txn.rollback();
    	
        response.renderJSON({
            success: false
        });
        return;
    }
    var BonusDiscountLineItem = ScriptResult.BonusDiscountLineItem;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/RemoveBonusDiscountLineItemProducts.ds'
    }).execute({
        bonusDiscountLineItem: BonusDiscountLineItem,
        Basket: Basket
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	txn.rollback();
    	
        response.renderJSON({
            success: false
        });
        return;
    }

    
	for each(var product in Products)
	{
	    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
	        ProductID: product.pid
	    });
	    if (GetProductResult.result == PIPELET_ERROR)
	    {
	    	txn.rollback();
	    	
	        response.renderJSON({
	            success: false
	        });
	        return;
	    }
	    var Product = GetProductResult.Product;
	
	    
	    var ScriptResult = new dw.system.Pipelet('Script', {
	        Transactional: false,
	        OnError: 'PIPELET_ERROR',
	        ScriptFile: 'cart/UpdateProductOptionSelections.ds',
	    }).execute({
	        SelectedOptions: new dw.util.ArrayList(product.options),
	        Product: Product
	    });
	    if (ScriptResult.result == PIPELET_ERROR)
	    {
	    	txn.rollback();
	    	
	        response.renderJSON({
	            success: false
	        });
	        return;
	    }
	    var ProductOptionModel = ScriptResult.ProductOptionModel;

	    
	    var AddBonusProductToBasketResult = new dw.system.Pipelet('AddBonusProductToBasket').execute({
	        Basket: Basket,
	        BonusDiscountLineItem: BonusDiscountLineItem,
	        Product: Product,
	        Quantity: parseInt(product.qty),
	        ProductOptionModel: ProductOptionModel
	    });
	    if (AddBonusProductToBasketResult.result == PIPELET_ERROR)
	    {
	    	txn.rollback();
	    	
	        response.renderJSON({
	            success: false
	        });
	        return;
	    }
	    var ProductLineItem = AddBonusProductToBasketResult.ProductLineItem;

	    
	    if (Product.bundle)
	    {
		    addBonusProductBundle();
	    }
	}

    var CalculateResult = Calculate();

    response.renderJSON({
        success: true
    });
    
    txn.commit();
}


/**
 * Add a sub product to the bonus product bundle.
 */
function addBonusProductBundle()
{
    var childPids = product.childPids.split(",");

	for each(var childPid in childPids)
	{
	    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
	        ProductID: childPid
	    });
	    if (GetProductResult.result == PIPELET_ERROR)
	    {
	    	continue;
	    }
	    var ChildProduct = GetProductResult.Product;

	    
	    var ScriptResult = new dw.system.Pipelet('Script', {
	        Transactional: false,
	        OnError: 'PIPELET_ERROR',
	        ScriptFile: 'cart/UpdateProductOptionSelections.ds'
	    }).execute({
	        SelectedOptions: new dw.util.ArrayList(product.options),
	        Product: ChildProduct,
	    });
	    if (ScriptResult.result == PIPELET_ERROR)
	    {
	    	continue;
	    }
	    var ProductOptionModel = ScriptResult.ProductOptionModel;

	    
	    var ScriptResult = new dw.system.Pipelet('Script', {
	        Transactional: false,
	        OnError: 'PIPELET_ERROR',
	        ScriptFile: 'cart/FindLineItem.ds'
	    }).execute({
	        pid: (ChildProduct.isVariant() ? ChildProduct.masterProduct.ID: ChildProduct.ID),
	        ProductLineItems: ProductLineItem.bundledProductLineItems
	    });
	    if (ScriptResult.result == PIPELET_ERROR)
	    {
	    	continue;
	    }
	    var FoundLineItem = ScriptResult.FoundLineItem;

	    
	    if (empty(FoundLineItem))
	    {
	    	continue;
	    }
	    
	
	    new dw.system.Pipelet('ReplaceLineItemProduct').execute({
	        ProductLineItem: FoundLineItem,
	        NewProduct: ChildProduct
	    });
	}
}


/**
 * When adding a new product to the cart check to see if it has triggered a new bonus discount line item.
 */
function newBonusDiscountLineItem(Basket, PreviousBonusDiscountLineItems)
{
    var BonusDiscountLineItems = Basket.getBonusDiscountLineItems();
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/CheckForNewBonusDiscountLineItem.ds'
    }).execute({
        NewBonusDiscountLineItems: BonusDiscountLineItems,
        PreviousBonusDiscountLineItems: PreviousBonusDiscountLineItems,
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	return null;
    }
    
    return {
    	BonusDiscountLineItem : ScriptResult.BonusDiscountLineItem
    };
}

    
function updateLineItem()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var GetBasketResult = new dw.system.Pipelet('GetBasket', {
        Create: false
    }).execute();
    if (GetBasketResult.result == PIPELET_ERROR)
    {
    	showCart();
    	return;
   	}
    var Basket = GetBasketResult.Basket;
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/FindLineItem.ds'
    }).execute({
        ProductLineItems: Basket.productLineItems,
        uuid: CurrentHttpParameterMap.uuid.stringValue,
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	showCart();
    	return;
    }
    var CurrentLineItem = FoundLineItem;

    
    var editLineItemResult = editLineItem();

    if (CurrentHttpParameterMap.format.stringValue.toLowerCase()=='ajax')
    {
        response.renderTemplate('checkout/cart/refreshcart', {
        });
        return;
    }

    var Location = dw.web.URLUtils.url('Cart-Show');
    response.renderTemplate('util/redirect', {
    	Location: Location
    });
}


function updateCart(Basket)
{
    new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/RemoveZeroQuantityLineItems.ds'
    }).execute({
        Basket: Basket,
        ShipmentsForm: session.forms.cart
    });

    
    var form = require('./dw/form');
    form.acceptForm(session.forms.cart.shipments);

    
    var CalculateResult = Calculate();

    checkInStoreProducts(CalculateResult.Basket);
}

/**
 * AddCoupon expects a CouponCode variable in the pdict
 */
function AddCoupon(CouponCode)
{
    if (empty(CouponCode))
    {
    	return;
    }
    
    var GetBasketResult = GetBasket();
    var Basket = GetBasketResult.Basket;

    
    var AddCouponToBasket2Result = new dw.system.Pipelet('AddCouponToBasket2').execute({
        Basket: Basket,
        CouponCode: CouponCode
    });

    // TODO any return needed?
    if (AddCouponToBasket2Result.result == PIPELET_ERROR)
    {
        if (empty(CouponCode))
        {
            var CouponError = 'COUPON_CODE_MISSING';
        }
        else
        {
            var CouponError = 'NO_ACTIVE_PROMOTION';
       	}
    }
    else
    {
    	var CouponStatus = AddCouponToBasket2Result.Status;
        var CalculateResult = Calculate();
	}
}

function AddCouponJson()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var CouponCode = CurrentHttpParameterMap.couponCode.stringValue;


    var AddCouponResult = AddCoupon();

    
    if (CurrentHttpParameterMap.format.stringValue != 'ajax')
    {
    	return;
    }
    

    var ResourceProperty = 'cart.' + CouponStatus.code;

    response.renderJSON({
    	status : CouponStatus.code,
        message : dw.web.Resource.msgf(ResourceProperty,'checkout', null, CouponCode),
  	    success : !CouponStatus.error,
   	    baskettotal : Basket.adjustedMerchandizeTotalGrossPrice.value,
   	    CouponCode : CouponCode
    });
}

function addItem()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    if (CurrentHttpParameterMap.plid.stringValue)
    {
        var ProductListController = require('./ProductList');
        var InitResult = ProductListController.Init({
            productListId: CurrentHttpParameterMap.plid.stringValue,
            listItemId: CurrentHttpParameterMap.itemid.stringValue
        });
        var ProductListItem = InitResult.ProductListItem;
        
        var GetBasketResult = GetBasket();
        var Basket = GetBasketResult.Basket;
        

        var AddProductToBasketResult = new dw.system.Pipelet('AddProductToBasket').execute({
            Basket: Basket,
            ProductOptionModel: ProductOptionModel,
            Quantity: CurrentHttpParameterMap.Quantity.doubleValue,
            Category: dw.catalog.CatalogMgr.getCategory(CurrentHttpParameterMap.cgid.value),
            ProductListItem: ProductListItem
        });
        if (AddProductToBasketResult.result == PIPELET_ERROR)
        {
        	return null;
       	}
        
        var ProductLineItem = AddProductToBasketResult.ProductLineItem;

        var CalculateResult = Calculate();
        
        return {
        	Basket: Basket
        };
    }
    else
    {
        if (!CurrentHttpParameterMap.pid.stringValue)
        {
        	return null;
        }
        
        var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
            ProductID: CurrentHttpParameterMap.pid.stringValue,
        });
        if (GetProductResult.result == PIPELET_ERROR)
        {
        	return null;
        }
        var Product = GetProductResult.Product;
        
    	
        var GetBasketResult = GetBasket();
        
        
        var Basket = GetBasketResult.Basket;
        var PreviousBonusDiscountLineItems = Basket.getBonusDiscountLineItems();

        if (Product.productSet)
        {
            addProductSetProducts();
        }
        else
        {
            var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
                Product: Product
            });
            var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;

            
            var AddProductToBasketResult = new dw.system.Pipelet('AddProductToBasket').execute({
                Basket: Basket,
                Product: Product,
                ProductOptionModel: ProductOptionModel,
                Quantity: CurrentHttpParameterMap.Quantity.doubleValue,
                Category: dw.catalog.CatalogMgr.getCategory(CurrentHttpParameterMap.cgid.value)
            });
            if (AddProductToBasketResult.result == PIPELET_ERROR)
            {
            	return;
            }
            var ProductLineItem = AddProductToBasketResult.ProductLineItem;

            if (Product.bundle)
            {
                replaceBundleLineItemProducts();
            }
       	}

        var CalculateResult = Calculate();
        newBonusDiscountLineItem(Basket, PreviousBonusDiscountLineItems);
        
        return {
        	Basket: Basket
        };
   	}
}

/**
 * This Pipeline will check the instore qty against the store inventory in the case that the pli's qtyt has been
 * updated.
 */
function checkInStoreProducts(basket)
{
    if (!dw.system.Site.getCurrent().getCustomPreferenceValue('enableStorePickUp'))
    {
    	return null;
    }

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/storepickup/CheckStoreInLineItem.ds'
    }).execute({
        Basket: basket
    });
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.AddProduct                      = g.post(AddProduct);
exports.Show                            = g.httpsGet(Show);
exports.SubmitForm                      = g.httpsPost(SubmitForm);
exports.ContinueShopping                = g.get(ContinueShopping);
exports.AddCouponJson                   = g.httpsGet(AddCouponJson);
exports.MiniCart                        = g.get(MiniCart);
exports.AddToWishlist                   = g.httpsGet(AddToWishlist);
exports.AddBonusProduct                 = g.post(AddBonusProduct);

/*
 * Local methods
 */
exports.AddCoupon           = AddCoupon;
exports.GetExistingBasket   = GetExistingBasket;
exports.GetBasket           = GetBasket;
exports.Calculate           = Calculate;
