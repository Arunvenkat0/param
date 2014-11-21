## Steps to run UI tests

- Install all the dependencies.

```sh
$ npm install
```

- Install Selenium driver and start the server

```sh
$ npm install --production selenium-standalone@latest -g
$ start-selenium
```

It's important to keep this command-line instance running in the background. Open a new window for next steps. For more information, see http://webdriver.io/guide/getstarted/install.html

- Update site url config and desired browser client
    If you are running selenium test, specify a url and client in `test/webdriver/config.json`. For example:

```json
{
	"url": "http://example.com",
	"client": "phantomjs"
}
```

- Run the test

```sh
$ gulp ui-test
```

This command runs all the test suites by default. In order to run specific test suite(s), you can specify from the command line, for eg. `gulp ui-test --suite homepage`.
Other configurations are also available, see below.

### Options
The following options are supported on the command line:

- `reporter`: (default: `spec`) see [all available options](http://mochajs.org/#reporters).
- `timeout`: (default: `10000`)
- `suite`: (default: `all`)

## Authoring

### `test/ui` directory
All of SiteGenesis's UI tests are located in the `test/ui` directory.

Here's an example breakdown of this directory:

```
❯ tree test/ui
test/ui
├── homepage
│   └── general.js
├── productDetails
│   └── index.js
└── webdriver
    ├── client.js
    ├── config.json
    └── config.sample.json
```

The `webdriver` directory contains configuration settings for webdriver. All the other directories in `test/ui` are test suites.

### Test suites
