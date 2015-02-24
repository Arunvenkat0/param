/**
 * This is where additional BillMeLaterl integration would go. The current implementation simply creates a payment 
 * method and returns 'success'.
 */
function Handle(args)
{
    var CurrentForms = session.forms;

    var Basket = args.Basket;
    
    
    if (!CurrentForms.billing.paymentMethods.bml.termsandconditions.checked)
    {
        var form = require('./dw/form');
        form.invalidateFormElement(CurrentForms.billing.paymentMethods.bml.termsandconditions);
        
        return {
            error: true
        };
    }

    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'checkout/CreatePaymentInstrument.ds'
    }).execute({
        PaymentType: dw.order.PaymentInstrument.METHOD_BML,
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
        sucess: true
    };
}


/**
 * Authorizes a payment using a credit card. The payment is authorized by using the CYBERSOURCE_BML processor only and 
 * setting the order no as the transaction ID. Customizations may use other processors and custom logic to authorize 
 * credit card payment.
 */
function Authorize(args)
{
    var GetPaymentProcessorResult = new dw.system.Pipelet('GetPaymentProcessor').execute({
        ID: "CYBERSOURCE_BML"
    });
    if (GetPaymentProcessorResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
    }
    var PaymentProcessor = GetPaymentProcessorResult.PaymentProcessor;

    var txn = require('dw/system/Transaction');
    txn.begin();
    
    PaymentInstrument.paymentTransaction.transactionID = OrderNo;
    PaymentInstrument.paymentTransaction.paymentProcessor = PaymentProcessor;
    
    txn.commit();
    
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
