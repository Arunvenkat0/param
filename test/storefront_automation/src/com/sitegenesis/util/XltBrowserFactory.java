package com.sitegenesis.util;

import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.phantomjs.PhantomJSDriver;
import org.openqa.selenium.phantomjs.PhantomJSDriverService;
import org.openqa.selenium.remote.DesiredCapabilities;

import com.xceptance.xlt.api.util.XltLogger;
import com.xceptance.xlt.api.util.XltProperties;
import com.xceptance.xlt.api.webdriver.XltDriver;


/**
 * Creates WebDriver browser instances for automation testing.
 * 
 * @author jbogner
 *
 */
public class XltBrowserFactory {

	public final static String CHROME 		= "chrome";
	public final static String XLT 			= "xlt";
	public final static String PHANTOM_JS 	= "phantomjs";
	public final static String FIRE_FOX 	= "firefox";
	
	public static int DEFAULT_BROWSER_WIDTH 	= 1200;
	public static int DEFAULT_BROWSER_HEIGHT 	= 900;
	

	/**
	 * Returns the configured WebDriver browser type.<br>
	 * Uses a default browser height and width. (DEFAULT_BROWSER_HEIGHT, DEFAULT_BROWSER_WIDTH)
	 * @return WebDriver instance.
	 */
	public static WebDriver getWebDriver() {
		return getWebDriver(DEFAULT_BROWSER_WIDTH, DEFAULT_BROWSER_HEIGHT);
	}
	
	
	/**
	 * Returns the configured WebDriver browser type. 
	 * @param width
	 * @param height
	 * @return WebDriver instance.
	 */
	public static WebDriver getWebDriver(int width, int height) {
		
		WebDriver webDriver = null;
		
		// Get WebDriver name/type to use from configuration.  Defaults to "" if none is found.
		final String driverName = (XltProperties.getInstance().getProperty("webdriver") != null) ? XltProperties.getInstance().getProperty("webdriver") : "";
		
	
		if (driverName.equalsIgnoreCase(CHROME)) {
			
			XltLogger.runTimeLogger.info("Using chrome driver");
			webDriver = getChromeWebDriver(width, height);
			
		} else if ((driverName.equalsIgnoreCase(PHANTOM_JS))) { 
			
			XltLogger.runTimeLogger.info("Using PhantomJS driver");
			webDriver = getPhantomWebDriver();
		
		} else if ((driverName.equalsIgnoreCase(FIRE_FOX))) {
			
			XltLogger.runTimeLogger.info("Using firefox driver");
			webDriver = getFirefoxWebDriver(width, height);
			
		} else if ((driverName.equalsIgnoreCase(XLT))) {
			
			XltLogger.runTimeLogger.info("Using Xlt driver");
			webDriver = getXLTWebDriver();
			
		} else {  /* No Driver Type Identified.... */
			String message = "No webdriver could be determined for \"" + driverName + "\", Not setting one, so this will now fail.";
			XltLogger.runTimeLogger.error(message);
			webDriver = null;
			
//			String message = "No webdriver could be determined for \""
//					+ driverName + "\", Setting default PhantomJS driver.";
//			XltLogger.runTimeLogger.info(message);
//			XltLogger.runTimeLogger.info("Using PhantomJS driver");
//			webDriver = getPhantomWebDriver();

		}
		
		return webDriver;
	}
	
	
	/**
	 * Get a Chrome WebDriver instance.
	 * @param width
	 * @param height
	 * @return WebDriver
	 */
	private static WebDriver getChromeWebDriver(int width, int height) {
		
		WebDriver webDriver = null;
		
		System.setProperty("webdriver.chrome.driver", XltProperties.getInstance().getProperty("webdriver.chrome.binary.location"));

		final DesiredCapabilities capabilities = DesiredCapabilities.chrome();

		webDriver = new ChromeDriver(capabilities);
		
		webDriver.manage().window().setSize(new Dimension(width, height));
		
		return webDriver;
	}
	
	
	/**
	 * Get a Firefox WebDriver instance.
	 * @param width
	 * @param height
	 * @return WebDriver
	 */
	private static WebDriver getFirefoxWebDriver(int width, int height) {
		
		WebDriver webDriver = null;
		
		webDriver = new FirefoxDriver();
		
		webDriver.manage().window().setSize(new Dimension(width, height));
		
		return webDriver;
	}
	
	
	/**
	 * Get a Phantom JS WebDriver instance.
	 * @return WebDriver
	 */
	private static WebDriver getPhantomWebDriver() {
		
		WebDriver webDriver = null;
	
		System.setProperty(
				PhantomJSDriverService.PHANTOMJS_EXECUTABLE_PATH_PROPERTY, 
				XltProperties.getInstance().getProperty("webdriver.phantomjs.binary.location") );
		
		System.out.println(PhantomJSDriverService.PHANTOMJS_EXECUTABLE_PATH_PROPERTY);
		
		final DesiredCapabilities capabilities = DesiredCapabilities.phantomjs();
		
		webDriver = new PhantomJSDriver(capabilities);
		
		return webDriver;
	}
	
	
	/**
	 * Get an XLT WebDriver instance.
	 * @return WebDriver
	 */
	private static WebDriver getXLTWebDriver() {
		
		WebDriver webDriver = null;
		
		webDriver = new XltDriver();
		
		return webDriver;
	}
	

	/**
	 * @param args
	 */
	public static void main(String[] args) {}
}
