/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package testcases.smoketest.purchase;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Test Case ID:() 
 Adds two products to the cart and modifies the quantities:
 product1: quantitiy = 1, no discount
 product2: quantitiy = 2, no discount
 
 - checks Minicart
 - checks Quickinfo in header (number of items, total price)
 - checks cart
 
 - modifies the cart (Read, Update, Delete)
 
 This is broken in 13.4. RAP-2396
 */
@ScriptName
("testcases.smoketest.purchase.TCheckCartManagement")
public class TCheckCartManagement extends AbstractScriptTestCase
{
}