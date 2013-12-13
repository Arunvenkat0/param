/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package com.sitegenesis.testcases.smoketest.cart;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * smoketest cart bundle
 Validates a bundle product in the cart and has the following steps:
 
 - open PDP of Bundle
 - add bundle to cart
 - checks that price is only shown at the top level, not by each individual line item
 - checks that quantity is only at the top level editable, not by each individual line item
 - adds bundle to wish list
 - adds bundle to gift registry
 - clicks each product name to verify that PDP of the product is shown
 - removes bundle from cart
 */
@ScriptName
("testcases.smoketest.cart.TCheckBundleInCart")
public class TCheckBundleInCart extends AbstractScriptTestCase
{
}