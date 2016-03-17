'use strict';

/**
 * Controller for gift registry business logic.
 *
 * @module  controllers/GiftRegistry
 */

/* API Includes */
var Pipelet = require('dw/system/Pipelet');
var giftRegistryType = require('dw/customer/ProductList').TYPE_GIFT_REGISTRY;
var GiftCertProductListItem = require('dw/customer/ProductListItem').TYPE_GIFT_CERTIFICATE;
var ProductListMgr = require('dw/customer/ProductListMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Content = app.getModel('Content');
var ProductList = app.getModel('ProductList');
var Form = app.getModel('Form');

/**
 * Renders a list of gift registries associated with the current customer.
 * Clears the productlists form and gets the product lists associated with a customer. Gets the
 * myaccount-giftregistry content asset, updates the page metadata and renders the registry list
 * page (account/giftregistry/registrylist template).
 */
function start() {
    var accountGiftRegistry = Content.get('myaccount-giftregistry');
    var pageMeta = require('~/cartridge/scripts/meta');
    var productLists = ProductListMgr.getProductLists(customer, giftRegistryType);
    var productListsForm = Form.get('productlists');
    var productListItems = productListsForm.get('items');

    pageMeta.update(accountGiftRegistry);

    Form.get(productListsForm).clear();
    productListItems.copyFrom(productLists);

    app.getView({
        ContinueURL: URLUtils.https('GiftRegistry-SubmitForm')
    }).render('account/giftregistry/registrylist');
}

/**
 * Controls the form submission that is required to access gift registry actions.
 */
function submitForm() {
    Form.get('giftregistry').handleAction({
        addToCart: function (form) {
            var cart = app.getModel('Cart').goc();

            if (form.items.triggeredAction.parent.object.type === GiftCertProductListItem) {
                response.redirect(URLUtils.https('GiftCert-Purchase'));
            } else {
                var renderInfo = cart.addProductToCart();

                if (renderInfo.template === 'checkout/cart/cart') {
                    app.getView('Cart', {
                        Basket: cart
                    }).render(renderInfo.template);
                } else if (renderInfo.format === 'ajax') {
                    app.getView('Cart', {
                        cart: cart,
                        BonusDiscountLineItem: renderInfo.newBonusDiscountLineItem
                    }).render(renderInfo.template);
                } else {
                    response.redirect(URLUtils.url('Cart-Show'));
                }

            }
        },

        create: createOne,

        confirm: confirm,

        deleteItem: function (form, action) {
            var productListItem = action.object;
            var productList = ProductList.get(productListItem.list);

            productList.removeItem(productListItem);

            showRegistry({ProductList: productList.object});
        },

        public: function (form, action) {
            var productListItem = action.object;
            productListItem.setPublic(productListItem.public);
        },

        search: function (form, action) {
            var productLists = ProductList.search(action.parent.simple, giftRegistryType);

            app.getView({ProductLists: productLists}).render('account/giftregistry/giftregistryresults');
        },

        setParticipants: setParticipants,

        setBeforeAfterAddresses: handleRegistryAddresses,

        setPublic: function (form, action) {
            var productList = action.object;
            setProductListPublic(productList, true);
        },

        setPrivate: function (form, action) {
            var productList = action.object;
            setProductListPublic(productList, false);
        },

        updateItem: function (form, action) {
            var productList = ProductList.get(action.object.list);
            productList.updateItem(form.items);

            showRegistry({ProductList: productList.object});
        },

        addGiftCertificate: function (form) {
            var productList = ProductList.get(form.object);

            Transaction.wrap(function () {
                productList.createGiftCertificateItem();
            });

            showRegistry({ProductList: productList.object});
        }
    });
}

/**
 * Creates or searches for a gift registry. Renders the registry list
 * page (account/giftregistry/registrylist template).
 */
function registrymain() {
    // TODO this should trigger some redirect
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'create') {
            create();
            return;
        } else if (TriggeredAction.formId === 'search') {
            var productListsForm = session.forms.productlists;

            if (productListsForm.search.eventMonth.value !== null && productListsForm.search.eventYear.value === null) {
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
    var params = request.httpParameterMap;
    var productId = params.pid.stringValue;
    var ProductModel = app.getModel('Product');
    var product;
    var productList;
    var productLists;
    var qtyProductLists;

    if (productId) {
        product = ProductModel.get(productId);
    } else {
        throw 'Product ID required but not provided.';
    }

    productLists = ProductListMgr.getProductLists(customer, giftRegistryType);
    qtyProductLists = productLists.size();

    if (productLists && qtyProductLists) {
        if (qtyProductLists === 1) {
            productList = ProductList.get(productLists.iterator().next());
            productList.addProduct(product.object);
        } else {
            selectOne();
            return;
        }
    } else {
        createOne();
        return;
    }

    showRegistry({
        ProductList: productList.object
    });
}


/**
 * Initiates the creation of a gift registry entry in three stages:
 *     1) Specify event participants
 *     2) Specify pre- and post-event addresses
 *     3) Confirm Gift Registry details
 * Renders the event participant page (account/giftregistry/eventparticipant template).
 */
function createOne() {
    var giftRegistryForm = Form.get('giftregistry');
    var participant = giftRegistryForm.get('event.participant');
    var profile = customer.profile;

    giftRegistryForm.clear();

    participant.setValue('firstName', profile.firstName);
    participant.setValue('lastName', profile.lastName);
    participant.setValue('email', profile.email);

    app.getView().render('account/giftregistry/eventparticipant');
}

/**
 * Event handler for gift registry addresses.
 * Checks the last triggered action and handles them depending on the formId associated with the triggered action.
 * If the formId is:
 * - __back__ - calls the {@link module:controllers/GiftRegistry~start|start} function
 * - __confirm__ - if there are no addresses in the customer address book, sets a flag to indicate the
 * before event shipping address is new. Calls the {@link module:controllers/GiftRegistry~setParticipants|setParticipants} function.
 * @FIXME Doesn't appear to ever be called.
 */
function eventParticipant() {
    var currentForms = session.forms;
    // TODO this should be some redirect
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'back') {
            start();
            return;
        } else if (TriggeredAction.formId === 'confirm') {
            if (customer.profile.addressBook.addresses.size() === 0) {
                currentForms.giftregistry.eventaddress.beforeEventAddress.value = 'newaddress';
            }

            setParticipants();
        }
    }
}

/**
 * Renders the gift registry addresses page (account/giftregistry/addresses template).
 */
function setParticipants() {
    app.getView().render('account/giftregistry/addresses');
}

/**
 * TODO
 */
 //TODO : jshint -> 'participantAddresses' is defined but never used.
// function participantAddresses() {
//     var currentForms = session.forms;
//     var AddressFormType;
//     // TODO this should trigger some redirect
//     var TriggeredAction = request.triggeredFormAction;
//     if (TriggeredAction !== null) {
//         if (TriggeredAction.formId === 'back') {
//             new Pipelet('Script', {
//                 Transactional: false,
//                 OnError: 'PIPELET_ERROR',
//                 ScriptFile: 'account/giftregistry/CopyAddressFormFields.ds'
//             }).execute({
//                 GiftRegistryForm: currentForms.giftregistry
//             });

//             app.getView().render('account/giftregistry/eventparticipant');
//             return;
//         } else if (TriggeredAction.formId === 'confirm') {
//             if (currentForms.giftregistry.copyAddress.checked) {
//                 new Pipelet('Script', {
//                     Transactional: false,
//                     OnError: 'PIPELET_ERROR',
//                     ScriptFile: 'account/giftregistry/AssignPostEventShippingAddress.ds'
//                 }).execute({
//                     GiftRegistryForm: currentForms.giftregistry
//                 });
//             }

//             showConfirmation();
//             return;
//         } else if (TriggeredAction.formId === 'selectAddressAfter') {
//             AddressFormType = 'after';

//             updateAddressDetails();
//             return;
//         } else if (TriggeredAction.formId === 'selectAddressBefore') {
//             AddressFormType = 'before';

//             updateAddressDetails();
//             return;
//         }
//     }

//     if (!currentForms.giftregistry.eventaddress.valid) {
//         setParticipants();
//         return;
//     }

//     if (currentForms.giftregistry.eventaddress.beforeEventAddress.value === 'newaddress' && !currentForms.giftregistry.eventaddress.addressBeforeEvent.valid) {
//         setParticipants();
//         return;
//     }

//     if (currentForms.giftregistry.eventaddress.afterEventAddress.value === 'newaddress' && !currentForms.giftregistry.eventaddress.addressAfterEvent.valid) {
//         setParticipants();
//         return;
//     }

//     showConfirmation();
// }

/**
 * Renders the gift registry confirmation page (account/giftregistry/giftregistryconfirmation template).
 */
function handleRegistryAddresses() {
    app.getView().render('account/giftregistry/giftregistryconfirmation');
}

/**
 * Selects a gift registry from a list of gift registries that are found by the registry search.
 * Called by {@link module:controllers/GiftRegistry~addProduct}.
 */
function selectOne() {
    var currentForms = session.forms;
    var ProductLists = ProductListMgr.getProductLists(customer, giftRegistryType);

    Form.get(currentForms.productlists.items).copyFrom(ProductLists);

    app.getView().render('account/giftregistry/registryselect');
}

/**
 * Makes a ProductList public or private
 *
 * @param {dw.customer.ProductList} productList
 * @param {Boolean} isPublic - true to make public; false to make private
 */
function setProductListPublic (productList, isPublic) {
    var productListWrapper = ProductList.get(productList);
    productListWrapper.setPublic(isPublic);

    showRegistry({ProductList: productListWrapper.object});
}

/**
 * Provides actions to edit a gift registry event.
 */
function selectProductListInteraction() {
    // TODO this should end in a redirect
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'select') {

            //TODO : jshint -> 'ProductList' is defined but never used.
            //var ProductList = TriggeredAction.object;
            // TODO interaction continue not supported anymore
            // where to continue now?
            return;
        }
    }

    // TODO what to render otherwise?
}

/**
 * Clears the giftregistry form and prepopulates event and participant information from the current ProductListModel.
 * Calls the {@link module:controllers/GiftRegistry~showEditParticipantForm|showEditParticipantForm} function.
 */
function editEvent() {
    var currentForms = session.forms;


    Form.get(currentForms.giftregistry).clear();
    Form.get(currentForms.giftregistry.event).copyFrom(ProductList, true);
    Form.get(currentForms.giftregistry.event.participant).copyFrom(ProductList.registrant);

    if (ProductList.coRegistrant !== null) {
        Form.get(currentForms.giftregistry.event.coParticipant).copyFrom(ProductList.coRegistrant);
    }


    currentForms.giftregistry.event.eventaddress.states.state.value = ProductList.eventState;
    currentForms.giftregistry.event.eventaddress.country.value = ProductList.eventCountry;


    showEditParticipantForm();
}

/**
 * Renders the event participant page (account/giftregistry/eventparticipant template).
 */
function showEditParticipantForm() {
    app.getView().render('account/giftregistry/eventparticipant');
}
/**
 * TODO
 */
// TODO this is probably never called?
// TODO : jshint -> 'editEventParticipant' is defined but never used.
// function editEventParticipant() {
//     var currentForms = session.forms;
//     var TriggeredAction = request.triggeredFormAction;
//     if (TriggeredAction !== null) {
//         if (TriggeredAction.formId === 'back') {
//             // TODO back???
//             showRegistry({
//                 ProductList: ProductList
//             });
//             return;
//         } else if (TriggeredAction.formId === 'confirm') {
//             if (!Form.get(currentForms.giftregistry.event).copyTo(ProductList)) {
//                 return {
//                     error: true
//                 };
//             }


//             if (!Form.get(currentForms.giftregistry.event.participant).copyTo(ProductList.registrant)) {
//                 return {
//                     error: true
//                 };
//             }

//             Transaction.wrap(function () {
//                       ProductList.eventState = currentForms.giftregistry.event.eventaddress.states.state.value;
//                       ProductList.eventCountry = currentForms.giftregistry.event.eventaddress.country.value;
//                     }
//                 );

//             if (ProductList.coRegistrant !== null) {
//                 if (!Form.get(currentForms.giftregistry.event.coParticipant).copyTo(ProductList.coRegistrant)) {
//                     return {
//                         error: true
//                     };
//                 }
//             } else {
//                 if (!(currentForms.giftregistry.event.coParticipant.role.selectedOption === null || currentForms.giftregistry.event.coParticipant.role.selectedOption.htmlValue === '')) {
//                     var CreateProductListRegistrantResult = new Pipelet('CreateProductListRegistrant', {
//                         CreateCoRegistrant: true
//                     }).execute({
//                         ProductList: ProductList
//                     });
//                     if (CreateProductListRegistrantResult.result === PIPELET_ERROR) {
//                         return {
//                             error: true
//                         };
//                     }

//                     //TODO : jshint -> 'ProductListRegistrant' is defined but never used.
//                     //var ProductListRegistrant = CreateProductListRegistrantResult.ProductListRegistrant;


//                     if (!Form.get(currentForms.giftregistry.event.coParticipant).copyTo(ProductList.coRegistrant)) {
//                         return {
//                             error: true
//                         };
//                     }
//                 }
//             }

//             showRegistry({
//                 ProductList: ProductList
//             });
//             return;
//         } else if (TriggeredAction.formId === 'navPurchases') {
//             showPurchases();
//             return;
//         } else if (TriggeredAction.formId === 'navRegistry') {
//             showRegistry({
//                 ProductList: ProductList
//             });
//             return;
//         } else if (TriggeredAction.formId === 'navShipping') {
//             editAddresses();
//             return;
//         }
//     }

//     showEditParticipantForm();
// }

/**
 * Renders the gift registry purchases page.
 */
function showPurchases() {
    app.getView().render('account/giftregistry/purchases');
}

/**
 * Event handler for gift registry navigation.
 * Checks the last triggered action and handles them depending on the formId associated
 * with the triggered action. If the formId is:
 * - __navEvent__ - calls the {@link module:controllers/GiftRegistry~editEvent|editEvent} function.
 * - __navRegistry__ - calls the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function.
 * - __navShipping __ - - {@link module:controllers/GiftRegistry~editAddresses|editAddresses} function.
 * If the last triggered action is none of these or null, the function calls the {@link module:controllers/GiftRegistry~showPurchases|showPurchases} function.
 */
// @secure
function showPurchasesInteraction() {
    // TODO this should end in a redirect
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'navEvent') {
            editEvent();
            return;
        } else if (TriggeredAction.formId === 'navRegistry') {
            showRegistry({
                ProductList: ProductList
            });
            return;
        } else if (TriggeredAction.formId === 'navShipping') {
            editAddresses();
            return;
        }
    }

    showPurchases();
}

/**
 * Renders a gift registry details page (account/giftregistry/registry template) and provides basic actions such as item updates and publishing.
 * @param {Object} pdict
 */
function showRegistry(pdict) {
    var ProductList = pdict.ProductList;

    Form.get('giftregistry').copyFrom(ProductList);
    Form.get('giftregistry.event').copyFrom(ProductList);

    app.getView({
        Status: null,
        ProductList: ProductList,
        ContinueURL: URLUtils.https('GiftRegistry-SubmitForm')
    }).render('account/giftregistry/registry');
}

/**
 * Event handler for gift registry interactions.
 * Checks the last triggered action and handles them depending on the formId associated with the triggered action.
 * If the formId is:
 * - __addGiftCertificate__ - adds a gift certificate to the product list and alls the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function.
 * - __addToCart__ - calls the {@link module:controllers/GiftCert~purchase|purchase} function.
 * - __deleteItem __ - changes the purchased quantity to zero. If this fails , it renders the registry page (account/giftregistry/registry template) with a status message.
 * - __navEvent__ - calls the {@link module:controllers/GiftRegistry~editEvent|editEvent} function
 * - __navPurchases__ - calls the {@link module:controllers/GiftRegistry~showPurchases|showPurchases} function.
 * - __navShipping __ - calls the {@link module:controllers/GiftRegistry~editAddresses|editAddresses} function.
 * - __purchaseGiftCertificate __ - calls the {@link module:controllers/GiftRegistryCustomer~PurchaseGiftCertificate|GiftRegistryCustomer controller PurchaseGiftCertificate function}.
 * - __setPrivate__ - sets the current product list as private and calls the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function.
 * - __setPublic __ - sets the current product list as public and calls the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function.
 * - __updateItem__ -  calls the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function.
 * If the last triggered action is none of these or null, the function renders the registry page (account/giftregistry/registry template).
 */
function showRegistryInteraction() {
    var currentForms = session.forms;
    // TODO this should end in redirects
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'addGiftCertificate') {
            new Pipelet('AddGiftCertificateToProductList').execute({
                ProductList: ProductList,
                Priority: 2
            });

            showRegistry({
                ProductList: ProductList
            });
            return;
        } else if (TriggeredAction.formId === 'addToCart') {
            if (currentForms.giftregistry.items.triggeredFormAction.parent.object.type === currentForms.giftregistry.items.triggeredFormAction.parent.object.TYPE_GIFT_CERTIFICATE) {
                var GiftCertController = require('./GiftCert');
                GiftCertController.Purchase();
                return;
            } else {
                var CartController = require('./Cart');
                CartController.AddProduct();
                return;
            }
        } else if (TriggeredAction.formId === 'deleteItem') {
            if (TriggeredAction.object.purchasedQuantity.value === 0) {

                //TODO : jshint -> 'RemoveProductListItemResult' is defined but never used.
                //var RemoveProductListItemResult = new Pipelet('RemoveProductListItem').execute({
                //    ProductListItem: TriggeredAction.object
                //});
            } else {
                var Status = new dw.system.Status(dw.system.Status.ERROR, 'delete.restriction');

                app.getView().render('account/giftregistry/registry', {
                    Status: Status
                });
                return;
            }
        } else if (TriggeredAction.formId === 'navEvent') {
            editEvent();
            return;
        } else if (TriggeredAction.formId === 'navPurchases') {
            showPurchases();
            return;
        } else if (TriggeredAction.formId === 'navShipping') {
            editAddresses();
            return;
        } else if (TriggeredAction.formId === 'purchaseGiftCertificate') {

            var GiftRegistryCustomerController = require('./GiftRegistryCustomer');
            GiftRegistryCustomerController.PurchaseGiftCertificate();
            return;
        } else if (TriggeredAction.formId === 'setPrivate') {
            Transaction.wrap(function () {
                ProductList.public = false;
            });

            showRegistry({
                ProductList: ProductList
            });
            return;
        } else if (TriggeredAction.formId === 'setPublic') {
            Transaction.wrap(function () {
                ProductList.public = true;
            }
                );

            showRegistry({
                ProductList: ProductList
            });
            return;
        } else if (TriggeredAction.formId === 'updateItem') {

            //TODO : jshint -> 'updateAllResult' is defined but never used.
            //var updateAllResult = updateAll();

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
    var advancedSearchForm = session.forms.giftregistry.search.advanced;
    var simpleSearchForm = session.forms.giftregistry.search.simple;
    var SearchProductListsResult = new Pipelet('SearchProductLists', {
        PublicOnly: true
    }).execute({
        EventType: simpleSearchForm.eventType.value,
        EventCity: advancedSearchForm.eventCity.value,
        EventState: advancedSearchForm.eventAddress.states.state.value,
        EventCountry: advancedSearchForm.eventAddress.country.value,
        RegistrantFirstName: simpleSearchForm.registrantFirstName.value,
        RegistrantLastName: simpleSearchForm.registrantLastName.value,
        Type: giftRegistryType,
        EventMonth: advancedSearchForm.eventMonth.value,
        EventYear: advancedSearchForm.eventYear.value,
        EventName: advancedSearchForm.eventName.value
    });

    var ProductLists = SearchProductListsResult.ProductLists;
/**
 * TODO
 */
    showSearch({
        ProductLists: ProductLists
    });
}

/**
 * Renders the gift registry results page account/giftregistry/giftregistryresults).
 * @param {object} args - JSON object with ProductLists member and ProductLists value.
 * @FIXME only called by the search() function - no need for separate function.
 */
function showSearch(args) {
    app.getView().render('account/giftregistry/giftregistryresults', {
        ProductLists: args.ProductLists
    });
}

/**
 * Event handler for gift registry search.
 * Checks the last triggered action and handles it ifthe formId associated with the triggered action is 'search'.
 * calls the {@link module:controllers/GiftRegistry~search|search} function.
 */
function searchGiftRegistry() {
    // TODO this should end with a redirect
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'search') {
            search();
            return;
        }
    }

    showSearch();
}


/**
 * Looks up a gift registry by its public UUID. If the customer is authenticated, it calls
 * the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function. If the customer
 * is not authenticated, it calls calls the {@link module:controllers/Account~show|Account
 * controller show function}.
 */
function showRegistryByID() {
    var currentHttpParameterMap = request.httpParameterMap;

    if (!customer.authenticated) {
        //TODO : RequireLoginResult was reported by jshint as never called
        //var RequireLoginResult = RequireLogin();
        return;
    }

    var GetProductListResult = new Pipelet('GetProductList', {
        Create: false
    }).execute({
        ProductListID: currentHttpParameterMap.ProductListID.value
    });

    if (GetProductListResult.result === PIPELET_ERROR) {
        start();
        return;
    }
    var ProductList = GetProductListResult.ProductList;

    if (ProductList.owner.profile.customerNo === customer.profile.customerNo) {
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
//TODO jshint -> 'updateAddressDetails' is defined but never used. after commenting out 'participantAddresses'
// function updateAddressDetails() {
//     var currentHttpParameterMap = request.httpParameterMap;
//     var currentForms = session.forms;
//     var Address;
//     var GetCustomerAddressResult;
//     //TODO : variable assignment
//     var AddressFormType;

//     if (AddressFormType === 'before') {
//         GetCustomerAddressResult = new Pipelet('GetCustomerAddress').execute({
//             AddressID: empty(currentHttpParameterMap.addressID.value) ? currentHttpParameterMap.dwfrm_giftregistry_eventaddress_addressBeforeList.value : currentHttpParameterMap.addressID.value,
//             Customer: customer
//         });
//         Address = GetCustomerAddressResult.Address;


//         Form.get(currentForms.giftregistry.eventaddress.addressBeforeEvent).copyFrom(Address);
//         Form.get(currentForms.giftregistry.eventaddress.addressBeforeEvent.states).copyForm(Address);
//     } else {
//         GetCustomerAddressResult = new Pipelet('GetCustomerAddress').execute({
//             AddressID: empty(currentHttpParameterMap.addressID.value) ? currentHttpParameterMap.dwfrm_giftregistry_eventaddress_addressAfterList.value : currentHttpParameterMap.addressID.value,
//             Customer: customer
//         });
//         Address = GetCustomerAddressResult.Address;


//         Form.get(currentForms.giftregistry.eventaddress.addressAfterEvent).copyFrom(Address);
//         Form(currentForms.giftregistry.eventaddress.addressAfterEvent.states).copyForm(Address);
//     }


//     setParticipants();
// }


/**
 * Attempts to replace a product in the gift registry.
 * @return {Object} JSON object indicating the error state if any pipelets called throw a PIPELET_ERROR.
 */
function replaceProductListItem() {
    var currentHttpParameterMap = request.httpParameterMap;


    var GetProductListResult = new Pipelet('GetProductList', {
        Create: false
    }).execute({
        ProductListID: currentHttpParameterMap.productlistid.stringValue
    });
    if (GetProductListResult.result === PIPELET_ERROR) {
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
    if (ScriptResult.result === PIPELET_ERROR) {
        app.getView().render('account/giftregistry/refreshgiftregistry', {
        });
        return;
    }


    var GetProductResult = new Pipelet('GetProduct').execute({
        ProductID: currentHttpParameterMap.pid.stringValue
    });
    if (GetProductResult.result === PIPELET_ERROR) {
        return {
            error: true
        };
    }

    //TODO : AddProductToProductListResult was never used and jshint was reporting errors as a result
    //var Product = GetProductResult.Product;


    //var UpdateProductOptionSelectionsResult = new Pipelet('UpdateProductOptionSelections').execute({
    //    Product: Product
    //});
    //var ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;


    // var AddProductToProductListResult = new Pipelet('AddProductToProductList', {
    //     DisallowRepeats: true
    // }).execute({
    //     Product: Product,
    //     ProductList: ProductList,
    //     Quantity: currentHttpParameterMap.Quantity.doubleValue,
    //     ProductOptionModel: ProductOptionModel,
    //     Priority: 2
    // });
    //TODO : AddProductToProductListResult was never used and jshint was reporting errors as a result

    app.getView().render('account/giftregistry/refreshgiftregistry', {});
}

/**
 * Event handler for gift registry addresses.
 * Checks the last triggered action and handles them depending on the formId associated with the triggered action.
 * If the formId is:
 * - __back__ -  calls the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function.
 * - __confirm__ - calls {@link module:controllers/GiftRegistry~confirm|confirm} function.
 * - __navEvent__ - calls the {@link module:controllers/GiftRegistry~editEvent|editEvent} function
 * - __navPurchases__ - calls the {@link module:controllers/GiftRegistry~showPurchases|showPurchases} function.
 * - __navRegistry__ - calls the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function.
 * If none of these are the formId of the last triggered action, then if the event addresses are not valid or are new
 * the {@link module:controllers/GiftRegistry~setParticipants|setParticipants} function is called.
 * Otherwise, the {@link module:controllers/GiftRegistry~confirm|confirm} function is called.
 *
 * @FIXME Why are there two functions with the same name?
 */
// @secure
function editAddresses() {
    var currentForms = session.forms;
    // TODO this should end in some redirect
    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'back') {
            showRegistry({
                ProductList: ProductList
            });
            return;
        } else if (TriggeredAction.formId === 'confirm') {
            confirm();
            return;
        } else if (TriggeredAction.formId === 'navEvent') {
            editEvent();
            return;
        } else if (TriggeredAction.formId === 'navPurchases') {
            showPurchases();
            return;
        } else if (TriggeredAction.formId === 'navRegistry') {
            showRegistry({
                ProductList: ProductList
            });
            return;
        }
    }

    if (!currentForms.giftregistry.eventaddress.valid) {
        setParticipants();
        return;
    }

    if (currentForms.giftregistry.eventaddress.beforeEventAddress.value === 'newaddress' && !currentForms.giftregistry.eventaddress.addressBeforeEvent.valid) {
        setParticipants();
        return;
    }

    if (currentForms.giftregistry.eventaddress.afterEventAddress.value === 'newaddress' && !currentForms.giftregistry.eventaddress.addressAfterEvent.valid) {
        setParticipants();
        return;
    }

    confirm();
}

/**
 * Handles the confirm action for the giftregistry form. Checks to makes sure the before and after
 * event addresses do not already exist in the customer profile. If the addresses are duplicates,
 * calls the {@link module:controllers/GiftRegistry~setParticipants|setParticipants} function.
 * If they are not duplicates, calls the AssignEventAddresses.js script to assign the event addresses
 * to the product list and then calls the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function.
 *
 * @transaction
 * @returns {Object} JSON object indicating an error occurred in the AssignEventAddresses.js script.
 */
function confirm() {
    var giftRegistryForm = Form.get('giftregistry');
    var dwProductList = Transaction.wrap(function () {
        return ProductListMgr.createProductList(customer, giftRegistryType);
    });
    var productList = ProductList.get(dwProductList);

    Transaction.wrap(function () {
        var assignEventAddresses = require('app_storefront_core/cartridge/scripts/account/giftregistry/AssignEventAddresses');
        var eventForm = Form.get('giftregistry.event');
        var participantForm = Form.get('giftregistry.event.participant');

        eventForm.copyTo(productList.object);
        productList.createRegistrant();
        participantForm.copyTo(productList.object.registrant);
        productList.setEventState(giftRegistryForm.getValue('event.eventaddress.states.state'));

        assignEventAddresses.assignEventAddresses({
            ProductList: productList.object,
            Customer: customer,
            GiftRegistryForm: giftRegistryForm.object
        });
    });

    showRegistry({ProductList: productList.object});
}

/**
 * Deletes a gift registry. Only the logged-in owner of the gift registry can delete it.
 *
 * @secure
 */
// Used 'deleteList' rather than 'delete' as the latter is a reserved word in Javascript
function deleteList() {
    var params = request.httpParameterMap;
    var productList = ProductList.get(params.ProductListID.value);
    productList.remove();

    start();
}


/**
 * Creates a gift registry. Calls the {@link module:controllers/GiftRegistry~createOne|createOne} function.
 */
function create() {
    createOne();
}

//TODO :jshint ->  'updateAll' is defined but never used.
// function updateAll() {
//     var currentForms = session.forms;

//     // TODO do in a single transaction
//     for (var i = 0; i < currentForms.giftregistry.items.length; i++) {
//         var item = currentForms.giftregistry.items[i];
//         if (!Form.get(item).copyTo(item.object)) {
//             return {
//                 error: true
//             };
//         }
//     }
// }


/**
 * Web exposed methods
 */

/**
 * Creates a gift registry.
 * @see module:controllers/GiftRegistry~start
 */
exports.Create = guard.ensure(['get', 'https'], create);

/**
 * Deletes a gift registry.
 * @see module:controllers/GiftRegistry~confirmation
 */
exports.Delete = guard.ensure(['get', 'https'], deleteList);

/**
 * Event handler for gift registry addresses.
 * @see module:controllers/GiftRegistry~editAddresses
 */
exports.EditAddresses = guard.ensure(['post', 'https'], editAddresses);

/**
 * Event handler for gift registry addresses.
 * @see module:controllers/GiftRegistry~eventParticipant
 */
exports.EventParticipant = guard.ensure(['post', 'https'], eventParticipant);

/**
 * Event handler for gift registry search.
 * @see module:controllers/GiftRegistry~searchGiftRegistry
 */
exports.SearchGiftRegistry = guard.ensure(['post'], searchGiftRegistry);

/**
 * Provides actions to edit a gift registry event.
 * @see module:controllers/GiftRegistry~selectProductListInteraction
 */
exports.SelectProductListInteraction = guard.ensure(['post', 'https'], selectProductListInteraction);

/**
 * Event handler for gift registry navigation.
 * @see module:controllers/GiftRegistry~showPurchasesInteraction
 */
exports.ShowPurchasesInteraction = guard.ensure(['post', 'https'], showPurchasesInteraction);

/**
 * Looks up a gift registry by its public UUID.
 * @see module:controllers/GiftRegistry~showRegistryByID
 */
exports.ShowRegistryByID = guard.ensure(['get', 'https'], showRegistryByID);

/**
 * Event handler for gift registry interactions.
 * @see module:controllers/GiftRegistry~showRegistryInteraction
 */
exports.ShowRegistryInteraction = guard.ensure(['get', 'https'], showRegistryInteraction);

/**
 * Controls the login that is required to access gift registry actions.
 * @see module:controllers/GiftRegistry~submitForm
 */
exports.SubmitForm = guard.ensure(['post', 'https', 'loggedIn'], submitForm);

/**
 * Creates or searches for a gift registry.
 * @FIXME Why is this exported as lowercase?
 * @see module:controllers/GiftRegistry~registrymain
 */
exports.registrymain = guard.ensure(['post', 'https'], registrymain);

/**
 * Renders a list of gift registries associated with the current customer.
 * @see module:controllers/GiftRegistry~start
 */
exports.Start = guard.ensure(['get', 'https', 'loggedIn'], start, {scope: 'giftregistry'});

/**
 * Adds a product to the gift registry.
 * @see module:controllers/GiftRegistry~addProduct
 */
exports.AddProduct = guard.ensure(['get', 'https', 'loggedIn'], addProduct);

/*
 * Local methods
 */
/**
 * Attempts to replace a product in the gift registry.
 * @see module:controllers/GiftRegistry~replaceProductListItem
 */
exports.ReplaceProductListItem = replaceProductListItem;

/**
 * Searches a gift registry by various parameters.
 * @see module:controllers/GiftRegistry~search
 */
exports.Search = search;

/**
 * Renders the gift registry details page.
 * @see module:controllers/GiftRegistry~showRegistry
 */
exports.ShowRegistry = showRegistry;
