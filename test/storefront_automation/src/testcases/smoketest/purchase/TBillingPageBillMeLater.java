/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package testcases.smoketest.purchase;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Test Case ID:() 
 Preconditions
 
 NOTE:
 
 SG is not integrated with BML so orders cannot actually be placed using this payment method. This just tests the form on the billing page.
 Expected Results
 
 Choosing the Bill Me Later payment method opens form with BML fields.
 User is asked to enter date of birth and last four digits of SSN, sees terms and conditions and is asked to check box agreeing to T and C. DoB, SSN and checkbox are all required.
 User sees error message if any of these BML required fields are not filled out and cannot proceed to the next step of checkout.
 */
@ScriptName
("testcases.smoketest.purchase.TBillingPageBillMeLater")
public class TBillingPageBillMeLater extends AbstractScriptTestCase
{
}