#!/usr/bin/env node

var browserify = require('browserify');
var watchify = require('watchify');
var exorcist = require('exorcist');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var pkg = require('../package.json');
var mkdirp = require('mkdirp');
var argv = require('minimist')(process.argv.slice(2));

pkg.paths.js.forEach((jsPath) => {
    mkdirp(jsPath.dest, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        bundleJs(jsPath, {
            watching: Boolean(argv.w || argv.watch),
            sourcemaps: Boolean(argv.sourcemaps)
        });
    });
});

function createBundler (jsPath, options) {
    try {
        var stat = fs.statSync(jsPath.src);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(jsPath.src + ' is not found.');
            return;
        } else {
            throw err;
        }
    }

    var filename, dirname;
    if (stat.isDirectory()) {
        dirname = jsPath.src;
        // trying to heuristically determine JS file name,
        // in order of index.js, main.js and app.js
        try {
            fs.statSync(jsPath.src + '/index.js');
            filename = 'index.js';
        } catch (e) {
            try {
                fs.statSync(jsPath.src + '/main.js');
                filename = 'main.js';
            } catch (e) {
                try {
                    fs.statSync(jsPath.src + '/app.js');
                    filename = 'app.js';
                } catch (e) {
                    console.error('Unable to find a JS file to bundle.');
                    return;
                }
            }
        }
    } else if (stat.isFile()) {
        dirname = path.dirname(jsPath.src);
        filename = path.basename(jsPath.src);
    }

    var opts = {
        entries: path.resolve(dirname, filename),
        debug: options.sourcemaps
    };

    if (options.watching) {
        opts = Object.assign(opts, watchify.args);
    }

    var bundler = browserify(opts);
    if (options.watching) {
        bundler = watchify(bundler);
    }

    // optionally transform
    // bundler.transform('transformer');

    bundler.on('update', function (ids) {
        console.log('File(s) changed: ' + chalk.cyan(ids));
        console.log('Rebundling...');
        rebundle(bundler, jsPath);
    });

    bundler.on('log', console.log.bind(console));

    return bundler;
}

function rebundle (b, jsPath) {
    var filename = path.basename(b._options.entries);
    return b.bundle()
        .on('error', function (e) {
            console.log(chalk.red('Browserify Error: ', e));
        })
        .on('end', function () {
            console.log(chalk.green(b._options.entries
                + ' -> ' + path.resolve(jsPath.dest, filename)
            ));
        })
        // sourcemaps
        .pipe(exorcist(path.resolve(jsPath.dest, filename + '.map')))
        .pipe(fs.createWriteStream(path.resolve(jsPath.dest, filename)));
}

function bundleJs (jsPath, options) {
    var b = createBundler(jsPath, options);
    if (!b) {
        return;
    }
    return rebundle(b, jsPath);
}
