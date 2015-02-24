/**
 * This module contains helper functions for the wishlist handling.
 */

/**
 * Gets or creates a wish list for the current customer.
 * 
 * @return  the product list
 */
exports.fetchWishList = function()
{
    var ProductList = null;

    var GetProductListsResult = new dw.system.Pipelet('GetProductLists').execute({
        Customer : customer,
        Type : dw.customer.ProductList.TYPE_WISH_LIST
    });
    var ProductLists = GetProductListsResult.ProductLists;


    if (ProductLists.size() > 0)
    {
        ProductList = ProductLists.iterator().next();
    }
    else
    {
        var CreateProductListResult = new dw.system.Pipelet('CreateProductList').execute({
            Type : dw.customer.ProductList.TYPE_WISH_LIST,
            Customer : customer
        });
        ProductList = CreateProductListResult.ProductList;
    }

    return ProductList;
};
