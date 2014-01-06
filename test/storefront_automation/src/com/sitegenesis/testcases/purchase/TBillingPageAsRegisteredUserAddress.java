/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package com.sitegenesis.testcases.purchase;
import com.sitegenesis.util.AbstractBrowserScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Preconditions
 
 Log in, put item(s) in cart and start checkout.
 
 Test with a registered user who
 - has no saved addresses
 - has one or more saved addresses
 
 Expected Results
 
 The billing address fields are filled with the customer's default address.
 If the user has no default address or no saved addresses, these fields are blank.
 If user chose on shipping page to use that address for billing, the shipping address is pre-populated here.
 A user who has saved addresses can choose one from the dropdown, and this fills in the fields.
 A user who has not saved an address yet does not see a dropdown.
 User can edit address fields after choosing an address from the dropdown. (That does not modify the saved address.)
 Test form validation: make sure user cannot leave required fields blank and can leave optional fields blank.
 Test form validation: make sure user has to enter valid information for zip code and phone numbers and the email address. (Unless specified in a project, the other fields do not have strict validation rules.)
 Test with foreign addresses as well: check the telephone field with valid foreign numbers (which will be formatted differently and have different numbers of digits than US)
 Test with foreign addresses as well: the zip code field is the biggest problem here. Make sure it is not restricted to accepting US zip codes. Common problems are Canada/UK (letters, numbers, space) and Australia (only four digits). US zip code should be accepted as 12345 or 12345-6789.
 Depending on what countries are allowed, test the interplay of country/state fields. For example, if country is changed to Canada, user should see Canadian provinces in the dropdown instead of US states and the field label should change to 'province'.
 */
@ScriptName
("testcases.purchase.TBillingPageAsRegisteredUserAddress")
public class TBillingPageAsRegisteredUserAddress extends AbstractBrowserScriptTestCase
{
}