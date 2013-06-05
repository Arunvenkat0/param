/*
 * NOTE: This file is generated. Do not edit! Your changes will be lost.
 */
package com.sitegenesis.testcases.responsive;
import com.sitegenesis.util.AbstractBrowserScriptTestCase;
import com.xceptance.xlt.api.engine.scripting.ScriptName;
import com.xceptance.xlt.api.util.XltProperties;


/**
 * 
 */
@ScriptName
("testcases.responsive.TPurchaseAsGuestResponsive")
public class TPurchaseAsGuestResponsive extends AbstractBrowserScriptTestCase
{
	public TPurchaseAsGuestResponsive() 
	{
		super(
				XltProperties.getInstance().getProperty("webdriver.screensize.responsivedesign.width", 600), 
				XltProperties.getInstance().getProperty("webdriver.screensize.responsivedesign.height", 800));
	}
}