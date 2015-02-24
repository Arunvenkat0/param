var g = require('./dw/guard');
var wl = require('./lib/wishlist');

/**
 * Forms handling for the landing page
 */
function LandingForm()
{
    // TODO use redirect for response
    var TriggeredAction = request.triggeredAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'register')
        {
            response.redirect(dw.web.URLUtils.https('Account-StartRegister'));
            return;
        }
        else if (TriggeredAction.formId == 'search')
        {
            Search();
            return;
        }
    }
}


/**
 * Renders the wishlist page.
 */
function Show()
{
    var form = require('./dw/form');
    form.clearFormElement(session.forms.wishlist);

    var ProductList = wl.fetchWishList();


    form.updateFormWithObject(session.forms.wishlist.items, ProductList.items);


    // init address book
    form.updateFormWithObject(session.forms.wishlist.addressbook.addresses, customer.profile.addressBook.addresses);


    var w = require('./dw/web');
    w.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("myaccount-wishlist"));


    response.renderTemplate('account/wishlist/wishlist', {
        ProductList : ProductList
    });
}


/**
 * Forms handler for processing wish lists.
 */
function WishListForm()
{
    var CurrentForms = session.forms;


    var TriggeredAction = request.triggeredAction;
    if (TriggeredAction != null)
    {
        if (TriggeredAction.formId == 'addGiftCertificate')
        {
            var ProductList = wl.fetchWishList();

            var AddGiftCertificateToProductListResult = new dw.system.Pipelet('AddGiftCertificateToProductList')
                    .execute({
                        ProductList : ProductList,
                        Priority : 0
                    });
        }
        else if (TriggeredAction.formId == 'addToCart')
        {
            if (CurrentForms.wishlist.items.triggeredAction.parent.object.type == CurrentForms.wishlist.items.triggeredAction.parent.object.TYPE_GIFT_CERTIFICATE)
            {
                // TODO redirect?
                var GiftCertController = require('./GiftCert');
                GiftCertController.Purchase();
                return;
            }
            else
            {
                // TODO redirect?
                var CartController = require('./Cart');
                CartController.AddProduct();
                return;
            }
        }
        else if (TriggeredAction.formId == 'deleteItem')
        {
            var RemoveProductListItemResult = new dw.system.Pipelet('RemoveProductListItem').execute({
                ProductListItem : TriggeredAction.object
            });
        }
        else if (TriggeredAction.formId == 'selectAddressWishlist')
        {
            SetShippingAddress();
            return;
        }
        else if (TriggeredAction.formId == 'setItemPrivate')
        {
            var txn = require('dw/system/Transaction');
            txn.begin();

            TriggeredAction.object.public = false;

            txn.commit();
        }
        else if (TriggeredAction.formId == 'setItemPublic')
        {
            var txn = require('dw/system/Transaction');
            txn.begin();

            TriggeredAction.object.public = true;

            txn.commit();
        }
        else if (TriggeredAction.formId == 'setListPrivate')
        {
            var ProductList = wl.fetchWishList();

            var txn = require('dw/system/Transaction');
            txn.begin();

            ProductList.public = false;

            txn.commit();


            new dw.system.Pipelet('Script', {
                Transactional : true,
                OnError : 'PIPELET_ERROR',
                ScriptFile : 'productlist/MakeItemsPrivate.ds'
            }).execute({
                ProductList : ProductList
            });
        }
        else if (TriggeredAction.formId == 'setListPublic')
        {
            var ProductList = wl.fetchWishList();

            var txn = require('dw/system/Transaction');
            txn.begin();

            ProductList.public = true;

            txn.commit();

            new dw.system.Pipelet('Script', {
                Transactional : true,
                OnError : 'PIPELET_ERROR',
                ScriptFile : 'productlist/MakeItemsPublic.ds'
            }).execute({
                ProductList : ProductList
            });
        }
        else if (TriggeredAction.formId == 'updateItem')
        {
            var form = require('./dw/form');
            form.updateObjectWithForm(TriggeredAction.object, TriggeredAction.parent);
        }
    }

    response.redirect(dw.web.URLUtils.https('Wishlist-Show'));
}


/**
 * Expects: UserID
 */
function ShowOther()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;


    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.wishlist.send);


    var ProductList = null;

    var GetProductListResult = new dw.system.Pipelet('GetProductList', {
        Create : false
    }).execute({
        ProductListID : CurrentHttpParameterMap.WishListID.value
    });
    if (GetProductListResult.result == PIPELET_NEXT)
    {
        ProductList = GetProductListResult.ProductList;


        form.updateFormWithObject(CurrentForms.wishlist.items, ProductList.items);
    }

    response.renderTemplate('account/wishlist/wishlist', {
        ProductList: ProductList
    });
}


/**
 * Expects: Product or ProductID or pid
 */
// this is called from the cart
function AddProduct(args)
{
    var CurrentHttpParameterMap = request.httpParameterMap;


    // TODO var Product = args.Product;
    var product = null;

    if (product == null)
    {
        if (CurrentHttpParameterMap.pid.stringValue != null)
        {
            var ProductID = CurrentHttpParameterMap.pid.stringValue;


            var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
                ProductID : ProductID
            });
            if (GetProductResult.result == PIPELET_ERROR)
            {
                return {
                    error : true
                };
            }
            product = GetProductResult.Product;
        }
    }


    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
        Product : product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;


    var ProductList = wl.fetchWishList();


    new dw.system.Pipelet('AddProductToProductList').execute({
        Product : product,
        ProductList : ProductList,
        Quantity : CurrentHttpParameterMap.Quantity.doubleValue,
        ProductOptionModel : ProductOptionModel
    });

    return {
        ok : true
    };
}


/**
 * Adds a product given by the http parameter "pid" to the wishlist and displays
 * the updated wishlist.
 */
function Add()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
        ProductID : CurrentHttpParameterMap.pid.getStringValue("")
    });
    if (GetProductResult.result == PIPELET_ERROR)
    {
        Show();
        return;
    }
    var Product = GetProductResult.Product;


    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
        Product : Product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;


    var ProductList = wl.fetchWishList();


    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
        Product : Product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;


    var AddProductToProductListResult = new dw.system.Pipelet('AddProductToProductList').execute({
        Product : Product,
        ProductList : ProductList,
        Quantity : 1,
        ProductOptionModel : ProductOptionModel
    });
    var ProductListItem = AddProductToProductListResult.ProductListItem;


    var txn = require('dw/system/Transaction');
    txn.begin();

    ProductListItem.public = ProductList.public;

    txn.commit();

    Show();
}


/**
 * Expects (optional): - OwnerEmail - OwnerFirstName - OwnerLastName
 */
function Search()
{
    var CurrentForms = session.forms;

    var SearchFirstName, SearchLastName, SearchEmail = null;

    if (CurrentForms.wishlist.search.valid
            && (!empty(CurrentForms.wishlist.search.email.value) || (!empty(CurrentForms.wishlist.search.firstname.value) && !empty(CurrentForms.wishlist.search.lastname.value))))
    {
        var SearchProductListsResult = new dw.system.Pipelet('SearchProductLists', {
            PublicOnly : true
        }).execute({
            Type : dw.customer.ProductList.TYPE_WISH_LIST,
            OwnerFirstName : CurrentForms.wishlist.search.firstname.value,
            OwnerLastName : CurrentForms.wishlist.search.lastname.value,
            OwnerEmail : CurrentForms.wishlist.search.email.value
        });
        var ProductLists = SearchProductListsResult.ProductLists;


        var form = require('./dw/form');
        form.updateFormWithObject(CurrentForms.wishlist.productlists, ProductLists);


        SearchFirstName = CurrentForms.wishlist.search.firstname.value;
        SearchLastName = CurrentForms.wishlist.search.lastname.value;
        SearchEmail = CurrentForms.wishlist.search.email.value;


        form.clearFormElement(CurrentForms.wishlist.search);
    }
    else
    {
        SearchFirstName = CurrentForms.wishlist.search.firstname.value;
        SearchLastName = CurrentForms.wishlist.search.lastname.value;
        SearchEmail = CurrentForms.wishlist.search.email.value;
    }

    response.renderTemplate('account/wishlist/wishlistresults', {
        SearchFirstName : SearchFirstName,
        SearchLastName : SearchLastName,
        SearchEmail : SearchEmail
    });
}


/**
 * Set the shipping address for the wish list. Expects: AddressID
 */
function SetShippingAddress()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var Address = null;


    if (!CurrentHttpParameterMap.AddressID.empty || !CurrentHttpParameterMap.editAddress.empty)
    {
        var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress')
                .execute({
                    AddressID : empty(CurrentHttpParameterMap.AddressID.stringValue) ? CurrentHttpParameterMap.editAddress.stringValue
                            : CurrentHttpParameterMap.AddressID.stringValue,
                    Customer : customer
                });
        if (GetCustomerAddressResult.result == PIPELET_ERROR)
        {
            return;
        }
        Address = GetCustomerAddressResult.Address;
    }


    var ProductList = wl.fetchWishList();

    var txn = require('dw/system/Transaction');
    txn.begin();
    
    ProductList.setShippingAddress(Address);

    txn.commit();
    
    Show();
}


/**
 * Replaces an item in the wish list.
 */
function ReplaceProductListItem()
{
    var plid = request.httpParameterMap.uuid.stringValue;

    var ProductList = wl.fetchWishList();


    var productListItem = ProductList.getItem(plid);
    if (productListItem != null)
    {
        var txn = require('dw/system/Transaction');
        txn.begin();
    
        ProductList.removeItem(productListItem);

        // TODO ProductList already resolved
        var AddProductResult = AddProduct();

        txn.commit();
    }

    // TODO rendering an empty template this seems pretty useless
    response.renderTemplate('account/wishlist/refreshwishlist');
}


/*
 * Private helpers
 */

function clearForms()
{
    var CurrentForms = session.forms;

    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.wishlist);
    form.clearFormElement(CurrentForms.login);
}


/**
 * A guard function which ensures that the user is logged in before the action can be executed.
 */
function loggedIn(action)
{
    return function()
    {
        if (!customer.authenticated)
        {
            requireLogin({
                TargetAction : 'Wishlist-' + action.name
            });
            return;
        }

        action();
    };
}


/**
 * Contains the login procedure specific for the wishlist.
 */
// TODO this is called from the cart when a product is added to the wishlist
function requireLogin(args)
{
    clearForms();

    var loginForm = session.forms.login;

    if (customer.registered)
    {
        loginForm.username.value = customer.profile.credentials.login;
        loginForm.rememberme.value = true;
    }


    var w = require('./dw/web');
    w.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("myaccount-login"));

    loginForm.targetAction.value = args.TargetAction;
    loginForm.targetParameters.value = (args.TargetParameters != null) ? JSON.stringify(args.TargetParameters) : null;

    response.renderTemplate('account/wishlist/wishlistlanding', {
        RegistrationStatus : false
    });
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
// own wishlist
exports.Add                     = g.httpsGet(loggedIn(Add));
exports.Show                    = g.httpsGet(loggedIn(Show));
exports.ReplaceProductListItem  = g.httpsGet(loggedIn(ReplaceProductListItem));
exports.SetShippingAddress      = g.httpsGet(loggedIn(SetShippingAddress));

// others wishlist
exports.Search                  = g.httpsPost(Search);
exports.ShowOther               = g.httpsGet(ShowOther);

// form handlers
exports.LandingForm             = g.httpsPost(LandingForm);
exports.WishListForm            = g.httpsPost(loggedIn(WishListForm));

/*
 * Local methods
 */
exports.AddProduct              = AddProduct;
exports.requireLogin            = requireLogin;
