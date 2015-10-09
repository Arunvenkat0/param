'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as cartPage from '../pageObjects/cart';
import * as common from '../pageObjects/helpers/common';
import * as productDetailPage from '../pageObjects/productDetail';
import * as testData from '../pageObjects/testData/main';
import * as products from '../pageObjects/testData/products';

describe('Cart - Simple', () => {
	let countryCode = common.defaultCountryCode;
	let catalog;
	let productVariationMaster;
	let resourcePath;
	let itemRow = 1;
	let variant1 = {
		instance: undefined,
		color: {
			index: undefined,
			displayValue: undefined
		},
		size: {
			index: undefined,
			displayValue: undefined
		},
		width: {
			index: undefined,
			displayValue: undefined
		}
	};
	let variant2 = {
		instance: undefined,
		color: {
			index: undefined,
			displayValue: undefined
		},
		size: {
			index: undefined,
			displayValue: undefined
		},
		width: {
			index: undefined,
			displayValue: undefined
		}
	};

	before(() => {
		return client.init()
			.then(() => testData.load())
			.then(() => catalog = testData.parsedData.catalog)
			.then(() => testData.getProductVariationMaster())
			.then(variationMaster => {
				let variantIds;
				let variant1Selection = new Map();

				productVariationMaster = variationMaster;

				resourcePath = productVariationMaster.getUrlResourcePath();
				variantIds = productVariationMaster.getVariantProductIds();
				variant1.instance = products.getProduct(catalog, variantIds[0]);
				variant2.instance = products.getProduct(catalog, variantIds[10]);

				// We must increment the index by 1 for the attribute selectors that use CSS nth-child which is one-based.
				variant1.color.index = productVariationMaster.getAttrTypeValueIndex('color', variant1.instance.customAttributes.color) + 1;
				variant1.size.index = productVariationMaster.getAttrTypeValueIndex('size', variant1.instance.customAttributes.size) + 1;
				variant1.width.index = productVariationMaster.getAttrTypeValueIndex('width', variant1.instance.customAttributes.width) + 1;

				variant1Selection.set('resourcePath', resourcePath);
				variant1Selection.set('colorIndex', variant1.color.index);
				variant1Selection.set('sizeIndex', variant1.size.index);
				variant1Selection.set('widthIndex', variant1.width.index);

				variant2.color.displayValue = productVariationMaster.getAttrDisplayValue('color', variant2.instance.customAttributes.color);
				variant2.size.displayValue = productVariationMaster.getAttrDisplayValue('size', variant2.instance.customAttributes.size);
				variant2.width.displayValue = productVariationMaster.getAttrDisplayValue('width', variant2.instance.customAttributes.width);

				return productDetailPage.addProductVariationToCart(variant1Selection);
			})
			.then(() => cartPage.navigateTo());
	});

	after(() => client.end());

	it('should display the correct number of rows', () =>
		cartPage
			.getItemList()
			.then(rows => assert.equal(1, rows.value.length))
	);

	it('should display the correct name', () =>
		cartPage
			.getItemNameByRow(1)
			.then(name => assert.equal(productVariationMaster.displayName[countryCode], name))
	);

	it('should display the correct color', () => {
		let expectedColor = productVariationMaster.variationAttributes.color.values[variant1.color.index - 1].displayValues[countryCode];
		return cartPage
			.getItemAttrByRow(1, 'color')
			.then(color => assert.equal(color, expectedColor));
	});

	it('should display the correct size', () => {
		let expectedSize = productVariationMaster.variationAttributes.size.values[variant1.size.index - 1].displayValues[countryCode];
		return cartPage
			.getItemAttrByRow(1, 'size')
			.then(size => assert.equal(size, expectedSize));
	});

	it('should display the correct width', () => {
		let expectedWidth = productVariationMaster.variationAttributes.width.values[variant1.width.index - 1].displayValues[countryCode];
		return cartPage
			.getItemAttrByRow(1, 'width')
			.then(size => assert.equal(size, expectedWidth));
	});

	it('should update attributes', () => {
		let variant2Selection = new Map();

		variant2.color.index = productVariationMaster.getAttrTypeValueIndex('color', variant2.instance.customAttributes.color) + 1;
		variant2.size.index = productVariationMaster.getAttrTypeValueIndex('size', variant2.instance.customAttributes.size) + 1;
		variant2.width.index = productVariationMaster.getAttrTypeValueIndex('width', variant2.instance.customAttributes.width) + 1;

		variant2Selection.set('colorIndex', variant2.color.index);
		variant2Selection.set('sizeIndex', variant2.size.index);
		variant2Selection.set('widthIndex', variant2.width.index);

		return cartPage
			.updateAttributesByRow(itemRow, variant2Selection)
			.then(() => client.getText('tr.cart-row:nth-child(1) .attribute[data-attribute=color] .value'))
			.then(color => assert.equal(color, variant2.color.displayValue))
			.then(() => client.getText('tr.cart-row:nth-child(1) .attribute[data-attribute=size] .value'))
			.then(size => assert.equal(size, variant2.size.displayValue))
			.then(() => client.getText('tr.cart-row:nth-child(1) .attribute[data-attribute=width] .value'))
			.then(width => assert.equal(width, variant2.width.displayValue));
	});

	it('should update quantity in cart', () =>
		cartPage
			.updateQuantityByRow(itemRow, 3)
			.then(quantity => assert.equal(quantity, 3))
	);

	it('should update price in cart when quantity updated', () =>
		cartPage
			.getPriceByRow(itemRow)
			.then(updatedItemSubTotal =>
				assert.equal(updatedItemSubTotal, '$149.97')
			)
	);

	it('should remove product from cart', () =>
		cartPage
			.removeItemByRow(1)
			.then(() => cartPage.verifyCartEmpty())
			.then(empty => assert.ok(empty))
	);

});
