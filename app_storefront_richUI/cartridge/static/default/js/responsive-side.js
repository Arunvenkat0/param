(function($,sr){

  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function (func, threshold, execAsap) {
      var timeout;

      return function debounced () {
	  var obj = this, args = arguments;
	  function delayed () {
	      if (!execAsap)
		  func.apply(obj, args);
	      timeout = null;
	  };

	  if (timeout)
	      clearTimeout(timeout);
	  else if (execAsap)
	      func.apply(obj, args);

	  timeout = setTimeout(delayed, threshold || 500);
      };
  }
	// smartresize
	jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

}(jQuery,'smartresize'));


/*
 * All java script logic for the mobile layout.
 *
 * The code relies on the jQuery JS library to
 * be also loaded.
 *
 * The logic extends the JS namespace app.*
 */
(function(app, $, undefined) {

	app.responsive = {

		mobileLayoutWidth : 500,

		init : function () {

			$cache = {
					wrapper: $('#wrapper'),
					navigation: $('#navigation'),
					homepageSlider: $('#homepage-slider'),
					sidecarwrapper : $('.sidecarwrapper'),
					hamburgericon : $('.hamburger_icon'),
					sidecarmenu : $('.sidecar_menu'),
					sidecarsearch : $('.sidecar-search'),
					mobilesearch : $('.mobile-search')
				};

			// toggle menu element
			$cache.navigation.find('.navigation-header')
				.click(function(){
					jQuery(this).siblings('.menu-category').toggle();
				});

			// mobile home page search init
			if(app.clientcache.LISTING_SEARCHSUGGEST_LEGACY){
				app.searchsuggestbeta.init($cache.mobilesearch, app.resources.SIMPLE_SEARCH);
			}

			// check onload to see if mobile enabled
			if( $cache.wrapper.width() <= this.mobileLayoutWidth ) {
				app.responsive.enableMobileNav();
			}

			$(window).resize(function(){
				 if($(window).width() < 768){
					//remove toggle class to refinements
					$cache.wrapper.find('.refinements .refinement h3').removeClass('toggle');
				 }else{
					 $cache.wrapper.find('.refinements .refinement h3').addClass('toggle');
					 $cache.wrapper.find('.refinements .refinement').show();
				 }
				if( $cache.wrapper.hasClass('sidecarwrapper')){
					var $width = $cache.sidecarmenu.width();
					 $cache.wrapper.css('margin-left',$width);
					 $cache.wrapper.find('> #header, > #main, > #footer').css('margin-left',$width);
				}

				if($(window).width() < 960 && $(window).width() > 360 ){
					if($('.pt_product-details #carousel-recomendations').length > 0){
						var count = parseInt($(window).width()/$('.pt_product-details #carousel-recomendations li').outerWidth()) - 1;
						$('.pdp-main .recommendations .jcarousel-clip').width(count*$('.pt_product-details #carousel-recomendations li').outerWidth() - 20)
					}
				}
			});


			 $cache.hamburgericon.on('click', function(){
				 var $width = $cache.sidecarmenu.width();
				 $cache.wrapper.toggleClass('sidecarwrapper');
				 $cache.sidecarmenu.toggleClass('visible');
				 if($cache.sidecarmenu.hasClass('visible')){
					 $cache.wrapper.find('> #header').animate({ "marginLeft": [$width, 'easeOutExpo'] });
					 $cache.wrapper.find('> #main').animate({ "marginLeft": [$width, 'easeOutExpo'] });
					 $cache.wrapper.find('> #footer').animate({ "marginLeft": [$width, 'easeOutExpo'] });
					 $cache.sidecarmenu.height($('body').height()).fadeIn(700);
					// sidecar search init
					 if(app.clientcache.LISTING_SEARCHSUGGEST_LEGACY){
						app.searchsuggestbeta.init($cache.sidecarsearch, app.resources.SIMPLE_SEARCH);
					 }
				 }else{
					 $cache.wrapper.find('> #header').animate({ "marginLeft": [0, 'easeOutExpo'] });
					 $cache.wrapper.find('> #main').animate({ "marginLeft": [0, 'easeOutExpo'] });
					 $cache.wrapper.find('> #footer').animate({ "marginLeft": [0, 'easeOutExpo'] });
					 $cache.sidecarmenu.hide();
					// mobile home page search init
					 if(app.clientcache.LISTING_SEARCHSUGGEST_LEGACY){
						app.searchsuggestbeta.init($cache.mobilesearch, app.resources.SIMPLE_SEARCH);
					 }
				 }

			 });

			 $cache.sidecarmenu.find('.menu-category > li').each(function(){
				 if($(this).find('ul').length == 0){
						$(this).find('> a').addClass('nosubmenu');
				 }
			 });
			 // Sidecar menu toggle
			 $cache.sidecarmenu.find('.menu-category a').on('click', function(e){
				e.preventDefault();
				var $this = $(this);
				var level_count = parseInt($cache.sidecarmenu.find('.back-to-menu').attr('data-level')) + 1;
				if($this.closest('li').find('ul').length > 0){
				  if(!$(this).closest('li').hasClass('active')){
					var $m_width = $cache.sidecarmenu.find('.menu-category').width() + 20;
					 $cache.sidecarmenu.find('.menu-category').animate({ "marginLeft": ['-'+$m_width, 'easeOutExpo'] }, function(){
						 $this.closest('ul').find('> li').hide();
						 $this.closest('li').addClass('active').removeAttr('style');
						 $cache.sidecarmenu.find('.active > a').hide();
						 $this.show().next('div').show();
						 $cache.sidecarmenu.find('.back-to-menu').attr('data-level', level_count).show();
						 if(level_count > 1){
							 $cache.sidecarmenu.find('.back-to-menu span').text('').text(app.resources.BACKTO + $this.closest('.sidecar-level-hide').prev('a').text());
						 }

						 $('.active:visible a').each(function(){
							if($(this).closest('li').find('ul').length == 0){
								$(this).addClass('nosubmenu');
							}
						 });
					 });
					 $cache.sidecarmenu.find('ul.level-1').delay(100).animate({ "marginLeft": [0, 'easeOutExpo'] });
				  }
				}else{
					window.location.href = $this.attr('href');
				}
			 });

			 $cache.sidecarmenu.find('.back-to-menu').on('click', function(e){
				 e.preventDefault();
				 var level_count = parseInt($cache.sidecarmenu.find('.back-to-menu').attr('data-level')) - 1;
				 var $this = $(this);
				 var $m_width = $cache.sidecarmenu.find('.menu-category').width() + 20;
				 $cache.sidecarmenu.find('ul.level-1').animate({ "marginLeft": ['-'+$m_width, 'easeOutExpo'] }, function(){
					 $cache.sidecarmenu.find('.menu-category li.active').eq(level_count).closest('ul').find('li').removeAttr('style');
					 $cache.sidecarmenu.find('.menu-category li.active').eq(level_count).find('.sidecar-level-hide').hide();
					 $cache.sidecarmenu.find('.menu-category li.active').eq(level_count).closest('.sidecar-level-hide').prev('a').show();
					 $cache.sidecarmenu.find('.back-to-menu').attr('data-level', level_count).show();
					 $cache.sidecarmenu.find('.menu-category li.active').eq(level_count).removeClass('active');
					 if(level_count == 0){
						 $cache.sidecarmenu.find('.back-to-menu').hide();
					 }else if(level_count == 1){
						 $cache.sidecarmenu.find('.back-to-menu span').text('');
					 }else{
						 $cache.sidecarmenu.find('.back-to-menu span').text('').text(app.resources.BACKTO + $cache.sidecarmenu.find('.menu-category li.active').last().closest('.sidecar-level-hide').prev('a').text());
					 }
				 });
				 $cache.sidecarmenu.find('ul.level-1').delay(100).animate({ "marginLeft": [0, 'easeOutExpo'] });
			 });

			//footer scroll top
			$cache.wrapper.on('click','.move-to-top',function(){
				$(window).scrollTop(0);
			});

			$cache.wrapper.on('click','.refine_search', function(){
				$cache.wrapper.find('.refinements .refinement').slideToggle(300);
				$(this).find('span.plus').toggleClass('hide');
				$(this).find('span.minus').toggleClass('hide');
			});

			$cache.wrapper.on('keyup','.wishlist_qty', function(){
				if($(this).val() == 0){$(this).val(1);}
				$(this).closest('tr').find('.item-dashboard input[name="Quantity"]').val($(this).val());
			});


			// Sidecar country toggle
			 $cache.sidecarmenu.find('.sidecar_country').on('click', function(e){
				 e.preventDefault();
				 $(this).toggleClass('active');
				 if($('.countryname').length > 0 && $cache.sidecarmenu.hasClass('logged')){
					 $cache.sidecarmenu.find('.sidecar_country_options li').hide();
					 $cache.sidecarmenu.find('.sidecar_country_options li.'+ $('.countryname').val()).show();
				 }
				 $cache.sidecarmenu.find('.sidecar_country_options').slideToggle(500);
			 });


		},

		// build vertical, collapsable menu
		enableMobileNav : function(){

			$cache.navigation.find('.menu-category')
				.hide()
				.children('li')
					.children('a')
						.click(function(){
							if( (jQuery(this).siblings().length > 0 ) && (!jQuery(this).siblings().is(":visible"))) {
								jQuery(this)
									.append('<span>close</span>')
									.children('span')
										.click(function(){
											jQuery(this).parent().siblings().hide();
											jQuery(this).remove();
											return false;
										})
									.parent().siblings().show();
								return false;
							}
						})
		},

		// revert to standard horizontal menu
		disableMobileNav : function(){
			$cache.navigation.find('.menu-category').show();
			$cache.navigation.find('.level-2').removeAttr('style');
			$cache.navigation.find('.level-1 span').remove();
		},

		// pull the slideshow into a variable to re-use
		rebuildHomepageSlides: function() {
			if($cache.homepageSlider.length > 0){
				var homeCarousel = 	$cache.homepageSlider.data('jcarousel');
				if(!homeCarousel){return false;}
				homeCarousel.stopAuto();
				homeCarousel.scroll(1);
				$cache.homepageSlider.find('.slide').width( $cache.wrapper.width());
				$cache.homepageSlider.find('#homepage-slides').css( {'left':'0','width': ($cache.wrapper.width() * $cache.homepageSlider.find('#homepage-slides li').size()) });
				homeCarousel.reload();
			}
		},

		toggleGridWideTileView : function(){
			/*	toggle grid/wide tile	*/
			if(jQuery('.toggle-grid').length == 0 && (jQuery('.pt_order').length == 0) && (jQuery('.pt_content-search-result').length == 0))
			{
				jQuery('.sort-by').append('<a class="toggle-grid" href="'+location.href+'">+</a>');
				jQuery('.toggle-grid').unbind('click').click(function(){
					$(this).toggleClass('switch');
					jQuery('.search-result-content').toggleClass('wide-tiles');
					$(document).find('.search-result-content .grid-tile').each(function(){
						app.storefront.hideTextrows($(this));
					});
					jQuery('.product-tile').removeAttr('style').syncHeight();
					return false;
				});
			}

		}

	}




	$(document).ready(function(){

		app.responsive.init();

		// set up listener so we can update DOM if page grows/shrinks, only on bigger platforms
		if(screen.width > 768){

			$(window).smartresize(function(){

				if( jQuery('#wrapper').width() <= app.responsive.mobileLayoutWidth   ) {
					app.responsive.enableMobileNav();
					app.responsive.rebuildHomepageSlides();
				}
				else {
					app.responsive.disableMobileNav();
					app.responsive.rebuildHomepageSlides();
				}

			});

		}

	});

}(window.app = window.app || {}, jQuery));
