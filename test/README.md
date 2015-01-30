# SiteGenesis Tests
We're launching a new client-side testing strategy for SiteGenesis. It will include:

- a stronger focus on unit tests, whether that is pure JavaScript unit tests, or tests that run in a browser environment
- the ability to run all tests on the command-line with a build tool (gulp and grunt), with flexible reporting output

## UI vs Unit Tests
As an application, SG requires thorough testing on both the unit level as well as user interface level. With recent efforts to modularize client-side code, unit tests will make our modules more reliable. They will also allow custom implementations of SG to reuse our modules.

At the same time, we also need to deliver on a smooth ecommerce experience, and that is where UI tests come in. It will cover high level usecases and complex ecommerce scenarios, as well as demonstrate functionalities enabled by our platform.

## Test architecture
### Mocha
We use [Mocha](http://mochajs.org) as the primary framework to run tests on node.js and in the browser. Mocha really excels in making asynchronous actions easy, supporting both callback style and promise-based APIs.

### WebdriverIO
[WebdriverIO](http://webdriver.io) provides bindings for WebDriver protocols in JavaScript. Not only does it provide a simple and clean API to work with, it also integrates nicely with different Selenium drivers for Chrome, Firefox and PhantomJS browsers and support services like SauceLabs that could enable tests to be run on a wide variety of browsers.

### Build tools
Both current build tools that are supported in SiteGenesis, namely gulp and grunt, will be able to run UI and unit tests.

### Directory structure

```sh
test
├── README.md
├── ui
│   ├── homepage
│   │   └── general.js
│   ├── productDetails
│   │   └── index.js
│   └── webdriver
│       ├── client.js
│       ├── config.json
│       └── config.sample.json
└── unit
    ├── browser
    │   ├── dist
    │   │   └── product-tile.js
    │   ├── product-tile.html
    │   └── product-tile.js
    ├── productDetails
    │   └── productTile.js
    ├── util
    │   └── index.js
    └── webdriver
        ├── client.js
        └── config.json
```
Above is the structure of our tests. The main `test` directory lives in the root folder of SG application. In it will be `ui` and `unit` directories.

Each type of test will have their own webdriver setup, which lives in the `webdriver` directories.

The tests are contained in suites, which are represented as directories. For example, the above structure contains UI test suites `homepage` and `productDetails`, and Unit test suites `productDetails` and `util`.

### Browser tests

Sometimes we need to run unit tests in a browser environment, such as testing DOM manipulation with jQuery. In such cases, the browser environment can be set up in the `browser` directory.

A local static web server will be established when the tests are run, serving assets in `browser` directory to `localhost` port `7000`, i.e. `http://localhost:7000`.

Any JavaScript required for browser tests should be written in the standard CommonJS syntax with references to modules that live in the core casrtridges. Browserify will resolve those dependencies and create a bundle in `browser/dist`. For example, the content of `test/unit/browser/product-tile.js` is:

```js
'use strict';
var productTile = require('../../../app_storefront_richUI/cartridge/js/product-tile');
productTile.init();
```
The bundle can then be pulled in to the site with a simple `script` tag as such:

```html
<script type="text/javascript" src="./dist/product-tile.js"></script>
```

## Run the test

- Install all dependencies

```sh
$ npm install
```

- Install phantomjs, Selenium driver and start the server

```sh
$ npm install -g phantomjs # see note [1]
$ npm install --production -g selenium-standalone@latest # see note [2]
$ selenium-standalone install
$ selenium-standalone start
```

It's important to keep this command-line instance running in the background. Open a new terminal window for next steps. For more information, see http://webdriver.io/guide/getstarted/install.html

*[1] You do not need to install `phantomjs` globally if `./node_modules/bin` is in your `$PATH`.*

*[2] Selenium version 2.44.0 is not compatible with PhantomJS (see https://code.google.com/p/selenium/issues/detail?id=8088). In order to circumvent this, install version 2.43.1 instead: `selenium-standalone install --version=2.43.1`.*

### Unit tests

- Update webdriver config in `test/unit/webdriver/config.json`. The default should just work.

```json
{
	"url": "http://localhost:7000",
	"client": "phantomjs"
}
```

- Run the test

```sh
$ gulp test:unit
```
This command runs all the test suites by default. In order to run specific test suite(s), you can specify from the command line, for eg. `gulp test:unit --suite util`.
Other configurations are also available, see below.

### UI tests

- Update site url config and desired browser client in `test/ui/webdriver/config.json`. For example:

```json
{
	"url": "http://example.demandware.net/on/demandware.store/Sites-SiteGenesis-Site",
	"client": "phantomjs"
}
```

- Run the test

```sh
$ gulp test:ui
```

This command runs all the test suites by default. In order to run specific test suite(s), you can specify from the command line, for eg. `gulp test:ui --suite homepage`.
Other configurations are also available, see below.

### Options
The following options are supported on the command line:

- `reporter`: (default: `spec`) see [all available options](http://mochajs.org/#reporters).
- `timeout`: (default: `10000`)
- `suite`: (default: `all`)
