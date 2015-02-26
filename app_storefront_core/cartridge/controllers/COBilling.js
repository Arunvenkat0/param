var g = require('./dw/guard');

/**
 * This pipeline implements the billing logic. It is used by both the single shipping and the multi shipping 
 * scenario and is responsible for providing the payment method selection as well as entering a billing address.
 */

/**
 * Starting point for billing. After a successful shipping setup both COShipping
 * and COShippingMultiple jump to this node.
 */
function Start()
{
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        CartController.Show();
        return;
    }

    var Basket = GetExistingBasketResult.Basket;
    
    
    initForms({
        Basket: Basket
    });
    
    start({
    	Basket: Basket
    });
}

function start(args)
{
    var Basket = args.Basket;
    
    
    var COShippingController = require('./COShipping');
    var PrepareShipmentsResult = COShippingController.PrepareShipments({
        Basket: Basket
    });

    /*
     * Clean shipments.
     */
    // TODO this gets the basket again and again
    var CartController = require('./Cart');
    var CalculateResult = CartController.Calculate();

    var web = require('./dw/web');
    web.updatePageMetaData("SiteGenesis Checkout");

    returnToForm({
    	Basket: args.Basket
    });
}

function returnToForm(args)
{
    var Basket = args.Basket;
    
    
    if (!empty(Basket.paymentInstrument) && Basket.paymentInstrument.paymentMethod == dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE)
    {
        var form = require('./dw/form');
        form.updateFormWithObject(CurrentForms.billing, {
            giftCertCode: Basket.paymentInstrument.giftCertificateCode
        });
    }
    
    response.renderTemplate('checkout/billing/billing', {
        Basket: Basket
    });
}

function Billing()
{
    var CurrentForms = session.forms;

    
	// TODO this should trigger a redirect?
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'applyCoupon')
	    {
	        var CouponCode = CurrentHttpParameterMap.couponCode.stringValue || CurrentHttpParameterMap.dwfrm_billing_couponCode.stringValue;

	        var CartController = require('./Cart');
	        var AddCouponResult = CartController.AddCoupon(CouponCode);

	        handleCoupon();
	        return;
	    }
	    else if (TriggeredAction.formId == 'creditCardSelect')
	    {
	        UpdateCreditCardSelection();
	        return;
	    }
	    else if (TriggeredAction.formId == 'paymentSelect')
	    {
	        UpdatePaymentMethodSelection();
	        return;
	    }
	    else if (TriggeredAction.formId == 'redeemGiftCert')
	    {
	        var GiftCertCode = CurrentForms.billing.giftCertCode.htmlValue;

	        redeemGiftCertificate(GiftCertCode);

	        returnToForm();
	        return;
	    }
	    else if (TriggeredAction.formId == 'save')
	    {
	        var CartController = require('./Cart');
	        var GetExistingBasketResult = CartController.GetExistingBasket();
	        var Basket = GetExistingBasketResult.Basket;
	        
	        
	        var resetPaymentFormsResult = resetPaymentForms();
	        if (resetPaymentFormsResult.error)
        	{
	        	returnToForm({
	        	    Basket: Basket
	        	});
        	}

	        var validateBillingResult = validateBilling();
	        if (validateBillingResult.error)
        	{
	        	returnToForm({
                    Basket: Basket
                });
        	}

	        /*
             * Performs validation steps, based upon the entered billing address
             * and address options.
             */
	        var handleBillingAddressResult = handleBillingAddress({
	            Basket: Basket
	        });
	        if (handleBillingAddressResult.error)
        	{
	        	returnToForm({
                    Basket: Basket
                });
        	}

	        /*
             * Performs payment method specific checks, such as credit card
             * verification.
             */
	        var HandlePaymentSelectionResult = HandlePaymentSelection({
	            Basket: Basket
	        });
	        if (HandlePaymentSelectionResult.error)
        	{
	        	returnToForm({
                    Basket: Basket
                });
        	}

	        saveAddress();

	        /*
             * Mark step as fulfilled.
             */
	        CurrentForms.billing.fulfilled.value = true;

	        /*
             * A successful billing page will jump to the next checkout step.
             */
	        var COSummaryController = require('./COSummary');
	        COSummaryController.Start();
	        return;
	    }
	    else if (TriggeredAction.formId == 'selectAddress')
	    {
	        UpdateAddressDetails();
	        return;
	    }
	}
	
	returnToForm();
}


function updateAddress(args)
{
    var Basket = args.Basket;
    
    
    initCreditCardList({
        Basket: Basket
    });
    
    start({
        Basket: Basket
    });
}

/**
 * Initializes all forms of the billing page including: - address form - email
 * address - coupon form
 */
function initForms(args)
{
    var CurrentForms = session.forms;
    var Basket = args.Basket;

    
    initAddressForm({
        Basket: Basket
    });

    initEmailAddress({
        Basket: Basket
    });

    var initCreditCardListResult = initCreditCardList({
        Basket: Basket
    });
    var ApplicablePaymentMethods = initCreditCardListResult.ApplicablePaymentMethods;
    
    var form = require('./dw/form');

    if (CurrentForms.billing.paymentMethods.valid)
    {
        initPaymentMethodList({
            ApplicablePaymentMethods: ApplicablePaymentMethods
        });
    }
    else
    {
        form.clearFormElement(CurrentForms.billing.paymentMethods);
    }

    form.clearFormElement(CurrentForms.billingcoupon);
    form.clearFormElement(CurrentForms.billinggiftcert);
}

/**
 * Initializes the address form: - if customer chose option "use as billing
 * address" on single shipping page the form is prepopulated with the shipping
 * address, otherwise - prepopulate with already set billing address, otherwise -
 * prepopulate with default address of authenticated customer
 */
function initAddressForm(args)
{
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    var Basket = args.Basket;
    
    
    if (CurrentForms.singleshipping.shippingAddress.useAsBillingAddress.value == true)
    {
        new dw.system.Pipelet('Script', {
            Transactional: false,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/CopyAddressFormFields.ds'
        }).execute({
            BillingAddressForm: CurrentForms.billing.billingAddress.addressFields,
            ShippingAddressForm: CurrentForms.singleshipping.shippingAddress.addressFields
        });
    }
    else if (Basket.billingAddress != null)
    {
        var form = require('./dw/form');
        form.updateFormWithObject(CurrentForms.billing.billingAddress.addressFields, Basket.billingAddress);
        form.updateFormWithObject(CurrentForms.billing.billingAddress.addressFields.states, Basket.billingAddress);
    }
    else if (CurrentCustomer.authenticated && CurrentCustomer.profile.addressBook.preferredAddress != null)
    {
        var form = require('./dw/form');
        form.updateFormWithObject(CurrentForms.billing.billingAddress.addressFields, CurrentCustomer.profile.addressBook.preferredAddress);
        form.updateFormWithObject(CurrentForms.billing.billingAddress.addressFields.states, CurrentCustomer.profile.addressBook.preferredAddress);
    }
}


/**
 * initializes the email address form field: - if there's already a customer
 * email set at the basket this email address is taken, otherwise - if the
 * current customer is authenticated the email address of the customer's profile
 * is taken
 */
function initEmailAddress(args)
{
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    var Basket = args.Basket;
    
    
    if (Basket.customerEmail != null)
    {
        CurrentForms.billing.billingAddress.email.emailAddress.value = Basket.customerEmail;
    }
    else if (CurrentCustomer.authenticated && CurrentCustomer.profile.email != null)
    {
    	CurrentForms.billing.billingAddress.email.emailAddress.value = CurrentCustomer.profile.email;
    }
}


/**
 * Initializes the credit card list by determining the saved customer payment
 * instruments of type credit card.
 */
function initCreditCardList(args)
{
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;
    var Basket = args.Basket;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'Exception',
        ScriptFile: 'checkout/GetNonGiftCertificatePaymentAmount.ds'
    }).execute({
        Basket: Basket
    });
    var PaymentAmount = ScriptResult.Amount;

    
    var CountryCode = CurrentForms.billing.billingAddress.addressFields.country.value;
    var ApplicablePaymentMethods = dw.order.PaymentMgr.getApplicablePaymentMethods(CurrentCustomer,CountryCode,PaymentAmount);
    var ApplicablePaymentCards = dw.order.PaymentMgr.getPaymentMethod(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).getApplicablePaymentCards(CurrentCustomer,CountryCode,PaymentAmount);

    
    var form = require('./dw/form');
    form.setFormOptions(CurrentForms.billing.paymentMethods.creditCard.type, ApplicablePaymentCards);
    

    var ApplicableCreditCards = null;
    
    if (CurrentCustomer.authenticated)
    {
        var GetCustomerPaymentInstrumentsResult = new dw.system.Pipelet('GetCustomerPaymentInstruments').execute({
            PaymentMethod: dw.order.PaymentInstrument.METHOD_CREDIT_CARD,
            Customer: CurrentCustomer
        });
        var AvailableCreditCards = GetCustomerPaymentInstrumentsResult.PaymentInstruments;

        
        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: false,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/ValidatePaymentInstruments.ds'
        }).execute({
            CountryCode: CountryCode,
            Customer: CurrentCustomer,
            PaymentAmount: PaymentAmount,
            PaymentInstruments: AvailableCreditCards
        });
        if (ScriptResult.result == PIPELET_NEXT)
        {
            ApplicableCreditCards = ScriptResult.ValidPaymentInstruments;
        }
    }
    
    return {
        ApplicablePaymentMethods: ApplicablePaymentMethods,
        ApplicableCreditCards: ApplicableCreditCards        
    };
}


function initPaymentMethodList(args)
{
    var CurrentForms = session.forms;

    var ApplicablePaymentMethods = args.ApplicablePaymentMethods;
    
    
    var form = require('./dw/form');
    form.setFormOptions(CurrentForms.billing.paymentMethods.selectedPaymentMethodID, ApplicablePaymentMethods);
}


/**
 * Adjust gift certificate redemptions as after applying coupon(s), order total
 * is changed. AdjustGiftCertificate pipeline removes and then adds currently
 * added gift certificates to reflect order total changes.
 */
function adjustGiftCertificates()
{
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
    	return;
    }
    var Basket = GetExistingBasketResult.Basket;
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/GetGiftCertIdList.ds'
    }).execute({
        Basket: Basket
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	return;
    }
    var gcIdList = ScriptResult.gcIdList;

    
	for each(var gcID in gcIdList)
	{
	    var ScriptResult = new dw.system.Pipelet('Script', {
	        Transactional: true,
	        OnError: 'PIPELET_ERROR',
	        ScriptFile: 'checkout/RemoveGiftCertificatePaymentInstrument.ds'
	    }).execute({
	        Basket: Basket,
	        GiftCertificateID: gcID
	    });
	    var GiftCertRemoveStatus = ScriptResult.Status;
	}


    var gcID = null;

	for each(var gcID in gcIdList)
	{
	    var ScriptResult = new dw.system.Pipelet('Script', {
	        ScriptFile: 'checkout/CreateGiftCertificatePaymentInstrument.ds',
	        Transactional: true,
	        OnError: 'PIPELET_ERROR'
	    }).execute({
	        Basket: Basket,
	        GiftCertificateID: gcID
	    });
	    var NewGCPaymentInstrument = ScriptResult.PaymentInstrument;
	    var GiftCertStatus = ScriptResult.Status;
	}
}


/**
 * Attempts to redeem a gift certificate. If the gift certificate wasn't
 * redeemed, the form field is invalidated with the appropriate error message.
 * If the gift certificate was redeemed, the form gets cleared. This start node
 * is called by an Ajax request and generates a JSON response.
 */
function redeemGiftCertificate(giftCertCode)
{
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        return {
            code : 'BASKET_NOT_FOUND',
            error : true
        };
    }
    var Basket = GetExistingBasketResult.Basket;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile: 'checkout/CreateGiftCertificatePaymentInstrument.ds',
        Transactional: true,
        OnError: 'PIPELET_ERROR'
    }).execute({
        Basket: Basket,
        GiftCertificateID: giftCertCode
    });
    if (ScriptResult.result == PIPELET_NEXT)
    {
        var NewGCPaymentInstrument = ScriptResult.PaymentInstrument;

        var CalculateResult = CartController.Calculate();
    }

    return ScriptResult.Status;
}


function RedeemGiftCertificateJson()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var giftCertCode = CurrentHttpParameterMap.giftCertCode.stringValue;


    var giftCertStatus = redeemGiftCertificate(giftCertCode);

    
    if (CurrentHttpParameterMap.format.stringValue != 'ajax')
    {
    	// TODO empty response?
        // TODO we could also build an ajax guard?
    	return;
    }

 
    var ResourceProperty = 'billing.' + giftCertStatus.code;

    response.renderJSON({
        status : giftCertStatus.code,
        success : !giftCertStatus.error,
        message : dw.web.Resource.msgf(ResourceProperty,'checkout', null, giftCertCode),
        code : giftCertCode
    });
}


/**
 * Attempts to remove a gift certificate from the basket payment instruments and
 * generates a JSON response with a status. This start node is called by an Ajax
 * request.
 */
function RemoveGiftCertificate()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    if (!empty(CurrentHttpParameterMap.giftCertificateID.stringValue))
    {
        var CartController = require('./Cart');
        var GetExistingBasketResult = CartController.GetExistingBasket();
        if (GetExistingBasketResult.error)
        {
        	var Basket = GetExistingBasketResult.Basket;
        	
            var ScriptResult = new dw.system.Pipelet('Script', {
                Transactional: true,
                OnError: 'PIPELET_ERROR',
                ScriptFile: 'checkout/RemoveGiftCertificatePaymentInstrument.ds'
            }).execute({
                Basket: Basket,
                GiftCertificateID: CurrentHttpParameterMap.giftCertificateID.stringValue
            });
            if (ScriptResult.result == PIPELET_NEXT)
            {
                var GiftCertRemoveStatus = ScriptResult.Status;

                var CartController = require('./Cart');
                var CalculateResult = CartController.Calculate();
            }
        }
    }

    Start();
}


/**
 * Renders the order summary including mini cart order totals and shipment
 * summary. This is used to update the order totals in the UI based on the
 * recalculated basket after a coupon code has been applied.
 */
function UpdateSummary()
{
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    var Basket = GetExistingBasketResult.Basket;

    var CalculateResult = CartController.Calculate();


    response.renderTemplate('checkout/minisummary', {
    	checkoutstep: 4,
    	Basket: Basket
    });
}


function UpdateAddressDetails()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
    	Show();
    	return;
    }
    var Basket = GetExistingBasketResult.Basket;
    

    var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
        AddressID: empty(CurrentHttpParameterMap.addressID.value)?CurrentHttpParameterMap.dwfrm_billing_addressList.value:CurrentHttpParameterMap.addressID.value,
        Customer: CurrentCustomer
    });
    var Address = GetCustomerAddressResult.Address;

    
    var form = require('./dw/form');
    form.updateFormWithObject(CurrentForms.billing.billingAddress.addressFields, Address);
    form.updateFormWithObject(CurrentForms.billing.billingAddress.addressFields.states, Address);

    
    if (Basket.billingAddress != null)
    {
        new dw.system.Pipelet('Script', {
            Transactional: true,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/UpdateBillingAddress.ds'
        }).execute({
            AddressForm: CurrentForms.billing.billingAddress,
            BillingAddress: Basket.billingAddress
        });
    }


    updateAddress({
        Basket: Basket
    });
}


function handleCoupon()
{
    if (empty(CouponError))
    {
        /*
         * Adjust gift certificate redemptions as after applying coupon(s),
         * order total is changed. AdjustGiftCertificate pipeline removes and
         * then adds currently added gift certificates to reflect order total
         * changes.
         */
        adjustGiftCertificates();
    }

    returnToForm();
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
    form.clearFormElement(CurrentForms.billingaddress);

    
    var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
        AddressID: CurrentHttpParameterMap.addressID.stringValue,
        Customer: CurrentCustomer
    });
    if (GetCustomerAddressResult.result == PIPELET_NEXT)
    {
        var BillingAddress = GetCustomerAddressResult.Address;

        
        var form = require('./dw/form');
        form.updateFormWithObject(CurrentForms.billingaddress, BillingAddress);
        form.updateFormWithObject(CurrentForms.billingaddress.states, BillingAddress);
    }

    showAddress();
}


function showAddress()
{
	response.renderTemplate('checkout/billing/billingaddressdetails');
}

function EditBillingAddress()
{
    var CurrentForms = session.forms;

    
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'apply')
	    {
	        var form = require('./dw/form');
	        if (!form.updateObjectWithForm(BillingAddress, CurrentForms.billingaddress))
	        {
		        showAddress();
		        return;
	        }

	        // TODO remove this
	        response.renderTemplate('components/dialog/dialogapply', {
	        });
	        return;
	    }
	    else if (TriggeredAction.formId == 'remove')
	    {
	        var RemoveCustomerAddressResult = new dw.system.Pipelet('RemoveCustomerAddress').execute({
	            Address: CurrentForms.billingaddress.object,
	            Customer: CurrentCustomer
	        });
	        if (RemoveCustomerAddressResult.result == PIPELET_ERROR)
	        {
		        showAddress();
		        return;
	        }

	        // TODO remove this
	        response.renderTemplate('components/dialog/dialogdelete', {
	        });
	        return;
	    }
	}
	
	showAddress();
}

    
/**
 * Handles the selection of the payment method and performs payment method
 * specific validation and verification upon the entered form fields. If the
 * order total is 0 (in case user has product promotions etc.) then we do not
 * need a valid payment method.
 */
function HandlePaymentSelection(args)
{
    var CurrentForms = session.forms;
    var Basket = args.Basket;
    
    
    var MissingPaymentProcessor = null;

    if (empty(CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value))
    {
        if (Basket.getTotalGrossPrice() > 0)
        {
        	return {
        	    error: true
        	};
        }
        else
        {
        	return {
        	    ok: true
        	};
        }
    }


    /*
     * skip the payment handling if the whole payment was made using gift cert
     */
    if (CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value.equals(dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE))
    {
    	return {
            ok: true
        };
    }


    if (empty(dw.order.PaymentMgr.getPaymentMethod(CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value).paymentProcessor))
    {
        return {
            error: true,
            MissingPaymentProcessor: true
        };
    }

    /*
     * The Handle Pipeline is being dynamically called based on a concatenation
     * of the current Payment-Processor and a constant suffix(-Handle).
     * 
     * For example: Credit Cards processor ID = BASIC_CREDIT Handle Pipeline =
     * BASIC_CREDIT-Handle
     * 
     * The handle pipeline is responsible for payment provider / payment method
     * specific form validation and payment instrument creation.
     */    
    var HandlePipeline = dw.order.PaymentMgr.getPaymentMethod(CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value).paymentProcessor.ID;

    // TODO support lookup from other cartridges in the site
    var PaymentProcessor = require('./lib/payment/' + HandlePipeline);
    
    var Result = PaymentProcessor.Handle({
        Basket: Basket
    });
    return Result;
}


/**
 * Returns information of a gift certificate including its balance as JSON
 * response. Required to check the remaining balance.
 */
function GetGiftCertificateBalance()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    
    var GetGiftCertificateResult = new dw.system.Pipelet('GetGiftCertificate').execute({
        GiftCertificateID: CurrentHttpParameterMap.giftCertificateID.value
    });
    var GiftCertificate = GetGiftCertificateResult.GiftCertificate;

    // TODO render directly as JSON
    response.renderTemplate('checkout/giftcert/giftcertdetailsjson', {
    	GiftCertificate: GiftCertificate
    });
}


/**
 * Selects a customer credit card and returns the details of the credit card as
 * JSON response. Required to fill credit card form with details of selected
 * credit card.
 */
function SelectCreditCard()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    var Basket = GetExistingBasketResult.Basket;
    

    var initCreditCardListResult = initCreditCardList({
        Basket: Basket
    });
    var ApplicableCreditCards = initCreditCardListResult.ApplicableCreditCards;
    

    var SelectedCreditCard = null;
    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/GetCustomerCreditCard.ds'
    }).execute({
        CreditCardUUID: CurrentHttpParameterMap.creditCardUUID.value,
        CustomerPaymentInstruments: ApplicableCreditCards
    });
    if (ScriptResult.result == PIPELET_NEXT)
    {
        SelectedCreditCard = ScriptResult.CreditCardPaymentInstrument;

        CurrentForms.billing.paymentMethods.creditCard.number.value = SelectedCreditCard.creditCardNumber;
    }

    response.renderTemplate('checkout/billing/creditcardjson', {
    	SelectedCreditCard: SelectedCreditCard
    });
}


function UpdateCreditCardSelection()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    var Basket = GetExistingBasketResult.Basket;

    
    var initCreditCardListResult = initCreditCardList({
        Basket: Basket
    });

    var UUID = !empty(CurrentHttpParameterMap.creditCardUUID.value)?CurrentHttpParameterMap.creditCardUUID.value:CurrentHttpParameterMap.dwfrm_billing_paymentMethods_creditCardList.stringValue;

    var SelectedCreditCard = null;
    
    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/GetCustomerCreditCard.ds'
    }).execute({
        CreditCardUUID: UUID,
        CustomerPaymentInstruments: ApplicableCreditCards
    });
    if (ScriptResult.result == PIPELET_NEXT)
    {
        SelectedCreditCard = ScriptResult.CreditCardPaymentInstrument;
      
        CurrentForms.billing.paymentMethods.creditCard.number.value = SelectedCreditCard.creditCardNumber;
    }


    if (empty(SelectedCreditCard))
    {
        Start();
        return;
    }
    

    var form = require('./dw/form');
    form.updateFormWithObject(CurrentForms.billing.paymentMethods.creditCard, SelectedCreditCard);

    
    updateAddress({
        Basket: Basket
    });
}


function UpdatePaymentMethodSelection()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    var selectedPaymentID = CurrentHttpParameterMap.dwfrm_billing_paymentMethods_selectedPaymentMethodID.stringValue;

    Start();
}


function handleBillingAddress(args)
{
    var CurrentForms = session.forms;
    var Basket = args.Basket;
    

    obtainBillingAddress({
        Basket: Basket
    });

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/UpdateBillingAddress.ds'
    }).execute({
        AddressForm: CurrentForms.billing.billingAddress,
        BillingAddress: Basket.billingAddress,
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
    }
    

    var txn = require('dw/system/Transaction');
    txn.begin();
   
    Basket.customerEmail = CurrentForms.billing.billingAddress.email.emailAddress.value;
    
    txn.commit();
    
    return {};
}



/**
 * Reset the forms of all payment methods, except the one of the current
 * selected payment method.
 */
function resetPaymentForms()
{
    var CurrentForms = session.forms;
    

    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    var Basket = GetExistingBasketResult.Basket;
    
    var form = require('./dw/form');


    if (CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value.equals("PayPal"))
    {
        form.clearFormElement(CurrentForms.billing.paymentMethods.creditCard);
        form.clearFormElement(CurrentForms.billing.paymentMethods.bml);

        
        new dw.system.Pipelet('RemoveBasketPaymentInstrument').execute({
            PaymentInstruments: Basket.getPaymentInstruments( dw.order.PaymentInstrument.METHOD_CREDIT_CARD)
        });

        
        new dw.system.Pipelet('RemoveBasketPaymentInstrument').execute({
            PaymentInstruments: Basket.getPaymentInstruments( dw.order.PaymentInstrument.METHOD_BML)
        });
    }
    else if (CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value.equals(dw.order.PaymentInstrument.METHOD_CREDIT_CARD))
    {
        form.clearFormElement(CurrentForms.billing.paymentMethods.bml);

        new dw.system.Pipelet('RemoveBasketPaymentInstrument').execute({
            PaymentInstruments: Basket.getPaymentInstruments( dw.order.PaymentInstrument.METHOD_BML)
        });

        
        new dw.system.Pipelet('RemoveBasketPaymentInstrument').execute({
            PaymentInstruments: Basket.getPaymentInstruments( "PayPal")
        });
    }
    else if (CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value.equals(dw.order.PaymentInstrument.METHOD_BML))
    {
        form.clearFormElement(CurrentForms.billing.paymentMethods.creditCard);

        if (!CurrentForms.billing.paymentMethods.bml.ssn.valid)
        {
        	return {
        	    error: true
        	};
        }

        new dw.system.Pipelet('RemoveBasketPaymentInstrument').execute({
            PaymentInstruments: Basket.getPaymentInstruments( dw.order.PaymentInstrument.METHOD_CREDIT_CARD)
        });

        
        new dw.system.Pipelet('RemoveBasketPaymentInstrument').execute({
            PaymentInstruments: Basket.getPaymentInstruments( "PayPal")
        });
    }
    
    return {};
}


/**
 * This branch is called whenever payment condition on the billing page change,
 * e.g. billing address country code, gift certificate redemption, coupon
 * redemption. The applicable payment methods/cards are recalculated. Invalid
 * payment instruments are removed.
 */
// TODO seems to be never called?
function RefreshPaymentMethods()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    
    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    var Basket = GetExistingBasketResult.Basket;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'Exception',
        ScriptFile: 'checkout/GetNonGiftCertificatePaymentAmount.ds'
    }).execute({
        Basket: Basket
    });
    var PaymentAmount = ScriptResult.Amount;
    
    

    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.billing.paymentMethods.creditCard);
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/ValidatePaymentInstruments.ds'
    }).execute({
        CountryCode: CurrentHttpParameterMap.countryCode.value,
        Customer: CurrentCustomer,
        PaymentAmount: PaymentAmount,
        PaymentInstruments: Basket.paymentInstruments
    });
    var InvalidPaymentInstruments = ScriptResult.InvalidPaymentInstruments;
    var ValidPaymentInstruments = ScriptResult.ValidPaymentInstruments;
    if (ScriptResult.result == PIPELET_ERROR)
    {
        new dw.system.Pipelet('RemoveBasketPaymentInstrument').execute({
            PaymentInstruments: InvalidPaymentInstruments
        });

        CurrentForms.billing.fulfilled.value = false;
    }


    updatePaymentForms();

    var ApplicableCreditCards = null;
    
    if (CurrentCustomer.authenticated)
    {
        var GetCustomerPaymentInstrumentsResult = new dw.system.Pipelet('GetCustomerPaymentInstruments').execute({
            PaymentMethod: dw.order.PaymentInstrument.METHOD_CREDIT_CARD,
            Customer: CurrentCustomer
        });
        var AvailableCreditCards = GetCustomerPaymentInstrumentsResult.PaymentInstruments;
        

        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: false,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/ValidatePaymentInstruments.ds'
        }).execute({
            CountryCode: CurrentHttpParameterMap.countryCode.value,
            Customer: CurrentCustomer,
            PaymentAmount: PaymentAmount,
            PaymentInstruments: AvailableCreditCards,
            ValidPaymentInstruments: ApplicableCreditCards
        });
        ApplicableCreditCards = ScriptResult.ValidPaymentInstruments;
    }


    response.renderTemplate('checkout/billing/paymentmethods', {
    	ApplicableCreditCards: ApplicableCreditCards
    });
}


function updatePaymentForms()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;
    
    CurrentForms.billing.billingAddress.addressFields.country.value = CurrentHttpParameterMap.countryCode.value;

    
    var form = require('./dw/form');
    form.setFormOptions(CurrentForms.billing.paymentMethods.selectedPaymentMethodID,
            dw.order.PaymentMgr.getApplicablePaymentMethods(CurrentCustomer,CurrentHttpParameterMap.countryCode.value,PaymentAmount));
    form.setFormOptions(CurrentForms.billing.paymentMethods.creditCard.type,
            dw.order.PaymentMgr.getPaymentMethod(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).getApplicablePaymentCards(CurrentCustomer,CurrentHttpParameterMap.countryCode.value,PaymentAmount));

    
	for each(var ValidPaymentInstrument in ValidPaymentInstruments)
	{
	    if (ValidPaymentInstrument.paymentMethod == dw.order.PaymentInstrument.METHOD_CREDIT_CARD)
	    {
	    	// TODO performance of long expressions
		    CurrentForms.billing.paymentMethods.creditCard.number.value = ValidPaymentInstrument.creditCardNumber;
		    CurrentForms.billing.paymentMethods.creditCard.owner.value = ValidPaymentInstrument.creditCardHolder;
		    CurrentForms.billing.paymentMethods.creditCard.type.value = ValidPaymentInstrument.creditCardType;
		    CurrentForms.billing.paymentMethods.creditCard.month.value = ValidPaymentInstrument.creditCardExpirationMonth;
		    CurrentForms.billing.paymentMethods.creditCard.year.value = ValidPaymentInstrument.creditCardExpirationYear;
	    }
	}
}


/**
 * This branch is used to revalidate existing payment instruments in later
 * checkout steps.
 */
function ValidatePayment(args)
{
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;
    var Basket = args.Basket;
    

    if (CurrentForms.billing.fulfilled.value)
    {
        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: false,
            OnError: 'Exception',
            ScriptFile: 'checkout/GetNonGiftCertificatePaymentAmount.ds'
        }).execute({
            Basket: Basket
        });
        var PaymentAmount = ScriptResult.Amount;

        
        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: false,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/ValidatePaymentInstruments.ds'
        }).execute({
            CountryCode: CurrentForms.billing.billingAddress.addressFields.country.value,
            Customer: CurrentCustomer,
            PaymentAmount: PaymentAmount,
            PaymentInstruments: Basket.paymentInstruments,
        });
        if (ScriptResult.result == PIPELET_NEXT)
        {
            var ScriptResult = new dw.system.Pipelet('Script', {
                ScriptFile: 'checkout/CalculatePaymentTransactionTotals.ds',
                Transactional: true,
                OnError: 'PIPELET_ERROR'
            }).execute({
                Basket: Basket
            });
            if (ScriptResult.result == PIPELET_NEXT)
            {
            	// ok
            	return {};
            }
        }
    }

    var PaymentStatus = new dw.system.Status(dw.system.Status.ERROR);
    CurrentForms.billing.fulfilled.value = false;

    return {
        error: true
    };
}


/**
 * Attempts to save the used credit card in the customer payment instruments.
 * The logic replaces an old saved credit card with the same masked credit card
 * number of the same card type with the new credit card. This ensures creating
 * only unique cards as well as replacing expired cards.
 */
function SaveCreditCard()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    
    if (!(CurrentCustomer.authenticated && CurrentForms.billing.paymentMethods.creditCard.saveCard.value))
    {
        // TODO what to return?
    	return;
    }

    var GetCustomerPaymentInstrumentsResult = new dw.system.Pipelet('GetCustomerPaymentInstruments').execute({
        PaymentMethod: dw.order.PaymentInstrument.METHOD_CREDIT_CARD,
        Customer: CurrentCustomer
    });
    var CreditCards = GetCustomerPaymentInstrumentsResult.PaymentInstruments;
    

    var CreateCustomerPaymentInstrumentResult = new dw.system.Pipelet('CreateCustomerPaymentInstrument').execute({
        PaymentMethod: dw.order.PaymentInstrument.METHOD_CREDIT_CARD,
        Customer: CurrentCustomer
    });
    var NewCreditCard = CreateCustomerPaymentInstrumentResult.PaymentInstrument;
    

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/SaveCustomerCreditCard.ds'
    }).execute({
        PaymentInstrument: NewCreditCard,
        CreditCardFormFields: CurrentForms.billing.paymentMethods.creditCard
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
    }

    
	for each(var creditcard in CreditCards)
	{
	    if (creditcard.maskedCreditCardNumber == NewCreditCard.maskedCreditCardNumber && creditcard.creditCardType == NewCreditCard.creditCardType)
	    {
	        new dw.system.Pipelet('RemoveCustomerPaymentInstrument').execute({
	            PaymentInstrument: creditcard
	        });
	    }
	}

	return {
	    ok: true
	};
}


/**
 * Checks if the basket has already a billing address set and creates one, if
 * not.
 */
function obtainBillingAddress(args)
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;
    var Basket = args.Basket;

    if (Basket.billingAddress == null)
    {
        var CreateBillingAddressResult = new dw.system.Pipelet('CreateBillingAddress').execute({
            Basket: Basket
        });
    }
}


/**
 * Attempts to save the used billing address in the customer address book.
 */
function saveAddress()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;
    var CurrentCustomer = customer;

    
    if (CurrentCustomer.authenticated && CurrentForms.billing.billingAddress.addToAddressBook.value)
    {
        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: true,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'checkout/AddAddressToAddressBook.ds'
        }).execute({
            Profile: CurrentCustomer.profile,
            OrderAddress: Basket.billingAddress
        });
        if (ScriptResult.result == PIPELET_ERROR)
        {
        	return {
        	    error: true
        	};
        }
    }
    
    return {
        ok: true
    };
}


function validateBilling()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    if (!CurrentForms.billing.billingAddress.valid)
    {
    	return {
    	    error: true
    	};
    }

    if (!empty(CurrentHttpParameterMap.noPaymentNeeded.value))
    {
    	return {};
    }

    if (!empty(CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value) && CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value.equals(dw.order.PaymentInstrument.METHOD_CREDIT_CARD))
    {
        if (!CurrentForms.billing.valid)
        {
        	return {
                error: true
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
// TODO called with GET and POST
exports.Start                           = g.https(Start);
exports.RedeemGiftCertificateJson       = g.httpsGet(RedeemGiftCertificateJson);
exports.RemoveGiftCertificate           = g.httpsGet(RemoveGiftCertificate);
exports.UpdateSummary                   = g.httpsGet(UpdateSummary);
exports.UpdateAddressDetails            = g.httpsGet(UpdateAddressDetails);
exports.EditAddress                     = g.httpsGet(EditAddress);
exports.GetGiftCertificateBalance       = g.httpsGet(GetGiftCertificateBalance);
exports.SelectCreditCard                = g.httpsGet(SelectCreditCard);
exports.UpdateCreditCardSelection       = g.httpsGet(UpdateCreditCardSelection);
exports.UpdatePaymentMethodSelection    = g.httpsGet(UpdatePaymentMethodSelection);

// form handlers
// TODO called using both POST and GET
exports.Billing                         = g.https(Billing);
exports.EditBillingAddress              = g.httpsPost(EditBillingAddress);

/*
 * Local methods
 */
exports.SaveCreditCard = SaveCreditCard;
exports.ValidatePayment = ValidatePayment;
exports.HandlePaymentSelection = HandlePaymentSelection;
