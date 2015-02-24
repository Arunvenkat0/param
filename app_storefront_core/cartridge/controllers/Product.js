var g = require('./dw/guard');

/**
 * Renders a full product detail page. If the http parameter "format" is set to
 * "json" the product details are rendered as JSON response.
 */
function Show()
{
    var GetProductResult = GetProduct();
    if (GetProductResult.error)
    {
    	response.renderTemplate('error/notfound');
		return;    	
   	}
    var Product = GetProductResult.Product;
    var CurrentVariationModel = GetProductResult.CurrentVariationModel;
    
    
    var web = require('./dw/web');			
    web.updatePageMetaDataForProduct(Product, 
            Product.name + " - " + dw.system.Site.getCurrent().name,
            Product.shortDescription != null ? Product.shortDescription.getMarkup() : "",
            Product.name);
    
		
    if (Product.template != null)
    {
    	response.renderTemplate(Product.template, {
    		Product: Product
    	});
    	return;
    }

    var DefaultVariant = null;
    
	if (Product.master)
	{
		var ScriptResult = new dw.system.Pipelet('Script', {
		    Transactional: 	false,
		    OnError: 		'PIPELET_ERROR',
		    ScriptFile: 	'product/GetDefaultVariant.ds'
		}).execute({
		    Prod: Product,
		    CurrentVariationModel: CurrentVariationModel
		});
	    DefaultVariant = ScriptResult.newProduct;
	}
		
	response.renderTemplate('product/product', {
		Product: Product,
		CurrentVariationModel : CurrentVariationModel,
		DefaultVariant: DefaultVariant
	});
}
	
	
/**
 * Determines a product based on the given ID.
 */
function GetProduct()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

	if (!CurrentHttpParameterMap.pid.stringValue)
	{
		return {
		    error: true
		};		
	}

	var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
		ProductID: CurrentHttpParameterMap.pid.stringValue
	});
    var Product = GetProductResult.Product;

	if (Product.productSet)
	{
		var HandleOfflineSetProductsResult = HandleOfflineSetProducts(Product);
		if (HandleOfflineSetProductsResult.error)
		{
			return {
	            error: true
	        };
		}
	}

	var UpdateProductVariationSelectionsResult = new dw.system.Pipelet('UpdateProductVariationSelections').execute({
	    Product: Product
	});
	var CurrentVariationModel = UpdateProductVariationSelectionsResult.ProductVariationModel;
	var Product = UpdateProductVariationSelectionsResult.SelectedProduct;
	var ProductVariationModels = UpdateProductVariationSelectionsResult.ProductVariationModels;
	
		
	var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
		Product: Product
	});
	var CurrentOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;
	var ProductOptionModels = UpdateProductOptionSelectionsResult.ProductOptionModels;
	
	
	return {
		Product: Product,
		CurrentVariationModel: CurrentVariationModel
	};
}

/**
 * Renders a full product detail page. If the http parameter "format" is set to
 * "json" the product details are rendered as JSON response.
 */
function Detail()
{
    var GetProductResult = GetProduct();
    if (GetProductResult.error)
    {
    	response.renderTemplate('error/notfound');
		return;    	
   	}
    var Product = GetProductResult.Product;
    var CurrentVariationModel = GetProductResult.CurrentVariationModel;

    
	if (Product.template != null)
	{
		response.renderTemplate(Product.template, {
			Product: Product,
			CurrentVariationModel: CurrentVariationModel
		});
	}
	else
	{
		response.renderTemplate('product/productdetail', {
			Product: Product,
			CurrentVariationModel: CurrentVariationModel
		});	
	}
}


/**
 * Returns product variants data as a JSON. Called via product.js
 * (loadVariation). Input: pid (required) - product ID
 */
function GetVariants()
{
    var GetProductResult = GetProduct();
    if (GetProductResult.error)
    {
    	response.renderTemplate('error/notfound');
		return;    	
   	}
    var Product = GetProductResult.Product;
    var CurrentVariationModel = GetProductResult.CurrentVariationModel;

    // TODO render directly as JSON response
    response.renderTemplate('product/components/variationsjson', {
    	Product: Product,
    	CurrentVariationModel: CurrentVariationModel
    });
}


/**
 * Returns product availability data as a JSON object. Called via product.js
 * (reloadAvailability). Input: pid (required) - product ID quantity (required) -
 * the quantity to use for determining avalability
 */
function GetAvailability()
{
    var GetProductResult = GetProduct();
    if (GetProductResult.error)
    {
    	response.renderTemplate('error/notfound');
		return;    	
   	}
    var Product = GetProductResult.Product;

    // TODO render directly as JSON
    response.renderTemplate('product/components/availabilityjson', {
    	Product: Product
    });
}

	
function HitTile()
{
    var GetProductResult = GetProduct();
    if (GetProductResult.error)
    {
    	response.renderTemplate('error/notfound');
		return;    	
   	}
    var Product = GetProductResult.Product;

    
    response.renderTemplate('product/producttile', {
    	product: Product,
    	showswatches : true,
    	showpricing : true,
    	showpromotion : true,
    	showrating : true,
    	showcompare : true
    });
}

	
/**
 * Determine if at least there is 1 online SetProduct in case it is s Product
 * Set. If all of the Set Products are offline then we return not found view.
 */
function Productnav()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var GetProductResult = GetProduct();
    if (GetProductResult.error)
    {
    	response.renderTemplate('error/notfound');
		return;    	
   	}
    var Product = GetProductResult.Product;
    var CurrentVariationModel = GetProductResult.CurrentVariationModel;

    
    var CategoryID = null;
	if (CurrentHttpParameterMap.cgid)
	{
		CategoryID = CurrentHttpParameterMap.cgid.value;
	}
	else if (Product.primaryCategory)
	{
		CategoryID = Product.primaryCategory.ID;
	}
	else if (Product.variationModel.master)
	{
		CategoryID = Product.variationModel.master.primaryCategory.ID;
	}

	var SearchResult = new dw.system.Pipelet('Search', {
	    SearchContent: true,
	    SearchProduct: true,
	    DisallowOfflineCategory: true,
	    RecursiveCategorySearch: true,
	    RecursiveFolderSearch: true	
	}).execute({
	    SearchPhrase: CurrentHttpParameterMap.q.value,
	    SortBy1: CurrentHttpParameterMap.psortb1.value,
	    SortBy1Direction: CurrentHttpParameterMap.psortd1.intValue,
	    SortBy2: CurrentHttpParameterMap.psortb2.value,
	    SortBy2Direction: CurrentHttpParameterMap.psortd2.intValue,
	    SortBy3: CurrentHttpParameterMap.psortb3.value,
	    SortBy3Direction: CurrentHttpParameterMap.psortd3.intValue,
	    PriceMin: CurrentHttpParameterMap.pmin.doubleValue,
	    PriceMax: CurrentHttpParameterMap.pmax.doubleValue,
	    CategoryID: CategoryID,
	    ContentID: CurrentHttpParameterMap.cid.value,
	    FolderID: CurrentHttpParameterMap.fdid.value,
	    RefineByNamePrefix: 'prefn',
	    RefineByPhrasePrefix: 'prefv',
	    SortingRuleID: CurrentHttpParameterMap.srule.value
	});
	var ContentSearchResult = SearchResult.ContentSearchModel;
    var ProductSearchResult = SearchResult.ProductSearchModel;
    

	var PagingResult = new dw.system.Pipelet('Paging', {
	    DefaultPageSize: 12
	}).execute({
	    Objects: ProductSearchResult.productSearchHits,
	    PageSize: 3,
	    Start: CurrentHttpParameterMap.start.intValue - 2,
	    ObjectsCount: ProductSearchResult.count
	});
    var ProductPagingModel = PagingResult.PagingModel;
		

    response.renderTemplate('search/productnav', {
		ProductPagingModel: ProductPagingModel,
		ProductSearchResult: ProductSearchResult
	});
}


function HandleOfflineSetProducts(Product)
{
	for each(var SetProduct in Product.getProductSetProducts())
    {
        if (SetProduct.online)
        {
        	return {
        	    SetProduct : SetProduct
        	};
       	}
    }
    
    return {
        error: true
    };
}


/**
 * Returns true if at least one SetProduct is online otherwise false i.e. when
 * all SetProducts are offline. Expects Product instance
 */
function Variation()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

	if (!CurrentHttpParameterMap.pid.stringValue)
	{
		response.renderTemplate('error/notfound');
		return;
	}

	var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
		ProductID: CurrentHttpParameterMap.pid.stringValue
	});
	if (GetProductResult.result == PIPELET_ERROR)
	{
		response.renderTemplate('error/notfound');
		return;
	}
	var Product = GetProductResult.Product;

		
	var UpdateProductVariationSelectionsResult = new dw.system.Pipelet('UpdateProductVariationSelections').execute({
	    Product: Product
	});
    var CurrentVariationModel = UpdateProductVariationSelectionsResult.ProductVariationModel;
    var Product = UpdateProductVariationSelectionsResult.SelectedProduct;
    var ProductVariationModels = UpdateProductVariationSelectionsResult.ProductVariationModels;
		
    
    var UpdateProductOptionSelectionsResult = new dw.system.Pipelet('UpdateProductOptionSelections').execute({
	    Product: Product
	});
    var CurrentOptionModel = UpdateProductOptionSelectionsResult.ProductOptionModel;

    // TODO this is apparently nowhere set to true..
	var resetAttributes = false;

	if (Product.master)
	{
		var ScriptResult = new dw.system.Pipelet('Script', {
		    Transactional: false,
		    OnError: 'PIPELET_ERROR',
		    ScriptFile: 'product/GetDefaultVariant.ds'
		}).execute({
		    Prod: Product,
		    CurrentVariationModel: CurrentVariationModel
		});
		// TODO scope
		var DefaultVariant = ScriptResult.newProduct;

		resetAttributes = false;
	}

	if (empty(CurrentHttpParameterMap.format.stringValue))
	{
		response.renderTemplate('product/product', {
    		Product: Product,
    		CurrentVariationModel: CurrentVariationModel
		});
		return;
	}
	
	if (CurrentHttpParameterMap.source.stringValue != 'bonus')
	{
		response.renderTemplate('product/productcontent', {
			Product: Product,
			GetImages: true,
			resetAttributes: resetAttributes
		});
		return;
	}

	
	var CartController = require('./Cart');
	var GetBasketResult = CartController.GetBasket();
	var Basket = GetBasketResult.Basket;
	

	var ScriptResult = new dw.system.Pipelet('Script', {
	    Transactional: false,
	    OnError: 'PIPELET_ERROR',
	    ScriptFile: 'cart/GetBonusDiscountLineItem.ds'
	}).execute({
	    BonusDiscountLineItems: Basket.bonusDiscountLineItems,
	    uuid: CurrentHttpParameterMap.bonusDiscountLineItemUUID.stringValue
	});
	var BonusDiscountLineItem = ScriptResult.BonusDiscountLineItem;
			
	
	response.renderTemplate('product/components/bonusproduct', {
		Product: Product,
		CurrentVariationModel: CurrentVariationModel,
		BonusDiscountLineItem: BonusDiscountLineItem
	});
}

	
function VariationPS()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    if (!CurrentHttpParameterMap.pid.stringValue)
	{
		response.renderTemplate('error/notfound');
		return;
	}

	var GetProductResult = new dw.system.Pipelet('GetProduct').execute({
		ProductID: CurrentHttpParameterMap.pid.stringValue
	});
	if (GetProductResult.result == PIPELET_ERROR)
	{
		response.renderTemplate('error/notfound');
		return;
	}
	var Product = GetProductResult.Product;

		
	var UpdateProductVariationSelectionsResult = new dw.system.Pipelet('UpdateProductVariationSelections').execute({
	    Product: Product
	});
    var CurrentVariationModel = UpdateProductVariationSelectionsResult.ProductVariationModel;
    var ProductVariationModels = UpdateProductVariationSelectionsResult.ProductVariationModels;
    var Product = UpdateProductVariationSelectionsResult.SelectedProduct;
	
	
	if (Product.master)
	{
		var ScriptResult = new dw.system.Pipelet('Script', {
		    Transactional: false,
		    OnError: 'PIPELET_ERROR',
		    ScriptFile: 'product/GetDefaultVariant.ds'
		}).execute({
		    Prod: Product,
		    CurrentVariationModel: CurrentVariationModel
		});
		Product = ScriptResult.newProduct;
	}

		
	if (empty(CurrentHttpParameterMap.format.stringValue))
	{
		response.renderTemplate('product/product', {
    		Product: Product,
		    CurrentVariationModel: CurrentVariationModel
		});
		return;
	}
	else
	{
		response.renderTemplate('product/components/productsetproduct', {
			Product: Product
		});
		return;
	}
}


/**
 * Renders the product detail page within the context of a category.
 */
function ShowInCategory()
{
    Show();
}


/**
 * Renders the last visisted products based on the session information.
 */
function IncludeLastVisited()
{
    var GetLastVisitedProductsResult = new dw.system.Pipelet('GetLastVisitedProducts').execute({
	    MaxLength: 3
	});
    var LastVisitedProducts = GetLastVisitedProductsResult.Products;


    response.renderTemplate('product/lastvisited', {
		LastVisitedProducts: LastVisitedProducts
	});
}


/**
 * Renders a list of bonus products for a bonus discount line item.
 */
function GetBonusProducts()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    var CartController = require('./Cart');
    var GetBasketResult = CartController.GetBasket();
    var Basket = GetBasketResult.Basket;

    
	var ScriptResult = new dw.system.Pipelet('Script', {
	    Transactional: false,
	    OnError: 'PIPELET_ERROR',
	    ScriptFile: 'cart/GetBonusDiscountLineItem.ds',
	}).execute({
	    uuid: CurrentHttpParameterMap.bonusDiscountLineItemUUID.stringValue,
	    BonusDiscountLineItems: Basket.bonusDiscountLineItems
	});
    var BonusDiscountLineItem = ScriptResult.BonusDiscountLineItem;


    response.renderTemplate('product/bonusproductgrid', {
		BonusDiscountLineItem: BonusDiscountLineItem
	});
}


function GetSetItem()
{
    var GetProductResult = GetProduct();
    if (GetProductResult.error)
    {
    	response.renderTemplate('error/notfound');
		return;    	
   	}
    var Product = GetProductResult.Product;

	
	response.renderTemplate('product/components/productsetproduct', {
		Product: Product,
		isSet: true
	});
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Show                = g.get(Show);
exports.Detail              = g.get(Detail);
exports.GetVariants         = g.get(GetVariants);
exports.GetAvailability     = g.get(GetAvailability);
exports.HitTile             = g.get(HitTile);
exports.Productnav          = g.get(Productnav);
exports.Variation           = g.get(Variation);
exports.VariationPS         = g.get(VariationPS);
exports.ShowInCategory      = g.get(ShowInCategory);
exports.IncludeLastVisited  = g.get(IncludeLastVisited);
exports.GetBonusProducts    = g.get(GetBonusProducts);
exports.GetSetItem          = g.get(GetSetItem);
