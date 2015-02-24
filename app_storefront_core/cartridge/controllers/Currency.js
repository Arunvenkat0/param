var g = require('./dw/guard');

/**
 * This pipeline is used in an ajax call to set the session variable 'currency'.
 */
function SetSessionCurrency()
{
    var SetSessionCurrencyResult = new dw.system.Pipelet('SetSessionCurrency').execute({
        CurrencyCode: request.httpParameterMap.currencyMnemonic.value
    });
    if (SetSessionCurrencyResult.result == PIPELET_NEXT)
    {
        var CartController = require('./Cart');
        CartController.Calculate();
    }

    response.renderJSON({
        success: true
    });
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.SetSessionCurrency = g.get(SetSessionCurrency);
