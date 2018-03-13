(function(e) {
  History.Adapter.bind(window,'statechange',function() {
    if (e(".product-listing").length > 0 || e(".filters-row").length > 0) {
      if(!obj.ajaxClickHandlerState) {
        var n = location.search == "" ? "" : "?" + location.search;
        var url = location.pathname + n;
        obj.getCollectionContent(url);
      }
      obj.ajaxClickHandlerState = false;
    }
  });

  var queryParams = {};
  var obj = {
    init: function() {
      queryParams = this.getQueryParams();
      this.initSidebar();
      this.initToolbar();
      this.initShowMore();
    },
    initSidebar: function() {
      obj.initFiltresEvent();
      obj.initFiltresRemoveEvent();
    },
    initToolbar: function() {
      obj.initSortbyState();
      obj.initSortbyEvent();
      obj.initPerpageEvent();
      obj.initPaginationEvent();
    },
    initShowMore: function() {
      obj.initShowMoreEvent();
    },
    initShowMoreEvent: function() {
      if (e(".show-more a").length > 0) {
        e(".show-more a").click(function(event) {
          if (!e(this).hasClass("disable")) {
            obj.showMoreHandler()
          }
          event.preventDefault();
        })
      }
    },
    showMoreHandler: function() {
      var scrollURL = e('.show-more a').last().attr("href");
      e.ajax({
        type: "GET",
        url: scrollURL,
        beforeSend: function() {
          obj.showPreloader();
        },
        success: function(data) {
          obj.hidePreloader();
          if (e(data).find(".show-more a").length > 0) {
            e(".show-more").replaceWith(e(data).find(".show-more"));
            if(e(".show-more a").attr('href')) {
              obj.initShowMoreEvent();
            }
          }
          else {
            if(e(".show-more a").length > 0) {
              e(".show-more a").remove();
            }
          }
          if (e(data).find(".product-listing").length > 0) {
            e(data).find(".product-listing > div").each(function() {
              e('.product-listing').append(e(this));
            });

            $('body').trigger('refreshCurrency');
            if(e(".spr-badge").length > 0) {
              e.getScript(window.location.protocol + "//productreviews.shopifycdn.com/assets/v4/spr.js");
            }
            
            countDown(true);
          }
          data = null;
        },
        error: function(XMLHttpRequest, textStatus) {
          obj.hidePreloader();
          alert("error");
        },
        dataType: "html"
      })
    },
    initFiltresEvent: function() {
      if (e(".filtres-js").length > 0) {
        e('.filtres-js:not(.clear-filters) a').unbind().click(function(event) {
          event.preventDefault();
          delete queryParams.page;
          
          var $_this = e(this);
          var tag = $_this.attr('href').split('/').pop().split('?').shift();

          var constraint = queryParams.constraint;
          queryParams.constraint = constraint ? constraint+'+'+tag : tag;
          
          obj.ajaxClick(obj.getAjaxLink(queryParams));
        });
      };
    },
    initFiltresRemoveEvent: function() {
      if (e(".filtres-remove-js").length > 0) {
        e('.filtres-remove-js a').unbind().click(function(event) {
          event.preventDefault();
          delete queryParams.page;
          
          var $_this = e(this);
          if($_this.hasClass('clear_all')) {
            delete queryParams.constraint;
          }
          else {
            var href = $_this.attr('href');
            var path = location.pathname;
            var page = obj.getUrlSubcategory('/collections/', path);
            var tag = href.split(page).pop().split('/').pop();
            tag != '' ? queryParams.constraint = tag : delete queryParams.constraint;
          }
          obj.ajaxClick(obj.getAjaxLink(queryParams));
        });
      };
    },
    initSortbyState: function() {
      if (e(".sort-position").length > 0) {
        if (queryParams.sort_by) {
          e('.sort-position').each(function() {
          	e(this).val(queryParams.sort_by);
          });
        }
      }
    },
    initSortbyEvent: function() {
      if (e(".sort-position").length > 0) {
        e('.sort-position').change(function(event) {
          var val = e(this).val();
          queryParams.sort_by = val;
          obj.ajaxClick(obj.getAjaxLink(queryParams));
        });
      }
    },
    initPerpageEvent: function () {
      if (e(".show-qty").length > 0) {
        e(".show-qty").change(function(event) {
          var val = e(this).val();
          if(e(this).find('option:selected').index() == 0) {
            delete queryParams.view;
          } else {
            queryParams.view = val;
          }
          delete queryParams.page;
          obj.ajaxClick(obj.getAjaxLink(queryParams));
        });
      }
    },
    initPaginationEvent: function() {
      if (e(".pagination").length > 0) {
        e(".pagination a").unbind().click(function(event) {
          event.preventDefault();
          if(!e(this).parent().hasClass("active")) {
            var value = e(this).attr("href").match(/page=\d+/g);
            if (!value) return false;
            queryParams.page = parseInt(value[0].match(/\d+/g));
            obj.ajaxClick(obj.getAjaxLink(queryParams));
            
            var current_class = ".product-listing";
            var stuck = e('.stuck').length ? e('.stuck').height() : 0;
            var top = e(current_class).offset().top - stuck;
            e(window).scrollTop(top);
          }
        });
      };
    },    
    getAjaxLink: function(value) {
      var page = obj.getUrlSubcategory('/collections/', location.pathname);
      var pathname = '/collections/' + page;
      value = obj.getDecodedUrl(value);      
      return value != "" ? pathname + "?" + value : pathname;
    },
    //AJAX
    ajaxClick: function(url) {
      obj.ajaxClickHandlerState = true;
      History.pushState({
        param: Shopify.queryParams
      }, document.title, url);
      obj.getCollectionContent(url);
    },
    getCollectionContent: function(url) {
      var view = url.match(/view=([^&#]*)/);
      if (!view) {
        url += String(url.indexOf('?') > -1 ?'&':'?') + 'view=ajax';
      }
      else {
        view = view[0];
        url = url.replace(view, view+'ajax');
      }

      var params = {
        type: "get",
        url: url,
        beforeSend: function() {
          obj.showPreloader();
        },
        success: function(data) {
          obj.hidePreloader();
          obj.pageData(data);
          obj.initPaginationEvent();
          obj.initSidebar();
          obj.initShowMore();
        },
        error: function(XMLHttpRequest, textStatus) {
          obj.hidePreloader();
          alert("error")
        }
      }
      jQuery.ajax(params);
    },
    //Get and show new content
    pageData: function(data) {
      var current_class = ".product-listing";

      var content = e(data).find(current_class);
      e(current_class).empty();
      e(current_class).append(content.html());

      current_class = ".filtres-js";
      e(current_class).each(function(index) {
      	var $_this = e(this);
        var $_parent_group = $_this.closest('.collapse-block');
        
        content = e(data).find(current_class+':eq('+index+')');
        $_this.replaceWith(content);
        content = e(data).find(current_class+':eq('+index+')').closest('.collapse-block');
        content.hasClass('hide') ? $_parent_group.addClass('hide') : $_parent_group.removeClass('hide');
      });
      
      content = e(data).find(".product-pagintion");
      content.length && e.type(content.html()) === "undefined" ? e(".product-pagintion").empty() : e(".product-pagintion").replaceWith(content);

      content = e(data).find(".number-of-products");
      e(".number-of-products").replaceWith(content);
      
      content = e(data).find('.infinitybutton');
      e('.infinitybutton').replaceWith(content);
      
      $('body').trigger('refreshCurrency');
      if(e(".spr-badge").length > 0) {
        e.getScript(window.location.protocol + "//productreviews.shopifycdn.com/assets/v4/spr.js");
      }
      
      countDown(true);
      
      content = null;
      data = null;
    },
	//Utils
    showPreloader: function() {
      e(".custom-loader").show();
    },
    hidePreloader: function() {
      e(".custom-loader").hide();
    },
    getUrlSubcategory: function (category, url) {
      var str = url;
      var n = str.indexOf(category);
      if(n < 0)
        return "";
      str = str.slice(n + category.length, str.length);
      var m = str.indexOf("/") > -1 ? str.indexOf("/") : str.length;
      str = str.slice(0, m).toLowerCase();
      return str.replace(name+"=", "");
    },
    getQueryParams: function() {
      var location_path = location.pathname;
      var location_search = location.search;
      var path_search = location_path.split('/');
      path_search.length > 3 ? path_search = 'constraint=' + path_search.pop().replace(/&/g, "") : path_search = location_search.split('?').pop();
      if(path_search == '') return {};
      else return obj.uriToJson(path_search);
    },
    uriToJson: function (value) {
      return JSON.parse('{"' + decodeURI(value.replace(/&/g, "\",\"").replace(/=/g,"\":\"")) + '"}')
    },
    getDecodedUrl: function(value) {
      return decodeURIComponent($.param(value));
  	}
  }

  e(document).ready(function() {
    obj.init();
  });

})(jQuery)