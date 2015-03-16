var g = require('./dw/guard');

/*
 * Creating, modifying and showing of a product comparison.
 */

/**
 * Expects: - category: category ID
 */
function Show()
{
    var compareForm = session.forms.compare;


    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile : 'catalog/GetCompareList.ds',
        Transactional : false
    }).execute({
        SelectedCategory : request.httpParameterMap.category.value
    });
    var CompareList = ScriptResult.CompareList;


    var form = require('./dw/form');
    form.updateFormWithObject(compareForm, CompareList);
    form.setFormOptions(compareForm.categories, CompareList.categories);


    response.renderTemplate('product/compare/compareshow', {
        CompareList : CompareList
    });
}


/**
 * Expects: - pid: SKU - category: category ID
 */
function AddProduct()
{
    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
        ProductID : request.httpParameterMap.pid.value
    });
    if (GetProductResult.result == PIPELET_ERROR)
    {
        response.renderJSON({
            success : false
        });
        return;
    }
    var Product = GetProductResult.Product;


    var GetCategoryResult = new dw.system.Pipelet('GetCategory').execute({
        CategoryID : request.httpParameterMap.category.value
    });
    if (GetCategoryResult.result == PIPELET_ERROR)
    {
        response.renderJSON({
            success : false
        });
        return;
    }
    var Category = GetCategoryResult.Category;


    var ScriptResult = new dw.system.Pipelet('Script', {
        Transactional : false,
        OnError : 'PIPELET_ERROR',
        ScriptFile : 'catalog/AddToCompareList.ds'
    }).execute({
        Category : Category,
        Product : Product
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        response.renderJSON({
            success : false
        });
        return;
    }


    response.renderJSON({
        success : true
    });
}

/**
 * Parameters: - pid: SKU - category: category ID
 */
function RemoveProduct()
{
    var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
        ProductID : request.httpParameterMap.pid.value
    });
    if (GetProductResult.result == PIPELET_ERROR)
    {
        response.renderJSON({
            success : false
        });
        return;
    }
    var Product = GetProductResult.Product;


    var GetCategoryResult = new dw.system.Pipelet('GetCategory').execute({
        CategoryID : request.httpParameterMap.category.value
    });
    if (GetCategoryResult.result == PIPELET_ERROR)
    {
        response.renderJSON({
            success : false
        });
        return;
    }
    var Category = GetCategoryResult.Category;


    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile : 'catalog/RemoveFromCompareList.ds',
        Transactional : false
    }).execute({
        Product : Product,
        Category : Category
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        response.renderJSON({
            success : false
        });
        return;
    }


    response.renderJSON({
        success : true
    });
}

/**
 * Parameters: - category: category ID
 */
function Controls()
{
    var GetCategoryResult = new dw.system.Pipelet('GetCategory').execute({
        CategoryID : request.httpParameterMap.category.value
    });
    if (GetCategoryResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('search/components/productcomparewidget');
        return;
    }
    var Category = GetCategoryResult.Category;


    var ScriptResult = new dw.system.Pipelet('Script', {
        ScriptFile : 'catalog/GetCompareList.ds',
        Transactional : false
    }).execute({
        SelectedCategory : request.httpParameterMap.category.value
    });
    if (ScriptResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('search/components/productcomparewidget');
        return;
    }
    var CompareList = ScriptResult.CompareList;


    response.renderTemplate('search/components/productcomparewidget', {
        CompareList : CompareList,
        Category : Category
    });
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Show            = g.get(Show);
exports.AddProduct      = g.get(AddProduct);
exports.RemoveProduct   = g.get(RemoveProduct);
exports.Controls        = g.get(Controls);
