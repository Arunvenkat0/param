/**
 * Authorizes a payment using a gift certificate. The payment is authorized by redeeming the gift certificate and 
 * simply setting the order no as transaction ID.
 */
function Authorize(args)
{
	// TODO review args
	var PaymentInstrument = args.PaymentInstrument;
	var OrderNo = args.OrderNo;
	

    var GetPaymentProcessorResult = new dw.system.Pipelet('GetPaymentProcessor').execute({
        ID: "BASIC_GIFT_CERTIFICATE"
    });
    if (GetPaymentProcessorResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
    }
    var PaymentProcessor = GetPaymentProcessorResult.PaymentProcessor;

    if (((PaymentProcessor != null) || (OrderNo != null)))
    {
        var txn = require('dw/system/Transaction');
        txn.begin();
        
        PaymentInstrument.paymentTransaction.paymentProcessor = PaymentProcessor;
        PaymentInstrument.paymentTransaction.transactionID = OrderNo;
        
        txn.commit();
    }


    var RedeemGiftCertificateResult = new dw.system.Pipelet('RedeemGiftCertificate').execute({
        PaymentInstrument: PaymentInstrument
    });
    if (RedeemGiftCertificateResult.result == PIPELET_ERROR)
    {
    	return {
    	    error: true
    	};
    }
    var Status = RedeemGiftCertificateResult.Status;
    
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
exports.Authorize = Authorize;
