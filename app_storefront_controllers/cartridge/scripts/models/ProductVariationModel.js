'use strict';
/**
 * Model for product variation functionality.
 * @module models/ProductVariationModel
 */

/* API Includes */
var AbstractModel = require('./AbstractModel');
var HashMap = require('dw/util/HashMap');

/**
 * ProductVariationModel helper class providing enhanced profile functionality
 * @class module:models/ProductVariationModel~ProductVariationModel
 */
var ProductVariationModel = AbstractModel.extend({
    /** @lends module:models/ProductVariationModel~ProductVariationModel.prototype */
    /**
     * Gets a new instance for a given product variation model.
     * @alias module:models/ProductVariationModel~ProductVariationModel/init
     * @param parameter method of of super class to call.
     */
    init: function (parameter) {
        var instance = this._super(parameter);
        this.initProperties();
        this.selectionMap = new HashMap();
        return instance;
    },

    /**
     * Updates the model with the given variation attribute to the given value.
     *
     * @alias module:models/ProductVariationModel~ProductVariationModel/setSelectedVariationValue
     * @param {dw.catalog.ProductVariationAttrbute} variationAttribute - the attribute
     * @param {dw.catalog.ProductVariationAttrbuteValue} variationAttributeValue - the variation attribute value
     */
    // TODO: This function might be removable once 16.1 has been deployed to sandboxes.
    // Please see https://intranet.demandware.com/jira/browse/RAP-4424
    // If cannot remove this override, should be able to replace the function body with:
    // this.object.setSelectedVariationValue(variationAttribute.ID, variationAttributeValue.ID);
    setSelectedVariationValue: function (variationAttribute, variationAttributeValue) {
        this.selectionMap.put(variationAttribute.ID, variationAttributeValue.ID);
        this.object.setSelectedAttributeValue(variationAttribute.ID, variationAttributeValue.ID);
    },

    /**
     * Returns the ProductVariationAttrbuteValue object for the given attribute and the value ID.
     *
     * @alias module:models/ProductVariationModel~ProductVariationModel/getVariationAttributeValue
     * @param {dw.catalog.ProductVariationAttrbute} variationAttribute - the attribute
     * @param {String} variationAttributeValueID - the variation attribute value ID
     */
    getVariationAttributeValue: function (variationAttribute, variationAttributeValueID) {
        if (variationAttributeValueID) {
            var allValues = this.object.getAllValues(variationAttribute);
            for (var i = 0; i < allValues.length; i++) {
                if (allValues[i].ID === variationAttributeValueID) {
                    return allValues[i];
                }
            }
        }
        return null;
    },

    /**
     * Gets the currently selected value for a given attribute.
     *
     * @param  {dw.catalog.ProductVariationAttrbute} variationAttribute the attribute
     * @return {dw.catalog.ProductVariationAttrbuteValue} the attribute value or null
     */
    getSelectedValue: function (variationAttribute) {
        if (variationAttribute) {
            return this.getVariationAttributeValue(variationAttribute, this.selectionMap.get(variationAttribute.ID));
        }
        return null;
    }
});

/** The model class */
module.exports = ProductVariationModel;
