## Build tools
Starting with 14.9, SiteGenesis uses [gulp](http://gulpjs.com) as its main build tool. [Grunt](http://gruntjs.com) is also supported.

### Getting started with gulp
- Install gulp globally with `npm install -g gulp`. (This assumes that you already have `npm` installed on your command line. If not, please [install node](http://nodejs.org/download/) first.)
- Pull down the latest copy of SiteGenesis. If you're reading this doc, it is likely that you already have a version of SG with the build tool config.
- Run `npm install`. If there's an error, please try and address that first, either by Googling or [contacting Tri](mailto:tnguyen@demandware.com).

Now that you have gulp and its dependencies installed, you can start using it in your workflow.

### SCSS
Before authoring SCSS, make sure to check out the README in `app_storefront_core/cartridge/scss` directory.

The `gulp scss` task does 2 things:
- Compile `.scss` code into `.css`
- [Auto-prefix](https://github.com/ai/autoprefixer) for vendor prefixes

This task is also run automatically on any `.scss` file change by using the `gulp watch` task.

The equivalent tasks for grunt also exist, i.e. `grunt scss` and `grunt watch`.

### JS
Before authoring JS, make sure to checkout the README in `app_storefront_richUI/cartridge/js` directory.

The new modular JavaScript architecture relies on [browserify](https://github.com/substack/node-browserify) to compile JS code written in CommonJS standard.

The `gulp js` task will compile JS modules in the `js` directory into `static/default/js` directory. The entry point for browserify is `app_storefront_richUI/cartridge/js/app.js`, and the bundled js is output to `app_storefront_richUI/cartridge/static/default/js/app.js`.

This task is also run automatically on any `.js` file change by using the `gulp watch` task. Under the hood, when watching is happening, [watchify](https://github.com/substack/watchify) is used instead of browserify for faster bundling by taking advantage of caching.

The equivalent tasks for grunt also exist, i.e. `grunt js` and `grunt watch`.

*Note: there is currently a known bug with using watchify on OS X Yosemite beta, where subsequent changes to a file are not detected (the first file change is detected). This issue is filed with the file watcher project [chokidar](https://github.com/paulmillr/chokidar/issues/138). The way to go around this is to manually run `gulp js`. This issue does not seem to be a problem for grunt.*