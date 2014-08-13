# SASS Guide
This is a port of SiteGenesis's old CSS architecture to using SASS.

## Authoring
All stylesheets are now written in SCSS, whose syntax is a superset of CSS. This means that any existing CSS is valid SCSS.

SCSS authoring is meant to be used with a build tool, which is currently [gulp](http://gulpjs.com) (Grunt is also supported.)
Once compiled, the SCSS is output as CSS in `static/default/css` folder just like before.

For more info about build tools and how to use them, check out the project's Contributions guideline in `CONTRIBUTING.md`.

### Code styles
Inspired by <https://github.com/twbs/bootstrap/blob/master/CONTRIBUTING.md#css> and <http://css-tricks.com/sass-style-guide/>

- Include partials should be prefixed with `_`, i.e. `_partial.scss`
- Multiple-line approach (one property and value per line).
- Always a space after a property's colon (e.g., `display: block;` and not `display:block;`).
- End all lines with a semi-colon.
- For multiple, comma-separated selectors, place each selector on its own line.
- No vendor prefixes. This will be done at build time.
- Attribute selectors, like `input[type="text"]` should always wrap the attribute's value in double quotes, for consistency and safety.
- Maximum selector nesting: **three** levels deep.
- Global sass file (`style.scss`) is just a table of content.
- Avoid the use of ID (#) like a plague. Class naming is preferred.
- When using class or ID selector, drop the element selector, i.e. `.className` and not `div.className`.

### Eclipse
To edit `.scss` files in Eclipse, install the [Aptana Studio Eclispe Plug-in](http://www.aptana.com/products/studio3/download) version.
