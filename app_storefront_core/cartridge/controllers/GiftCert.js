var g = require('./dw/guard');

/**
 * Gift Certificate related workflows
 */

/**
 * Renders the page to purchase a gift certificate.
 */
function Purchase()
{
    var form = require('./dw/form');
    form.clearFormElement(session.forms.giftcert);

    showPurchase();
}


function showPurchase()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var purchaseForm = session.forms.giftcert.purchase;


    if (CurrentHttpParameterMap.from.stringValue || CurrentHttpParameterMap.recipient.stringValue)
    {
        purchaseForm.from.value = CurrentHttpParameterMap.from.stringValue;
        purchaseForm.recipient.value = CurrentHttpParameterMap.recipient.stringValue;
    }


    if (customer.registered)
    {
        purchaseForm.from.value = customer.profile.firstName + " " + customer.profile.lastName;
    }


    if (!CurrentHttpParameterMap.plid.empty)
    {
        var GetProductListResult = new dw.system.Pipelet('GetProductList', {
            Create : false
        }).execute({
            ProductListID : CurrentHttpParameterMap.plid.value
        });
        if (GetProductListResult.result == PIPELET_NEXT)
        {
            var ProductList = GetProductListResult.ProductList;

            purchaseForm.recipient.value = ProductList.owner.profile.firstName + " "
                    + ProductList.owner.profile.lastName;
            purchaseForm.recipientEmail.value = ProductList.owner.profile.email;
            purchaseForm.confirmRecipientEmail.value = ProductList.owner.profile.email;
            purchaseForm.lineItemId.value = CurrentHttpParameterMap.itemid.stringValue;
        }
    }


    response.renderTemplate('checkout/giftcert/giftcertpurchase', {
        bctext1 : 'gc',
        bcurl1 : null
    });
}


/**
 * Parameters - GiftCertificateLineItemID: UUID of line item for gift
 * certificate to edit in basket.
 */
function Edit()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var purchaseForm = session.forms.giftcert.purchase;


    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        Purchase();
        return;
    }
    var Basket = GetExistingBasketResult.Basket;


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError : 'Exception',
        ScriptFile : 'checkout/GetGiftCertLineItem.ds'
    }).execute({
        Basket : Basket,
        GiftCertificateLineItemID : CurrentHttpParameterMap.GiftCertificateLineItemID.value
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        Purchase();
        return;
    }
    var GiftCertificateLineItem = ScriptResult.GiftCertificateLineItem;


    var form = require('./dw/form');
    form.clearFormElement(session.forms.giftcert);

    purchaseForm.lineItemId.value = GiftCertificateLineItem.UUID;
    purchaseForm.from.value = GiftCertificateLineItem.senderName;
    purchaseForm.recipient.value = GiftCertificateLineItem.recipientName;
    purchaseForm.recipientEmail.value = GiftCertificateLineItem.recipientEmail;
    purchaseForm.confirmRecipientEmail.value = GiftCertificateLineItem.recipientEmail;
    purchaseForm.message.value = GiftCertificateLineItem.message;
    purchaseForm.amount.value = GiftCertificateLineItem.price.value;

    response.renderTemplate('checkout/giftcert/giftcertpurchase', {
        GiftCertificateLineItem : GiftCertificateLineItem
    });
}


/**
 * Returns the details of a gift certificate as JSON in order to check the
 * current balance.
 */
function CheckBalance()
{
    var params = request.httpParameterMap;


    var GiftCertificate = null;

    if (params.dwfrm_giftcert_balance_giftCertID.value != null
            && params.dwfrm_giftcert_balance_giftCertID.stringValue != '')
    {
        var giftCertificateID = empty(params.giftCertID.stringValue) ? params.dwfrm_giftcert_balance_giftCertID.stringValue
                : params.giftCertID.stringValue;


        var GetGiftCertificateResult = new dw.system.Pipelet('GetGiftCertificate').execute({
            GiftCertificateID : giftCertificateID
        });
        if (GetGiftCertificateResult.result == PIPELET_NEXT)
        {
            GiftCertificate = GetGiftCertificateResult.GiftCertificate;
        }
    }


    if (!empty(GiftCertificate) && GiftCertificate.enabled)
    {
        response.renderJSON({
            giftCertificate : {
                ID : pdict.GiftCertificate.getGiftCertificateCode(),
                balance : dw.util.StringUtils.formatMoney(pdict.GiftCertificate.balance)
            }
        });
    }
    else
    {
        response.renderJSON({
            error : dw.web.Resource.msg('billing.giftcertinvalid', 'checkout', null)
        });
    }
}


/**
 * Parameters - post of giftcert.purchase
 */
function AddToBasket()
{
    addToBasket(false);
}

/**
 * Parameters - post of giftcert.purchase
 */
function Update()
{
    addToBasket(true);
}


function addToBasket(Updating)
{
    var CurrentHttpParameterMap = request.httpParameterMap;


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError : 'Exception',
        ScriptFile : 'checkout/ValidateGiftCertPurchaseForm.ds'
    }).execute({
        Form : session.forms.giftcert.purchase
    });
    var FormErrors = ScriptResult.FormErrors;
    if (ScriptResult.result == PIPELET_ERROR)
    {
        showError({
            FormErrors : FormErrors
        });
        return;
    }

    var CartController = require('./Cart');
    var GetBasketResult = CartController.GetBasket();
    if (GetBasketResult.error)
    {
        var GeneralError = dw.web.Resource.msg('checkout.giftcert.error.internal', 'checkout', null);
        showError({
            GeneralError : GeneralError
        });
        return;
    }

    var Basket = GetBasketResult.Basket;
    var GiftCertificateLineItem = null;

    if (Updating)
    {
        var updateGiftCertResult = updateGiftCert({
            Basket : Basket
        });
        if (updateGiftCertResult.error)
        {
            showError({
                GeneralError : updateGiftCertResult.GeneralError
            });
            return;
        }
        GiftCertificateLineItem = updateGiftCertResult.GiftCertificateLineItem;
    }
    else
    {
        var createGiftCertResult = createGiftCert({
            Basket : Basket
        });
        if (createGiftCertResult.error)
        {
            showError({
                GeneralError : createGiftCertResult.GeneralError
            });
            return;
        }
        GiftCertificateLineItem = createGiftCertResult.GiftCertificateLineItem;
    }

    CartController.Calculate();

    if (CurrentHttpParameterMap.format.stringValue == 'ajax')
    {
        response.renderTemplate('checkout/giftcert/giftcertaddtobasketjson', {
            FormErrors : FormErrors,
            GiftCertificateLineItem : GiftCertificateLineItem
        });
        return;
    }


    response.redirect(dw.web.URLUtils.https('Cart-Show'));
}

function showError(args)
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    if (CurrentHttpParameterMap.format.stringValue == 'ajax')
    {
        response.renderTemplate('checkout/giftcert/giftcertaddtobasketjson', {
            GeneralError : args.GeneralError,
            FormErrors : args.FormErrors
        });
        return;
    }

    showPurchase();
}


/**
 * Parameters - lineItemID: gift certificate line item UUID
 */
function ShowMiniCart()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var CartController = require('./Cart');
    var GetExistingBasketResult = CartController.GetExistingBasket();
    if (GetExistingBasketResult.error)
    {
        // TODO no template???
        return;
    }

    var Basket = GetExistingBasketResult.Basket;


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError : 'Exception',
        ScriptFile : 'checkout/GetGiftCertLineItem.ds'
    }).execute({
        Basket : Basket,
        GiftCertificateLineItemID : CurrentHttpParameterMap.lineItemId.value
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        // TODO no template?
        return;
    }
    var GiftCertificateLineItem = ScriptResult.GiftCertificateLineItem;

    response.renderTemplate('checkout/cart/minicart', {
        Basket : Basket,
        GiftCertificateLineItem: GiftCertificateLineItem
    });
}


/*
 * Private helpers
 */

/**
 * Creates a gift certificate in the customer basket using form input values.
 * The form must be valid before calling this pipeline.
 */
function createGiftCert(args)
{
    var purchaseForm = session.forms.giftcert.purchase;

    var CurrentHttpParameterMap = request.httpParameterMap;

    var Basket = args.Basket;

    var ProductListItem = null;

    if (CurrentHttpParameterMap.plid.stringValue)
    {
        var productListId = CurrentHttpParameterMap.plid.stringValue;
        var listItemId = purchaseForm.lineItemId.value;

        var ProductListController = require('./ProductList');
        var InitResult = ProductListController.Init({
            productListId : productListId,
            listItemId : listItemId
        });

        ProductListItem = InitResult.ProductListItem;
    }


    var AddGiftCertificateToBasketResult = new dw.system.Pipelet('AddGiftCertificateToBasket').execute({
        Amount : purchaseForm.amount.value,
        Basket : Basket,
        RecipientEmail : purchaseForm.recipientEmail.value,
        RecipientName : purchaseForm.recipient.value,
        SenderName : purchaseForm.from.value,
        Message : purchaseForm.message.value,
        ProductListItem : ProductListItem,
        // TODO originally Shipment : Shipment, but where should this come from?
        Shipment : null
    });
    if (AddGiftCertificateToBasketResult.result == PIPELET_ERROR)
    {
        var GeneralError = dw.web.Resource.msg('checkout.giftcert.error.internal', 'checkout', null);
        return {
            error : true,
            GeneralError : GeneralError
        };
    }
    var GiftCertificateLineItem = AddGiftCertificateToBasketResult.GiftCertificateLineItem;

    return {
        GiftCertificateLineItem : GiftCertificateLineItem
    };
}


/**
 * Updates a gift certificate in the customer basket using form input values.
 * The form must be valid before calling this pipeline.
 */
function updateGiftCert(args)
{
    var purchaseForm = session.forms.giftcert.purchase;

    var Basket = args.Basket;


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError : 'Exception',
        ScriptFile : 'checkout/GetGiftCertLineItem.ds'
    }).execute({
        Basket : Basket,
        GiftCertificateLineItemID : purchaseForm.lineItemId.value
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        var GeneralError = dw.web.Resource.msg('checkout.giftcert.error.internal', 'checkout', null);
        return {
            error : true,
            GeneralError : GeneralError
        };
    }
    var GiftCertificateLineItem = ScriptResult.GiftCertificateLineItem;

    var txn = require('dw/system/Transaction');
    txn.begin();

    GiftCertificateLineItem.senderName = purchaseForm.from.value;
    GiftCertificateLineItem.recipientName = purchaseForm.recipient.value;
    GiftCertificateLineItem.recipientEmail = purchaseForm.recipientEmail.value;
    GiftCertificateLineItem.message = purchaseForm.message.value;
    GiftCertificateLineItem.basePrice = new dw.value.Money(purchaseForm.amount.value,
            GiftCertificateLineItem.basePrice.currencyCode);
    GiftCertificateLineItem.grossPrice = new dw.value.Money(purchaseForm.amount.value,
            GiftCertificateLineItem.netPrice.currencyCode);
    GiftCertificateLineItem.netPrice = new dw.value.Money(purchaseForm.amount.value,
            GiftCertificateLineItem.grossPrice.currencyCode);

    txn.commit();

    return {
        GiftCertificateLineItem : GiftCertificateLineItem
    };
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Purchase        = g.httpsGet(Purchase);
exports.Edit            = g.httpsGet(Edit);
exports.CheckBalance    = g.httpsGet(CheckBalance);
exports.AddToBasket     = g.httpsPost(AddToBasket);
exports.Update          = g.httpsPost(Update);
exports.ShowMiniCart    = g.httpsGet(ShowMiniCart);
