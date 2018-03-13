var addToCartHandler = {
  initItemAddToCartButton: function(){
    var _btns = $('.addtocart-item-js');
    $('body').on('click', '.addtocart-item-js', function(e){
      e.preventDefault();
      var variant_id = getIdFromUrl($(this).attr("href"));
      Shopify.addItem(variant_id, 1);
    })
  },
  initFormAddToCartButton: function(variant_id, _parent, _swatch){
    var _btn = _parent.find('.addtocart-js');
    if(_btn.length == 0) return false;

    _btn.unbind().click(function(e){
      e.preventDefault();

      var quantity = Math.max(1, parseInt(_parent.find('.input-counter').find('input').val()));
      Shopify.addItem(variant_id, quantity);

      typeof quick_view_loader !== 'undefined' && quick_view_loader.wait(_btn);
    })
  },
  addItem: function(line_item) {
    var _parent = $('header').find('.cart');
    var _empty_cart = $('.empty-cart-js');
    var _ul = _parent.find('ul:not(.item-html-js)');
    
    var price_str = getItemFormatedPrice(line_item.price);
    var _ = $('.item-html-js').children().clone();
    _.find('.title').find('a').attr('href', line_item.url).html(line_item.product_title);
    _.find('.price').html(price_str);
    _.find('.qty').find('input').val(line_item.quantity);

    var _img = _.find('.img').find('a');
    _img.attr('href', line_item.url).empty();
    $('<img src='+line_item.image+' alt="Cart Image">').appendTo(_img);

    var _details = _.find('.details');
    line_item.variant_title == null ? _details.remove() : _details.html(line_item.variant_title.replace(/ \//g, ', '));

    var delete_btn = _.find('.delete').find('a');
    var delete_url = String(delete_btn.attr('href')).replace('id=0', 'id='+line_item.id);
    delete_btn.attr('href', delete_url);
    _.find('.edit').find('a').attr('href', line_item.url);

    _ul.find('[href="'+delete_url+'"]').length && _ul.find('[href="'+delete_url+'"]').closest('li').remove();
    $(_).appendTo(_ul);
    !_empty_cart.hasClass('hide') && _empty_cart.addClass('hide');
  },
  updateGeneralInfo: function(cart){
    var price_str = getItemFormatedPrice(cart.total_price);
    var _parent = $('header').find('.cart');
    _parent.find('.badge-cart').text(cart.item_count);
    cart.item_count == 0 ? _parent.find('.badge-cart').addClass('empty') : _parent.find('.badge-cart').removeClass('empty');
    _parent.find('.cart-total').find('span:first-child').empty().html(price_str);
  }
}

var addedModal = {
  $modal: $('#modalAddToCartProduct'),
  initSingleItem: function(line_item){
    var price_str = getItemFormatedPrice(line_item.price*line_item.quantity);
    var _ = this.$modal;
    _.find('.title').html(line_item.product_title);
    var _details = _.find('.description');
    line_item.variant_title == null ? _details.hide() : _details.show().html(line_item.variant_title.replace(/ \//g, ', '));
    _.find('.qty span').first().empty().text(line_item.quantity);
    _.find('.total-product-js span').first().empty().html(price_str);

    var _img = _.find('.image-box').empty();
    $('<img src="'+line_item.image+'" alt="Added Product">').appendTo(_img);
  },
  initGeneralInfo: function(cart){
    var price_str = getItemFormatedPrice(cart.total_price);
    var _ = this.$modal;
    _.find('.modal-total-quantity').text(cart.item_count);
    _.find('.full-total-js').html(price_str);
  },
  showModal: function(){
    if(typeof modal_qv_open !== 'undefined') {
      if(modal_qv_open) return false;
    }

    var $this = this.$modal;
    $this.modal('show');
    var _ = this.$modal;
    _.find('.close-modal-added-js').click(function(e){
      e.preventDefault();
      $(this).unbind();
      $this.modal('hide');
    })
    
  }
}

function getItemFormatedPrice(value){
  return Shopify.formatMoney(value, money_format);
}

/* override functions api.jquery.js */
Shopify.onItemAdded = function(line_item) {
  Shopify.getCart();
  addToCartHandler.addItem(line_item);
  addedModal.initSingleItem(line_item);
};

Shopify.onCartUpdate = function(cart) {
  addToCartHandler.updateGeneralInfo(cart);
  addedModal.initGeneralInfo(cart);
  addedModal.showModal();
  typeof quick_view_loader !== 'undefined' && quick_view_loader.added();
  $('body').trigger('refreshCurrency');
};
Shopify.onError = function(XMLHttpRequest, textStatus) {
  if(typeof modal_qv_open !== 'undefined') {
    if(modal_qv_open) {
      quick_view_loader.error();
      return false;
    }
  }

  var data = eval('(' + XMLHttpRequest.responseText + ')');
  if (!!data.message) {
    var str = data.description;
  } else {
   	var str = 'Error : ' + Shopify.fullMessagesFromErrors(data).join('; ') + '.';
  }
  $('#modalAddToCartError .error_message').text(str);
  $('#modalAddToCartError').modal("toggle");
}

var removeFromCartHandler = function(){
  $('body').on('click', '.header_delete_cartitem_js', function(e){
    e.preventDefault();
    $(this).closest('li').addClass('removeAfterCompleteAjax');
    var variant_id = getIdFromUrl($(this).attr("href"));
    Shopify.removeItem(variant_id, onCartUpdateCustom);
  });
}
function onCartUpdateCustom(cart){
  cart.item_count == 0 && $('.empty-cart-js').removeClass('hide');
  $('.removeAfterCompleteAjax').remove();
  addToCartHandler.updateGeneralInfo(cart);
  $('body').trigger('refreshCurrency');
}
function getIdFromUrl(url){
  url = url.match(/id=\d+/g);
  return url[0].match(/\d+/g);
}
addToCartHandler.initItemAddToCartButton();
removeFromCartHandler();