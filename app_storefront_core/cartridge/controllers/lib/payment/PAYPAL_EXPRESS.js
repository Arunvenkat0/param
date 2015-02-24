/**
 * This is where additional PayPal integration would go. The current implementation simply creates a PaymentInstrument and 
 * returns 'success'.
 */
function Handle(args)
{
	var Basket = args.Basket;
	

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/CreatePaymentInstrument.ds'
    }).execute({
        PaymentType: "PayPal",
        RemoveExisting: true,
        LineItemCtnr: Basket
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
    }
    var PaymentInstrument = ScriptResult.PaymentInstrument;
    
    return {
        success: true
    };
}


/**
 * Authorizes a payment using a credit card. The payment is authorized by using the PAYPAL_EXPRESS processor only 
 * and setting the order no as the transaction ID. Customizations may use other processors and custom logic to 
 * authorize credit card payment.
 */
function Authorize(args)
{
	var OrderNo = args.OrderNo;
	var PaymentInstrument = args.PaymentInstrument;
	
	
    var GetPaymentProcessorResult = new dw.system.Pipelet('GetPaymentProcessor').execute({
        ID: "PAYPAL_EXPRESS"
    });
    if (GetPaymentProcessorResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
    }
    var PaymentProcessor = GetPaymentProcessorResult.PaymentProcessor;

    PaymentInstrument.paymentTransaction.transactionID = OrderNo;
    PaymentInstrument.paymentTransaction.paymentProcessor = PaymentProcessor;
    
    return {
        authorized: true
    };
}


/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;
