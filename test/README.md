# SiteGenesis Tests
We're launching a new client-side testing strategy for SiteGenesis. It will include:

- functional tests that make sure the application's features are working correctly
- unit tests
- the ability to run all tests on the command-line with a build tool (gulp and grunt), with flexible reporting output

### Application vs Unit Tests
As an application, SG requires thorough testing on both the unit level as well as application level. With recent efforts to modularize client-side code, unit tests will make our modules more reliable. They will also allow custom implementations of SG to reuse our modules.

At the same time, we also need to deliver on a smooth ecommerce experience, and that is where application/ user interface (UI) tests come in. It will cover high level usecases and complex ecommerce scenarios, as well as demonstrate functionalities enabled by our platform.

## Test architecture
### Mocha
We use [Mocha](http://mochajs.org) as the primary framework to run tests on node.js and in the browser. Mocha really excels in making asynchronous actions easy, supporting both callback style and promise-based APIs.

### WebdriverIO
[WebdriverIO](http://webdriver.io) provides bindings for WebDriver protocols in JavaScript. Not only does it provide a simple and clean API to work with, it also integrates nicely with different Selenium drivers for Chrome, Firefox and PhantomJS browsers and support services like SauceLabs that could enable tests to be run on a wide variety of browsers.

### Build tools
Both current build tools that are supported in SiteGenesis, namely gulp and grunt, will be able to run application and unit tests.

### Directory structure

```shell
test
├── README.md
├── application
│   ├── homepage
│   │   └── general.js
│   ├── productDetails
│   │   └── index.js
│   └── webdriver
│       ├── client.js
│       ├── config.json
│       └── config.sample.json
└── unit
└── util
	└── index.js

```
Above is the structure of our tests. The main `test` directory lives in the root folder of SG application. In it will be `application` and `unit` directories.

Application tests' webdriver configurations are in the `webdriver` directory.

The tests are contained in suites, which are represented as directories. For example, the above structure contains Application test suites `homepage` and `productDetails`, and Unit test suite `util`.

## Test Setup

1. Install all dependencies

```shell
:; npm install
```

1. Install phantomjs and standalone Selenium driver

```shell
:; npm install -g phantomjs # see note [1]
:; npm install --production -g selenium-standalone@latest
:; selenium-standalone install # see note [2]
```

1. Use a WebDAV client (i.e. Cyberduck at https://cyberduck.io/) to upload the
testdata directory from the app_storefront/cartridge to the "Impex/src"
directory of your sandbox (https://&lt;sandbox_host&gt;/on/demandware.servlet/webdav/Sites/Impex/src).
You will need to login with a valid Business Manager account that has been
assigned the role of Administrator.

1. Add the `app_storefront` cartridge to the Business Manager Sites-Site
Settings:
    1. Go to **Business Manager > Administration > Manage Sites**
    1. Click on the Manage the **Business Manager** Site link
    1. Set the **Cartridges** field to **app_storefront:bm_custom_plugin**

1. Update site url config and desired browser client in `test/application/webdriver/config.json`. For example:

```javascript
{
	"url": "https://example.demandware.net/s/SiteGenesis",
	"client": "phantomjs"
}
```
 *Note: please use Storefront URL format for application tests, but without the ending `/home` part.*

These 5 steps only need to be performed once.

## Run the tests

### Application tests

After installing the dependencies, start selenium server each time you wish to run the tests.

```shell
:; selenium-standalone start # see note [3]
```

It's important to keep this command-line instance running in the background. Open a new terminal window for next steps. For more information, see http://webdriver.io/guide/getstarted/install.html

1. Reset test data

    To ensure that the application tests can consistently compare results with their
expected values, we have implemented a process to reset test data.  During the
SiteGenesis build process, a job called, **TestDataReset**, is created and available
to run.  **Note:** By default, the site associated with the job is SiteGenesis.
If you are using a different site, please alter the job to point to it.

    Before running a test, please reset the data by following these steps:

    a. Go to **Business Manager > Administration > Job Schedules**

    b. Click on the **TestDataReset** link, which will redirect you to the Job Detail page.

    c. Click the Run button, wait a moment, then periodically click the Refresh
button under the **TestDataReset - History** section until the Status column reports
**Finished**.  The Error column should display **None**.  At this point, you can run
the application tests.

1. Run the test

```sh
:; gulp test:application
```

 This command runs all the test suites by default. In order to run specific test suite(s), you can specify from the command line, for eg. `gulp test:application --suite homepage`.
Other configurations are also available, see below.

### Unit tests

```shell
:; gulp test:unit
```

This command runs all the test suites by default. In order to run specific test suite(s), you can specify from the command line, for eg. `gulp test:unit --suite util`.
Other configurations are also available, see below.

### Options
The following options are supported on the command line:

- `reporter`: (default: `spec`) see [all available options](http://mochajs.org/#reporters).
- `timeout`: (default: `10000`)
- `suite`: (default: `all`)
- `client`: (default: `phantomjs`) browser environment to run UI tests in
- `url`: URL of storefront site to run UI tests against

### Test user accounts

Here are some generic test accounts that are used in the application tests suite,
along with their differences for testing different scenarios:
( **Note** : The password for each account is **Test123!** )

<style type='text/css'>
	td {
		vertical-align: top;
	}
	table {
		border: 1px solid red;
		padding: 2px;
	}
	.test-users, .center {
		text-align: center;
	}
	.test-users, .test-data {
		padding: 2px;
	}
	.variation-master {
		color: #0000ff;
		font-weight: bold;
		font-style: italic;
	}
	.top-level-product {
		font-weight: bold;
	}

</style>
<table class="test-users">
<thead>
<tr>
	<th>Email</th>
	<th>First Name</th>
	<th>Last Name</th>
	<th>Address1</th>
	<th>City</th>
	<th>State Code</th>
	<th>Postal Code</th>
	<th>Country Code</th>
	<th>Phone</th>
	<th>AddressID</th>
	<th>Preferred Address</th>
	<th>Gender</th>
</tr>
</thead>
<tr>
	<td>testuser1@demandware.com</td>
	<td>Test1</td>
	<td>User1</td>
	<td>104 Presidential Way</td>
	<td>Woburn</td>
	<td>MA</td>
	<td>01801</td>
	<td>US</td>
	<td>781-555-1212</td>
	<td>Home</td>
	<td>&#10004;</td>
	<td>F</td>
</tr>
<tr>
	<td></td>
	<td>Test1</td>
	<td>User1</td>
	<td>91 Middlesex Tpke</td>
	<td>Woburn</td>
	<td>MA</td>
	<td>01801</td>
	<td>US</td>
	<td>781-555-1212</td>
	<td>Work</td>
	<td></td>
	<td></td>
</tr>

<tr>
	<td>testuser2@demandware.com</td>
	<td>Test2</td>
	<td>User2</td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
	<td>M</td>
</tr>

<tr>
	<td>testuser3@demandware.com</td>
	<td>Test3</td>
	<td>User3</td>
	<td>3486 Mission St</td>
	<td>San Francisco</td>
	<td>CA</td>
	<td>94110</td>
	<td>US</td>
	<td>415-555-1212</td>
	<td>Mom's</td>
	<td>&#10004;</td>
	<td>F</td>
</tr>

</table>


### Test products

<table class='test-data'>
<thead>
<tr>
	<th>Type</th>
	<th>Product ID</th>
	<th>Display Name</th>
	<th>Color</th>
	<th>Size</th>
	<th>Width</th>
	<th>Product Options</th>
</tr>
</thead>
<tbody>
<tr class='top-level-product'>
	<td>
	Option Product
	</td>
<td>samsung-ln55a950</td>
	<td>Samsung Series 9 55" LCD High Definition Television</td>
	<td></td>
	<td></td>
	<td></td>
	<td>tvWarranty</td>
</tr>
<tr class='top-level-product'>
	<td>VariationMaster</td>
	<td>25686514</td>
	<td>Navy Single Pleat Wool Suit</td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548258</td>
	<td></td>
	<td>Navy<br />(NAVYWL)</td>
	<td class='center'>46</td>
	<td class='center'>Regular</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548265</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>48</td>
	<td class='center'>Regular</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548227</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>42</td>
	<td class='center'>Regular</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548197</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>39</td>
	<td class='center'>Regular</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548234</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>43</td>
	<td class='center'>Regular</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548203</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>40</td>
	<td class='center'>Regular</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548241</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>44</td>
	<td class='center'>Regular</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548432</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>40</td>
	<td class='center'>Long</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548487</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>46</td>
	<td class='center'>Long</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548456</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>42</td>
	<td class='center'>Long</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548319</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>38</td>
	<td class='center'>Short</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548357</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>42</td>
	<td class='center'>Short</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548371</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>44</td>
	<td class='center'>Short</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>750518548296</td>
	<td></td>
	<td>Navy</td>
	<td class='center'>36</td>
	<td class='center'>Short</td>
	<td></td>
</tr>
<tr class='top-level-product'>
	<td>Set</td>
	<td>spring-look</td>
	<td>Spring Look</td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
</tr>
<tr class='variation-master'>
	<td></td>
	<td>25517787<br />(Master Product)</td>
	<td>Long Sleeve Raglan Button Out Turtle Neck</td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>701642808268</td>
	<td></td>
	<td>Fire Red Multi</td>
	<td class='center'>S</td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>701642808251</td>
	<td></td>
	<td>Fire Red Multi</td>
	<td class='center'>M</td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>701642808244</td>
	<td></td>
	<td>Fire Red Multi</td>
	<td class='center'>L</td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>701642808275</td>
	<td></td>
	<td>Fire Red Multi</td>
	<td class='center'>XL</td>
	<td></td>
	<td></td>
</tr>
<tr class='variation-master'>
	<td></td>
	<td>25553432<br />(Master Product)</td>
	<td>Trouser Leg Pant</td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>701643489442</td>
	<td></td>
	<td>Chino<br />(JJ493XX)</td>
	<td class='center'>16</td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>701643489398</td>
	<td></td>
	<td>midnight navy<br />(JJ0VWXX)</td>
	<td class='center'>6</td>
	<td></td>
	<td></td>
</tr>
<tr class='variation-master'>
	<td></td>
	<td>25791388<br />(Master Product)</td>
	<td>Zacco</td>
	<td>Black (BLKBKPA)</td>
	<td></td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>740357431040</td>
	<td></td>
	<td>Black</td>
	<td class='center'>6</td>
	<td class='center'>M</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>740357431057</td>
	<td></td>
	<td>Black</td>
	<td class='center'>6.5</td>
	<td class='center'>M</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>740357431064</td>
	<td></td>
	<td>Black</td>
	<td class='center'>7</td>
	<td class='center'>M</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>740357431071</td>
	<td></td>
	<td>Black</td>
	<td class='center'>7.5</td>
	<td class='center'>M</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>740357431088</td>
	<td></td>
	<td>Black</td>
	<td class='center'>8</td>
	<td class='center'>M</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>740357431095</td>
	<td></td>
	<td>Black</td>
	<td class='center'>8.5</td>
	<td class='center'>M</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>740357431101</td>
	<td></td>
	<td>Black</td>
	<td class='center'>9</td>
	<td class='center'>M</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>740357431118</td>
	<td></td>
	<td>Black</td>
	<td class='center'>9.5</td>
	<td class='center'>M</td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>740357431125</td>
	<td></td>
	<td>Black</td>
	<td class='center'>10</td>
	<td class='center'>M</td>
	<td></td>
</tr>
<tr class='top-level-product'>
	<td>Bundle</td>
	<td>microsoft-xbox360-bundle</td>
	<td>Xbox 360 Bundle</td>
	<td></td>
	<td></td>
	<td></td>
	<td>consoleWarranty</td>
</tr>
<tr>
	<td></td>
	<td>microsoft-xbox360-console</td>
	<td>Microsoft X-Box 360 Game Console</td>
	<td></td>
	<td></td>
	<td></td>
	<td>consoleWarranty</td>
</tr>
<tr>
	<td></td>
	<td>easports-fight-night-round-3-xbox360</td>
	<td>Fight Night: Round 3 (for X-Box 360)</td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>rockstar-games-grand-theft-auto-iv-xbox360</td>
	<td>Grand Theft Auto 4 (for X-Box 360)</td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
</tr>
<tr>
	<td></td>
	<td>sierra-the-bourne-conspiracy-xbox360</td>
	<td>Robert Ludlum's: The Bourne Conspiracy (for X-Box 360)</td>
	<td></td>
	<td></td>
	<td></td>
	<td></td>
</tr>
</tbody>
</table>

# Troubleshooting

1. **Couldn't connect to selenium server error**

    This is likely due to the Selenium server not being started.  Assuming that
    `npm install` has already been run, from a Terminal, please type:
    `selenium-standalone start`

1. **Tests have been succeeding, and with no code changes, tests are suddenly
failing**

    - Has the TestDataReset job been run?  It is possible that a test has been
      run so often that inventory values have been depleted, and certain options
      are no longer available.

    - Another potential area to check is whether Promises in before and beforeEach
      hooks are prepended with `return` as this is needed by Mocha as part of
      its Promises implementation.

1. **Other Tips**

    - Check the Selenium log in the Terminal where `selenium-standalone start`
      was executed for potential clues as to what may have occurred when a
      test failed.


# Notes
*[1] You do not need to install `phantomjs` globally if `./node_modules/bin` is in your `$PATH`.*

*[2] Selenium version 2.44.0 is not compatible with PhantomJS (see https://code.google.com/p/selenium/issues/detail?id=8088). In order to circumvent this, install version 2.43.1 instead: `selenium-standalone install --version=2.43.1`.*

*[3] You might need to use the flag `--version=2.43.1` to start the server as well, similar to note [2].*

