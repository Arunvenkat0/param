'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as footer from '../pageObjects/footer';
import * as homePage from '../pageObjects/home';
import url from 'url';
import * as common from '../pageObjects/helpers/common';


describe('Header #C147202', () => {
    var sparams;
    before(() => client.init()
        .then(() => homePage.navigateTo())
    );

    after(() => client.end());

    it('#1 Navigate to NewArrivals', () =>
       client.waitForVisible(footer.FOOTER_CONTAINER)
           .click(homePage.NEW_ARRIVALS)
           .waitForVisible(common.PRIMARY_CONTENT)
           .url()
           .then(currentUrl => {
               let parseUrl = url.parse(currentUrl.value);
               return assert.isTrue(parseUrl.pathname.endsWith('new%20arrivals/'));
            })
    );

    it('#2 Navigate to Womens', () =>
       client.waitForVisible(footer.FOOTER_CONTAINER)
          .click(homePage.WOMENS)
          .waitForVisible(common.PRIMARY_CONTENT)
          .url()
          .then(currentURL => {
              let parseUrl = url.parse(currentURL.value);
              return assert.isTrue(parseUrl.pathname.endsWith('womens/'));
           })
    );

    it('#3 Navigate to Mens', () =>
       client.waitForVisible(footer.FOOTER_CONTAINER)
          .click(homePage.MENS)
          .waitForVisible(common.PRIMARY_CONTENT)
          .url()
          .then(currentURL => {
              let parseUrl = url.parse(currentURL.value);
              return assert.isTrue(parseUrl.pathname.endsWith('mens/'));
           })
    );

    it('#4 Navigate to Electronics', () =>
       client.waitForVisible(footer.FOOTER_CONTAINER)
          .click(homePage.ELECTRONICS)
          .waitForVisible(common.PRIMARY_CONTENT)
           .url()
          .then(currentURL => {
             let parseUrl = url.parse(currentURL.value);
             return assert.isTrue(parseUrl.pathname.endsWith('electronics/'));
           })

    );

    it('#5 Navigate to Top Sellers', () =>
       client.waitForVisible(footer.FOOTER_CONTAINER)
          .click(homePage.TOP_SELLERS)
          .waitForVisible(common.PRIMARY_CONTENT)
           .then(() => common.getSearchParams())
           .then(params => sparams = params)
           .then(() => assert.equal(sparams.srule, 'top-sellers'))

    );
});
