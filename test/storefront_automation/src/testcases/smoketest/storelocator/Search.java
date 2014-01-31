/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package testcases.smoketest.storelocator;
import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;


/**
 * Preconditions
 Store data has to be configured in the Business Manager (Sites > Online Marketing > Stores).
 Steps
 Homepage -> STORE LOCATOR
 Click SEARCH button under the ZIP CODE field without entering any detail.
 Enter incorrect data in the zipcode -> SEARCH
 Enter less than or equal to 4 digits
 Enter valid ZIP CODE -> SEARCH
 Confirm the stores are correct based on data in BusMgr.
 Test zip code search with at least some of the different radius options and check against BusMgr data to make sure correct stores are being returned.
 Test state search for a state that should return a result.
 Confirm the stores are correct based on data in BusMgr.
 Test international search for a country that should return a result.
 Confirm the stores are correct based on data in BusMgr.
 do a search without results. (Test for each of the three options.)
 For each of the options, confirm you can trigger a search by
 clicking on the SEARCH button
 using the ENTER key on the keyboard
 Expected Results
 Store locator landing page is shown.
 User has options to search by zip code and radius
 User has options to search by state
 User has options to search outside the US
 Search results page with list of stores (this page is tested separately) is shown.
 Correct.
 Each redaius option triggers a search correctly and data is correct.
 Search results page with list of stores is shown.
 Correct.
 Search results page with list of stores is shown.
 Correct.
 A message is displayed on this page.
 Works.
 */
@ScriptName
("testcases.smoketest.storelocator.Search")
public class Search extends AbstractScriptTestCase
{
}