/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package com.sitegenesis.testcases.purchase;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Purchases a product as registered user and checks the order review feature.
 The steps in detail:
 - register a new user
 - enter a credit card
 - search for a product and put it into the cart
 - perform checkout and place the order
 - go to my account - orders
 - validate details of the placed order
 - logout
 - use the check-order-feature as guest
 - validate details of the placed order
 */
@ScriptName
("testcases.purchase.TPurchaseAndReviewOrder")
public class TPurchaseAndReviewOrder extends AbstractScriptTestCase
{
}