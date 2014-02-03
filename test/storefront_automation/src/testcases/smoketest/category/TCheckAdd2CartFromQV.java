/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package testcases.smoketest.category;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Test Case ID:() 
 
 Checks the add to cart behaviour at the quickview overlay.
 
 - opens the quick view of the first product of a product grid
 - checks that add2cart button is disabled
 - selects color and size
 - checks that add2cart button is enabled
 - clicks the add2cart button
 - checks the mini cart behaviour
 - opens quick view of the last product at a grid page
 - verifies this as well
 - adds the product to the cart
 - in view mode you can see if the page scrolls up to see the mini cart
 - checks the mini cart
 */
@ScriptName
("testcases.smoketest.category.TCheckAdd2CartFromQV")
public class TCheckAdd2CartFromQV extends AbstractScriptTestCase
{
}