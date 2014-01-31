/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package testcases.smoketest.myaccount;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Personal data account management. Creates a new user and changes the following information afterwards:
 
 - FirstName
 - LastName
 - Email
 
 
 The user is logged out and loggid in again to proof the changes have been stored correctly. All changes are reverted to the initial state.
 
 During the testcase email and password information are generated dynamically.
 
 */
@ScriptName
("testcases.smoketest.myaccount.TChangePersonalData")
public class TChangePersonalData extends AbstractScriptTestCase
{
}