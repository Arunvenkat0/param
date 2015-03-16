var g = require('./dw/guard');

/**
 * Sets the store for s given line item (requires rich_UI cartrdige)
 */
function SetStore()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
    	CartController.Show();
    	return;
    }
    
    var Basket = GetExistingBasketResult.Basket;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/storepickup/SetStoreInLineItem.ds'
    }).execute({
        Basket: Basket,
        LineItemUUID: CurrentHttpParameterMap.plid.stringValue,
        StoreId: CurrentHttpParameterMap.storeid.stringValue,
        StorePickup: CurrentHttpParameterMap.storepickup.stringValue
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        var ErrorCode = ScriptResult.ErrorCode;

        response.renderJSON({
            success: false,
        	ErrorCode: ErrorCode
        });
        return;
    }


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/RemoveEmptyShipments.ds'
    }).execute({
        Basket: Basket
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        response.renderJSON({
            success: false
        });
        return;
    }


    // TODO bug in original pipeline?
    if (empty(session.custom.storeId) && !empty(CurrentHttpParameterMap.storeid))
    {
        session.custom.storeId = CurrentHttpParameterMap.storeid.value;
    }

    
    response.renderJSON({
        success: true
    });
}


/**
 * These pipelines are used when the UI cartridge is not in the cartridge path.
 */
function ShowSelectedStoreCore()
{
    session.custom.storeId = request.httpParameterMap.storeId.value;
    
    if ((session.custom.zipcode != null) && (session.custom.storeId != null))
    {
        response.renderTemplate('storelocator/storepickup/coreshowselectedstore');
        return;
    }
    
    showSetStore();
}


function showSetStore()
{
    if (session.custom.zipcode != null)
    {
        // TODO Stores and storeAvailabilityMap expected?
        response.renderTemplate('storelocator/storepickup/coresetstore', {
        });
        return;
    }

    showZipCode();
}


function showZipCode()
{
    response.renderTemplate('storelocator/storepickup/corezipcode', {
    });
}


function ShowAvailableStores()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    session.custom.zipcode = request.httpParameterMap.zipCode.value;
    
    var LookupByZipCodeResult = lookupByZipCode();
    var Stores = LookupByZipCodeResult.Stores;
    

    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
        ProductID: CurrentHttpParameterMap.pid.stringValue
    });
    var Product = GetProductResult.Product;
    if (GetProductResult.result == PIPELET_ERROR)
    {
        var GetProductFromLineItemResult = GetProductFromLineItem();
        Product = GetProductFromLineItemResult.Product;
    }


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'storelocator/storepickup/InventoryLookup.ds'
    }).execute({
        stores: Stores,
        product: Product
    });

    var storeAvailabilityMap = ScriptResult.storeAvailability;
    
    // TODO what is done with it?
    
    showSetStore();
}


function CartSetZipCodeCore()
{
    if (session.custom.zipcode != null)
    {
    	ShowAvailableStores();
    }
    else
    {
    	SetZipCodeCore();
    }
}


function SetZipCodeCore()
{
    showZipCode();
}


function SetStoreCore()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
	{
        CartController.Show();
        return;
	}


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/storepickup/SetStoreInLineItem.ds'
    }).execute({
        Basket: Basket,
        LineItemUUID: CurrentHttpParameterMap.plid.stringValue,
        StoreId: CurrentHttpParameterMap.storeid.stringValue,
        StorePickup: CurrentHttpParameterMap.storepickup.stringValue
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        var ErrorCode = ScriptResult.ErrorCode;

        CartController.Show();
        return;
    }


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/RemoveEmptyShipments.ds'
    }).execute({
        Basket: Basket
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        CartController.Show();
        return;
    }

    CartController.Show();
}


/**
 * Gets a list of stores with the given product, or product line item's
 * availibity to sell (requires rich_UI cartridge), if the storeID is not set it
 * will be set within the session object.
 * 
 * Sample URL to call ....Stores-Inventory?pid=2239622&zipCode=01803
 */
function Inventory()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    
    var LookupByZipCodeResult = lookupByZipCode();
    var Stores = LookupByZipCodeResult.Stores;

    var PLI = null;
    

    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
        ProductID: request.httpParameterMap.pid.stringValue
    });
    var Product = GetProductResult.Product;
    if (GetProductResult.result == PIPELET_ERROR)
    {
        var GetProductFromLineItemResult = getProductFromLineItem();
        Product = GetProductFromLineItemResult.Product;
        PLI = GetProductFromLineItemResult.PLI;
    }


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'storelocator/storepickup/InventoryLookup.ds'
    }).execute({
        stores: Stores,
        product: Product,
        pid: request.httpParameterMap.pid.stringValue,
        pli: PLI
    });
    var storeAvailabilityMap = ScriptResult.storeAvailability;

    
    // create JSON representation
    var stores = [];

    for (var i = 0,len = Stores.length; i < len; i++)
    {
        var store = Stores[i];
        
        // this may need to be changed to ("inventoryListId" in store.custom) ?
        // store.custom.inventoryListId : "";
        var inventoryListId = store.custom.inventoryListId || "";
        var inventoryList = dw.catalog.ProductInventoryMgr.getInventoryList(inventoryListId);
        var inventoryRec = inventoryList ? inventoryList.getRecord(Product.ID) : null;
        
        if (i > 9)
        {
            break;
        }
        
        if (storeAvailabilityMap.get(store.ID) == null)
        {
            continue;
        }

        stores.push({
            storeId : store.ID,
            status: storeAvailabilityMap.get(store.ID),
            statusclass : storeAvailabilityMap.get(store.ID) == Resource.msg('cart.store.availableinstore','storepickup',null) ? 'store-in-stock' : 'store-error',
            quantity: inventoryRec ? inventoryRec.ATS.value : 0,
            address1: store.address1,
            city: store.city,
            stateCode: store.stateCode,
            postalCode: store.postalCode
        });
    }

    response.renderJSON(stores);
}

/**
 * Gets/Sets the preferred store for the session object
 */
function SetPreferredStore()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    session.custom.storeId = CurrentHttpParameterMap.storeId.value;
    
    response.renderJSON([{
        storeId : session.custom.storeId
    }]);
}


function GetPreferredStore()
{
    response.renderJSON([{
        storeId : session.custom.storeId
    }]);
}

/**
 * Gets/Sets the users zip code for the session object
 */
function SetZipCode()
{
    session.custom.zipcode = request.httpParameterMap.zipCode.value;

    response.renderJSON([{
        zip : session.custom.zipcode
    }]);
}

function GetZipCode()
{
    response.renderJSON([{
        zip : session.custom.zipcode
    }]);
}

/*
 * Private helpers
 */

/**
 * Looks up stores based on the zipcode given and the site prefernces that refer
 * the the radius and units of distance
 */
function lookupByZipCode()
{
    var getNearestStoresResult = new dw.system.Pipelet('GetNearestStores', {
        DistanceUnit: 'mi',
    }).execute({
        PostalCode: request.httpParameterMap.zipCode.value,
        CountryCode: dw.system.Site.getCurrent().getCustomPreferenceValue('countryCode').value,
        DistanceUnit: dw.system.Site.getCurrent().getCustomPreferenceValue('storeLookupUnit').value,
        MaxDistance: new Number(dw.system.Site.getCurrent().getCustomPreferenceValue('storeLookupMaxDistance').value)
    });
    var nearestStores = getNearestStoresResult.Stores;

    session.custom.zipcode = request.httpParameterMap.zipCode.value;
    
    var stores = nearestStores.keySet();
    var storesCount = nearestStores.size();

    return {
        Stores: stores,
        StoresCount: storesCount
    };
}

/**
 * Assumes that the pid refers to a product line item instead of a product
 * object for determining products availability.
 */
function getProductFromLineItem()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        return {};
    }
    
    var Basket = GetExistingBasketResult.Basket;

	for (var i = 0; i < Basket.productLineItems.length; i++) {
		var LineItem = Basket.productLineItems[i];

        if (LineItem.UUID == CurrentHttpParameterMap.pid.stringValue)
        {
            return {
                Product: LineItem.product,
                PLI: LineItem
            };
        }
    }

    return {};
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.SetStore                = g.get(SetStore);
exports.ShowSelectedStoreCore   = g.get(ShowSelectedStoreCore);
exports.ShowAvailableStores     = g.get(ShowAvailableStores);
exports.CartSetZipCodeCore      = g.get(CartSetZipCodeCore);
exports.SetZipCodeCore          = g.get(SetZipCodeCore);
exports.SetStoreCore            = g.get(SetStoreCore);
exports.Inventory               = g.get(Inventory);
exports.SetPreferredStore       = g.get(SetPreferredStore);
exports.GetPreferredStore       = g.get(GetPreferredStore);
exports.SetZipCode              = g.get(SetZipCode);
exports.GetZipCode              = g.get(GetZipCode);
