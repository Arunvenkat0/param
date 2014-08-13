## Build tools
Starting with 14.9, SiteGenesis uses [gulp](http://gulpjs.com) as its main build tool. [Grunt](http://gruntjs.com) is also supported.

### Getting started with gulp
- Install gulp globally with `npm install -g gulp`. (This assumes that you already have `npm` installed on your command line. If not, please [install node](http://nodejs.org/download/) first.)
- Pull down the latest copy of SiteGenesis. If you're reading this doc, it is likely that you already have a version of SG with the build tool config.
- Run `npm install`. If there's an error, please try and address that first, either by Googling or [contacting Tri](mailto:tnguyen@demandware.com).

Now that you have gulp and its dependencies installed, you can start using it in your workflow.

### SCSS
Before authoring SCSS, make sure to check out the README in `app_storefront_core/cartridge/scss` directory.

#### Task
The `gulp scss` task does 2 things:
- Compile `.scss` code into `.css`
- [Auto-prefix](https://github.com/ai/autoprefixer) for vendor prefixes

This task is also run automatically on any `.scss` file change by using the `gulp watch` task.

The equivalent tasks for grunt also exist, i.e. `grunt scss` and `grunt watch`.