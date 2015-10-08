'use strict';

/**
 * This controller initializes the product list and creates a new list if none was found.
 * It also determines a selected product list item based on the given ID.
 *
 * @module  controllers/ProductList
 * @TODO this should be a library, not a controller
 */

 /**
 * TODO
 */
function Init(args) {
    var productListId = args.productListId;
    var listItemId = args.listItemId;

    var ProductList = null;
    var ProductListItem = null;

    var GetProductListResult = new dw.system.Pipelet('GetProductList', {
        Create: false
    }).execute({
        ProductListID: productListId
    });
    if (GetProductListResult.result === PIPELET_NEXT) {
        ProductList = GetProductListResult.ProductList;
    }

    var ProductOptionModel = null;

    if (ProductList !== null) {
        ProductListItem = ProductList.getItem(listItemId);

        var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
            Product: ProductListItem.product
        });
        ProductOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;
    }

    return {
        ProductListItem: ProductListItem,
        ProductOptionModel: ProductOptionModel
    };
}


/**
 * Ensure shipment locates a shipment associated with a product list. If it cannot find one, one is created.
 */
function EnsureShipment(args) {
    var ProductList = args.ProductList;
    var ProductListItem = args.ProductListItem;
    var Basket = args.Basket;
    var Shipment;

    var ShipmentID = ProductListItem.list.name;

    if (empty(ShipmentID) || ProductListItem.list.shippingAddress === null) {
        var GenerateShipmentNameResult = new GenerateShipmentName({
            ProductList: ProductList
        });

        ShipmentID = GenerateShipmentNameResult.ShipmentID;
    }


    if (Basket.getShipment(ShipmentID) !== null) {
        Shipment = Basket.getShipment(ShipmentID);
    } else {
        var CreateShipmentResult = new dw.system.Pipelet('CreateShipment').execute({
            Basket: Basket,
            ID: ShipmentID
        });
        Shipment = CreateShipmentResult.Shipment;
    }

    // TODO define returns
}


/**
 * Generates a shipment ID based on the type of product list passed in. Also assigns this name to the product list itself.
 * Note that if the product list does not have a shipping address, the default shipping address name is used.
 */
function GenerateShipmentName(args) {
    var ProductList = args.ProductList;
    var ShipmentID;//TODO : variable assignment
    var Basket;//TODO : variable assignment

    if (ProductList.shippingAddress !== null) {
        var ScriptResult = new dw.system.Pipelet('Script', {
            Transactional: true,
            OnError: 'PIPELET_ERROR',
            ScriptFile: 'app_storefront_core:productlist/GenerateShipmentName.ds'
        }).execute({
            ProductList: ProductList
        });
        if (ScriptResult.result === PIPELET_NEXT) {
            ShipmentID = ScriptResult.ShipmentID;

            return {
                ShipmentID: ShipmentID
            };
        }
    }

    ShipmentID = Basket.defaultShipment.ID;

    return {
        ShipmentID: ShipmentID
    };
}


/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Init                    = Init;
exports.EnsureShipment          = EnsureShipment;
exports.GenerateShipmentName    = GenerateShipmentName;
