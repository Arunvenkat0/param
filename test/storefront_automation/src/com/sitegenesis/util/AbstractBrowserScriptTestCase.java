package com.sitegenesis.util;

import org.junit.After;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.remote.DesiredCapabilities;

import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;
import com.xceptance.xlt.api.util.XltLogger;
import com.xceptance.xlt.api.util.XltProperties;
import com.xceptance.xlt.api.webdriver.XltDriver;

public class AbstractBrowserScriptTestCase extends AbstractScriptTestCase 
{
	/**
	 * The browser driver
	 */
	private final WebDriver webDriver;

	/**
	 * Constructor.
	 */
	public AbstractBrowserScriptTestCase(int width, int height) 
	{
		
		webDriver = XltBrowserFactory.getWebDriver( width, height );
	
		// enabled shutdown on quit
		if (webDriver != null && XltProperties.getInstance().getProperty("webdriver.shutdownAfterTest", true))
		{
			// clean up the driver when the JVM quits
			Runtime.getRuntime().addShutdownHook(new Thread()
			{
				@Override
				public void run()
				{
					System.out.println("Shutdown Hook Called: webDriver.quit()");
					webDriver.quit();
				}
			});
		}

		// sets the web driver to be used.
		setWebDriver(webDriver);
	}

	/**
	 * Default Constructor.
	 */
	public AbstractBrowserScriptTestCase()
	{
		
		this(XltProperties.getInstance().getProperty("webdriver.screensize.width", 1200), 
			 XltProperties.getInstance().getProperty("webdriver.screensize.height", 900));
	}
	
	
	@After
	public void stopWebDriver() 
	{
		// do we want to close it after the test?
		if (XltProperties.getInstance().getProperty("webdriver.shutdownAfterTest", true))
		{
			System.out.println("Stop Web Driver: webDriver.quit()");
			webDriver.quit();
		}
	}
}
