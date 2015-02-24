var g = require('./dw/guard');

/**
 * This is the pipeline hook for reporting to the Demandware AB-test engine that a customer has started 
 * checkout in the storefront.  This event is recorded only fore the purposes of updating AB-test statistics and 
 * doesd not affect the basket.  This pipeline does not ordinarily need to be modified.
 */
function StartCheckout()
{
    var GetBasketResult = new dw.system.Pipelet('GetBasket', {
        Create: false
    }).execute();
    if (GetBasketResult.result == PIPELET_ERROR)
    {
        // TODO what is the intention to render an empty template?
        response.renderTemplate('util/reporting/reporting');
        return;
    }
    var Basket = GetBasketResult.Basket;
    var StoredBasket = GetBasketResult.StoredBasket;

    if (Basket == null)
    {
        // TODO what is the intention to render an empty template?
        response.renderTemplate('util/reporting/reporting');
        return;
    }

    
    new dw.system.Pipelet('StartCheckout').execute({
        Basket: Basket
    });

    // TODO what is the intention to render an empty template?
    response.renderTemplate('util/reporting/reporting');
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.StartCheckout = g.get(StartCheckout);
