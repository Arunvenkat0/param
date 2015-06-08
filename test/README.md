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

- Install all dependencies

	```shell
	:; npm install
	```

- Install phantomjs and standalone Selenium driver

	```shell
	:; npm install -g phantomjs # see note [1]
	:; npm install --production -g selenium-standalone@latest
	:; selenium-standalone install # see note [2]
	```

- Use a WebDAV client (i.e. Cyberduck at https://cyberduck.io/) to upload the
testdata directory from the app_storefront_core/cartridge to the "Impex/src"
directory of your sandbox (https://&lt;sandbox_host&gt;/on/demandware.servlet/webdav/Sites/Impex/src).
You will need to login with a valid Business Manager account that has been
assigned the role of Administrator.

- Add the 'app_storefront_core cartridge' to the Business Manager Sites-Site
Settings:
    1. Go to `Business Manager > Administration > Manage Sites` 
    1. Click on the Manage the Business Manager Site link
    1. Set the `Cartridges` field to `app_storefront_core:bm_custom_plugin'

The above 4 steps are only needed once.

## Run the tests

### Application tests

After installing the dependencies, start selenium server each time you wish to run the tests.

```shell
:; selenium-standalone start # see note [3]
```

It's important to keep this command-line instance running in the background. Open a new terminal window for next steps. For more information, see http://webdriver.io/guide/getstarted/install.html

1. Update site url config and desired browser client in `test/application/webdriver/config.json`. For example:

 ```javascript
{
	"url": "http://example.demandware.net/s/SiteGenesis",
	"client": "phantomjs"
}
```
 *Note: please use Storefront URL format for application tests, but without the ending `/home` part.*

1. Reset test data

 To ensure that the application tests can consistently compare results with their
expected values, we have implemented a process to reset test data.  During the 
SiteGenesis build process, a job called, TestDataReset, is created and available
to run.  **Note:** By default, the site associated with the job is SiteGenesis.
If you are using a different site, please alter the job to point to it.

 Before running a test, please reset the data by following these steps:
 
 a. Go to Business Manager > Administration > Job Schedules

    https://&lt;sandbox_host&gt;/on/demandware.store/Sites-Site/default/SMCScheduler-DisplayAll?SelectedMenuItem=operations&CurrentMenuItemId=operations&menuname=Job%20Schedules&mainmenuname=Operations

 b. Click on the TestDataReset link, which will redirect you to the Job Detail page.

 c. Click the Run button, wait a moment, then periodically click the Refresh
button under the "TestDataReset - History" section until the Status column reports
"Finished".  The Error column should display "None".  At this point, you can run
the application tests.

1. Run the test

 ```sh
$ gulp test:application
```

 This command runs all the test suites by default. In order to run specific test suite(s), you can specify from the command line, for eg. `gulp test:application --suite homepage`.
Other configurations are also available, see below.

### Unit tests

```shell
:; gulp test:unit
```
This command runs all the test suites by default. In order to run specific test suite(s), you can specify from the command line, for eg. `gulp test:unit --suite util`.
Other configurations are also available, see below.

### Test user accounts

Here are some generic test accounts that are used in the application tests suite, 
along with their differences for testing different scenarios:
( **Note** : The password for each account is **Test123!** )

<table cellspacing=1 cellpadding=2 border=1>
<thead>
	<tr>
		<th>Email</th>
		<th>First Name</th>
		<th>Last Name</th>
		<th>Address1:</th>
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
	<td align='center'>testuser1@demandware.com</td>
	<td align='center'>Test1</td>
	<td align='center'>User1</td>
	<td align='center'>104 Presidential Way</td>
	<td align='center'>Woburn</td>
	<td align='center'>MA</td>
	<td align='center'>01801</td>
	<td align='center'>US</td>
	<td align='center'>781-555-1212</td>
	<td align='center'>Home</td>
	<td align='center'>&#10004;</td>
	<td align='center'>F</td>
</tr>
<tr>
	<td align='center'></td>
	<td align='center'>Test1</td>
	<td align='center'>User1</td>
	<td align='center'>91 Middlesex Tpke</td>
	<td align='center'>Woburn</td>
	<td align='center'>MA</td>
	<td align='center'>01801</td>
	<td align='center'>US</td>
	<td align='center'>781-555-1212</td>
	<td align='center'>Work</td>
	<td align='center'></td>
	<td align='center'></td>
</tr>

<tr>
	<td align='center'>testuser2@demandware.com</td>
	<td align='center'>Test2</td>
	<td align='center'>User2</td>
	<td align='center'></td>
	<td align='center'></td>
	<td align='center'></td>
	<td align='center'></td>
	<td align='center'></td>
	<td align='center'></td>
	<td align='center'></td>
	<td align='center'></td>
	<td align='center'>M</td>
</tr>

<tr>
	<td align='center'>testuser3@demandware.com</td>
	<td align='center'>Test3</td>
	<td align='center'>User3</td>
	<td align='center'>3486 Mission St</td>
	<td align='center'>San Francisco</td>
	<td align='center'>CA</td>
	<td align='center'>94110</td>
	<td align='center'>US</td>
	<td align='center'>415-555-1212</td>
	<td align='center'>Mom's</td>
	<td align='center'>&#10004;</td>
	<td align='center'>F</td>
</tr>

</table>

### Options
The following options are supported on the command line:

- `reporter`: (default: `spec`) see [all available options](http://mochajs.org/#reporters).
- `timeout`: (default: `10000`)
- `suite`: (default: `all`)

### Notes
*[1] You do not need to install `phantomjs` globally if `./node_modules/bin` is in your `$PATH`.*

*[2] Selenium version 2.44.0 is not compatible with PhantomJS (see https://code.google.com/p/selenium/issues/detail?id=8088). In order to circumvent this, install version 2.43.1 instead: `selenium-standalone install --version=2.43.1`.*

*[3] You might need to use the flag `--version=2.43.1` to start the server as well, similar to note [2].*
