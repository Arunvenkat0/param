var g = require('./dw/guard');

/**
 * The GiftRegistry pipeline contains a set of workflows that allow you to create and maintain one or more Gift Registries.
 */

/**
 * Controls the login, which is required to access gift registry related actions.
 */
function requireLogin(args)
{
    var loginForm = session.forms.login;

    if (customer.registered)
    {
        loginForm.username.value = customer.profile.credentials.login;
        loginForm.rememberme.value = true;
    }


    var web = require('./dw/web');
    web.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("myaccount-login"));

    loginForm.targetAction.value = args.TargetAction;
    loginForm.targetParameters.value = (args.TargetParameters != null) ? JSON.stringify(args.TargetParameters) : null;
 
    response.renderTemplate('account/giftregistry/giftregistrylanding', {
        RegistrationStatus : false
    });
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
                TargetAction : 'GiftRegistry-' + action.name
            });
            return;
        }

        action();
    };
}


function SubmitFormLanding()
{
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'search')
	    {
	        Search();
	        return;
	    }
	}

	showLanding();
}


/**
 * Renders a list of gift registries.
 */
function Start()
{
    var productListsForm = session.forms.productlists;
    
    var form = require('./dw/form');
    form.clearFormElement(productListsForm);

    
    var GetProductListsResult = new dw.system.Pipelet('GetProductLists').execute({
        Customer: customer,
        Type: dw.customer.ProductList.TYPE_GIFT_REGISTRY
    });
    var ProductLists = GetProductListsResult.ProductLists;

    
    form.updateFormWithObject(productListsForm.items, ProductLists);

    
    var web = require('./dw/web');
    web.updatePageMetaDataForContent(dw.content.ContentMgr.getContent("myaccount-giftregistry"));
    
    
    response.renderTemplate('account/giftregistry/registrylist');
}


function registrymain()
{
    // TODO this should trigger some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'create')
	    {
	        create();
	        return;
	    }
	    else if (TriggeredAction.formId == 'search')
	    {
	        var productListsForm = session.forms.productlists;

	        if (productListsForm.search.eventMonth.value != null && productListsForm.search.eventYear.value == null)
	        {
	            var form = require('./dw/form');
	            form.invalidateFormElement(productListsForm.search.eventYear);

	            response.renderTemplate('account/giftregistry/registrylist');
	            return;
	        }
	        
	        Search();
	        return;
	    }
	}
	
    response.renderTemplate('account/giftregistry/registrylist');
}


/**
 * Adds a product to the gift registry. The product must either be a Product object, or is identified by its 
 * product ID using the dictionary key ProductID or, if empty, uses the HTTP parameter "pid".
 */
function AddProduct()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    
    // TODO this function looks exactly the same as like AddProduct in Wishlist
    // TODO where should this come from?
    var Product = null;
    
    if (Product == null)
    {
        if (CurrentHttpParameterMap.pid.stringValue != null)
        {
            var ProductID = CurrentHttpParameterMap.pid.stringValue;
        
            var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
                ProductID: ProductID
            });
            if (GetProductResult.result == PIPELET_ERROR)
            {
                return {
                    error: true
                };
            }
            Product = GetProductResult.Product;
        }
    }


    var GetProductListsResult = new dw.system.Pipelet('GetProductLists').execute({
        Customer: customer,
        Type: dw.customer.ProductList.TYPE_GIFT_REGISTRY
    });
    var ProductLists = GetProductListsResult.ProductLists;

    var ProductList = null;

    if (typeof(ProductLists) != 'undefined' && ProductLists != null && !ProductLists.isEmpty())
    {
        if (ProductLists.size() == 1)
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

    
    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
        Product: Product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;

    
    var AddProductToProductListResult = new dw.system.Pipelet('AddProductToProductList', {
        DisallowRepeats: true
    }).execute({
        Product: Product,
        ProductList: ProductList,
        Quantity: CurrentHttpParameterMap.Quantity.getIntValue(),
        ProductOptionModel: ProductOptionModel,
        Priority: 2
    });

    
    ShowRegistry({
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
    
    var form = require('./dw/form');
    form.clearFormElement(session.forms.giftregistry);

    participantForm.firstName.value = customer.profile.firstName;
    participantForm.lastName.value = customer.profile.lastName;
    participantForm.email.value = customer.profile.email;
    
    response.renderTemplate('account/giftregistry/eventparticipant');
}


function EventParticipant()
{
    // TODO this should be some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'back')
	    {
	        Start();
	        return;
	    }
	    else if (TriggeredAction.formId == 'confirm')
	    {
	        if (customer.profile.addressBook.addresses.size() == 0)
	        {
	            CurrentForms.giftregistry.eventaddress.beforeEventAddress.value = "newaddress";
	        }
	        
	        showAddresses();
	    }
	}

    response.renderTemplate('account/giftregistry/eventparticipant');
}


function showAddresses()
{
    response.renderTemplate('account/giftregistry/addresses');
}


function ParticipantAddresses()
{
    // TODO this should trigger some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'back')
	    {
	        new dw.system.Pipelet('Script', {
	            Transactional: false,
	            OnError: 'PIPELET_ERROR',
	            ScriptFile: 'account/giftregistry/CopyAddressFormFields.ds'
	        }).execute({
	            GiftRegistryForm: CurrentForms.giftregistry
	        });
	        
	        response.renderTemplate('account/giftregistry/eventparticipant');
	        return;
	    }
	    else if (TriggeredAction.formId == 'confirm')
	    {
	        if (CurrentForms.giftregistry.copyAddress.checked)
	        {
	            new dw.system.Pipelet('Script', {
	                Transactional: false,
	                OnError: 'PIPELET_ERROR',
	                ScriptFile: 'account/giftregistry/AssignPostEventShippingAddress.ds'
	            }).execute({
	                GiftRegistryForm: CurrentForms.giftregistry
	            });
	        }
	        
	        showConfirmation();
	        return;
	    }
	    else if (TriggeredAction.formId == 'selectAddressAfter')
	    {
	        var AddressFormType = "after";

	        updateAddressDetails();
	        return;
	    }
	    else if (TriggeredAction.formId == 'selectAddressBefore')
	    {
	        var AddressFormType = "before";

	        updateAddressDetails();
	        return;
	    }
	}

	if (!CurrentForms.giftregistry.eventaddress.valid)
    {
	    showAddresses();
	    return;
    }

	if (CurrentForms.giftregistry.eventaddress.beforeEventAddress.value == 'newaddress' && !CurrentForms.giftregistry.eventaddress.addressBeforeEvent.valid)
    {
        showAddresses();
        return;
    }

    if (CurrentForms.giftregistry.eventaddress.afterEventAddress.value == 'newaddress' && !CurrentForms.giftregistry.eventaddress.addressAfterEvent.valid)
    {
        showAddresses();
        return;
    }
    
    showConfirmation();
}


function showConfirmation()
{
    response.renderTemplate('account/giftregistry/giftregistryconfirmation');
}


function Confirmation()
{
    // TODO this should trigger some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'back')
	    {
	        showAddresses();
	        return;
	    }
	    else if (TriggeredAction.formId == 'confirm')
	    {
	        /*
	         * If the product list isn't null then confirm has been called via the browser back button
	         */	        
	        if (CurrentForms.giftregistry.object != null)
	        {
	            var GetProductListResult = new dw.system.Pipelet('GetProductList', {
	                Create: false
	            }).execute({
	                ProductListID: CurrentForms.giftregistry.object.UUID
	            });
	            if (GetProductListResult.result == PIPELET_NEXT)
	            {
	                var ProductList = GetProductListResult.ProductList;
	                
	                ShowRegistry({
	                    ProductList: ProductList
	                });
	                return;
	            }
	        }

	        if (CurrentForms.giftregistry.eventaddress.beforeEventAddress.value == 'newaddress')
	        {
	            var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
	                AddressID: CurrentForms.giftregistry.eventaddress.addressBeforeEvent.addressid.value,
	                Customer: customer
	            });
	            if (GetCustomerAddressResult.result == PIPELET_NEXT)
	            {
	                var Address = GetCustomerAddressResult.Address;

	                var form = require('./dw/form');
	                form.invalidateFormElement(CurrentForms.giftregistry.eventaddress.addressBeforeEvent.addressid);
	                
	                ShowAddresses();
	                return;	                
	            }
	        }

	        
	        if (CurrentForms.giftregistry.eventaddress.afterEventAddress.value == 'newaddress')
	        {
	            var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
	                AddressID: CurrentForms.giftregistry.eventaddress.addressAfterEvent.addressid.value,
	                Customer: customer
	            });
	            if (GetCustomerAddressResult.result == PIPELET_NEXT)
	            {
	                var Address = GetCustomerAddressResult.Address;

	                var form = require('./dw/form');
	                form.invalidateFormElement(CurrentForms.giftregistry.eventaddress.addressAfterEvent.addressid);

	                ShowAddresses();
                    return;                 
	            }
	        }

	        
	        var CreateProductListResult = new dw.system.Pipelet('CreateProductList').execute({
	            Type: dw.customer.ProductList.TYPE_GIFT_REGISTRY,
	            Customer: customer
	        });
	        var ProductList = CreateProductListResult.ProductList;

	        
	        var txn = require('dw/system/Transaction');
	        txn.begin();
	        
	        ProductList.eventState = CurrentForms.giftregistry.event.eventaddress.states.state.value;
	        ProductList.eventCountry = CurrentForms.giftregistry.event.eventaddress.country.value;
	        
	        txn.commit();

	        
	        var form = require('./dw/form');
	        if (!form.updateObjectWithForm(ProductList, CurrentForms.giftregistry.event))
	        {
	            return {
	                error: true
	            };
	        }

	    
	        var CreateProductListRegistrantResult = new dw.system.Pipelet('CreateProductListRegistrant', {
	            CreateCoRegistrant: false
	        }).execute({
	            ProductList: ProductList
	        });
	        if (CreateProductListRegistrantResult.result == PIPELET_ERROR)
	        {
                return {
                    error: true
                };
	        }
	        var ProductListRegistrant = CreateProductListRegistrantResult.ProductListRegistrant;
	    

	        var form = require('./dw/form');
	        if (!form.updateObjectWithForm(ProductListRegistrant, CurrentForms.giftregistry.event.participant))
	        {
                return {
                    error: true
                };
	        }

	        
	        if (!(CurrentForms.giftregistry.event.coParticipant.role.selectedOption == null || CurrentForms.giftregistry.event.coParticipant.role.selectedOption.htmlValue == ''))
	        {
	            var CreateProductListRegistrantResult = new dw.system.Pipelet('CreateProductListRegistrant', {
	                CreateCoRegistrant: true
	            }).execute({
	                ProductList: ProductList
	            });
	            if (CreateProductListRegistrantResult.result == PIPELET_ERROR)
	            {
	                return {
	                    error: true
	                };
	            }
	            var ProductListRegistrant = CreateProductListRegistrantResult.ProductListRegistrant;

	            
	            var form = require('./dw/form');
	            if (!form.updateObjectWithForm(ProductListRegistrant, CurrentForms.giftregistry.event.coParticipant))
	            {
	                return {
	                    error: true
	                };
	            }
	        }

	        
	        var ScriptResult = new dw.system.Pipelet('Script', {
	            ScriptFile: 'account/giftregistry/AssignEventAddresses.ds',
	            Transactional: true
	        }).execute({
	            ProductList: ProductList,
	            GiftRegistryForm: CurrentForms.giftregistry,
	            Customer: customer
	        });
	        if (ScriptResult.result == PIPELET_ERROR)
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
 * Selects a gift registry from a list of gift registries, e.g. found by the registry search.
 */
function selectOne()
{
    var CurrentForms = session.forms;

    
    var form = require('./dw/form');
    form.updateFormWithObject(CurrentForms.productlists.items, ProductLists);

    response.renderTemplate('account/giftregistry/registryselect');
}

    
/**
 * Provides actions to edit a gift registry event.
 */
function SelectProductListInteraction()
{
    // TODO this should end in a redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'select')
	    {
	        var ProductList = TriggeredAction.object;
	        // TODO interaction continue not supported anymore
	        // where to continue now?
	        return;
	    }
	}
	
	// TODO what to render otherwise?
}


function editEvent()
{
    var CurrentForms = session.forms;

    
    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.giftregistry);
    form.updateFormWithObject(CurrentForms.giftregistry.event, ProductList, true);
    form.updateFormWithObject(CurrentForms.giftregistry.event.participant, ProductList.registrant);
    
    if (ProductList.coRegistrant != null)
    {
        form.updateFormWithObject(CurrentForms.giftregistry.event.coParticipant, ProductList.coRegistrant);
    }

    
    CurrentForms.giftregistry.event.eventaddress.states.state.value = ProductList.eventState;
    CurrentForms.giftregistry.event.eventaddress.country.value = ProductList.eventCountry;

    
    showEditParticipantForm();
}


function showEditParticipantForm()
{
    response.renderTemplate('account/giftregistry/eventparticipant');
}

// TODO this is probably never called?
function EditEventParticipant()
{
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'back')
	    {
	        // TODO back???
	        ShowRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId == 'confirm')
	    {
	        var form = require('./dw/form');
	        if (!form.updateObjectWithForm(ProductList, CurrentForms.giftregistry.event))
	        {
	            return {
                    error: true
                };
	        }


	        if (!form.updateObjectWithForm(ProductList.registrant, CurrentForms.giftregistry.event.participant))
	        {
	            return {
                    error: true
                };
	        }
	        

	        var txn = require('dw/system/Transaction');
	        txn.begin();
	        
	        ProductList.eventState = CurrentForms.giftregistry.event.eventaddress.states.state.value;
	        ProductList.eventCountry = CurrentForms.giftregistry.event.eventaddress.country.value;
	        
	        txn.commit();

	        
	        if (ProductList.coRegistrant != null)
	        {
	            var form = require('./dw/form');
	            if (!form.updateObjectWithForm(ProductList.coRegistrant, CurrentForms.giftregistry.event.coParticipant))
	            {
	                return {
	                    error: true
	                };
	            }
	        }
	        else
	        {
	            if (!(CurrentForms.giftregistry.event.coParticipant.role.selectedOption == null || CurrentForms.giftregistry.event.coParticipant.role.selectedOption.htmlValue == ''))
	            {
	                var CreateProductListRegistrantResult = new dw.system.Pipelet('CreateProductListRegistrant', {
	                    CreateCoRegistrant: true
	                }).execute({
	                    ProductList: ProductList
	                });
	                if (CreateProductListRegistrantResult.result == PIPELET_ERROR)
	                {
	                    return {
	                        error: true
	                    };
	                }
	                var ProductListRegistrant = CreateProductListRegistrantResult.ProductListRegistrant;
	                
	                
	                var form = require('./dw/form');
	                if (!form.updateObjectWithForm(ProductList.coRegistrant, CurrentForms.giftregistry.event.coParticipant))
	                {
	                    return {
	                        error: true
	                    };
	                }
	            }
	        }

	        ShowRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId == 'navPurchases')
	    {
	        showPurchases();
	        return;
	    }
	    else if (TriggeredAction.formId == 'navRegistry')
	    {
            ShowRegistry({
                ProductList: ProductList
            });
            return;
	    }
	    else if (TriggeredAction.formId == 'navShipping')
	    {
	        editAddresses();
	        return;
	    }
	}
	
	showEditParticipantForm();
}


function showPurchases()
{
    var CurrentForms = session.forms;

    
    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.giftregistry.purchases);
    form.updateFormWithObject(CurrentForms.giftregistry.purchases, ProductList.purchases);

    
    showPurchases();
}


function showPurchases()
{
    response.renderTemplate('account/giftregistry/purchases');
}


// @secure    
function ShowPurchasesInteraction()
{
    // TODO this should end in a redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'navEvent')
	    {
	        editEvent();
	        return;
	    }
	    else if (TriggeredAction.formId == 'navRegistry')
	    {
	        ShowRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId == 'navShipping')
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
function ShowRegistry(args)
{
    var giftregistryForm = session.forms.giftregistry;

    var ProductList = args.ProductList;
    
    var form = require('./dw/form');
    form.updateFormWithObject(giftregistryForm, ProductList, true);
    form.updateFormWithObject(giftregistryForm.event, ProductList, true);

    
    response.renderTemplate('account/giftregistry/registry', {
        Status : null,
        ProductList : ProductList
    });
}


function ShowRegistryInteraction()
{
    // TODO this should end in redirects
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'addGiftCertificate')
	    {
	        var AddGiftCertificateToProductListResult = new dw.system.Pipelet('AddGiftCertificateToProductList').execute({
	            ProductList: ProductList,
	            Priority: 2
	        });
	        var ProductListItem = AddGiftCertificateToProductListResult.ProductListItem;

	        ShowRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId == 'addToCart')
	    {
	        if (CurrentForms.giftregistry.items.triggeredFormAction.parent.object.type == CurrentForms.giftregistry.items.triggeredFormAction.parent.object.TYPE_GIFT_CERTIFICATE)
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
	    else if (TriggeredAction.formId == 'deleteItem')
	    {
	        if (TriggeredAction.object.purchasedQuantity.value == 0)
	        {
	            var RemoveProductListItemResult = new dw.system.Pipelet('RemoveProductListItem').execute({
	                ProductListItem: TriggeredAction.object
	            });
	        }
	        else
	        {
	            var Status = new dw.system.Status(dw.system.Status.ERROR, "delete.restriction");

	            response.renderTemplate('account/giftregistry/registry', {
	                Status: Status
	            });
	            return;
	        }
	    }
	    else if (TriggeredAction.formId == 'navEvent')
	    {
	        editEvent();
	        return;
	    }
	    else if (TriggeredAction.formId == 'navPurchases')
	    {
	        showPurchases();
	        return;
	    }
	    else if (TriggeredAction.formId == 'navShipping')
	    {
	        editAddresses();
	        return;
	    }
	    else if (TriggeredAction.formId == 'purchaseGiftCertificate')
	    {
	        var ProductListItem = TriggeredAction.object;

	        var GiftRegistryCustomerController = require('./GiftRegistryCustomer');
	        GiftRegistryCustomerController.PurchaseGiftCertificate();
	        return;
	    }
	    else if (TriggeredAction.formId == 'setPrivate')
	    {
	        var txn = require('dw/system/Transaction');
	        txn.begin();
	        
	        ProductList.public = false;
	        
	        txn.commit();

	        ShowRegistry({
	            ProductList: ProductList
	        });
            return;
	    }
	    else if (TriggeredAction.formId == 'setPublic')
	    {
	        var txn = require('dw/system/Transaction');
	        txn.begin();
	        
	        ProductList.public = true;
	        
	        txn.commit();

            ShowRegistry({
                ProductList: ProductList
            });
            return;
	    }
	    else if (TriggeredAction.formId == 'updateItem')
	    {
	        var updateAllResult = updateAll();

	        ShowRegistry({
	            ProductList: ProductList
	        });
            return;
	    }
	}
	
	// TODO
    response.renderTemplate('account/giftregistry/registry', {
        
    });
}


/**
 * Searches a gift registry by various parameters.
 */
function Search()
{
    var CurrentForms = session.forms;

    
    var SearchProductListsResult = new dw.system.Pipelet('SearchProductLists', {
        PublicOnly: true
    }).execute({
        EventType: CurrentForms.productlists.search.eventType.value,
        EventCity: CurrentForms.productlists.search.eventCity.value,
        EventState: CurrentForms.productlists.search.eventState.value,
        EventCountry: CurrentForms.productlists.search.eventCountry.value,
        RegistrantFirstName: CurrentForms.productlists.search.registrantFirstName.value,
        RegistrantLastName: CurrentForms.productlists.search.registrantLastName.value,
        Type: dw.customer.ProductList.TYPE_GIFT_REGISTRY,
        EventMonth: CurrentForms.productlists.search.eventMonth.value,
        EventYear: CurrentForms.productlists.search.eventYear.value,
        EventName: CurrentForms.productlists.search.eventName.value
    });
    var ProductLists = SearchProductListsResult.ProductLists;

    showSearch({
        ProductLists: ProductLists
    });
}


function showSearch(args)
{
    response.renderTemplate('account/giftregistry/giftregistryresults', {
        ProductLists: args.ProductLists
    });
}


function SearchGiftRegistry()
{
    // TODO this should end with a redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'search')
	    {
	        Search();
	        return;
	    }
	}

    showSearch();
}


/**
 * Looks up a gift registry by its public UUID.
 */
function ShowRegistryByID()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    
    if (!customer.authenticated)
    {
        var RequireLoginResult = RequireLogin();
        return;
    }
    

    var GetProductListResult = new dw.system.Pipelet('GetProductList', {
        Create: false
    }).execute({
        ProductListID: CurrentHttpParameterMap.ProductListID.value
    });
    if (GetProductListResult.result == PIPELET_ERROR)
    {
        Start();
        return;
    }
    var ProductList = GetProductListResult.ProductList;


    if (ProductList.owner.profile.customerNo == customer.profile.customerNo)
    {
        ShowRegistry({
            ProductList: ProductList
        });
        return;
    }
   

    var AccountController = require('./Account');
    AccountController.Show();
}



function updateAddressDetails()
{
    var CurrentHttpParameterMap = request.httpParameterMap;
    var CurrentForms = session.forms;

    if (AddressFormType == "before")
    {
        var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
            AddressID: empty(CurrentHttpParameterMap.addressID.value)?CurrentHttpParameterMap.dwfrm_giftregistry_eventaddress_addressBeforeList.value:CurrentHttpParameterMap.addressID.value,
            Customer: customer
        });
        var Address = GetCustomerAddressResult.Address;
        
        
        var form = require('./dw/form');
        form.updateFormWithObject(CurrentForms.giftregistry.eventaddress.addressBeforeEvent, Address);
        form.updateFormWithObject(CurrentForms.giftregistry.eventaddress.addressBeforeEvent.states, Address);
    }
    else
    {
        var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
            AddressID: empty(CurrentHttpParameterMap.addressID.value)?CurrentHttpParameterMap.dwfrm_giftregistry_eventaddress_addressAfterList.value:CurrentHttpParameterMap.addressID.value,
            Customer: customer
        });
        var Address = GetCustomerAddressResult.Address;

        
        var form = require('./dw/form');
        form.updateFormWithObject(CurrentForms.giftregistry.eventaddress.addressAfterEvent, Address);
        form.updateFormWithObject(CurrentForms.giftregistry.eventaddress.addressAfterEvent.states, Address);
    }
    
    
    showAddresses();
}


/**
 * Attempts to replace a product in the gift registry.
 */
function ReplaceProductListItem()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    
    var GetProductListResult = new dw.system.Pipelet('GetProductList', {
        Create: false
    }).execute({
        ProductListID: CurrentHttpParameterMap.productlistid.stringValue
    });
    if (GetProductListResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
    }
    var ProductList = GetProductListResult.ProductList;

    
    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional: true,
        OnError: 'PIPELET_ERROR',
        ScriptFile: 'account/ReplaceProductListItem.ds'
    }).execute({
        ProductList: ProductList,
        plid: CurrentHttpParameterMap.uuid.stringValue
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('account/giftregistry/refreshgiftregistry', {
        });
        return;
    }

    
    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
        ProductID: CurrentHttpParameterMap.pid.stringValue
    });
    if (GetProductResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
    }
    var Product = GetProductResult.Product;

    
    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
        Product: Product
    });
    var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;

    
    var AddProductToProductListResult = new dw.system.Pipelet('AddProductToProductList', {
        DisallowRepeats: true
    }).execute({
        Product: Product,
        ProductList: ProductList,
        Quantity: CurrentHttpParameterMap.Quantity.doubleValue,
        ProductOptionModel: ProductOptionModel,
        Priority: 2
    });

    
    response.renderTemplate('account/giftregistry/refreshgiftregistry', {
    });
}


/**
 * Provides address related gift registry actions such as address changes.
 */
function editAddresses()
{
    var CurrentForms = session.forms;

    
    var form = require('./dw/form');
    form.clearFormElement(CurrentForms.giftregistry);

    
    if (ProductList.shippingAddress != null)
    {
        form.updateFormWithObject(CurrentForms.giftregistry.eventaddress.addressBeforeEvent, ProductList.shippingAddress);
        form.updateFormWithObject(CurrentForms.giftregistry.eventaddress.addressBeforeEvent.states, ProductList.shippingAddress);
    }
    
    
    if (ProductList.postEventShippingAddress != null)
    {
        form.updateFormWithObject(CurrentForms.giftregistry.eventaddress.addressAfterEvent, ProductList.postEventShippingAddress);
        form.updateFormWithObject(CurrentForms.giftregistry.eventaddress.addressAfterEvent.states, ProductList.postEventShippingAddress);
    }
    
    showAddresses();
}


function showAddresses()
{
    response.renderTemplate('account/giftregistry/addresses');
}


// @secure
function EditAddresses()
{
    // TODO this should end in some redirect
	var TriggeredAction = request.triggeredFormAction;
	if (TriggeredAction != null)
	{
	    if (TriggeredAction.formId == 'back')
	    {
	        ShowRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	    else if (TriggeredAction.formId == 'confirm')
	    {
	        confirm();
	        return;
	    }
	    else if (TriggeredAction.formId == 'navEvent')
	    {
	        editEvent();
	        return;
	    }
	    else if (TriggeredAction.formId == 'navPurchases')
	    {
	        showPurchases();
	        return;
	    }
	    else if (TriggeredAction.formId == 'navRegistry')
	    {
	        ShowRegistry({
	            ProductList: ProductList
	        });
	        return;
	    }
	}

	if (!CurrentForms.giftregistry.eventaddress.valid)
    {
	    showAddresses();
	    return;
    }

	if (CurrentForms.giftregistry.eventaddress.beforeEventAddress.value == 'newaddress' && !CurrentForms.giftregistry.eventaddress.addressBeforeEvent.valid)
    {
        showAddresses();
        return;
    }
	
    if (CurrentForms.giftregistry.eventaddress.afterEventAddress.value == 'newaddress' && !CurrentForms.giftregistry.eventaddress.addressAfterEvent.valid)
    {
        showAddresses();
        return;
    }

    confirm();
}


function confirm()
{
    if (CurrentForms.giftregistry.eventaddress.beforeEventAddress.value == 'newaddress')
    {
        var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
            AddressID: CurrentForms.giftregistry.eventaddress.addressBeforeEvent.addressid.value,
            Customer: customer
        });
        if (GetCustomerAddressResult.result == PIPELET_NEXT)
        {
            var Address = GetCustomerAddressResult.Address;

            var form = require('./dw/form');
            form.invalidateFormElement(CurrentForms.giftregistry.eventaddress.addressBeforeEvent.addressid);            
            
            showAddresses();
            return;
        }

    }


    if (CurrentForms.giftregistry.eventaddress.afterEventAddress.value == 'newaddress')
    {
        var GetCustomerAddressResult = new dw.system.Pipelet('GetCustomerAddress').execute({
            AddressID: CurrentForms.giftregistry.eventaddress.addressAfterEvent.addressid.value,
            Customer: customer
        });
        if (GetCustomerAddressResult.result == PIPELET_NEXT)
        {
            var Address = GetCustomerAddressResult.Address;

            var form = require('./dw/form');
            form.invalidateFormElement(CurrentForms.giftregistry.eventaddress.addressAfterEvent.addressid);

            showAddresses();
            return;
        }
    }

    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile: 'account/giftregistry/AssignEventAddresses.ds',
        Transactional: true
    }).execute({
        ProductList: ProductList,
        Customer: customer,
        GiftRegistryForm: CurrentForms.giftregistry
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        return {
            error: true
        };
    }

    ShowRegistry({
        ProductList: ProductList
    });
}


/**
 * Deletes a gift registry. Only the logged in owner of the gift registry can delete it.
 */
// @secure
function Delete()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    
    var TargetPipeline = "GiftRegistry-Delete";
    var TargetPipelineParams = RedirectParams;

    
    if (!customer.authenticated)
    {
        var RequireLoginResult = RequireLogin();
        return;
    }

    
    var GetProductListResult = new dw.system.Pipelet('GetProductList', {
        Create: false
    }).execute({
        ProductListID: CurrentHttpParameterMap.ProductListID.value
    });
    if (GetProductListResult.result == PIPELET_NEXT)
    {
        var ProductList = GetProductListResult.ProductList;

        if (customer.ID == ProductList.owner.ID)
        {
            new dw.system.Pipelet('RemoveProductList').execute({
                ProductList: ProductList
            });
        }
    }

    // TODO redirect?
    Start();
}


/**
 * Creates a gift registry.
 */
function create()
{
    if (!customer.authenticated)
    {
        requireLogin({
            TargetAction : 'GiftRegistry-Start'
        });
        return;
    }

    createOne();
    

    // TODO redirect?
    /*ShowRegistry({
        ProductList: ProductList
    });*/
}


function updateAll()
{
    var CurrentForms = session.forms;

    var form = require('./dw/form');

    
    // TODO do in a single transaction
	for (var i = 0; i < CurrentForms.giftregistry.items.length; i++) {
		var Item = CurrentForms.giftregistry.items[i];
	    if (!form.updateObjectWithForm(Item.object, Item))
	    {
	        return {
	            error: true
	        };
	    }
	}
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Confirmation                    = g.httpsPost(Confirmation);
exports.Delete                          = g.httpsGet(Delete);
exports.EditAddresses                   = g.httpsPost(EditAddresses);
exports.EventParticipant                = g.httpsPost(EventParticipant);
exports.SearchGiftRegistry              = g.post(SearchGiftRegistry);
exports.SelectProductListInteraction    = g.httpsPost(SelectProductListInteraction);
exports.ShowPurchasesInteraction        = g.httpsPost(ShowPurchasesInteraction);
exports.ShowRegistryByID                = g.httpsGet(ShowRegistryByID);
exports.ShowRegistryInteraction         = g.httpsGet(ShowRegistryInteraction);
exports.SubmitFormLanding               = g.httpsPost(SubmitFormLanding);
exports.registrymain                    = g.httpsPost(registrymain);
exports.Start                           = g.httpsGet(loggedIn(Start));
exports.AddProduct                      = g.httpsGet(loggedIn(AddProduct));

/*
 * Local methods
 */
exports.ReplaceProductListItem = ReplaceProductListItem;
exports.Search = Search;
exports.ShowRegistry = ShowRegistry;
