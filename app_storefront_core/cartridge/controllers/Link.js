var g = require('./dw/guard');

/*
 * This pipeline forwards calls to other pipelines. It is here to support legacy code where 
 * content assets could link to that pipeline only. For all new code link to the respective 
 * pipeline directly (Search-Show, Product-Show, etc.)
 */
function Category()
{
    var SearchController = require('./Search');
    SearchController.Show();
}

function CategoryProduct()
{
    var ProductController = require('./Product');
    ProductController.ShowInCategory();
}

function Product()
{
    var ProductController = require('./Product');
    ProductController.Show();
}

function Page()
{
    var PageController = require('./Page');
    PageController.Show();
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Category        = g.get(Category);
exports.CategoryProduct = g.get(CategoryProduct);
exports.Product         = g.get(Product);
exports.Page            = g.get(Page);
