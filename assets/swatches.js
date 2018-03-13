function SwatchesConstructor(obj_json, obj_param){
  var _ = this;

  _.productIsValid = obj_json.available && obj_json.options != 'Title';
  _.product_json = obj_json;
  _.options_name = '';
  _.options = '';

  _.viewDesign = window[obj_param['viewDesign']];

  _.contentParent = obj_param['contentParent'];
  _.enableHistoryState = Boolean(obj_param['enableHistoryState']) || false;
  _.callback = obj_param['callback'] || false;
  _.texture_obj = obj_param['externalImagesObject'] || {};
  _.colors_obj = obj_param['externalColors'] || {};
  _.color_with_border = obj_param['colorWithBorder'] || {};

  _.productIsValid && $(_.contentParent).length ? _.initSwatches() : _.callExternalVariantHandler(_.callback, obj_json.variants[0], _.getJsonObject());
}

SwatchesConstructor.prototype.destroy = function() {
  var $parent = $(this.contentParent);
  $parent.find('a').unbind();
  $parent.find('select').unbind();
  $parent.empty();
}

SwatchesConstructor.prototype.initSwatches = function() {
  var _ = this;
  var arr = [];
  var options_object = false;
  
  options_object = _.getJsonObject().options;
  for(var i = 0; i<options_object.length; i++){
    arr[i] = Object(options_object[i]).name;
  }
  _.options_name = arr;
  
  _.options = getAllOptions(_.getJsonObject().variants);
  var variant_id = _.enableHistoryState && getVariantIdUrl();
  _.createSwatches(variant_id);
}
SwatchesConstructor.prototype.createSwatches = function(variant_id) {
  var _ = this;
  var fn = _.viewDesign;

  if (isEmpty(_.options)) return false;
  var variant = getCurrentVariantById(_.getJsonObject().variants, variant_id);
  var selected_variant_array = String(variant.title).replace(/\/ /g, '/').split('/');
  _.createOptionsView(_.contentParent, _.options, _.options_name, selected_variant_array);
  _[fn('getFunctionClickHandler')]();

  _.callExternalVariantHandler(_.callback, variant, _.getJsonObject());
}
/* Handlers */
SwatchesConstructor.prototype.buttonHandler = function() {
  var _ = this;
  var fn = _.viewDesign;

  var $_parent = $(_.contentParent);
  var group_parent_name = fn('getGroupElementName');
  var $_group_parent = $_parent.find(group_parent_name);

  $_group_parent.find('a').click(function(e){
    e.preventDefault();
    if($(this).hasClass('active')) return false;
    $_group_parent.find('a').unbind();
    $(this).closest(group_parent_name).find('.active').removeClass('active');
    $(this).parent().addClass('active');
    var str = '';
    $_parent.find('.active').find('[data-value]').each(function(){
      str += $(this).attr('data-value') + ' / ';
    });
    _.endOfTheClickHandler(str);
  });
}
SwatchesConstructor.prototype.selectHandler = function() {
  var _ = this;
  var fn = _.viewDesign;

  var $_parent = $(_.contentParent);
  var group_parent_name = fn('getGroupElementName');
  var $_group_parent = $_parent.find(group_parent_name);

  $_group_parent.find('select').change(function(){
    var str = '';
    $_parent.find('select option:selected').each(function(){
      str += $(this).text() + ' / ';
    });
    _.endOfTheClickHandler(str);
  })
}
SwatchesConstructor.prototype.endOfTheClickHandler = function(str) {
  var _ = this;
  str = str.substring(0, str.length-3);
  var variant = getCurrentVariantByTitle(_.getJsonObject().variants, str);
  _.enableHistoryState && history.pushState(null, null, location.pathname+'?variant='+variant.id);
  _.createSwatches(variant.id);
}
/* View */
SwatchesConstructor.prototype.createOptionsView = function(contentParent, value, names, selected){
  var _ = this;
  var fn = _.viewDesign;

  var $_parent = $(contentParent).empty(),
      texture = _.texture_obj,
      colors = _.colors_obj,
      c_border = _.color_with_border,
      opt1 = '',
      opt2 = '',
      opt3 = '',
      title_key = 'getTitleHtml',
      button_key = 'getButtonHtml',
      wrapperView = '';

  $.each(value, function(key){
    if(key == selected[0] && typeof value[key] === 'object' && key != 'Default Title') {
      var array_options2 = value[key];
      $.each(array_options2, function(key){
        if(key == selected[1] && typeof array_options2[key] === 'object') {
          $.each(array_options2[key], function(key){
            opt3 += fn(button_key, {value:key, selected:selected[2], title:names[2], texture:texture, colors:colors, c_border:c_border });
          });
        }
        opt2 += fn(button_key, {value:key, selected:selected[1], title:names[1], texture:texture, colors:colors, c_border:c_border });
      });
    }
    if(key != 'Default Title') opt1 += fn(button_key, {value:key, selected:selected[0], title:names[0], texture:texture, colors:colors, c_border:c_border });
  });

  var titles = [names[0], names[1], names[2]];
  var values = [opt1, opt2, opt3];
  for(var i=0; i<values.length; i++) {
    values[i] != '' && $_parent.append(fn('getGroupHtml', { title:titles[i], html:values[i] }));
  }
}
SwatchesConstructor.prototype.getJsonObject = function() {
  return this.product_json;
}
SwatchesConstructor.prototype.callExternalVariantHandler = function(fn, param1, param2) {
  fn && typeof(fn) === "function" && fn(param1, param2);
}


/* Public Methods */
function getAllOptions(data){
  var arr = '';
  var available = true;
  var obj = {};
  for (var i = 0; i < data.length; i++) {
    arr = String(data[i].title).replace(/\/ /g, '/').split('/');
    available = Boolean(data[i].available);

    if(arr[0] && available) {
      if(arr[1]) {
        obj[arr[0]] = obj[arr[0]] || {};
        if(arr[2]) {
          obj[arr[0]][arr[1]] = obj[arr[0]][arr[1]] || {};
          obj[arr[0]][arr[1]][arr[2]] = true;
        }
        else {
          obj[arr[0]][arr[1]] = true;
        }
      }
      else {
        obj[arr[0]] = true;
      }
    }
  }
  return obj;
}

function getCurrentVariantById(data, idToLookFor) {
  for (var i = 0; i < data.length; i++) {
    if(!idToLookFor) {
      if (data[i].available) return(data[i]);
    } else {
      if (data[i].id == idToLookFor) return(data[i]);
    }
  }
  return(data[0]);
}
function getCurrentVariantByTitle(data, TitleToLookFor) {
  if(!TitleToLookFor) return data[0];

  var d = 2;
  top:
  for (var i = 0; i < data.length; i++) {
    if (data[i].title.indexOf(TitleToLookFor) > -1 && data[i].available) return(data[i]);
    if(i == data.length-1) {
      if(TitleToLookFor.indexOf('/') > -1){
        TitleToLookFor = TitleToLookFor.split('/');
        TitleToLookFor.pop();
        TitleToLookFor = TitleToLookFor.length > 1 ? TitleToLookFor.join('/') : TitleToLookFor;
        i = 0;
        continue top;
      }
    }
  }
  return(data[0]);
}

function getVariantIdUrl(){
  var path_search = location.search;
  if(path_search.indexOf('variant=') > -1) {
    path_search = path_search.match(/variant=\d+/g);
    path_search = parseInt(path_search[0].match(/\d+/g));
  }
  return path_search
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}



/* View */
/*
*<div class=".wrapper">
*	<div class="title-options">title</div>
*	<ul class="tags-list">
*		<li><a href="#" data-value="value">value</a></li>
*	</ul>
*</div>
*/
function viewButtons(type, obj) {
  obj = obj || {};
  var mainElementName = '.wrapper';
  switch(type) {
    case 'getFunctionClickHandler':
      return 'buttonHandler';

    case 'getGroupElementName':
      return mainElementName;

    case 'getGroupHtml':
      var elementName = mainElementName.replace(/([\.#])/g, ''),
          title_html = '<div class="title-options text-uppercase">'+obj.title+':'+'</div>',
          value_html = obj.html;

      return '<div class="'+elementName+'">'+title_html+'<ul class="options options-large">'+value_html+'</ul></div>';

    case 'getButtonHtml':
      var value = obj.value.trim();
      var color = value.toLowerCase();
      var border = obj.c_border.indexOf(value) > -1 ? ' border' : '';

      color = ',' + color + ':';
      color = obj.colors.indexOf(color) > -1 ? obj.colors.split(color).pop().split(',').shift().trim() : false;
      var style = value in obj.texture ? ' style="background:url('+obj.texture[value]+')"' : '';
      if(style == '' && color) style = ' style="background:' + color + ';"';

      var btn = style != '' ?
          '<li><a href="#" class="options-color' + border + '" data-value="'+value+'" title="'+value+'" '+style+'></a></li>':
      	  '<li><a href="#" data-value="'+value+'" title="'+value+'">'+value+'</a></li>';
      if(obj.value != obj.selected) return btn;
      return btn.replace(/<li/, '<li class="active"');
  }
}
/*
*<div class=".wrapper">
*	<div class="title-options">title</div>
*	<ul>
*		<li><select><option></option>...</select></li>
*	</ul>
*</div>
*/
function viewSelect(type, obj) {
  obj = obj || {};
  var mainElementName = '.wrapper';
  switch(type) {
    case 'getFunctionClickHandler':
      return 'selectHandler';

    case 'getGroupElementName':
      return mainElementName;

    case 'getGroupHtml':
      var elementName = mainElementName.replace(/([\.#])/g, ''),
          title_html = '<div class="title-options text-uppercase">'+obj.title+':'+'</div>',
          value_html = obj.html;
      return '<div class="'+elementName+'">'+title_html+'<select class="form-control select-inline">'+value_html+'</select></div>';

    case 'getButtonHtml':
      var btn = '<option>'+obj.value.trim()+'</option>';
      if(obj.value != obj.selected) return btn;
      return btn.replace(/<option/, '<option selected');
  }
}