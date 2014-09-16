/** @module ServiceProviderDispatcher **/

var cartCalculator = require( "../cart/calculate.js" );

/**
 * @function calculate
 *
 * calculate is the arching logic for computing the value of a basket.  It makes
 * calls into cart/calculate.js and enables both SG and OCAPI applications to share
 * the same cart calculation logic.
 *
 * @param {object} basket The basket to be calculated
 */
exports.calculate = function(basket)
{
    // ===================================================
	// =====   CALCULATE PRODUCT LINE ITEM PRICES    =====
    // ===================================================

	cartCalculator.calculateProductPrices(basket);

    // ===================================================
	// =====    CALCULATE GIFT CERTIFICATE PRICES    =====
    // ===================================================

	cartCalculator.calculateGiftCertificatePrices(basket);

    // ===================================================
	// =====   Note: Promotions must be applied      =====
	// =====   after the tax calculation for         =====
	// =====   storefronts based on GROSS prices     =====
    // ===================================================

    // ===================================================
	// =====   APPLY PROMOTION DISCOUNTS			 =====
	// =====   Apply product and order promotions.   =====
	// =====   Must be done before shipping 		 =====
	// =====   calculation. 					     =====
    // ===================================================

	PromotionMgr.applyDiscounts(basket);

    // ===================================================
	// =====        CALCULATE SHIPPING COSTS         =====
    // ===================================================

	// apply product specific shipping costs
	// and calculate total shipping costs
	ShippingMgr.applyShippingCost(basket);

    // ===================================================
	// =====   APPLY PROMOTION DISCOUNTS			 =====
	// =====   Apply product and order and 			 =====
	// =====   shipping promotions.                  =====
    // ===================================================

	PromotionMgr.applyDiscounts(basket);

	// since we might have bonus product line items, we need to
	// reset product prices
	cartCalculator.calculateProductPrices(basket);

    // ===================================================
	// =====         CALCULATE TAX                   =====
    // ===================================================

	cartCalculator.calculateTax(basket);

    // ===================================================
	// =====         CALCULATE BASKET TOTALS         =====
    // ===================================================

	basket.updateTotals();

    // ===================================================
	// =====            DONE                         =====
    // ===================================================
}
