### Steps to run headless browser tests

- Install mocha and phantomjs

    ```sh
    $ npm install -g mocha phantomjs
    ```
- Install Selenium driver and start the server

    ```sh
    $ npm install --production selenium-standalone@latest -g
    $ start-selenium
    ```
    For more information, see http://webdriver.io/guide/getstarted/install.html
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
    $ npm test
    ```
