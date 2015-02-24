/**
 * Updates the page meta data with the given optional values.
 */
function updatePageMetaData(defaultTitle, defaultKeywords, defaultDescription)
{
    var pageMetaData = request.pageMetaData;
    
    if (defaultTitle != null) pageMetaData.setTitle(defaultTitle);
    if (defaultKeywords != null) pageMetaData.setKeywords(defaultKeywords);
    if (defaultDescription != null) pageMetaData.setDescription(defaultDescription);
}

/**
 * Updates the page meta data from the given product.
 */
function updatePageMetaDataForProduct(product, defaultTitle, defaultKeywords, defaultDescription)
{
    if (product == null)
    {
        updatePageMetaData(defaultTitle, defaultKeywords, defaultDescription);
        return;
    }

    var pageMetaData = request.pageMetaData;

    var title = product.getPageTitle();
    if (title == null) title = defaultTitle;
    if (title == null) title = product.getName();
    if (title != null) pageMetaData.setTitle(title);

    var keywords = product.getPageKeywords();
    if (keywords == null) keywords = defaultKeywords;
    if (keywords != null) pageMetaData.setKeywords(keywords);

    var description = product.getPageDescription();
    if (description == null) description = defaultDescription;
    if (description != null) pageMetaData.setDescription(description);
}

/**
 * Updates the page meta data from the given content object.
 */
function updatePageMetaDataForContent(content, defaultTitle, defaultKeywords, defaultDescription)
{
    if (content == null)
    {
        updatePageMetaData(defaultTitle, defaultKeywords, defaultDescription);
        return;
    }

    var pageMetaData = request.pageMetaData;

    var title = content.getPageTitle();
    if (title == null) title = defaultTitle;
    if (title == null) title = content.getName();
    if (title != null) pageMetaData.setTitle(title);

    var keywords = content.getPageKeywords();
    if (keywords == null) keywords = defaultKeywords;
    if (keywords != null) pageMetaData.setKeywords(keywords);

    var description = content.getPageDescription();
    if (description == null) description = defaultDescription;
    if (description != null) pageMetaData.setDescription(description);
}

/**
 * Updates the page meta data from the given category.
 */
function updatePageMetaDataForCategory(category, defaultTitle, defaultKeywords, defaultDescription)
{
    if (category == null)
    {
        updatePageMetaData(defaultTitle, defaultKeywords, defaultDescription);
        return;
    }
    
    var pageMetaData = request.pageMetaData;

    var title = category.getPageTitle();
    if (title == null) title = defaultTitle;
    if (title == null) title = category.getDisplayName();
    if (title != null) pageMetaData.setTitle(title);

    var keywords = category.getPageKeywords();
    if (keywords == null) keywords = defaultKeywords;
    if (keywords != null) pageMetaData.setKeywords(keywords);

    var description = category.getPageDescription();
    if (description == null) description = defaultDescription;
    if (description != null) pageMetaData.setDescription(description);
}

/**
 * Updates the page meta data from the given folder.
 */
function updatePageMetaDataForFolder(folder, defaultTitle, defaultKeywords, defaultDescription)
{
    if (folder == null)
    {
        updatePageMetaData(defaultTitle, defaultKeywords, defaultDescription);
        return;
    }

    var pageMetaData = request.pageMetaData;

    var title = folder.getPageTitle();
    if (title == null) title = defaultTitle;
    if (title == null) title = folder.getDisplayName();
    if (title != null) pageMetaData.setTitle(title);

    var keywords = folder.getPageKeywords();
    if (keywords == null) keywords = defaultKeywords;
    if (keywords != null) pageMetaData.setKeywords(keywords);

    var description = folder.getPageDescription();
    if (description == null) description = defaultDescription;
    if (description != null) pageMetaData.setDescription(description);
}

/*
 * Module exports
 */
exports.updatePageMetaData = updatePageMetaData;
exports.updatePageMetaDataForContent = updatePageMetaDataForContent;
exports.updatePageMetaDataForCategory = updatePageMetaDataForCategory;
exports.updatePageMetaDataForFolder = updatePageMetaDataForFolder;
exports.updatePageMetaDataForProduct = updatePageMetaDataForProduct;
