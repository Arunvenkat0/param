# Demo Storefront Data

## Creating a data installation

Because of file size constraints, the demo store data distribution is broken into 2 distinct parts:
- everything, without high resolution images, including a catalog with hi resolution references removed
- a delta distibution, with only high resolution images, plus a catalog specifically referencing those images

If you need to install high resolution images, you will need to perform 2 separate import steps.

    % git pull sg20_demo_data_no_hires_images
    
When you want to install the high resolution images, you can do that, following the same procedure.

    % git pull sg20_demo_data_only_hires_images
    

## Zipping the files

On the Mac, you should use the commandline `zip` command to make sure the folder structure is created properly.

    % zip -r sg20_demo_data_no_hires_images sg20_demo_data_no_hires_images


## Upload and import the site

Upload the resulting file to your site and import it.
    
## Storefront test automation

Within the folder `storefront_automation` you can find a complete testsuite of automated storefront tests created with the Firefox Addon XLT Script Developer. 
Find more [information](http://www.xceptance.com/products/xlt/what-is-xlt.html "XLT information") 
and [download](http://www.xceptance.com/products/xlt/download.html "XLT download") about XLT on <http://www.xceptance.com>. Find more information about the testsuite itself under 
`storefront_automation\doc\testcases_manual.html`.
    
## Profit
