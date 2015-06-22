# Welcome to the SiteGenesis repository

# Purpose
This is the primary repository for Demandware's SiteGenesis development team.  The 'master' branch contains the HEAD code of our development activities.  The HEAD branch has not been released and should be treated "as is".  For 'released' versions of SiteGenesis, either look at our TAGS or consult the Community Branch at [https://bitbucket.org/demandware/sitegenesis-community](https://bitbucket.org/demandware/sitegenesis-community).

Only authorized members of the SiteGenesis developement team can modify the 'master' branch, however, we encourage all other Demandware employees and friends to fork this repository, and submit pull requests according to Contribution Guidelines outlined in [How to contribute to SiteGenesis (Internal Guide)](https://intranet.demandware.com/confluence/pages/viewpage.action?pageId=166199408)

# Demo Storefront Data

## Creating a data installation

Because of file size constraints, the demo store data distribution is broken into 2 distinct parts:
- everything, without high resolution images, including a catalog with hi resolution references removed
- a delta distibution, with only high resolution images, plus a catalog specifically referencing those images

If you need to install high resolution images, you will need to perform 2 separate import steps.

    % git pull demo_data_no_hires_images

When you want to install the high resolution images, you can do that, following the same procedure.

    % git pull demo_data_only_hires_images


## Zipping the files

On the Mac, you should use the commandline `zip` command to make sure the folder structure is created properly.

    % zip -r demo_data_no_hires_images demo_data_no_hires_images


## Upload and import the site

Upload the resulting file to your site and import it.

# Test Automation

Please read the README.md file in the test directory, but essentially, we have a series of application and unit tests that are runnable from the commandline using either 'grunt' or 'gulp'.  The README.md in the test directory will guide in installing and running the tools that you need for executing these tests.

Please note: the tests that we are offering is not a complete, fixed set of tests.  This is a living directory which we will continue to add to as our team is able.  We also encourage any reader of this document to use these tests as a model and to enhance this capability by adding their own tests.

# How to Use
## Build tools
Starting with 15.1, SiteGenesis supports both [gulp](http://gulpjs.com) and [Grunt](http://gruntjs.com) as build tools.

### Getting started
- Pull down the latest copy of SiteGenesis. If you're reading this doc, it is likely that you already have a version of SG with the build tool config.
- `cd` into the `sitegenesis` directory.
- Install node modules:
```sh
$ npm install
```
This assumes that you already have `npm` installed on your command line. If not, please [install node](http://nodejs.org/download/) first.
If you encounter an error, please try and address that first, either by Googling or [contacting us](mailto:tnguyen@demandware.com).
- Install either `gulp` or `grunt` (see below).

#### gulp
Install gulp globally
```sh
$ npm install -g gulp
```

#### grunt
Install the grunt command line tools
```sh
$ npm install -g grunt-cli
```

Now that you have gulp (or grunt) and its dependencies installed, you can start using it in your workflow.


### SCSS
Before authoring SCSS, make sure to check out the [README] in `app_storefront/cartridge/scss` directory.

#### `gulp css`
This task does 2 things:
- Compile `.scss` code into `.css`
- [Auto-prefix](https://github.com/ai/autoprefixer) for vendor prefixes

This task is also run automatically on any `.scss` file change by using the `gulp watch` task.

The equivalent task for grunt, `grunt css`, is also available.

### JS
Before authoring JS, make sure to checkout the [README] in `app_storefront/cartridge/js` directory.

The new modular JavaScript architecture relies on [browserify](https://github.com/substack/node-browserify) to compile JS code written in CommonJS standard.

#### `gulp js`

Compile JS modules in the `js` directory into `static/default/js` directory. The entry point for browserify is `app_storefront/cartridge/js/app.js`, and the bundled js is output to `app_storefront/cartridge/static/default/js/app.js`.

This task is also run automatically on any `.js` file change by using the `gulp watch` task.

The equivalent task for grunt, `grunt js`, is also available.

#### `gulp jscs` and `gulp jshint`
Run code format and style validators. New code must not have any errors reported before being accepted.

The equivalent tasks for grunt, `grunt jscs` and `grunt jshint`, are also available.

### Watching
To make the development process easier, running `gulp` on the command line will run the default task and automatically watch any changes in both `scss` and `js` code to run the right compilers.

For JavaScript, when watching is happening, [watchify](https://github.com/substack/watchify) is used instead of browserify for faster bundling by taking advantage of caching.

The equivalent default task for grunt, `grunt`, is also available.

### Sourcemaps
For sourcemaps support, run `gulp` or `grunt` in development mode by specificying `type` flag, i.e. `:; gulp --sourcemaps`.

We only support external sourcemaps because Eclipse tend to crash with inline sourcemaps.
As a result, if you're using Grunt, sourcemaps is only available when the build steps are run explicitly, i.e. `grunt js --sourcemaps`. Sourcemaps is not enabled during `watch` mode.

Updated: 3/19/15
