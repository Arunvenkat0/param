/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package testcases.smoketest.giftregistry;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Test Case ID:() 
 Places an order from a new gift registry and checks if the purchase is visible on the gift registry page. These are the steps in detail:
 - register a new user
 - create a new giftregistry
 - add two products
 - log out
 - search for the gift registry
 - order the first product, guest checkout
 - search for the gift registry again
 - validate if the "quantity purchased" of the first product has changed
 */
@ScriptName
("testcases.smoketest.giftregistry.TAddProductToNewGiftRegistryAndOrder")
public class TAddProductToNewGiftRegistryAndOrder extends AbstractScriptTestCase
{
}