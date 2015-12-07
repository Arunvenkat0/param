'use strict';

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var getConfig = require('@tridnguyen/config');
var _ = require('lodash');

var opts = _.assign({}, getConfig({
    client: 'chrome',
    url: 'https://staging-sitegenesis-dw.demandware.net/s/SiteGenesis',
    suite: '*',
    reporter: 'spec',
    timeout: 60000
}, './config.json'), argv);

var specs = 'test/application/' + opts.suite;

if (opts.suite.indexOf('.js') === -1) {
    specs += '/**';
}

exports.config = {
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: opts.timeout,
        compilers: ['js:babel-core/register']
    },
    specs: [
        specs
    ],
    capabilities: [{
        browserName: opts.client
    }],
    waitforTimeout: opts.timeout,
    baseUrl: opts.url,
    reporter: opts.reporter,
    reporterOptions: {
        outputDir: 'test/reports'
    }
};
