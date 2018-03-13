var _custom_loader = $('.custom-loader');
var modal_qv_parent = $('#ModalquickView');
var modal_qv_open = false;
var modal_qv_content = modal_qv_parent.find('.modal-content');
if(modal_qv_parent.length) {
  modal_qv_parent.on('show.bs.modal', function(e) {
    /* modal */
    modal_qv_open = true;
    _custom_loader.show();
    modal_qv_content.hide();//hide content
    var relatedTarget = $(e.relatedTarget).filter(':first');
    var attr = relatedTarget.attr('data-value');
    var small_description = relatedTarget.closest('.product').find('.description').html();
    var fn = window['configureQuickView'];
    typeof(fn) === "function" && fn(attr, small_description);
  }).on('hidden.bs.modal', function () {
    modal_qv_open = false;
    var fn = window['destroyQuickView'];
    typeof(fn) === "function" && fn();
  });
}

var quick_view_loader = {
  btn: false,
  wait: function(_btn){
    if(!modal_qv_open) return false;
    this.btn = _btn;
    _btn.html(wait_text);
  },
  error: function(){
  	if(!modal_qv_open) return false;
    this.btn.addClass('quickview-error').html(errorhtml_text);
    this.default_text('quickview-error');
  },
  added: function(){
    if(!modal_qv_open) return false;
    this.btn.addClass('quickview-added').html(addedhtml_text);
    this.default_text('quickview-added');
  },
  default_text: function(value){
    setTimeout(function(){quick_view_loader.btn.removeClass(value).html(addtocart_text)}, 1000);
  }
}

var quickview_swatches = false;
function configureQuickView(product_url, small_description){
  var handle = product_url.split('/').pop();
  Shopify.getProduct(handle, qvLoadSuccess);
  
  /* hide preloader when ajax error */

  function qvLoadSuccess(json_data){
    var view = $('.quickview-swatches-container').length && $('.quickview-swatches-container').attr('data-swatches-design');
    view = view == "true" ? 'viewSelect' : 'viewButtons';
    quickview_swatches = new SwatchesConstructor(json_data, {contentParent: '.quickview-swatches-container', viewDesign:view, enableHistoryState: false, callback: quickViewVariant, externalImagesObject: texture_obj, externalColors: colors_value, colorWithBorder: color_with_border });
    json_data = null;
    /* modal */
    _custom_loader.hide();
    modal_qv_content.fadeIn();//show content
  }
  function quickViewVariant(variant, product){
    var _ = modal_qv_parent;
    var _parent_general_info = _.find('.product-info');
    var _swatch = _.find('.swatches-container');
    swatchVariantHandler(_parent_general_info, variant);
    addToCartHandler.initFormAddToCartButton(variant.id, _parent_general_info, _swatch);
    
    _.find('.title').html(product.title);
    _.find('.viewfullinfo') && _.find('.viewfullinfo').attr('href', product_url);

    _.find('.qv_vendor') && _.find('.qv_vendor').html(product.vendor);
    var qv_type = _.find('.qv_type');
    if(qv_type.length){
      product.type == '' ? qv_type.parent().hide() : qv_type.html(product.type).parent().show();
    }
    
    var _img = _.find('.product-main-image');
    var img_src = variant.featured_image ? variant.featured_image.src : product.featured_image;
    if(_img.children().length) _img.children().first().attr('src', img_src)
    else $('<img src="'+img_src+'" alt="Quick View Image">').appendTo(_img);

    var description = _.find('.description').empty();
    description.length && description.html(small_description);
  }
}
function destroyQuickView(){
  quickview_swatches && quickview_swatches.destroy();
  quickview_swatches = false;
  var _ = modal_qv_parent;
  _.find('.product-main-image').empty();
  _.find('.description').empty();
  _.find('.swatches-container').empty();  
  _.find('.title').empty();
}


function swatchVariantHandler(_parent, variant) {
  var _ = _parent;
  var _price = _.find('.price');
  var _info = _.find('.add-info');
  var _sku = _info.length && _info.find('.sku');
  var _avaibility = _info.length && _info.find('.availability');
  var _input = _.find('.input-counter').find('input');
  var _btnaddtocart = _.find('.btn-addtocart');
  
  var _barcode = _.find('.barcode');
  
  var qty_label = _.find('.qty-label');
  var input_counter = _.find('.input-counter');

  var price_str = Shopify.formatMoney(variant.price, money_format);
  var price_comare_str = Shopify.formatMoney(variant.compare_at_price, money_format);
  if(variant.price < variant.compare_at_price){
    _price.find('>span:first').addClass('new-price').html(price_str);
    _price.find('>span:last').removeClass('hide').html(price_comare_str);
  }
  else {
    _price.find('>span:first').removeClass('new-price').html(price_str);
    _price.find('>span:last').addClass('hide');
  }
  
  if(_sku.length) {
    _sku.children().last().html(variant.sku);
    variant.sku == '' ? _sku.addClass('hide') : _sku.removeClass('hide');
  }
  
  if(_barcode.length) {
    _barcode.html(variant.barcode);
    variant.barcode == '' ? _barcode.parent().addClass('hide') : _barcode.parent().removeClass('hide');
  }
  
  
  // Inventory Quantity
  var inventory_management = variant.inventory_management;
  var inventory_policy = variant.inventory_policy;
  var inventory_quantity = variant.inventory_quantity;

  if(_avaibility.length){
    if(Boolean(variant.available)){
      _avaibility.find('.sold_out').addClass('hide');
      if(inventory_management == null || inventory_policy == "continue") {
        inventory_quantity = 9999;
        _avaibility.find('.stock_quantity, .in_stock').addClass('hide');
        _avaibility.find('.many_in_stock').removeClass('hide');
      }
      else {
        _avaibility.find('.stock_quantity').removeClass('hide').html(inventory_quantity);
        _avaibility.find('.in_stock').removeClass('hide');
        _avaibility.find('.many_in_stock').addClass('hide');
      }
      _input.val(1).attr('size', inventory_quantity);
    }
    else {
      _avaibility.find('.stock_quantity, .in_stock, .many_in_stock').addClass('hide');
      _avaibility.find('.sold_out').removeClass('hide');
    }
  }
  
  $('body').trigger('refreshCurrency');
  if(_btnaddtocart.length == 0) return false

  // Form
  if(Boolean(variant.available)) {
    qty_label.closest('.wrapper').show();
    _btnaddtocart.html(addtocart_text).removeClass('disable');
  }
  else {
    qty_label.closest('.wrapper').hide();
    _btnaddtocart.html(unavailable_text).addClass('disable');
  }
}