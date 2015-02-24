var g = require('./dw/guard');

/**
 * This pipeline is responsible to create an order from the current basket. It's a pure processing pipeline and does no page 
 * rendering. The pipeline is used by the checkout and is called upon the triggered place order action. 
 * It contains the actual logic to authorize the payment and create the order. The pipeline communicates the result 
 * of the order creation process by named end nodes and uses a status object PlaceOrderError to set proper error states. 
 * The calling pipeline is responsible to react on these end nodes and to evaluate the error status.
 */

/**
 * Responsible for payment handling. This pipeline calls the specific
 * authorization pipelines for each individual payment type. It ends on an named
 * "error" end node if either any of the authorizations failed or a payment
 * instrument is of an unknown payment method. If a payment method has no
 * payment processor assigned, the payment is deemed as authorized.
 */
function HandlePayments(args)
{
    var Order = args.Order;
    

    if (Order.getTotalNetPrice() != 0.00)
    {
        return {};
    }

    if (Order.paymentInstruments.length != 0)
    {
        return {
            missingPaymentInfo: true
        };
    }

	for each(var PaymentInstrument in Order.paymentInstruments)
	{
	    if (dw.order.PaymentMgr.getPaymentMethod(PaymentInstrument.paymentMethod).paymentProcessor == null)
	    {
	        var txn = require('dw/system/Transaction');
	        txn.begin();
	        
	        PaymentInstrument.paymentTransaction.transactionID = Order.orderNo;
	        
	        txn.commit();
	    }
	    else
	    {
	        /*
             * An Authorization Pipeline is being dynamically called based on a
             * concatenation of the current Payment-Processor and a constant
             * suffix (-Authorize). For example: Credit Cards processor ID =
             * BASIC_CREDIT Authorization Pipeline = BASIC_CREDIT-Authorize
             * 
             * The authorization pipeline must end in a named "error" end node
             * to communicate any authorization error back to this pipeline.
             * Additionally the authorization pipeline may put a
             * dw.system.Status object into the pipeline dictonary under key
             * PlaceOrderError, which contains provider specific error messages.
             */
	        var AuthorizationPipeline = dw.order.PaymentMgr.getPaymentMethod(PaymentInstrument.paymentMethod).paymentProcessor.ID;

	        // dynamic call node to authorization pipeline
	        // TODO support global lookup of controller from site cartridge list
	        var PaymentProcessor = require('./lib/payment/' + AuthorizationPipeline);
	        var AuthorizationResult = PaymentProcessor.Authorize();
	        
	        if (AuthorizationResult.not_supported || AuthorizationResult.error)
	        {
	            return {
	                error: true
	            };
	        }
	    }
	}
	
	return {};
}

/**
 * The entry point for the order creation. The start node needs to be private
 * since it is supposed to be called by pipelines only.
 */
function Start()
{
    var CurrentForms = session.forms;

    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        CartController.Show();
        return {};
    }
    var Basket = GetExistingBasketResult.Basket;
    
    
    /*
     * Clean shipments.
     */
    var COShippingController = require('./COShipping');
    var PrepareShipmentsResult = COShippingController.PrepareShipments({
        Basket: Basket
    });

    
    /*
     * Make sure there are valid shipping address, accounting for gift
     * certificate that would not have one.
     */
    if (Basket.productLineItems.size() > 0)
    {
        if (Basket.defaultShipment.shippingAddress == null)
        {
            COShippingController.Start();
            return {};
        }
    }

    /*
     * Make sure, the billing step has been fulfilled, otherwise restart
     * checkout.
     */
    if (!CurrentForms.billing.fulfilled.value)
    {
        var COCustomerController = require('./COCustomer');
        COCustomerController.Start();
        return {};
    }

    var CalculateResult = CartController.Calculate();
    

    var COBillingController = require('./COBilling');
    var ValidatePaymentResult = COBillingController.ValidatePayment({
        Basket: Basket
    });
    if (ValidatePaymentResult.error)
    {
        COBillingController.Start();
        return {};
    }
    

    /*
     * Validate the cart against availability and price calculation.
     */
    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile: 'cart/ValidateCartForCheckout.ds',
        Transactional: false
    }).execute({
        Basket: Basket,
        ValidateTax: true
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        CartController.Show();
        return {};
    }
    var BasketStatus = ScriptResult.BasketStatus;
    var EnableCheckout = ScriptResult.EnableCheckout;

    
    /*
     * Recalculate the payments. If there is only gift certificates, make sure
     * it covers the order total, if not back to billing page.
     */
    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile: 'checkout/CalculatePaymentTransactionTotals.ds',
        Transactional: true,
        OnError: 'PIPELET_ERROR'
    }).execute({
        Basket: Basket
    });
    var PaymentStatus = ScriptResult.PaymentStatus;
    if (ScriptResult.result == PIPELET_ERROR)
    {
        if (PaymentStatus.getStatus() == Status.ERROR)
        {
            COBillingController.Start();
            return {};
        }
        else
        {
            CartController.Show();
            return {};
        }
    }

    /*
     * Handle used addresses and credit cards.
     */
    var processPersonalInformationResult = processPersonalInformation();
    if (processPersonalInformationResult.error)
    {
        var PlaceOrderError = new dw.system.Status(dw.system.Status.ERROR, "confirm.error.technical");
        return {
            error: true,
            PlaceOrderError: PlaceOrderError
        };
    }

    
    /*
     * Creates a new order. This will internally ReserveInventoryForOrder and
     * will create a new Order with status 'Created'.
     */
    var createOrderResult = createOrder({
        Basket: Basket
    });
    if (createOrderResult.error)
    {
        var BasketStatus = new dw.system.Status(dw.system.Status.ERROR);
        CartController.Show();
        return {};
    }
    var Order = createOrderResult.Order;
        
        
    return handlePayments({
        Order: Order
    });
}


function handlePayments(args)
{
    var Order = args.Order;
    
    
    /*
     * Handle the payment authorization, use the created order number as
     * reference for external payment transactions. Note that this is also the
     * departure point for asynchronous payments. The 'Submit' pipeline action
     * allows for asynchronous callback to perform the actual PlaceOrder
     * function.
     */
    var HandlePaymentsResult = HandlePayments({
        Order: Order
    });
    if (HandlePaymentsResult.error)
    {
        var PlaceOrderError = HandlePaymentsResult.PlaceOrderError != null ? HandlePaymentsResult.PlaceOrderError : new dw.system.Status(dw.system.Status.ERROR, "confirm.error.declined");
        return failOrder({
            PlaceOrderError: PlaceOrderError
        });
    }
    else if (HandlePaymentsResult.missingPaymentInfo)
    {
        var PlaceOrderError = new dw.system.Status(dw.system.Status.ERROR, "confirm.error.session");
        return failOrder({
            PlaceOrderError: PlaceOrderError
        });
    }
    
    return placeOrder({
        Order: Order
    });
}


function placeOrder(args)
{
    var Order = args.Order;
    
    
    /*
     * Sets the Order status to 'New'.
     */
    var PlaceOrderResult = PlaceOrder({
        Order: Order
    });
    if (PlaceOrderResult.error)
    {
        return failOrder({
            PlaceOrderError: new dw.system.Status(dw.system.Status.ERROR, "confirm.error.technical")
        });
    }
    
    /*
     * Creates purchased gift certificates with this order.
     */
    var createGiftCertificatesResult = createGiftCertificates({
        Order: Order
    });
    if (createGiftCertificatesResult.error)
    {
        return failOrder({
            PlaceOrderError: new dw.system.Status(dw.system.Status.ERROR, "confirm.error.technical")
        });
    }

    /*
     * Send order confirmation and clear used forms within the checkout process.
     */
    var m = require('./dw/mail');
    m.sendMail({
        MailFrom : dw.system.Site.getCurrent().getCustomPreferenceValue('customerServiceEmail'),
        MailSubject : dw.web.Resource.msg('order.orderconfirmation-email.001','order',null)+ " " + Order.orderNo,
        MailTemplate : 'mail/orderconfirmation',
        MailTo : Order.customerEmail
    });
    

    /*
     * Mark order as EXPORT_STATUS_READY.
     */
    new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/SetOrderStatus.ds'
    }).execute({
        Order: Order
    });

    
    clearForms();
    
    return {
        Order: Order,
        order_created: true
    };
}

    
/**
 * All errors must explicitly call FailOrder, to revive the Basket … or the
 * customer order will remain unaccessible
 */
function failOrder(args)
{
    var Order = args.Order;

    new dw.system.Pipelet('FailOrder').execute({
        Order: Order
    });
    
    return {
        error: true
    };
}


/**
 * Responsible for creating the order, set the order status to 'Created'
 */
function createOrder(args)
{
    var Basket = args.Basket;

    
    var CreateOrder2Result = new dw.system.Pipelet('CreateOrder2', {
        CreateCustomerNo: true
    }).execute({
        Basket: Basket
    });
    if (CreateOrder2Result.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
    }
    var Order = CreateOrder2Result.Order;
    return {
        Order: Order
    };
}


/**
 * Clears all forms used in the checkout process.
 */
function clearForms()
{
    var CurrentForms = session.forms;

    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.singleshipping);
    form.clearFormElement(CurrentForms.multishipping);
    form.clearFormElement(CurrentForms.billing);
}


/**
 * Responsible for placing the order and set the order status to 'New'
 */
function PlaceOrder(args)
{
    var Order = args.Order;
    
    
    var PlaceOrderResult = new dw.system.Pipelet('PlaceOrder').execute({
        Order: Order
    });
    if (PlaceOrderResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
    }

    var txn = require('dw/system/Transaction');
    txn.begin();
    
    Order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    
    txn.commit();
    
    return {};
}


/*
 * These pipelines contain past order creation logic. However, they must be
 * called within the transaction.
 */

/**
 * Creates a gift certificate for each gift certificate line item in the order
 * and sends an email to the gift certificate receiver.
 */
function createGiftCertificates(args)
{
    var Order = args.Order;
    

    for each(var GiftCertificateLineItem in Order.giftCertificateLineItems)
	{
        var CreateGiftCertificateResult = new dw.system.Pipelet('CreateGiftCertificate').execute({
            Amount: GiftCertificateLineItem.netPrice.value,
            RecipientEmail: GiftCertificateLineItem.recipientEmail,
            RecipientName: GiftCertificateLineItem.recipientName,
            SenderName: GiftCertificateLineItem.senderName,
            GiftCertificateLineItem: GiftCertificateLineItem,
            Message: GiftCertificateLineItem.message,
            OrderNo: Order.orderNo
        });
        if (CreateGiftCertificateResult.result == PIPELET_ERROR)
        {
            return {
                error: true
            };
        }
        var GiftCertificate = CreateGiftCertificateResult.GiftCertificate;
    
        
        var m = require('./dw/mail');
        m.sendMail({
            MailFrom : dw.system.Site.getCurrent().getCustomPreferenceValue('customerServiceEmail'),
            MailSubject : dw.web.Resource.msg('email.ordergcemsg','email',null)+" "+GiftCertificate.senderName,
            MailTemplate : "mail/giftcert",
            MailTo : GiftCertificate.recipientEmail
        });
    }
    
    return {};
}


/**
 * This pipeline is responsible to process information supplied by the user
 * during the checkout and saves a used credit card to the customer payment
 * instruments.
 */
function processPersonalInformation()
{
    var COBillingController = require('./COBilling');
    var SaveCreditCardResult = COBillingController.SaveCreditCard();
    if (SaveCreditCardResult.error)
    {
        return {
            error: true
        };
    }
    return {};
}


function getOrder()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    if (!empty(Order))
    {
        return {};
    }

    if (empty(CurrentHttpParameterMap.order_id.stringValue))
    {
        return {
            error: true
        }
    }

    var GetOrderResult = new dw.system.Pipelet('GetOrder').execute({
        OrderNo: CurrentHttpParameterMap.order_id.stringValue
    });
    if (GetOrderResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        }
    }
    var Order = GetOrderResult.Order;

    if (CurrentHttpParameterMap.order_token.stringValue != Order.getOrderToken())
    {
        return {
            error: true
        }
    }
    
    return {
        Order: Order
    };
}


/**
 * Asynchronous Callbacks for OCAPI. These functions result in a JSON response.
 */
function SubmitPaymentJSON()
{
    var getOrderResult = getOrder();
    if (getOrderResult.error)
    {
        faultsJSON();
        return;
    }

    var copyPaymentInfoResult = copyPaymentInfo();
    if (copyPaymentInfoResult.error)
    {
        faultsJSON();
        return;
    }

    var handlePaymentsResult = handlePayments();
    if (handlePaymentsResult.error)
    {
        faultsJSON();
        return;
    }

    response.renderTemplate('checkout/components/payment_methods_success', {
    });
}


function faultsJSON()
{
    response.renderTemplate('checkout/components/faults');
}


function copyPaymentInfo()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    
    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.billing.paymentMethods);

    
    new dw.system.Pipelet('Script', {
        Transactional: false,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/CopyPaymentMethodsFromOCAPIRequest.ds'
    }).execute({
        PaymentMethodsForm: CurrentForms.billing.paymentMethods,
        HttpParamMap: CurrentHttpParameterMap
    });

    // Order?
    var COBillingController = require('./COBilling');
    var HandlePaymentSelectionResult = COBillingController.HandlePaymentSelection({
        Basket: Basket
    });
    if (HandlePaymentSelectionResult.error)
    {
        return {
            error: true
        };
    }
    
    return {};
}


/*
 * Asynchronous Callbacks for SiteGenesis
 */
function Submit()
{
    var COSummaryController = require('./COSummary');

    var getOrderResult = getOrder();
    if (getOrderResult.error)
    {
        COSummaryController.Start();
        return;
    }

    var placeOrderResult = placeOrder();
    if (placeOrderResult.error)
    {
        COSummaryController.Start();
        return;
    }

    COSummaryController.ShowConfirmation();
}


/**
 * Order successfully created, communicate status back to calling pipeline.
 */
/*
 * Module exports
 */

/*
 * Web exposed methods
 */
// TODO external callbacks, method unclear
exports.SubmitPaymentJSON   = g.https(SubmitPaymentJSON);
exports.Submit              = g.https(Submit);

/*
 * Local methods
 */
exports.Start = Start;
