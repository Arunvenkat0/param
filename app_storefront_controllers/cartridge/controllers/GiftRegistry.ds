'use strict';

/**
 * This controller implements functionality for gift registry business logic.
 *
 * @module  controllers/GiftRegistry
 */

/* API Includes */
var Pipelet = require('dw/system/Pipelet');
var ProductList = require('dw/customer/ProductList');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Content = app.getModel('Content');
var ProductList = app.getModel('ProductList');
var Form = app.getModel('Form');
var giftRegistryForm = Form.get('giftregistry');

/**
 * Controls the login, which is required to access gift registry related actions.
 */
function submitFormLanding() {
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'search')
	    {
	        search();
	        return;
	    }
	}

}


/**
 * Renders a list of gift registries.
 */
function start() {
    var productListsForm = session.forms.productlists;

    Form.get(productListsForm).clear();


    var GetProductListsResult = new Pipelet('GetProductLists').execute({
        Customer: customer,
        Type: ProductList.TYPE_GIFT_REGISTRY
    });
    var ProductLists = GetProductListsResult.ProductLists;

	Form.get(productListsForm.items).copyFrom(ProductLists);

    var accountGiftRegistry = Content.get('myaccount-giftregistry');

    var pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update(accountGiftRegistry);

    app.getView().render('account/giftregistry/registrylist');
}

/**
 * Creates or searches for a gift registry.
 */
function registrymain() {
    // TODO this should trigger some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'create')
	    {
	        create();
	        return;
	    }
	    else if (TriggeredAction.formId === 'search')
	    {
	        var productListsForm = session.forms.productlists;

	        if (productListsForm.search.eventMonth.value !== null && productListsForm.search.eventYear.value === null)
	        {
	            productListsForm.search.eventYear.invalidateFormElement();

	            app.getView().render('account/giftregistry/registrylist');
	            return;
	        }

	        search();
	        return;
	    }
	}

    app.getView().render('account/giftregistry/registrylist');
}


/**
 * Adds a product to the gift registry. The product must either be a Product object, or is identified by its
 * product ID using the dictionary key ProductID or, if empty, uses the HTTP parameter "pid".
 */
function addProduct() {
    var currentHttpParameterMap = request.httpParameterMap;

    // TODO this function looks exactly the same as like AddProduct in Wishlist
    // TODO where should this come from?
    var Product = null;

    if (Product === null)
    {
        if (currentHttpParameterMap.pid.stringValue !== null)
        {
            var ProductID = currentHttpParameterMap.pid.stringValue;

            var GetProductResult = new Pipelet('GetProduct').execute({
                ProductID: ProductID
            });
            if (GetProductResult.result === PIPELET_ERROR)
            {
                return {
                    error: true
                };
            }
            Product = GetProductResult.Product;
        }
    }


    var GetProductListsResult = new Pipelet('GetProductLists').execute({
        Customer: customer,
        Type: ProductList.TYPE_GIFT_REGISTRY
    });
    var ProductLists = GetProductListsResult.ProductLists;

    var ProductList = null;

    if (typeof(ProductLists) !== 'undefined' && ProductLists !== null && !ProductLists.isEmpty())
    {
        if (ProductLists.size() === 1)
        {
            ProductList = ProductLists.iterator().next();
        }
        else
        {
            selectOne();
            return;
        }
    }
    else
    {
        createOne();
        return;
    }


    var UpdateProductOptionSelectionsResult = new Pipelet('UpdateProductOptionSelections').execute({
        Product: Product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;


    var AddProductToProductListResult = new Pipelet('AddProductToProductList', {
        DisallowRepeats: true
    }).execute({
        Product: Product,
        ProductList: ProductList,
        Quantity: currentHttpParameterMap.Quantity.getIntValue(),
        ProductOptionModel: ProductOptionModel,
        Priority: 2
    });


    showRegistry({
        ProductList: ProductList
    });
    return;
}


/**
 * Provides the actual creation logic for the gift registry in 3 steps: event participants, participant addresses
 * and a final confirmation.
 */
function createOne()
{
    var participantForm = session.forms.giftregistry.event.participant;

    Form.get(session.forms.giftregistry).clear();

    participantForm.firstName.value = customer.profile.firstName;
    participantForm.lastName.value = customer.profile.lastName;
    participantForm.email.value = customer.profile.email;

    app.getView().render('account/giftregistry/eventparticipant');
}

/**
 * TODO
 */
function eventParticipant() {
    // TODO this should be some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'back')
	    {
	        start();
	        return;
	    }
	    else if (TriggeredAction.formId === 'confirm')
	    {
	        if (customer.profile.addressBook.addresses.size() === 0)
	        {
	            currentForms.giftregistry.eventaddress.beforeEventAddress.value = 'newaddress';
	        }

	        showAddresses();
	    }
	}
}

/**
 * TODO
 */
function showAddresses()
{
    app.getView().render('account/giftregistry/addresses');
}

/**
 * TODO
 */
function participantAddresses() {
    // TODO this should trigger some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'back')
	    {
	        new Pipelet('Script', {
	            Transactional: false,
	            OnError: 'PIPELET_ERROR',
	            ScriptFile: 'app_storefront_core:account/giftregistry/CopyAddressFormFields.ds'
	        }).execute({
	            GiftRegistryForm: currentForms.giftregistry
	        });

	        app.getView().render('account/giftregistry/eventparticipant');
	        return;
	    }
	    else if (TriggeredAction.formId === 'confirm')
	    {
	        if (currentForms.giftregistry.copyAddress.checked)
	        {
	            new Pipelet('Script', {
	                Transactional: false,
	                OnError: 'PIPELET_ERROR',
	                ScriptFile: 'app_storefront_core:account/giftregistry/AssignPostEventShippingAddress.ds'
	            }).execute({
	                GiftRegistryForm: currentForms.giftregistry
	            });
	        }

	        showConfirmation();
	        return;
	    }
	    else if (TriggeredAction.formId === 'selectAddressAfter')
	    {
	        var AddressFormType = 'after';

	        updateAddressDetails();
	        return;
	    }
	    else if (TriggeredAction.formId === 'selectAddressBefore')
	    {
	        var AddressFormType = 'before';

	        updateAddressDetails();
	        return;
	    }
	}

	if (!currentForms.giftregistry.eventaddress.valid)
    {
	    showAddresses();
	    return;
    }

	if (currentForms.giftregistry.eventaddress.beforeEventAddress.value === 'newaddress' && !currentForms.giftregistry.eventaddress.addressBeforeEvent.valid)
    {
        showAddresses();
        return;
    }

    if (currentForms.giftregistry.eventaddress.afterEventAddress.value === 'newaddress' && !currentForms.giftregistry.eventaddress.addressAfterEvent.valid)
    {
        showAddresses();
        return;
    }

    showConfirmation();
}

/**
 * TODO
 */
function showConfirmation()
{
    app.getView().render('account/giftregistry/giftregistryconfirmation');
}

/**
 * TODO
 */
function confirmation() {
    // TODO this should trigger some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'back')
	    {
	        showAddresses();
	        return;
	    }
	    else if (TriggeredAction.formId === 'confirm')
	    {
	        /*
	         * If the product list isn't null then confirm has been called via the browser back button
	         */
	        if (currentForms.giftregistry.object !== null)
	        {
	            var GetProductListResult = new Pipelet('GetProductList', {
	                Create: false
	            }).execute({
	                ProductListID: currentForms.giftregistry.object.UUID
	            });
	            if (GetProductListResult.result === PIPELET_NEXT)
	            {
	                var ProductList = GetProductListResult.ProductList;

	                ShowRegistry({
	                    ProductList: ProductList
	                });
	                return;
	            }
	        }

	        if (currentForms.giftregistry.eventaddress.beforeEventAddress.value === 'newaddress')
	        {
	            var GetCustomerAddressResult = new Pipelet('GetCustomerAddress').execute({
	                AddressID: currentForms.giftregistry.eventaddress.addressBeforeEvent.addressid.value,
	                Customer: customer
	            });
	            if (GetCustomerAddressResult.result === PIPELET_NEXT)
	            {
	                var Address = GetCustomerAddressResult.Address;

	                currentForms.giftregistry.eventaddress.addressBeforeEvent.addressid.invalidateFormElement();

	                ShowAddresses();
	                return;
	            }
	        }


	        if (currentForms.giftregistry.eventaddress.afterEventAddress.value === 'newaddress')
	        {
	            var GetCustomerAddressResult = new Pipelet('GetCustomerAddress').execute({
	                AddressID: currentForms.giftregistry.eventaddress.addressAfterEvent.addressid.value,
	                Customer: customer
	            });
	            if (GetCustomerAddressResult.result === PIPELET_NEXT)
	            {
	                var Address = GetCustomerAddressResult.Address;

	                currentForms.giftregistry.eventaddress.addressAfterEvent.addressid.invalidateFormElement();

	                ShowAddresses();
                    return;
	            }
	        }

	        var CreateProductListResult = new Pipelet('CreateProductList').execute({
	            Type: ProductList.TYPE_GIFT_REGISTRY,
	            Customer: customer
	        });
	        var CreatedProductList = CreateProductListResult.ProductList;

			Transaction.wrap(function () {
		        CreatedProductList.eventState = currentForms.giftregistry.event.eventaddress.states.state.value;
		        CreatedProductList.eventCountry = currentForms.giftregistry.event.eventaddress.country.value;
			 }
                );



	        if (!Form.get(currentForms.giftregistry.event).copyTo(CreatedProductList))
	        {
	            return {
	                error: true
	            };
	        }


	        var CreateProductListRegistrantResult = new Pipelet('CreateProductListRegistrant', {
	            CreateCoRegistrant: false
	        }).execute({
	            ProductList: CreatedProductList
	        });
	        if (CreateProductListRegistrantResult.result === PIPELET_ERROR)
	        {
                return {
                    error: true
                };
	        }
	        var ProductListRegistrant = CreateProductListRegistrantResult.ProductListRegistrant;

			if (!Form.get(currentForms.giftregistry.event.participant).copyTo(ProductListRegistrant))
	        {
                return {
                    error: true
                };
	        }


	        if (!(currentForms.giftregistry.event.coParticipant.role.selectedOption === null || currentForms.giftregistry.event.coParticipant.role.selectedOption.htmlValue === ''))
	        {
	            var CreateProductListRegistrantResult = new Pipelet('CreateProductListRegistrant', {
	                CreateCoRegistrant: true
	            }).execute({
	                ProductList: CreatedProductList
	            });
	            if (CreateProductListRegistrantResult.result === PIPELET_ERROR)
	            {
	                return {
	                    error: true
	                };
	            }
	            var ProductListRegistrant = CreateProductListRegistrantResult.ProductListRegistrant;

	            if (!Form.get(currentForms.giftregistry.event.coParticipant).copyTo(ProductListRegistrant))
	            {
	                return {
	                    error: true
	                };
	            }
	        }


	        var ScriptResult = new Pipelet('Script', {
	            ScriptFile: 'app_storefront_core:account/giftregistry/AssignEventAddresses.ds',
	            Transactional: true
	        }).execute({
	            ProductList: CreatedProductList,
	            GiftRegistryForm: currentForms.giftregistry,
	            Customer: customer
	        });
	        if (ScriptResult.result === PIPELET_ERROR)
	        {
	            return {
                    error: true
                };
	        }

	        // TODO here should be some template?
	        return;
	    }
	}

	showConfirmation();
}


/**
 * Selects a gift registry from a list of gift registries that are found by the registry search.
 */
function selectOne()
{
    var currentForms = session.forms;


    Form.get(currentForms.productlists.items).copyFrom(ProductLists);

    app.getView().render('account/giftregistry/registryselect');
}


/**
 * Provides actions to edit a gift registry event.
 */
function selectProductListInteraction() {
    // TODO this should end in a redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'select')
	    {
	        var ProductList = TriggeredAction.object;
	        // TODO interaction continue not supported anymore
	        // where to continue now?
	        return;
	    }
	}

	// TODO what to render otherwise?
}

/**
 * TODO
 */
function editEvent()
{
    var currentForms = session.forms;


    Form.get(currentForms.giftregistry).clear();
    Form.get(currentForms.giftregistry.event).copyFrom(ProductList, true);
    Form.get(currentForms.giftregistry.event.participant).copyFrom(ProductList.registrant);

    if (ProductList.coRegistrant !== null)
    {
        Form.get(currentForms.giftregistry.event.coParticipant).copyFrom(ProductList.coRegistrant);
    }


    currentForms.giftregistry.event.eventaddress.states.state.value = ProductList.eventState;
    currentForms.giftregistry.event.eventaddress.country.value = ProductList.eventCountry;


    showEditParticipantForm();
}

/**
 * TODO
 */
function showEditParticipantForm()
{
    app.getView().render('account/giftregistry/eventparticipant');
}
/**
 * TODO
 */
// TODO this is probably never called?
function editEventParticipant() {
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'back')
	    {
	        // TODO back???
	        showRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId === 'confirm')
	    {
	        if (!Form.get(currentForms.giftregistry.event).copyTo(ProductList))
	        {
	            return {
                    error: true
                };
	        }


	        if (!Form.get(currentForms.giftregistry.event.participant).copyTo(ProductList.registrant))
	        {
	            return {
                    error: true
                };
	        }

			Transaction.wrap(function () {
                      ProductList.eventState = currentForms.giftregistry.event.eventaddress.states.state.value;
	        		  ProductList.eventCountry = currentForms.giftregistry.event.eventaddress.country.value;
                    }
                );

	        if (ProductList.coRegistrant !== null)
	        {
	            if (!Form.get(currentForms.giftregistry.event.coParticipant).copyTo(ProductList.coRegistrant))
	            {
	                return {
	                    error: true
	                };
	            }
	        }
	        else
	        {
	            if (!(currentForms.giftregistry.event.coParticipant.role.selectedOption === null || currentForms.giftregistry.event.coParticipant.role.selectedOption.htmlValue === ''))
	            {
	                var CreateProductListRegistrantResult = new Pipelet('CreateProductListRegistrant', {
	                    CreateCoRegistrant: true
	                }).execute({
	                    ProductList: ProductList
	                });
	                if (CreateProductListRegistrantResult.result === PIPELET_ERROR)
	                {
	                    return {
	                        error: true
	                    };
	                }
	                var ProductListRegistrant = CreateProductListRegistrantResult.ProductListRegistrant;


	                if (!Form.get(currentForms.giftregistry.event.coParticipant).copyTo(ProductList.coRegistrant))
	                {
	                    return {
	                        error: true
	                    };
	                }
	            }
	        }

	        showRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId === 'navPurchases')
	    {
	        showPurchases();
	        return;
	    }
	    else if (TriggeredAction.formId === 'navRegistry')
	    {
            showRegistry({
                ProductList: ProductList
            });
            return;
	    }
	    else if (TriggeredAction.formId === 'navShipping')
	    {
	        editAddresses();
	        return;
	    }
	}

	showEditParticipantForm();
}

/**
 * TODO
 */
function showPurchases()
{
    var currentForms = session.forms;


    Form.get(currentForms.giftregistry.purchases).clear();
    Form.get(currentForms.giftregistry.purchases).copyForm(ProductList.purchases);


    showPurchases();
}

/**
 * @FIXME Why are there two identically named functions?
 */
function showPurchases()
{
    app.getView().render('account/giftregistry/purchases');
}

/**
 * TODO
 */
// @secure
function showPurchasesInteraction() {
    // TODO this should end in a redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'navEvent')
	    {
	        editEvent();
	        return;
	    }
	    else if (TriggeredAction.formId === 'navRegistry')
	    {
	        ShowRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId === 'navShipping')
	    {
	        editAddresses();
	        return;
	    }
	}

	showPurchases();
}


/**
 * Renders a gift registry details page and provides basic actions such as item updates and publishing.
 */
function showRegistry(args) {
    var giftregistryForm = session.forms.giftregistry;

    var ProductList = args.ProductList;

    Form.get(giftregistryForm).copyFrom(ProductList);
    Form.get(giftregistryForm.event).copyFrom(ProductList);


    app.getView().render('account/giftregistry/registry', {
        Status : null,
        ProductList : ProductList
    });
}

/**
 * TODO
 */
function showRegistryInteraction() {
    // TODO this should end in redirects
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'addGiftCertificate')
	    {
	        var AddGiftCertificateToProductListResult = new Pipelet('AddGiftCertificateToProductList').execute({
	            ProductList: ProductList,
	            Priority: 2
	        });
	        var ProductListItem = AddGiftCertificateToProductListResult.ProductListItem;

	        showRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId === 'addToCart')
	    {
	        if (currentForms.giftregistry.items.triggeredFormAction.parent.object.type === currentForms.giftregistry.items.triggeredFormAction.parent.object.TYPE_GIFT_CERTIFICATE)
	        {
	            var GiftCertController = require('./GiftCert');
	            GiftCertController.Purchase();
	            return;
	        }
	        else
	        {
	            var CartController = require('./Cart');
	            CartController.AddProduct();
	            return;
	        }
	    }
	    else if (TriggeredAction.formId === 'deleteItem')
	    {
	        if (TriggeredAction.object.purchasedQuantity.value === 0)
	        {
	            var RemoveProductListItemResult = new Pipelet('RemoveProductListItem').execute({
	                ProductListItem: TriggeredAction.object
	            });
	        }
	        else
	        {
	            var Status = new dw.system.Status(dw.system.Status.ERROR, "delete.restriction");

	            app.getView().render('account/giftregistry/registry', {
	                Status: Status
	            });
	            return;
	        }
	    }
	    else if (TriggeredAction.formId === 'navEvent')
	    {
	        editEvent();
	        return;
	    }
	    else if (TriggeredAction.formId === 'navPurchases')
	    {
	        showPurchases();
	        return;
	    }
	    else if (TriggeredAction.formId === 'navShipping')
	    {
	        editAddresses();
	        return;
	    }
	    else if (TriggeredAction.formId === 'purchaseGiftCertificate')
	    {
	        var ProductListItem = TriggeredAction.object;

	        var GiftRegistryCustomerController = require('./GiftRegistryCustomer');
	        GiftRegistryCustomerController.PurchaseGiftCertificate();
	        return;
	    }
	    else if (TriggeredAction.formId === 'setPrivate')
	    {
	        Transaction.wrap(function () {
                         ProductList.public = false;
                    }
                );

	        showRegistry({
	            ProductList: ProductList
	        });
            return;
	    }
	    else if (TriggeredAction.formId === 'setPublic')
	    {
	        Transaction.wrap(function () {
                         ProductList.public = true;
                    }
                );

            showRegistry({
                ProductList: ProductList
            });
            return;
	    }
	    else if (TriggeredAction.formId === 'updateItem')
	    {
	        var updateAllResult = updateAll();

	        showRegistry({
	            ProductList: ProductList
	        });
            return;
	    }
	}

	// TODO
    app.getView().render('account/giftregistry/registry', {

    });
}


/**
 * Searches a gift registry by various parameters.
 */
function search() {
    var currentForms = session.forms;


    var SearchProductListsResult = new Pipelet('SearchProductLists', {
        PublicOnly: true
    }).execute({
        EventType: currentForms.giftregistry.search.simple.eventType.value,
        EventCity: currentForms.giftregistry.search.advanced.eventCity.value,
        EventState: currentForms.giftregistry.search.advanced.eventAddress.states.state.value,
        EventCountry: currentForms.giftregistry.search.advanced.eventAddress.country.value,
        RegistrantFirstName: currentForms.giftregistry.search.simple.registrantFirstName.value,
        RegistrantLastName: currentForms.giftregistry.search.simple.registrantLastName.value,
        Type: ProductList.TYPE_GIFT_REGISTRY,
        EventMonth: currentForms.giftregistry.search.advanced.eventMonth.value,
        EventYear: currentForms.giftregistry.search.advanced.eventYear.value,
        EventName: currentForms.giftregistry.search.advanced.eventName.value
    });
    var ProductLists = SearchProductListsResult.ProductLists;
/**
 * TODO
 */
    showSearch({
        ProductLists: ProductLists
    });
}


function showSearch(args)
{
    app.getView().render('account/giftregistry/giftregistryresults', {
        ProductLists: args.ProductLists
    });
}

/**
 * TODO
 */
function searchGiftRegistry() {
    // TODO this should end with a redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'search')
	    {
	        search();
	        return;
	    }
	}

    showSearch();
}


/**
 * Looks up a gift registry by its public UUID.
 */
function showRegistryByID() {
    var currentHttpParameterMap = request.httpParameterMap;

    if (!customer.authenticated)
    {
        var RequireLoginResult = RequireLogin();
        return;
    }


    var GetProductListResult = new Pipelet('GetProductList', {
        Create: false
    }).execute({
        ProductListID: currentHttpParameterMap.ProductListID.value
    });
    if (GetProductListResult.result === PIPELET_ERROR)
    {
        start();
        return;
    }
    var ProductList = GetProductListResult.ProductList;


    if (ProductList.owner.profile.customerNo === customer.profile.customerNo)
    {
        showRegistry({
            ProductList: ProductList
        });
        return;
    }


    var AccountController = require('./Account');
    AccountController.Show();
}


/**
 * TODO
 */
function updateAddressDetails() {
    var currentHttpParameterMap = request.httpParameterMap;
    var currentForms = session.forms;

    if (AddressFormType === "before")
    {
        var GetCustomerAddressResult = new Pipelet('GetCustomerAddress').execute({
            AddressID: empty(currentHttpParameterMap.addressID.value)?currentHttpParameterMap.dwfrm_giftregistry_eventaddress_addressBeforeList.value:currentHttpParameterMap.addressID.value,
            Customer: customer
        });
        var Address = GetCustomerAddressResult.Address;


        Form.get(currentForms.giftregistry.eventaddress.addressBeforeEvent).copyFrom(Address);
        Form.get(currentForms.giftregistry.eventaddress.addressBeforeEvent.states).copyForm(Address);
    }
    else
    {
        var GetCustomerAddressResult = new Pipelet('GetCustomerAddress').execute({
            AddressID: empty(currentHttpParameterMap.addressID.value)?currentHttpParameterMap.dwfrm_giftregistry_eventaddress_addressAfterList.value:currentHttpParameterMap.addressID.value,
            Customer: customer
        });
        var Address = GetCustomerAddressResult.Address;


        Form.get(currentForms.giftregistry.eventaddress.addressAfterEvent).copyFrom(Address);
        Form(currentForms.giftregistry.eventaddress.addressAfterEvent.states).copyForm(Address);
    }


    showAddresses();
}


/**
 * Attempts to replace a product in the gift registry.
 */
function replaceProductListItem() {
    var currentHttpParameterMap = request.httpParameterMap;


    var GetProductListResult = new Pipelet('GetProductList', {
        Create: false
    }).execute({
        ProductListID: currentHttpParameterMap.productlistid.stringValue
    });
    if (GetProductListResult.result === PIPELET_ERROR)
    {
        return {
            error: true
        };
    }
    var ProductList = GetProductListResult.ProductList;


    var ScriptResult = new Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'app_storefront_core:account/ReplaceProductListItem.ds'
    }).execute({
        ProductList: ProductList,
        plid: currentHttpParameterMap.uuid.stringValue
    });
    if (ScriptResult.result === PIPELET_ERROR)
    {
        app.getView().render('account/giftregistry/refreshgiftregistry', {
        });
        return;
    }


    var GetProductResult = new Pipelet('GetProduct').execute({
        ProductID: currentHttpParameterMap.pid.stringValue
    });
    if (GetProductResult.result === PIPELET_ERROR)
    {
        return {
            error: true
        };
    }
    var Product = GetProductResult.Product;


    var UpdateProductOptionSelectionsResult = new Pipelet('UpdateProductOptionSelections').execute({
        Product: Product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;


    var AddProductToProductListResult = new Pipelet('AddProductToProductList', {
        DisallowRepeats: true
    }).execute({
        Product: Product,
        ProductList: ProductList,
        Quantity: currentHttpParameterMap.Quantity.doubleValue,
        ProductOptionModel: ProductOptionModel,
        Priority: 2
    });


    app.getView().render('account/giftregistry/refreshgiftregistry', {
    });
}


/**
 * Provides address related gift registry actions such as address changes.
 */
function editAddresses() {
    var currentForms = session.forms;


    Form.get(currentForms.giftregistry).clear();


    if (ProductList.shippingAddress !== null)
    {
        Form.get(currentForms.giftregistry.eventaddress.addressBeforeEvent).copyFrom(ProductList.shippingAddress);
        Form.get(currentForms.giftregistry.eventaddress.addressBeforeEvent.states).copyFrom(ProductList.shippingAddress);
    }


    if (ProductList.postEventShippingAddress !== null)
    {
        Form.get(currentForms.giftregistry.eventaddress.addressAfterEvent).copyFrom(ProductList.postEventShippingAddress);
        Form.get(currentForms.giftregistry.eventaddress.addressAfterEvent.states).copyFrom(ProductList.postEventShippingAddress);
    }

    showAddresses();
}

/**
 * TODO
 */
function showAddresses() {
    app.getView().render('account/giftregistry/addresses');
}

/**
 * TODO
 @FIXME Why are there two functions with the same name?
 */
// @secure
function editAddresses() {
    // TODO this should end in some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction !== null)
	{
	    if (TriggeredAction.formId === 'back')
	    {
	        showRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId === 'confirm')
	    {
	        confirm();
	        return;
	    }
	    else if (TriggeredAction.formId === 'navEvent')
	    {
	        editEvent();
	        return;
	    }
	    else if (TriggeredAction.formId === 'navPurchases')
	    {
	        showPurchases();
	        return;
	    }
	    else if (TriggeredAction.formId === 'navRegistry')
	    {
	        ShowRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	}

	if (!currentForms.giftregistry.eventaddress.valid)
    {
	    showAddresses();
	    return;
    }

	if (currentForms.giftregistry.eventaddress.beforeEventAddress.value === 'newaddress' && !currentForms.giftregistry.eventaddress.addressBeforeEvent.valid)
    {
        showAddresses();
        return;
    }

    if (currentForms.giftregistry.eventaddress.afterEventAddress.value === 'newaddress' && !currentForms.giftregistry.eventaddress.addressAfterEvent.valid)
    {
        showAddresses();
        return;
    }

    confirm();
}

/**
 * TODO
 */
function confirm() {
    var currentForms = session.forms;
    var currentHttpParameterMap = request.httpParameterMap;
    if (currentForms.giftregistry.eventaddress.beforeEventAddress.value === 'newaddress')
    {
        var GetCustomerAddressResult = new Pipelet('GetCustomerAddress').execute({
            AddressID: currentForms.giftregistry.eventaddress.addressBeforeEvent.addressid.value,
            Customer: customer
        });
        if (GetCustomerAddressResult.result === PIPELET_NEXT)
        {
            var Address = GetCustomerAddressResult.Address;

            currentForms.giftregistry.eventaddress.addressBeforeEvent.addressid.invalidateFormElement();

            showAddresses();
            return;
        }

    }


    if (currentForms.giftregistry.eventaddress.afterEventAddress.value === 'newaddress')
    {
        var GetCustomerAddressResult = new Pipelet('GetCustomerAddress').execute({
            AddressID: currentForms.giftregistry.eventaddress.addressAfterEvent.addressid.value,
            Customer: customer
        });
        if (GetCustomerAddressResult.result === PIPELET_NEXT)
        {
            var Address = GetCustomerAddressResult.Address;

            currentForms.giftregistry.eventaddress.addressAfterEvent.addressid.invalidateFormElement();

            showAddresses();
            return;
        }
    }

    var productList = ProductList.get();

    var ScriptResult = new Pipelet('Script', {
        ScriptFile: 'app_storefront_core:account/giftregistry/AssignEventAddresses.ds',
        Transactional: true
    }).execute({
        ProductList: productList.object,
        Customer: customer,
        GiftRegistryForm: currentForms.giftregistry
    });
    if (ScriptResult.result === PIPELET_ERROR)
    {
        return {
            error: true
        };
    }

    showRegistry({
        ProductList: productList
    });
}


/**
 * Deletes a gift registry. Only the logged in owner of the gift registry can delete it.
 */
// @secure
function Delete() {
    var currentHttpParameterMap = request.httpParameterMap;


    var TargetPipeline = "GiftRegistry-Delete";
    var TargetPipelineParams = RedirectParams;


    var GetProductListResult = new Pipelet('GetProductList', {
        Create: false
    }).execute({
        ProductListID: currentHttpParameterMap.ProductListID.value
    });
    if (GetProductListResult.result === PIPELET_NEXT)
    {
        var ProductList = GetProductListResult.ProductList;

        if (customer.ID === ProductList.owner.ID)
        {
            new Pipelet('RemoveProductList').execute({
                ProductList: ProductList
            });
        }
    }

    // TODO redirect?
    start();
}


/**
 * Creates a gift registry.
 */
function create() {
    createOne();
}


function updateAll() {
    var currentForms = session.forms;

    // TODO do in a single transaction
	for (var i = 0; i < currentForms.giftregistry.items.length; i++) {
		var item = currentForms.giftregistry.items[i];
	    if (!Form.get(item).copyTo(item.object))
	    {
	        return {
	            error: true
	        };
	    }
	}
}


/*
 * Web exposed methods
 */
/** @see module:controllers/GiftRegistry~Confirmation */
exports.Confirmation = guard.ensure(['post', 'https'], confirmation);
/** @see module:controllers/GiftRegistry~Confirmation */
exports.Delete = guard.ensure(['get', 'https'], Delete);
/** @see module:controllers/GiftRegistry~EditAddresses */
exports.EditAddresses = guard.ensure(['post', 'https'], editAddresses);
/** @see module:controllers/GiftRegistry~EventParticipant */
exports.EventParticipant = guard.ensure(['post', 'https'], eventParticipant);
/** @see module:controllers/GiftRegistry~SearchGiftRegistry */
exports.SearchGiftRegistry = guard.ensure(['post'], searchGiftRegistry);
/** @see module:controllers/GiftRegistry~SelectProductListInteraction */
exports.SelectProductListInteraction = guard.ensure(['post', 'https'], selectProductListInteraction);
/** @see module:controllers/GiftRegistry~ShowPurchasesInteraction */
exports.ShowPurchasesInteraction = guard.ensure(['post', 'https'], showPurchasesInteraction);
/** @see module:controllers/GiftRegistry~ShowRegistryByID */
exports.ShowRegistryByID = guard.ensure(['get', 'https'], showRegistryByID);
/** @see module:controllers/GiftRegistry~ShowRegistryInteraction */
exports.ShowRegistryInteraction = guard.ensure(['get', 'https'], showRegistryInteraction);
/** @see module:controllers/GiftRegistry~SubmitFormLanding */
exports.SubmitFormLanding = guard.ensure(['post', 'https'], submitFormLanding);
/** @see module:controllers/GiftRegistry~registrymain */
exports.registrymain = guard.ensure(['post', 'https'], registrymain);
/** @see module:controllers/GiftRegistry~Start */
exports.Start = guard.ensure(['get', 'https', 'loggedIn'], start, {scope : 'giftregistry'});
/** @see module:controllers/GiftRegistry~AddProduct */
exports.AddProduct = guard.ensure(['get', 'https', 'loggedIn'], addProduct);

/*
 * Local methods
 */
exports.ReplaceProductListItem = replaceProductListItem;
exports.Search = search;
exports.ShowRegistry = showRegistry;
