For contribution guideline, please see `CONTRIBUTING.md`

# Demo Storefront Data

## Creating a data installation

Because of file size constraints, the demo store data distribution is broken into 2 distinct parts:
- everything, without high resolution images, including a catalog with hi resolution references removed
- a delta distibution, with only high resolution images, plus a catalog specifically referencing those images

If you need to install high resolution images, you will need to perform 2 separate import steps.

    % git pull sg20_demo_data_no_hires_images

When you want to install the high resolution images, you can do that, following the same procedure.

    % git pull sg20_demo_data_only_hires_images


## Zipping the files

On the Mac, you should use the commandline `zip` command to make sure the folder structure is created properly.

    % zip -r sg20_demo_data_no_hires_images sg20_demo_data_no_hires_images


## Upload and import the site

Upload the resulting file to your site and import it.

# Test Automation

## Overview

Within the folder `test/storefront_automation` you can find a complete testsuite of automated storefront tests
created with and for the [XLT](http://www.xceptance-loadtest.com/). Watch this [screencast](http://youtu.be/Ykx4DcKo-mc) for a quick start.

The documentation of the test suite can be found in `test/storefront_automation/doc/testcases_manual.html`. It also explains how to create a new version of the documentation based on your latest changes.

## How to run with ANT?

You can run the entire test suite with the Script Developer in Firefox and watch the tests live. See the screencast for more info.

The test suite also gained the ability to be executed from Eclipse or ANT directly by utilizing WebDrivers. Currently ChromeDriver and FirefoxDriver work fine. IEDrivers has not been tried yet. PhantomJS is similar to Chrome and therefore should work as well. You can find some details about getting WebDriver to work with XLT [here](http://blog.xceptance.com/2013/04/23/webdrivers-in-xlt-how-to-run-test-cases-in-multiple-browser/).

The following steps explain quickly, how you can run the tests via ANT and use this either for build machines or a more automate local execution on your machine. This should work on any OS. Please make sure that you adjust the path names according to your OS style. The following examples are for OS X and Linux.

* Download [XLT](http://www.xceptance-loadtest.com/products/xlt/download.html) and unzip it.
* You need Java 7 and ANT installed on your machine.
* You need Chrome and Firefox as well.
* When you want to run Chrome tests, you have to download the [ChromeDriver binary](http://code.google.com/p/chromedriver/downloads/list).
* Adjust the path to XLT in the `<testsuite>/build.properties` file: `xlt.home.dir = /home/user/xlt`
* Check `<testsuite>/config/project.properties` and pick the driver you want and adjust the other related properties too:
 * Pick the driver to use: `webdriver = chrome`
 * Adjust the location of the Chrome binary: `webdriver.chrome.binary.location = /home/location/chromdriver`
 * Set the screen size if needed: `webdriver.screensize.[width|height] = 1200` You can also set the screensize for the responsive tests.
* Open a shell and go to `<testsuite>` and run `ant compile` just to make sure the basics are set right.
* Run `ant test.java` and enjoy the magic happening.

At the end of the test, a JUnit report will be compiled and can be found in `<testsuite>/results/`.

## Tool

For more information about XLT, please visit http://www.xceptance-loadtest.com/. You can
download the tool for free and browse the [documentation](http://www.xceptance-loadtest.com/releases/xlt/latest/user-manual.html "XLT Documentation") online.

Updated: 6/13/14
