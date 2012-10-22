/*!
 * samaxesJS JavaScript Library
 * jQuery TOC Plugin v1.0.2
 * http://code.google.com/p/samaxesjs/
 *
 * Copyright (c) 2008 samaxes.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Modified by Rene Schwietzke to mark the numbers for easy formatting.
 */
 
(function($) {
	/*
	 * The TOC plugin dynamically builds a table of contents from the headings in
	 * a document and prepends legal-style section numbers to each of the headings.
	 */
    $.fn.toc = function(options) {
        var opts = $.extend({}, $.fn.toc.defaults, options);
        var toc = this.append('<ul></ul>').children('ul');
        var headers = {h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0};
        var index = 0;
        var indexes = {
            h1: (opts.exclude.match('h1') === null && $('h1').length > 0) ? ++index : 0,
            h2: (opts.exclude.match('h2') === null && $('h2').length > 0) ? ++index : 0,
            h3: (opts.exclude.match('h3') === null && $('h3').length > 0) ? ++index : 0,
            h4: (opts.exclude.match('h4') === null && $('h4').length > 0) ? ++index : 0,
            h5: (opts.exclude.match('h5') === null && $('h5').length > 0) ? ++index : 0,
            h6: (opts.exclude.match('h6') === null && $('h6').length > 0) ? ++index : 0
        };

        return this.each(function() {
        	$(':header').not(opts.exclude).each(function() {
                var $this = $(this);
                if ($this.is('h6')) {
                    checkContainer(headers.h6, toc);
                    updateNumeration(headers, 'h6');
                    $this.prepend(addNumeration(headers, 'h6', $this.text()));
                    appendToTOC(toc, indexes.h6, $this.attr('id'), $this.html(), headers);
                } else if ($this.is('h5')) {
                    checkContainer(headers.h5, toc);
                    updateNumeration(headers, 'h5');
                    $this.prepend(addNumeration(headers, 'h5', $this.text()));
                    appendToTOC(toc, indexes.h5, $this.attr('id'), $this.html(), headers);
                } else if ($this.is('h4')) {
                    checkContainer(headers.h4, toc);
                    updateNumeration(headers, 'h4');
                    $this.prepend(addNumeration(headers, 'h4', $this.text()));
                    appendToTOC(toc, indexes.h4, $this.attr('id'), $this.html(), headers);
                } else if ($this.is('h3')) {
                    checkContainer(headers.h3, toc);
                    updateNumeration(headers, 'h3');
                    $this.prepend(addNumeration(headers, 'h3', $this.text()));
                    appendToTOC(toc, indexes.h3, $this.attr('id'), $this.html(), headers);
                } else if ($this.is('h2')) {
                    checkContainer(headers.h2, toc);
                    updateNumeration(headers, 'h2');
                    $this.prepend(addNumeration(headers, 'h2', $this.text()));
                    appendToTOC(toc, indexes.h2, $this.attr('id'), $this.html(), headers);
                } else if ($this.is('h1')) {
                    updateNumeration(headers, 'h1');
                    $this.prepend(addNumeration(headers, 'h1', $this.text()));
                    appendToTOC(toc, indexes.h1, $this.attr('id'), $this.html(), headers);
                }
            });
        });
    };

    /*
     * Checks if the last node is an 'ul' element.
     * If not, a new one is created.
     */
    function checkContainer(header, toc) {
	    if (header === 0 && !toc.find(':last').is('ul')) {
	        toc.find('li:last').append('<ul></ul>');
	    }
    };

    /*
     * Updates headers numeration.
     */
	function updateNumeration(headers, header) {
	    $.each(headers, function(i, val) {
	        if (i === header)  {
	            ++headers[i];
	        } else if (i > header) {
	            headers[i] = 0;
	        }
	    });
	};

    /*
     * Prepends the numeration to a heading.
     */
    function addNumeration(headers, header, text) {
        var numeration = '';

        $.each(headers, function(i, val) {
            if (i <= header && headers[i] > 0)  {
                numeration += headers[i] + '.';
            };
        });

        // remove last . again
        numeration = numeration.replace(/\.$/,"");
        
        // replace . with <span class="dot">.</span>
        numeration = numeration.replace(/\./,"<span class=\"dot\">.</span>");
        
        return '<span class="numbering">' + numeration + '</span>';
    };

    /*
     * Appends a new node to the TOC.
     */
    function appendToTOC(toc, index, id, text, headers) {
        var parent = toc;

        for (var i = 1; i < index; i++) {
            if (parent.find('> li:last > ul').length === 0) {
                parent = parent.append('<li><ul></ul></li>');
            }
            parent = parent.find('> li:last > ul');
        }

        if (id === '') {
            parent.append('<li><a>' + text + '</a></li>');
        } else {
            parent.append('<li><a href="#' + id + '">' + text + '</a></li>');
        }
    };

    $.fn.toc.defaults = {exclude: 'h1, h5, h6'}
})(jQuery);
