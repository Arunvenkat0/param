/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package testcases.smoketest.category;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Test Case ID:() 
 This test validates the Send to a Friend overlay which is opened from a PDP. It´s doing the following steps:
 
 - open category, subcategory, first product
 - open staf overlay and close it with x and with cancel
 - clicks the login button at the staf overlay
 - created a new user
 - goes back to the pdp of the first product
 - opens the staf overlay
 - left mandatory fields empty and clicks preview
 - checks for error messages
 - fills all fields and opens the preview
 - validates the data at the preview
 - clicks the edit button
 - changes friends email address and message
 - opens preview again
 - validates new data at preview
 - sends the recommendation
 - closes the confirmation overlay
 - logout
 - back to the homepage
 */
@ScriptName
("testcases.smoketest.category.TSendToFriendFromPDP")
public class TSendToFriendFromPDP extends AbstractScriptTestCase
{
}