var g = require('./dw/guard');

/* API Includes */
var Cart = require('~/cartridge/scripts/model/Cart');

/**
 * Single Shipping Scenario
 * -----------------------------
 * This pipeline implements the logic for the default (single) shipping scenario. It is responsible for dealing with one 
 * shipment only, respectively one shipping addresses as well as one shipping method.
 */

/**
 * Starting point for single shipping scenario
 */
function Start() {
    var cart = Cart.get();

    if (!cart.object) {
        require('./Cart').Show();
        return;
    }

    /*
     * Redirect to multi shipping scenario if more than one physical shipment is
     * contained in the basket.
     */
    var requiresMultiShippingResult = requiresMultiShipping({
        Basket : cart.object
    });

    if (requiresMultiShippingResult.yes) {
        require('./COShippingMultiple').Start();
        return;
    }

    initForms({
        Basket : cart.object
    });

    /*
     * Clean shipments.
     */
    var PrepareShipmentsResult = PrepareShipments({
        Basket : cart.object
    });

    cart.calculate();

    /*
     * Go to billing step, if we have no product line items, but only gift
     * certificates in the basket. Shipping step is not required.
     */
    if (cart.getProductLineItems().size() == 0) {
        require('./COBilling').Start();
        return;
    }

    showSingleShipping({
        Basket         : cart.object,
        HomeDeliveries : PrepareShipmentsResult.HomeDeliveries
    });
}


function showSingleShipping(args)
{
    var web = require('./dw/web');
    web.updatePageMetaData("SiteGenesis Checkout");

    response.renderTemplate('checkout/shipping/singleshipping', args);
}


function SingleShipping()
{
    var CurrentForms = session.forms;

	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'save')
	    {
	        // this is a new request, so we have to resolve the context again
	        var CartController = require('./Cart');
	        var GetExistingBasketResult = CartController.GetExistingBasket();
	        if (GetExistingBasketResult.error)
	        {
	            CartController.Show();
	            return;
	        }
	        var Basket = GetExistingBasketResult.Basket;

	        var handleShippingSettingsResult = handleShippingSettings({
	            Basket: Basket
	        });
	        if (handleShippingSettingsResult.error)
	        {
	            showSingleShipping();
	            return;
	        }

	        saveAddress();

	        updateInStoreMessage();

	        /*
             * Mark step as fulfilled.
             */
	        CurrentForms.singleshipping.fulfilled.value = true;

	        var COBillingController = require('./COBilling');
	        COBillingController.Start();
	        return;
	    }
	    else if (TriggeredAction.formId == 'selectAddress')
	    {
	        UpdateAddressDetails();
	        return;
	    }
	    else if (TriggeredAction.formId == 'shipToMultiple')
	    {
	        var COShippingMultipleController = require('./COShippingMultiple');
	        COShippingMultipleController.Start();
	        return;
	    }
	}
	
	showSingleShipping();
}

/**
 * Initializes the address and shipping method form: - prepopulates form with
 * shipping address of default shipment if address exists, otherwise -
 * preselects shipping method in list if set at shipment
 */
function initForms(args)
{
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    var Basket = args.Basket;
    
    
    if (Basket.defaultShipment.shippingAddress != null)
    {
        var form = require('./dw/form');
        form.updateFormWithObject(CurrentForms.singleshipping.shippingAddress.addressFields, Basket.defaultShipment.shippingAddress);
        form.updateFormWithObject(CurrentForms.singleshipping.shippingAddress.addressFields.states, Basket.defaultShipment.shippingAddress);
        form.updateFormWithObject(CurrentForms.singleshipping.shippingAddress, Basket.defaultShipment);
    }
    else
    {
        if (CurrentCustomer.authenticated && CurrentCustomer.registered && !empty(CurrentCustomer.addressBook.preferredAddress))
        {
            var form = require('./dw/form');
            form.updateFormWithObject(CurrentForms.singleshipping.shippingAddress.addressFields, CurrentCustomer.addressBook.preferredAddress);
            form.updateFormWithObject(CurrentForms.singleshipping.shippingAddress.addressFields.states, CurrentCustomer.addressBook.preferredAddress);
        }
    }


    CurrentForms.singleshipping.shippingAddress.shippingMethodID.value = Basket.defaultShipment.shippingMethodID;

    return {};
}


/**
 * Select a shipping method for the default shipment. Sets the shipping method
 * and returns the result as JSON response.
 */
function SelectShippingMethod()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        response.renderTemplate('checkout/shipping/selectshippingmethodjson', {
        });
        return;
    }
    var Basket = GetExistingBasketResult.Basket;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/GetApplicableShippingMethods.ds'
    }).execute({
        Basket: Basket,
        City: CurrentHttpParameterMap.city.stringValue,
        Country: CurrentHttpParameterMap.countryCode.stringValue,
        PostalCode: CurrentHttpParameterMap.postalCode.stringValue,
        State: CurrentHttpParameterMap.stateCode.stringValue,
        Address1: CurrentHttpParameterMap.address1.stringValue,
        Address2: CurrentHttpParameterMap.address2.stringValue
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('checkout/shipping/selectshippingmethodjson', {
            Basket: Basket
        });
        return;
    }
    var ApplicableShippingMethods = ScriptResult.ShippingMethods;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/UpdateShipmentShippingMethod.ds'
    }).execute({
        ShippingMethodID: CurrentHttpParameterMap.shippingMethodID.stringValue,
        Shipment: Basket.defaultShipment,
        ShippingMethods: ApplicableShippingMethods
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('checkout/shipping/selectshippingmethodjson', {
            Basket: Basket
        });
        return;
    }


    var CalculateResult = CartController.Calculate();
    

    response.renderTemplate('checkout/shipping/selectshippingmethodjson', {
        Basket: Basket
    });
}

/**
 * Determine the list of applicable shipping methods for the default shipment of
 * the current basket. The applicable shipping methods are based on the
 * merchandise in the cart and the address parameters included in the request
 * (if any). Change the shipping method of this shipment if the current method
 * is no longer applicable. Pre-calculate the shipping cost for each applicable
 * shipping method by simulating the shipping selection i.e. explicitly add each
 * shipping method and then calculate cart (to get cost and
 * discounts/promotions). The simulation is done so that shipping cost along
 * with discounts and promotions can be shown to the user before making a
 * selection.
 */
function UpdateShippingMethodList()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        // TODO don't mix process and view pipelines
        // TODO this should end with a template
        return;
    }
    var Basket = GetExistingBasketResult.Basket;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/GetApplicableShippingMethods.ds'
    }).execute({
        Basket: Basket,
        City: CurrentHttpParameterMap.city.stringValue,
        Country: CurrentHttpParameterMap.countryCode.stringValue,
        PostalCode: CurrentHttpParameterMap.postalCode.stringValue,
        State: CurrentHttpParameterMap.stateCode.stringValue,
        Address1: CurrentHttpParameterMap.address1.stringValue,
        Address2: CurrentHttpParameterMap.address2.stringValue,
    });
    var ApplicableShippingMethods = ScriptResult.ShippingMethods;

    
    var ShippingCosts = new dw.util.HashMap();
    var CurrentShippingMethod = Basket.defaultShipment.getShippingMethod() || dw.order.ShippingMgr.getDefaultShippingMethod();

    /*
     * Transaction controls are for fine tuning the performance of the data base
     * interactions when calculating shipping methods
     */
    var txn = require('dw/system/Transaction');
    txn.begin();
    
	for each(var Method in ApplicableShippingMethods)
	{
        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: true,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/UpdateShipmentShippingMethod.ds'
        }).execute({
            ShippingMethodID: Method.ID,
            Shipment: Basket.defaultShipment,
            ShippingMethod: Method,
            ShippingMethods: ApplicableShippingMethods
        });
        if (ScriptResult.result == PIPELET_ERROR)
        {
            continue;
        }

        
        var CalculateResult = CartController.Calculate();
        

        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: true,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/PreCalculateShipping.ds'
        }).execute({
            Basket: Basket,
            Method: Method
        });
        if (ScriptResult.result == PIPELET_ERROR)
        {
            continue;
        }
        var ShippingCost = ScriptResult.ShippingCost;

        
        ShippingCosts.put(Method.ID, ShippingCost);
    }
	
	// TODO what the heck?
	txn.rollback();


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/UpdateShipmentShippingMethod.ds'
    }).execute({
        ShippingMethodID: CurrentShippingMethod.ID,
        Shipment: Basket.defaultShipment,
        ShippingMethod: CurrentShippingMethod,
        ShippingMethods: ApplicableShippingMethods
    });
    if (ScriptResult.result != PIPELET_ERROR)
    {
        var CartController = require('./Cart');
        var CalculateResult = CartController.Calculate();
    }
    

    CurrentForms.singleshipping.shippingAddress.shippingMethodID.value = Basket.defaultShipment.shippingMethodID;

    response.renderTemplate('checkout/shipping/shippingmethods', {
        Basket: Basket,
        ApplicableShippingMethods: ApplicableShippingMethods,
        ShippingCosts: ShippingCosts
    });
}


/**
 * Determine the list of applicable shipping methods for the default shipment of
 * the current customer's basket and return the response as a JSON array. The
 * applicable shipping methods are based on the merchandise in the cart and any
 * address parameters included in the request parameters.
 */
function GetApplicableShippingMethodsJSON()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    var Basket = GetExistingBasketResult.Basket;
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/GetApplicableShippingMethods.ds'
    }).execute({
        Basket: Basket,
        City: CurrentHttpParameterMap.city.stringValue,
        Country: CurrentHttpParameterMap.countryCode.stringValue,
        PostalCode: CurrentHttpParameterMap.postalCode.stringValue,
        State: CurrentHttpParameterMap.stateCode.stringValue,
        Address1: CurrentHttpParameterMap.address1.stringValue,
        Address2: CurrentHttpParameterMap.address2.stringValue
    });
    var ApplicableShippingMethods = ScriptResult.ShippingMethods;

    
    response.renderTemplate('checkout/shipping/shippingmethodsjson', {
        ApplicableShippingMethods: ApplicableShippingMethods
    });
}


/**
 * Handles the selected shipping address and shipping method: - copies the
 * address details and gift options to the basket's default shipment - set the
 * selected shipping method at the default shipment
 */
function handleShippingSettings(args)
{
    var CurrentForms = session.forms;

    var Basket = args.Basket;
    
    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/CreateShipmentShippingAddress.ds'
    }).execute({
        AddressForm: CurrentForms.singleshipping.shippingAddress,
        Shipment: Basket.defaultShipment,
        GiftOptionsForm: CurrentForms.singleshipping.shippingAddress,
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
    }

    
    new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/UpdateShipmentShippingMethod.ds'
    }).execute({
        ShippingMethodID: CurrentForms.singleshipping.shippingAddress.shippingMethodID.value,
        Shipment: Basket.defaultShipment
    });

    
    var CartController = require('./Cart');
    var CalculateResult = CartController.Calculate();
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'cart/ValidateCartForCheckout.ds'
    }).execute({
        Basket: Basket,
        BasketStatus: BasketStatus,
        ValidateTax: true,
        EnableCheckout: EnableCheckout
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        CartController.Show();
        return;
    }
    var BasketStatus = ScriptResult.BasketStatus;
    var EnableCheckout = ScriptResult.EnableCheckout;
    
    
    return {
        next: true
    };
}


/**
 * Prepares shipments by separating all gift certificate line items from product
 * line items and creating one shipment per gift certificate to purchase. As
 * second step empty shipments are removed. This start node can be called by any
 * checkout step to clean existing shipments according to these conditions.
 */
function PrepareShipments(args)
{
    var Basket = args.Basket;
    
    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/UpdateGiftCertificateShipments.ds'
    }).execute({
        Basket: Basket
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
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
        return {
            error: true
        };
    }

    var inStoreFormInitResult = inStoreFormInit({
        Basket: Basket
    });
    return inStoreFormInitResult;
}


/**
 * Renders a form dialog to edit an address. The dialog is supposed to be opened
 * by an Ajax request and ends in templates, which just trigger a certain JS
 * event. The calling page of this dialog is responsible for handling these
 * events.
 */
function EditAddress()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;
    
    
    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.shippingaddress);
    

    var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
        AddressID: CurrentHttpParameterMap.addressID.stringValue,
        Address: ShippingAddress,
        Customer: CurrentCustomer
    });
    if (GetCustomerAddressResult.result == PIPELET_ERROR)
    {
        showEditAddressDetails();
    }
    var ShippingAddress = GetCustomerAddressResult.Address;

    
    var form = require('./dw/form');
    form.updateFormWithObject(CurrentForms.shippingaddress, ShippingAddress);
    form.updateFormWithObject(CurrentForms.shippingaddress.states, ShippingAddress);


    showEditAddressDetails();
}


function showEditAddressDetails()
{
    response.renderTemplate('checkout/shipping/shippingaddressdetails');
}


function EditShippingAddress()
{
    var CurrentForms = session.forms;

    
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'apply')
	    {
	        var form = require('./dw/form');
	        if (!form.updateObjectWithForm(ShippingAddress, CurrentForms.shippingaddress))
	        {
	            showEditAddressDetails();
	            return;
	        }
	        
	        
	        if (!form.updateObjectWithForm(ShippingAddress, CurrentForms.shippingaddress.states))
	        {
	            showEditAddressDetails();
	            return;
	        }


	        response.renderTemplate('components/dialog/dialogapply', {
	        });
	        return;
	    }
	    else if (TriggeredAction.formId == 'remove')
	    {
	        var RemoveCustomerAddressResult = new dw.system.Pipelet('RemoveCustomerAddress').execute({
	            Address: CurrentForms.shippingaddress.object,
	            Customer: CurrentCustomer
	        });
	        if (RemoveCustomerAddressResult.result == PIPELET_ERROR)
	        {
	            showEditAddressDetails();
	            return;
	        }

	        
	        response.renderTemplate('components/dialog/dialogdelete', {
	        });
	        return;
	    }
	}
	
	showEditAddressDetails();
}



/**
 * Attempts to save the used shipping address in the customer address book.
 */
function saveAddress()
{
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    
    if (CurrentCustomer.authenticated && CurrentForms.singleshipping.shippingAddress.addToAddressBook.value)
    {
        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: true,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/AddAddressToAddressBook.ds'
        }).execute({
            Profile: CurrentCustomer.profile,
            OrderAddress: Basket.defaultShipment.shippingAddress
        });
        if (ScriptResult.result == PIPELET_ERROR)
        {
            return {
                error: true
            };
        }
    }
}


/**
 * Checks if the basket requires a multi shipping checkout by determining the
 * physical shipments of the basket. If more than one physical shipment is
 * contained in the basket a multi shipping checkout is required. The node ends
 * on named end nodes "yes" and "no" in order to communicates back to the
 * calling node.
 */
function requiresMultiShipping(args)
{
    var Basket = args.Basket;
    
    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/GetPhysicalShipments.ds'
    }).execute({
        Basket: Basket
    });
    var PhysicalShipments = ScriptResult.Shipments;

    
    if (!empty(PhysicalShipments) && PhysicalShipments.size() > 1 && dw.system.Site.getCurrent().getCustomPreferenceValue('enableMultiShipping'))
    {
        return {
            yes: true
        };
    }

    return {
        no: true
    };
}


function UpdateAddressDetails()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        CartController.Show();
        return;
    }
    var Basket = GetExistingBasketResult.Basket;


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/addressbook/GetAddressCustomer.ds'
    }).execute({
        AddressId: empty(CurrentHttpParameterMap.addressID.value)?CurrentHttpParameterMap.dwfrm_singleshipping_addressList.value:CurrentHttpParameterMap.addressID.value,
        CurrentCustomer: CurrentCustomer
    });
    var LookupCustomer = ScriptResult.Customer;
    var addressId = ScriptResult.LookupId;

    
    var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
        AddressID: addressId,
        Customer: LookupCustomer
    });
    var Address = GetCustomerAddressResult.Address;

    
    var form = require('./dw/form');
    form.updateFormWithObject(CurrentForms.singleshipping.shippingAddress.addressFields, Address);
    form.updateFormWithObject(CurrentForms.singleshipping.shippingAddress.addressFields.states, Address);

    
    if (Basket.defaultShipment.shippingAddress != null)
    {
        new dw.system.Pipelet('Script', {
            Transactional: true,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/CreateShipmentShippingAddress.ds'
        }).execute({
            AddressForm: CurrentForms.singleshipping.shippingAddress,
            Shipment: Basket.defaultShipment,
            GiftOptionsForm: CurrentForms.singleshipping.shippingAddress
        });
    }

    Start();
}


/**
 * Binds the store message from the user to the shipment.
 */
function updateInStoreMessage()
{
    var CurrentForms = session.forms;

    
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableStorePickUp'))
    {
        var form = require('./dw/form');
        if (!form.updateObjectWithForm(Basket.shipments, CurrentForms.singleshipping.inStoreShipments.shipments))
        {
            var CartController = require('./Cart');
            CartController.Show();
            return;
        }
    }
}


/**
 * Used to initialize the single shipping form with instore pick up shipments
 */
function inStoreFormInit(args)
{
    var CurrentForms = session.forms;
    
    var Basket = args.Basket;

    var HomeDeliveries = false;
    
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableStorePickUp'))
    {
        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: true,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/storepickup/InStoreShipments.ds'
        }).execute({
            Basket: Basket
        });
        if (ScriptResult.result == PIPELET_ERROR)
        {
            // TODO either return something - or render something!
            var CartController = require('./Cart');
            CartController.Show();
            return {
                error: true
            };
        }
        HomeDeliveries = ScriptResult.homedeliveries;


        var form = require('./dw/form');
        form.clearFormElement(CurrentForms.singleshipping.inStoreShipments.shipments);
        form.updateFormWithObject(CurrentForms.singleshipping.inStoreShipments.shipments, Basket.shipments);
    }
    else
    {
        HomeDeliveries = true;
    }
    
    return {
        HomeDeliveries: HomeDeliveries
    };
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
// TODO called with GET and POST
exports.Start                               = g.https(Start);
exports.SelectShippingMethod                = g.httpsGet(SelectShippingMethod);
exports.UpdateShippingMethodList            = g.httpsGet(UpdateShippingMethodList);
exports.GetApplicableShippingMethodsJSON    = g.httpsGet(GetApplicableShippingMethodsJSON);
exports.EditAddress                         = g.httpsGet(EditAddress);
exports.UpdateAddressDetails                = g.httpsGet(UpdateAddressDetails);
exports.SingleShipping                      = g.httpsPost(SingleShipping);
exports.EditShippingAddress                 = g.httpsPost(EditShippingAddress);

/*
 * Local methods
 */
exports.PrepareShipments    = PrepareShipments;
