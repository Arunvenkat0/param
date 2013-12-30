/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package com.sitegenesis.testcases.smoketest.category;
import com.sitegenesis.util.AbstractBrowserScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Steps
 Homepage -> Select a category and its sub category
 Select all the sort options in the dropdown one by one.
 Page through the results.
 Change the sort order.
 Expected Results
 at 1. The page displays all the products under that particular sub-category of that category.
 at 2. Product grid refreshes based on the selection.
 at 3. The sort is persistent.
 at 4. This causes the first result page to appear.
 */
@ScriptName
("testcases.smoketest.category.TSortByCategory")
public class TSortByCategory extends AbstractBrowserScriptTestCase
{
}