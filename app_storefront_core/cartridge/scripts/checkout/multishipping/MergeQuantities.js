'use strict';
/**
*	This script creates new ProductLineItems and Shipments from the
*	FormList of the address selections with help of a data structure
*	(address and product relations through HashMaps).
*
*   @input CBasket : dw.order.Basket The current basket object.
*	@input QuantityLineItems : dw.web.FormList Quantity Line Items from address selection.
*
*/

var HashMap = require('dw/util/HashMap');
var ShippingAddress = require('app_storefront_core/cartridge/scripts/checkout/Utils.ds');
var ArrayList = require('dw/util/ArrayList');
var UUIDUtils = require('dw/util/UUIDUtils');

function execute(pdict) {
    var basket = pdict.CBasket;
    var qunatityLineItemList = pdict.QuantityLineItems;

    var bonusDiscountLineItem = basket.getBonusDiscountLineItems()[0];

    var addressProductRelations = createAddressProductRelations(qunatityLineItemList);

    destoryProductLineItems(basket);
    removeNonDefaultShipments(basket);
    creatNewShipmentsandProoductLineItems(addressProductRelations, bonusDiscountLineItem, basket);

    return PIPELET_NEXT;
}
    /**
     *   Build new data structure through HashMaps from address-products-relations (stored in FormList)
     *   to build the new ProductLineItems in dependency to their addresses and quantities
     *
     *   address relation:   +===============+=================+
     *                       |   Key         |   Value         |
     *                       +===============+=================+
     *                       |   address1    |   products1   --|-------> product relation 1: +===============+===============+
     *                       +---------------+-----------------+                             |   Key         |   Value       |
     *                       |   address2    |   products2   --|---> product relation 2      +===============+===============+
     *                       +---------------+-----------------+                             |   productID1  |   quantity1   |
     *                       |   ...         |   ...           |                             +---------------+---------------+
     *                                                                                       |   productID2  |   quantity2   |
     *                                                                                       +---------------+---------------+
     *                                                                                       |   ...         |   ...         |
     */

function createAddressProductRelations(qliList) {
    var addressRelations = new HashMap();
    var productRelations;
    for (var i = 0; i < qliList.getChildCount(); i++) {
        var qli = qliList[i];
        // type: String
        var selectedAddress = qli.addressList.selectedOptionObject;
        // type: String
        var productID = qli.object.productID;
        // type: String
        var productOptionID = qli.object.optionID;
        // type: String
        var isBonusProduct = qli.object.bonusProductLineItem;
        
        productID = productID + '.' + productOptionID + '.' + isBonusProduct;

        if (selectedAddress === null) {
            return PIPELET_ERROR;
        }

        if (addressRelations.containsKey(selectedAddress)) {
            // type: HashMap
            productRelations = addressRelations.get(selectedAddress);
            if (productRelations.containsKey(productID)) {
                var quantity = productRelations.get(productID);
                productRelations.put(productID, quantity + 1);
            } else {
                productRelations.put(productID, 1);
            }
        } else {
            productRelations = new HashMap();
            productRelations.put(productID, 1);
            addressRelations.put(selectedAddress, productRelations);
        }
    }

    return addressRelations; // the new data structure
}

function destoryProductLineItems(basket) {
    var plis = basket.getProductLineItems();
    var pli;
    for (var m = 0; m < plis.length; m++) {
        pli = plis[m];
        if (empty(pli.custom.fromStoreId)) {
            basket.removeProductLineItem(pli);
        }
    }
    return;
}
function removeNonDefaultShipments(basket) {
    var shipments = basket.getShipments();
    var shipment;
    for (var l = 0; l < shipments.length; l++) {
        shipment = shipments[l];
        //If the shipment is for a gift certificate or the default shipment, it is not removed from the cart.
        if (!shipment.isDefault() && (shipment.giftCertificateLineItems.length <= 0) && shipment.custom.shipmentType !== 'instore') {
            basket.removeShipment(shipment);
        }
    }
    return;
}

function creatNewShipmentsandProoductLineItems(addressRelations, bonusDiscountLineItem, basket) {
    // Build new ProductLineItems and Shipments with the new created data structure
    // type: Set
    var addresses = addressRelations.keySet();
    var shipment;
    var defaultShippingSet = false;
    var pli;

    // adddress : Object
    for (var x = 0; x < addresses.length; x++) {
        var address = addresses[x];
        // type: OrderAddress
        var orderAddress;
        if (!defaultShippingSet){
            shipment = basket.getDefaultShipment();
            defaultShippingSet = true;
        } else {
            shipment = basket.createShipment(address.UUID);
        }
        orderAddress = shipment.createShippingAddress();
        // type: Object
        var shippingAddress = new ShippingAddress();
        shippingAddress.UUID = UUIDUtils.createUUID();
        shippingAddress.copyFrom(address);
        shippingAddress.copyTo(orderAddress);

        // type: HashMap
        var productRelations = addressRelations.get(address);
        // type: Set
        var products = productRelations.keySet();

        var product_ID = '';
        var optionID = '';
        var isProductBonus;

        for (var n = 0; n < products.length; n++){
            var product = products[n];
            var splitarray = product.split('.');
            product_ID = splitarray[0];
            optionID = splitarray[1];
            isProductBonus = splitarray[2];

            if (isProductBonus === true) {
                var productToAdd;
                for (var j = 0; j < bonusDiscountLineItem.bonusProducts.length; j++) {
                    if (bonusDiscountLineItem.bonusProducts[j].ID === product_ID) {
                        productToAdd = bonusDiscountLineItem.bonusProducts[j];
                        break;
                    }
                }
                pli = basket.createBonusProductLineItem(bonusDiscountLineItem, productToAdd, null, shipment);

            } else {
                // type: ProductLineItem
                pli = basket.createProductLineItem(product_ID, shipment);
                pli.setQuantityValue(productRelations.get(product));
            }

            //re-assign the option product based on the optionID
            if(optionID !== 'na'){
                // type: dw.catalog.ProductOptionModel
                var productOptionModel = pli.product.getOptionModel();
                // type: dw.catalog.ProductOption
                var productOptions = productOptionModel.getOptions();
                var pliOptionArrayList = new ArrayList(productOptions);
                var productOption = pliOptionArrayList[0];

                // type: Iterator
                var options = productOptionModel.getOptionValues(productOption).iterator();
                while(options.hasNext()){

                    var optionValue = options.next();

                    // if the option id equals the selection option id, set the selected option
                    if (optionValue.getID() === optionID)
                    {
                        var pliOptionProdcuts = new ArrayList(pli.optionProductLineItems);

                        for (var k = 0; k < pliOptionProdcuts.length; k++) {
                            pliOptionProdcuts[k].updateOptionValue(optionValue);
                        }
                    }
                }
            }
        }
    }
}

module.exports = {
    execute: execute
};
