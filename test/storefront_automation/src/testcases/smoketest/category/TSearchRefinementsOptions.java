/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package testcases.smoketest.category;
import org.junit.Ignore;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * DISABLED:  Requires access to Business Manager Instance.
 
 Steps
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
("testcases.smoketest.category.TSearchRefinementsOptions")
@Ignore
public class TSearchRefinementsOptions extends AbstractScriptTestCase
{
}