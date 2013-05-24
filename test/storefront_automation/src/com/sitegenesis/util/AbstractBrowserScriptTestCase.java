package com.sitegenesis.util;

import org.junit.After;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.remote.DesiredCapabilities;

import com.xceptance.xlt.api.engine.scripting.AbstractScriptTestCase;

public class AbstractBrowserScriptTestCase extends AbstractScriptTestCase {
	/**
	 * The browser driver
	 */
	private final WebDriver webDriver;

	/**
	 * Constructor.
	 */
	public AbstractBrowserScriptTestCase() {
		// create a single driver instance
		System.setProperty("webdriver.chrome.driver",
				"/home/rschwietzke/projects/demandware/sitegenesis-testautomation/chromedriver");

		final DesiredCapabilities capabilities = DesiredCapabilities.chrome();

//		webDriver = new FirefoxDriver();
		webDriver = new ChromeDriver(capabilities);
		webDriver.manage().window().setSize(new Dimension(1200, 900));

//		// clean up the driver when the JVM quits
//		Runtime.getRuntime().addShutdownHook(new Thread()
//		{
//			@Override
//			public void run()
//			{
//				webDriver.quit();
//			}
//		});

		// sets the web driver to be used.
		setWebDriver(webDriver);
	}

	@After
	public void stopWebDriver() {
		webDriver.quit();
	}
}
