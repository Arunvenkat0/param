var g = require('./dw/guard');

/* API Includes */
var Cart = require('~/cartridge/scripts/model/Cart');

/**
 * Multi Shipping Scenario
 * ---------------------------
 * This pipeline implements the logic for the multiple shipping scenario. It is responsible for dealing with more 
 * than one shipments, respectively multiple shipping addresses as well as multiple selected shipping methods.
 */

/**
 * Starting point for multi shipping scenario. Renders a page providing address selection for each product line item.
 */
function Start()
{
	var cart = Cart.get();

	if (!cart.object)
    {
	    require('./Cart').Show();
        return;
    }

    initSessionAddressBook(cart.object);
    separateQuantities(cart.object);

    initAddressForms({
        Basket: cart.object
    });
    
    var PrepareShipmentsResult = require('./COShipping').PrepareShipments();
    require('./Cart').Calculate();

	response.renderTemplate('checkout/shipping/multishipping/multishippingaddresses');
}

function MultiShippingAddresses()
{
    var CurrentForms = session.forms;

    
    // TODO this should end in a redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'save')
	    {
	        var handleAddressSelectionsResult = handleAddressSelections();
	        if (handleAddressSelectionsResult.error)
	        {
		        response.renderTemplate('checkout/shipping/multishipping/multishippingaddresses');
	            
	            CurrentForms.multishipping.addressSelection.fulfilled.value = true;

	            StartShipments();
	            return;
	        }
	    }
	}

	response.renderTemplate('checkout/shipping/multishipping/multishippingaddresses');
}


/**
 * The second step of multi shipping: renders a page with each shipment, providing a shipping method selection per shipment.
 */
function StartShipments()
{
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        CartController.Show();
        return;
    }
    var Basket = GetExistingBasketResult.Basket;

    
    var COShippingController = require('./COShipping');
    var PrepareShipmentsResult = COShippingController.PrepareShipments();
    

    initShipmentForms();


    var CalculateResult = CartController.Calculate();
    
    
    showMultiShipments();
}


function showMultiShipments()
{
    response.renderTemplate('checkout/shipping/multishipping/multishippingshipments');
}


function MultiShippingMethods()
{
    var CurrentForms = session.forms;

    
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'save')
	    {
	        var handleShippingSettingsResult = handleShippingSettings();
	        if (handleShippingSettingsResult.error)
	        {
	            showMultiShipments();
	            return;
	        }

	        /*
	         * Mark step as fulfilled.
	         */
	        CurrentForms.multishipping.shippingOptions.fulfilled.value = true;

	        var COBillingController = require('./COBilling');
	        COBillingController.Start();
	        return;
	    }
	}
	
	showMultiShipments();
}


/**
 * Initializes the forms for the multi address selection.
 */
function initAddressForms(args)
{
    var CurrentForms = session.forms;

    var Basket = args.Basket;
    
    
    /*
     * Set flag, that customer has entered the multi shipping scenerio.
     */
    CurrentForms.multishipping.entered.value = true;

    
    if (!CurrentForms.multishipping.addressSelection.fulfilled.value)
    {
        var form = require('./dw/form');
        form.clearFormElement(CurrentForms.multishipping.addressSelection);
        //form.updateFormWithObject(CurrentForms.multishipping.addressSelection.quantityLineItems, QuantityLineItems);
    }


	/*
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/multishipping/GetSessionAddresses.ds'
    }).execute({
        CBasket: Basket
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        Start();
        return;
    }
    var ShippingAddresses = ScriptResult.SessionAddresses;


    if (!empty(ShippingAddresses))
    {
        initShippingAddresses();
    }*/
}


/**
 * Initializes the shipping address list for each quantity line item.
 */
function initShippingAddresses()
{
    var CurrentForms = session.forms;

    
	for each(var quantityLineItem in CurrentForms.multishipping.addressSelection.quantityLineItems)
	{
	    var form = require('./dw/form');
	    form.setFormOptions(quantityLineItem.addressList, ShippingAddresses);
	}
}


/**
 * Stores session and customer addresses in sessionAddressBook attribute.
 */
function initSessionAddressBook(Basket)
{
    var CurrentCustomer = customer;
    
    new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/multishipping/InitSessionAddressBook.ds'
    }).execute({
        CBasket: Basket,
        CCustomer: CurrentCustomer
    });
}


/**
 * Initializes the forms for the multi shipment setting.
 */
function initShipmentForms()
{
    var CurrentForms = session.forms;

    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.multishipping.shippingOptions);
    form.updateFormWithObject(CurrentForms.multishipping.shippingOptions.shipments, Basket.shipments);

    initShippingMethods();
}


/**
 * Initializes the shipping method list for each shipment.
 */
function initShippingMethods()
{
    var CurrentForms = session.forms;

    
	for each(var ShipmentForm in CurrentForms.multishipping.shippingOptions.shipments)
	{
        var ShippingMethods = dw.order.ShippingMgr.getShipmentShippingModel(ShipmentForm.object).applicableShippingMethods;
    
        var form = require('./dw/form');
        form.setFormOptions(ShipmentForm.shippingMethodID, ShippingMethods);
    }
}


/**
 * Renders a form dialog to edit an address. The dialog is supposed to be opened by an Ajax request and ends 
 * in templates, which just trigger a certain JS event. The calling page of this dialog is responsible for 
 * handling these events.
 */
function EditAddresses()
{
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        CartController.Show();
        return;
    }
    var Basket = GetExistingBasketResult.Basket;

    
    showEdit({
        Basket: Basket
    });
}

function showEdit(args)
{
    var Basket = args.Basket;
    
    
    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.multishipping.editAddress);

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/multishipping/GetSessionAddresses.ds'
    }).execute({
        CBasket: Basket
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        Start();
        return;
    }
    var Addresses = ScriptResult.SessionAddresses;


    var form = require('./dw/form');
    form.setFormOptions(CurrentForms.multishipping.editAddress.addressList, Addresses);

    showEditAddresses();
}

function showEditAddresses()
{
    response.renderTemplate('checkout/shipping/multishipping/editaddresses');
}


function EditForm()
{
    var CurrentForms = session.forms;

    
    // TODO this should end with redirects
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'cancel')
	    {
	        Start();
	        return;
	    }
	    else if (TriggeredAction.formId == 'save')
	    {
	        var addEditAddressResult = addEditAddress();
	        if (addEditAddressResult.error)
	        {
	            showEditAddresses();
	            return;
	        }

	        Start();
	        return;
	    }
	    else if (TriggeredAction.formId == 'selectAddress')
	    {
	        if (CurrentForms.multishipping.editAddress.addressList.selectedOption == null)
	        {
	            showEdit();
	            return;
	        }

	        
	        var form = require('./dw/form');
	        form.updateFormWithObject(CurrentForms.multishipping.editAddress.addressFields, CurrentForms.multishipping.editAddress.addressList.selectedOptionObject);
	        form.updateFormWithObject(CurrentForms.multishipping.editAddress.addressFields.states, CurrentForms.multishipping.editAddress.addressList.selectedOptionObject);
	    }
	}
	
    showEditAddresses();
}


/**
 * Handles the address selection per quantity line item and derives possibly multiple shipments from it.
 */
function handleAddressSelections()
{
    var CurrentForms = session.forms;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/multishipping/MergeQuantities.ds'
    }).execute({
        QuantityLineItems: CurrentForms.multishipping.addressSelection.quantityLineItems,
        CBasket: Basket
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
    }

    
    var CartController = require('./Cart');
    var CalculateResult = CartController.Calculate();
}


/**
 * Handles the settings per shipment, like shipping method selection and gift options.
 */
function handleShippingSettings()
{
    var CurrentForms = session.forms;

    
	for each(var ShipmentForm in CurrentForms.multishipping.shippingOptions.shipments)
	{
        if (ShipmentForm.shippingMethodID.selectedOptionObject != null)
        {
            new dw.system.Pipelet('SetShippingMethod').execute({
                Shipment: ShipmentForm.object,
                ShippingMethod: ShipmentForm.shippingMethodID.selectedOptionObject
            });
        }
    
        var form = require('./dw/form');
        if (!form.updateObjectWithForm(ShipmentForm.object, ShipmentForm))
        {
            return {
                error: true
            };
        }
    }
}

	
/**
 * Creates for each quantity of ProductLineItems new QuantityLineItems helper objects.
 */
function separateQuantities(Basket)
{
	for each(var PLI in Basket.productLineItems)
	{
	    var ScriptResult = new dw.system.Pipelet('Script', {
	        Transactional: false,
	        OnError: 'PIPELET_ERROR',
	        ScriptFile: 'checkout/multishipping/SeperateQuantities.ds',
	    }).execute({
	        CBasket: Basket,
	        ProductLineItem: PLI
	        //QuantityLineItemsIn: QuantityLineItems
	    });
	    var QuantityLineItems = ScriptResult.QuantityLineItemsOut;
	}
}


function addEditAddress()
{
    var CurrentForms = session.forms;

    
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    var Basket = GetExistingBasketResult.Basket;

    
    var AddEditAddress = new Object();

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/multishipping/CreateSessionAddress.ds'
    }).execute();
    if (ScriptResult.result == PIPELET_ERROR)
    {
        // TODO AddEditAddress.success = false
        return {
            error: true
        };
    }
    var NewAddress = ScriptResult.Address;

    
    var form = require('./dw/form');
    if (!form.updateObjectWithForm(NewAddress, CurrentForms.multishipping.editAddress.addressFields))
    {
        // TODO AddEditAddress.success = false
        return {
            error: true
        };
    }

    
    if (!form.updateObjectWithForm(NewAddress, CurrentForms.multishipping.editAddress.addressFields.states))
    {
        // TODO AddEditAddress.success = false
        return {
            error: true
        };
    }

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/multishipping/AddAddressToSessionAddressBook.ds'
    }).execute({
        AddToAddressBook: CurrentForms.multishipping.editAddress.addToAddressBook.checked,
        CBasket: Basket,
        ReferenceAddress: CurrentForms.multishipping.editAddress.addressList.selectedOptionObject
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        // TODO AddEditAddress.success = false
        return {
            error: true
        };
    }
    var NewAddress = ScriptResult.FormAddress;
    var ShippingAddresses = ScriptResult.SessionAddresses;

    
    AddEditAddress.success = true;
    AddEditAddress.address = NewAddress;

    initShippingAddresses();
}


function AddEditAddressJSON()
{
    var addEditAddressResult = addEditAddress();

    response.renderJSON({
        address : addEditAddressResult.NewAddress,
        success : addEditAddressResult.success
    });
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Start                   = g.httpsGet(Start);
exports.StartShipments          = g.httpsGet(StartShipments);
exports.EditAddresses           = g.httpsGet(EditAddresses);
exports.AddEditAddressJSON      = g.httpsGet(AddEditAddressJSON);
exports.MultiShippingAddresses  = g.httpsPost(MultiShippingAddresses);
exports.MultiShippingMethods    = g.httpsPost(MultiShippingMethods);
exports.EditForm                = g.httpsPost(EditForm);
