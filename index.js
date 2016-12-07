var webComponent = {
	_formValues : [],
	_modelValues: [],
	searchType: '' ,
	setSearchType: function( value ){ this.searchType = value; },
	errorFields: [],
	invalidFields : [],
	canvas:'',
	lastCount: 1,
	error:'',
	selected: [],
	checked:[],

	_getAllValues:function() {
		var inputValues = [];
		var notChecked = [];		

		$('#' + webComponent.canvas ).find(' input[type="text"], textarea, input[type="email"], input[type="password"] ').not(':button,:hidden').each(function() {
			if($(this).attr("id").substr(0, 7) != "camOtro"){				
				inputValues.push({ idField: $(this).attr("id"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response: $(this).val(), position : parseFloat($(this).attr("position")) });
			}
		});

		$('#' + webComponent.canvas ).find(' input[type="radio"]:checked ').each(function() {
			//if($(this).val().length > 0){
				inputValues.push({ idField: $(this).attr("parentId"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response: $(this).val(), position : parseFloat($(this).attr("position")) });
			//}
		});

		$('#' + webComponent.canvas ).find(' input[type="radio"]').not(':checked').each(function() {
			if($(this).attr("parentId")){
				var div = $(this).attr("parentId");
				var seleccionados =  $("#"+div).find(":checked");
				if(seleccionados.length === 0 && notChecked.indexOf($(this).attr("label")) === -1){
					notChecked.push($(this).attr("label"));
					inputValues.push({ idField: $(this).attr("parentId"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response:'', position : parseFloat($(this).attr("position")) });
				}
			}
		});

		$('#' + webComponent.canvas ).find(' input[type="checkbox"]').each(function() {
			//if($(this).val().length > 0){
				var response = ''
				var order = ''
				if ($(this).is(':checked')) {
					var id =  $(this).attr("id")
					var finder = $.grep( getClickedOrderedCheckedBoxes(), function(e){
						return e.id == id ; 
					});
					if(finder[0].order){
						order = String(finder[0].order);
					}
					response = finder[0].response; 
				}

				if(order != ''){
					inputValues.push({ idField: $(this).attr("parentId"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response: response+"-"+order, order:order, position: parseFloat($(this).attr("position"))  });
				}else {	
					inputValues.push({ idField: $(this).attr("parentId"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response: response, order:order, position: parseFloat($(this).attr("position"))  });
				}
			});

		$('#' + webComponent.canvas ).find('  option:selected').each(function() {
			//if ($(this).val() != ''){
				inputValues.push({  idField: $(this).parent().attr("id"), name: $(this).attr("data-name") ,  label: $(this).attr("data-label"), response: $(this).val(), position: parseFloat($(this).attr("position")) });
			//}
		});


		function getClickedOrderedCheckedBoxes() {
			var distinct = []
			for (var i = 0; i < webComponent.checked.length; i++){
				if (!(webComponent.checked[i].name in distinct)){
					distinct.push(webComponent.checked[i].name);
				}
			}

			$.each($.unique(distinct), function(index,field){
				var result = $.grep(webComponent.checked, function(e){ return e.name === field;  });
				$.each(result, function(i,f){
					if(f.clickedOrder === 'true'){
						f["order"] = i + 1;	
					}
				});
				//inputValues.push.apply(inputValues, result );
			});

			return webComponent.checked;
		};


		return inputValues.sort(function(a,b) {
			return b.position < a.position;
		});

	},

	_isValidForm: function(){
		return isFullRequired() && isFullRegexValid();

		function isFullRequired(){
			webComponent._errorFields = [];
			$('#' + webComponent.canvas ).find('.required select').each(function(i, requiredField){
				if($(requiredField).val() === '' || $(requiredField).val() === null){
					webComponent._errorFields.push($(requiredField).attr('id'));
					webComponent._addErrorClass($(requiredField).attr('id'),"required");
				}
			});
			$('#' + webComponent.canvas ).find( '.required   input[type="text"],  input[type="email"],  input[type="password"] ').not(':button,:hidden').each(function(i, requiredField){
				if($(requiredField).val() == ''){
					webComponent._errorFields.push($(requiredField));
					webComponent._addErrorClassSimple( $(requiredField).parent().attr('id') , "Campo Requerido");	
				}
			});

			$('#' + webComponent.canvas ).find( '.required  textarea ').not(':button,:hidden').each(function(i, requiredField){
				if($(requiredField).val() == ''){
					webComponent._errorFields.push($(requiredField));
					webComponent._addErrorClassSimple($(requiredField).parent().attr('id') , "Campo Requerido");	
				}
			});

			$('#' + webComponent.canvas ).find( '.required   input[type="checkbox"]').each(function(i, requiredField){
				var seleccionados = $(requiredField).parent().parent().parent().parent().find("input:checked");
				if (seleccionados.length === 0 ) {
					webComponent._errorFields.push($(requiredField));
					webComponent._addErrorClassSimple($("#" + $(requiredField).parent().parent().parent().attr('id') ), "Campo Requerido");
				}
			});

			$('#' + webComponent.canvas ).find('.required   input[type="radio"]').each(function(i, requiredField){
				var seleccionados = $(requiredField).parent().parent().parent().parent().find("input:checked");
				if (seleccionados.length === 0 ) {
					webComponent._errorFields.push($(requiredField));
					webComponent._addErrorClassSimple($("#" + $(requiredField).parent().parent().parent().attr('id') ), "Campo Requerido");
				}
			});

			if(webComponent._errorFields.length !== 0){
				$.each(webComponent._errorFields, function(index,field){
					if($(field).attr("parentId")){
						var divId = $(field).attr("parentId");
						webComponent._addErrorClassSimple($("#"+divId), "Campo Requerido");
						
					}else{
						webComponent._addErrorClass($(field).attr('id'));
					}
				});
				return false;
			}
			else{
				return true;
			}
		};

		function isFullRegexValid(){
			webComponent.invalidFields = [];
			var regexFields = $.grep(webComponent._formValues, function(e){ return e.regex });
			$.each( regexFields , function( index, field ) {
				var findField  = $.grep(webComponent._getAllValues(), function(el){ return el.name = field.name });
				if(findField[0].response.length > 0 && !webComponent._evaluateValueInRegex(findField[0].response, field.regex)){
					webComponent.invalidFields.push(findField);
				}
			});
			if(webComponent.invalidFields.length !== 0){
				$.each(webComponent._errorFields, function(index,field){
					webComponent._addErrorClass(field.id);
				})
				return false;
			}
			else{
				return true;
			}
		};
	},

	main: function (url, container) {
		var controller = this;
		$.support.cors = true;
		$.ajax({
			type: 'GET',
			url: url,
			cache: true,
			'async': false,
			crossDomain: true,
			dataType: 'json',
			contentType: 'application/json',
			success: function (data, status) {
				controller._formValues = data.fields ;
				controller._modelValues = data;
			},
			error: function (e) {
				if(e.status === 404){
					webComponent.showMessage("Encuesta no encontrada:", "warning", container);
					controller.error = e.status;
				}
			}
		});
		return controller._modelValues;
	},

	showMessage: function(message, kind , container){
		var type = kind || "danger";
	    var div = container || 	"messageContainer";
		$("#"+ div).append('<div class="alert alert-'+type+' alert-dismissible">'+
			'<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+ message+
		'</div>');		
        $('html,body').animate({scrollTop: $("#"+div).offset().top},'slow');

    	setTimeout(function() {
			$("#"+ div).fadeOut();
		}, 3000);
	 
	},

	_render: function (container){
		$("#" + container).html("");
		$("#" + container).append('<div id="messageContainer"></div>');
		$("#div-id_captcha").empty();
		$('#navBarr').empty();
		webComponent.canvas = container;
		var controller = this;

		$.each( webComponent._formValues, function( fieldIndex, field ) {
			switch(field.type) {
				case "text":
				createTextInput(field, fieldIndex);
				break;
				case "textarea":
				createTextAreaInput(field, fieldIndex);
				break;
				case "radio-group":
				createRadioGroup(field,fieldIndex);
				break;
				case "checkbox-group":
				createCheckBoxGroup(field,fieldIndex);
				break;
				case "select":
				createSimpleSelect(field,fieldIndex);
				break;
				case "select-ws":
				createSelectWs(field,fieldIndex);
				break;
				case "date":
				createDatePicker(field,fieldIndex);
				break;			
				case "header":
				createHeader(field,fieldIndex);
				break;
				case "footer":
				createFooter(field);
				break;
				case "hr":
				createHr(field.class);
				break;
				default:  
				//('Default case');
			}
		});

		if(webComponent._modelValues.captcha){
			createCaptcha($("#div-id_captcha"));
		}
		if(webComponent._modelValues.submitButton){
			var div = $('#navBarr');
			createNavBar(div);
		}

		function createHeader(field, index){
			var div = getOrCreateDiv("id" + index, field.class);			
			getOrCreateHeader(div,field);
		    $("#" + webComponent.canvas).append(div);
		};

		function createHr(clazz){
            var hr = $("<hr>")
            if(clazz){
               hr.attr("class", clazz);               
            }
            $("#" + webComponent.canvas).append(hr);
            return hr
  		};
		function createFooter(field){
			var labelObject = $("#footer");
			if(labelObject.length === 0){
				labelObject = $("<"+field.subtype+" class='"+ field.class +"' >"+ field.label + "</"+field.subtype+">");
			}
			$("#navBarr").after(labelObject);
			return labelObject;	
		};

		function createTextInput(field, index){
			validateFieldsClass(field);
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv("div-field-container-" + index , field.class);
			getOrCreateLabel(div,id, field);
			var divInputContainer = getOrCreateDiv("input-container-" + id , "inputContainer");
			getOrCreateTextInput(divInputContainer,id, field);
			addHelperBlock(divInputContainer);
			div.append(divInputContainer);
			$("#" + webComponent.canvas).append(div);
		};

		function createTextAreaInput(field, index){
			validateFieldsClass(field);
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv("div-field-container-" + index , field.class);
			getOrCreateLabel(div,id, field);
			var divInputContainer = getOrCreateDiv("input-container-" + id , "inputContainer");
			getOrCreateTextAreaInput(divInputContainer,id, field);
			addHelperBlock(divInputContainer);
			div.append(divInputContainer);
			$("#" + webComponent.canvas).append(div);
		};

		function createDatePicker (field, index) {
			validateFieldsClass(field);
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv("div-field-container-" + index , field.class);
			getOrCreateLabel(div,id, field);
			getOrCreateDatePickerInput(div,id, field);
			addGlyphicon(div);
			addHelperBlock(div);
			$("#" + webComponent.canvas).append(div);		
		};

		function createRadioGroup(field, index){
			validateFieldsClass(field);
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv("div-field-container-" + index , field.class);
			var divInputContainer = getOrCreateDiv("input-container-" + id , "inputContainer");
			getOrCreateLabel(div,id, field);
			getOrCreateRadioGroupInput(divInputContainer, id,  field);
			addHelperBlock(divInputContainer);
			div.append(divInputContainer);
			$("#" + webComponent.canvas).append(div);
		};

		function createCheckBoxGroup(field,index){
			validateFieldsClass(field);
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv("div-field-container-" + index , field.class);
			var divInputContainer = getOrCreateDiv("input-container-" + id , "inputContainer");
			getOrCreateLabel(div,id, field);
			getOrCreateCheckBoxGroupInput(divInputContainer, id,  field);
			addHelperBlock(divInputContainer);
			div.append(divInputContainer);
			$("#" + webComponent.canvas).append(div);
		};

		function createSimpleSelect(field){
			validateFieldsClass(field);
			var id = field.name //+ "-" + f;
			field["id"] = id;
			var div = getOrCreateDiv("div-field-container-" + index , field.class);
			getOrCreateLabel(div,id, field);
			var divInputContainer = getOrCreateDiv("input-container-" + id , "inputContainer");
			var select =getOrCreateSelect(divInputContainer, id, field);
			populateSelect(select, field);
			addHelperBlock(divInputContainer);
			div.append(divInputContainer);
			$("#" + webComponent.canvas).append(div);
		};

		function createSelectWs(field, fieldIndex){
			var dropDownData = webComponent.selected[fieldIndex];
			if(!dropDownData){
				var options = [];
				var label = '';
				var clazz = '';
				if(field.wsList){
					options = getValuesFromWs(0 ,field);
					label = field.wsList[0].label;
					clazz = field.wsList[0].class;
				}
				else if (field.options){
					options = field.options;
					label = field.label;
					clazz = field.class;
				}
				// var fieldDropdown = {}
				webComponent.selected[fieldIndex] = {'dropdowns':[{"options": options, "selected":'', "label":  label, 'class': clazz }], 'lastCount':1, 'fieldIndex':fieldIndex}
				// webComponent.selected.push(fieldDropdown);
				dropDownData = webComponent.selected[fieldIndex];
			}
			var dropdowns = dropDownData.dropdowns;
			var lastCount = dropDownData.lastCount;
			if(lastCount > dropdowns.length ){
				for(var i=dropdowns.length -1; i <= lastCount; i++){
					$("#div-" + field.posicion + "-" + i).remove();
				}
			}
			dropDownData.lastCount = dropdowns.length;


			var divContainer = $("#div-field-container-" + fieldIndex );
			if(divContainer.length === 0){
				divContainer = $('<div/>')
				divContainer.attr("id", "div-field-container-" + fieldIndex)
			}

			$.each(dropdowns, function(i,selection){
				var id = field.posicion + "-" + i ;
				field["id"] = id ;
				var div = getOrCreateDiv(id, field.class || selection.class , "div-field-container-" + fieldIndex);
				if(field.wsList){
					getOrCreateLabel(div,id, field, field.wsList[i].label);
				}
				else{
					getOrCreateLabel(div,id, field, selection.label);
				}
				var select = getOrCreateSelect(div, id, field, i, dropDownData);
				if(field.wsList){
					populateWSSelect(select, field, selection, i);
				}
				else if (field.options && field.type ==="select-ws") {
					populateWSSelect(select, field, selection, i);
				}
				addHelperBlock(div);
				divContainer.append(div);
			});

			var preId  = fieldIndex - 1;
			var postId = fieldIndex + 1;

			if($("#div-field-container-"+ preId).length > 0  ){
				$("#div-field-container-"+ preId).after(divContainer);
			}
			else if($("#div-field-container-"+ postId).length > 0 ) {
				$("#div-field-container-"+ preId).before(divContainer);
			}
			else {
				$("#" + webComponent.canvas).append(divContainer);
			}

		};

		function getValuesFromWs(idx,field, dropDownData){
			var options = [];
			var wsData = field.wsList[idx];
			var url = wsData.url;
			var regExp = /\{(.*?)\}/g;
			var matches = url.match(regExp);
			if(matches){
				var selectionValues = getSelectionsValues(field, idx, dropDownData);
				var propertyList =  matches.map(function(el){
					return el.substring(1, el.length - 1);
				});
				var findElements = propertyList.map(function (element, index){
					var finds = selectionValues.map(function (el,i){
						var keys = Object.keys(el);
						if(keys.indexOf(element) > -1){
							return el;
						}
					})[0];
					return finds;
				}).filter(Boolean);
				if(findElements.length >= propertyList.length){
					findElements.forEach(function(el,i){
						url = url.replace("{" + Object.keys(el) + "}", el[Object.keys(el)]);
					});
				}

			}

			var responseDisplay = wsData.responseDisplay;
			var type ='';
			var payload = '';
			if(field.wsList[idx]["request"]){
				payload = this.get('model')["request"]
				type = 'POST'
			}
			else{
				type = 'GET'
			}

			$.ajax({
				url: url,
				type: type,
				dataType: 'json',
				contentType: 'application/json',
				'async': false,
				data: JSON.stringify(payload),
			})
			.done(function(data) {
				options = data;
			})
			.fail(function(data) {
				alert("WS Fail " + JSON.stringify(data));
			});
			return options;
		};

		function  getSelectionsValues(field, index,  dropDownData){
			return	dropDownData.dropdowns.map(function(el, idx){
				var currentSelected = getSelectedOption(el);
				var name = field.wsList[idx].name;
				var value = field.wsList[idx].responseValue ;
				var row = Object.create({});
				row[name] = currentSelected[value];
				return row;
			});
		};

		function getSelectedOption (dropdown) {
			var selectOption = dropdown.selected;
			return dropdown.options[selectOption];
		};

		function getOrCreateDiv(id, clazz, container){
			var divContainer = container || webComponent.canvas;
			var div = $("#" + id );
			if(div.length === 0){
				div = $('<div/>')
				div.attr("id", id)
				div.addClass(clazz);
			}
			return div;
		};

		function getOrCreateLabel(div, id, field, label){
			var labelObject = $("#label-" + id );
			var text = label || field.label
			if(labelObject.length === 0){
				labelObject = $("<label class='control-label' id='label-"+ id +"' for = "+ id + " >"+ webComponent.unescapeHtml(text) + "</label>");
				div.append(labelObject);
			}
			if(field.description){
				addToolTip(labelObject, field.description, "top");
			}
			if( field.textoapoyo != undefined ) {
				var p = $('<p/>')
				.text(webComponent.unescapeHtml(field.textoapoyo))
				.appendTo(div);
			}
			return labelObject;
		};

		function getOrCreateHeader(div, field){
			var labelObject = $("#header");
			if(labelObject.length === 0){
				labelObject = $("<"+field.subtype+" class='"+ field.class +"' >"+ field.label + "</"+field.subtype+">");
			}
			if(field.description){
				addToolTip(labelObject, field.description, "top");
			}
			div.append(labelObject);

			return labelObject;
		};

		function getOrCreateSelect (div , id, field, idx, dropDownData){
			id = "select-" + id + "_" + idx;
			var select = $("#" + id );
			if(select.length === 0){
				select = $("<select class='form-control' id='" + id + "'></select>");
				select.focusout(	function(){
					if(field.required && $(this).val() === '' ){
						webComponent._addErrorClass(id,"required");
					}
					else{
						webComponent._removeErrorClass(id);
					}
				});

				// Action to take if select is changed. State is made available through evt.data
				select.on("change", { controller: controller, index: idx, dropDownData:dropDownData}, function(evt){
				    // Restore the state
				    var controller = evt.data.controller;
				    var index = evt.data.index;
				    var selected = dropDownData.dropdowns;
				    // The selected field
				    var selectedFieldName = $(this).val();
				    // Update the selected
				    dropDownData.dropdowns = dropDownData.dropdowns.slice(0, index + 1);
				    var selectedOptionModel = setModelNameFromFieldName(selectedFieldName, dropDownData, field, index);
				    if(selectedOptionModel){
				    	if (selectedOptionModel.options){
				    		controller.lastCount = controller.lastCount + 1;
				    		dropDownData.dropdowns.push({"options":selectedOptionModel.options,"selected":'', 'label':selectedOptionModel.label} );
				    	}
				    	else if(field.wsList){
				    		var options = getValuesFromWs(idx + 1 , field, dropDownData);
				    		var label = field.wsList[idx + 1].label;
					        var clazz = field.wsList[idx + 1].class;
				    		var fieldDropdown = {};
				    		fieldDropdown = {"options": options, "selected":'', 'label': label, 'class': clazz };
				    		dropDownData.dropdowns.push(fieldDropdown);
				    	}
				    	createSelectWs(field, dropDownData.fieldIndex);



				    	/*
				    		if(field.wsList){
					options = getValuesFromWs(0 ,field);
					label = field.wsList[0].label;
					clazz = field.wsList[0].class;
				}
				else if (field.options){
					options = field.options;
					label = field.label;
					clazz = field.class;
				}
				// var fieldDropdown = {}
				webComponent.selected[fieldIndex] = {'dropdowns':[{"options": options, "selected":'', "label":  label, 'class': clazz }], 'lastCount':1, 'fieldIndex':fieldIndex}

				    	*/
				    }});
div.append(select);
}
return select;
};
function populateSelect(select, field){
	var label = webComponent.unescapeHtml(field.label);
	var name = webComponent.unescapeHtml(field.name);
	var placeholder =  webComponent.unescapeHtml(field.placeholder) || '';
	select.html("");
	select.append($("<option />").val('').attr("data-name", name).attr("data-label", label).text(placeholder).prop('selected', true).attr("disabled", "disabled"));
	if(field.options){
		var options =  field.options;
		for (opt  in options){
			select.append($("<option />").val(options[opt].value).attr("data-name", name).attr("data-label", webComponent.unescapeHtml(label)).text(webComponent.unescapeHtml(options[opt].text)));
		}
	}
};

function populateWSSelect(select, field, selection, idx){
	var label = '';
	var name = '';
	if(field.wsList){
		label = webComponent.unescapeHtml(field.wsList[idx].label);
		name = webComponent.unescapeHtml(field.wsList[idx].name);
	}else{
		label = selection.label;
		name = selection.name;
	}
	var placeholder = field.placeholder || '';
	select.html("");
	var options =  selection["options"];
	var currentSelectedIndex = selection["selected"];
	select.append($("<option />").val('').attr("data-name", name).attr("data-label", label).text(placeholder).prop('selected', true).attr("disabled", "disabled"));
	$.each( options , function( i, opt ) {
		var	text = '';
		var	value = '';
		if(field.wsList){
			var rd = field.wsList[idx].responseDisplay;
			text = opt[rd];
			value = opt[field.wsList[idx].responseValue];
		}
		else{
			text = opt.text;
			value = opt.value;
		}
		if(i === currentSelectedIndex){
			select.append($("<option />").val(value).attr("data-name", name).attr("data-label", label).text(text).prop('selected', true));
		}
		else{
			select.append($("<option />").val(value).attr("data-name", name).attr("data-label", label).text(text));
		}
	});
};

function setModelNameFromFieldName( fieldName, dropDownData, field, index ){
	var selectOptions = dropDownData.dropdowns[index].options;
	if(fieldName){
		var optionModel = [];
		if(field.wsList){
			var display = field.wsList[index].responseValue;
			optionModel =  $.grep(selectOptions, function(e){ return String(e[display]) === String(fieldName); });
			dropDownData.dropdowns[index].selected = selectOptions.indexOf(optionModel[0]);

		}else{
			optionModel =  $.grep(selectOptions, function(e){
				var val = String('' + e.value);
				return val.toString() === String(fieldName);
			});
			dropDownData.dropdowns[index].selected = selectOptions.indexOf(optionModel[0]);
		}
		// dropDownData.selected = selectOptions.indexOf(optionModel[0]);
		return optionModel[0];
	}else{
		webComponent.selected[selectedIndex]["selected"] = -1;
	}
};

function validateFieldsClass(item){
	var re = /form-control/gi;
	item.class = item.class.replace(re, "").split(" ").join(' ');
	item.placeholder = item.placeholder || "";
	if(item.required && item.required === "true"){
		item.class = item.class.concat(" required");
	}
	return item;
};

function getOrCreateTextInput(div, id, field){
	var input = $("#" + id );

	if(input.length === 0){
		input = $("<input/>");
		input.attr("id", id )
		input.addClass('form-control')
		input.attr("type", field.subtype || field.type)
		input.attr("name", field.name)
		input.attr("label", webComponent.unescapeHtml(field.label))
		input.attr("position", field.posicion)
		input.attr("placeholder", webComponent.unescapeHtml(field.placeholder))
		input.attr("maxlength", field.maxlength)
		input.focusout(	function(){
			if(field.required && $(this).val().length === 0 ){
				webComponent._addErrorClass(id,"required");
			}
			else if (field.regex && $(this).val().length > 0 && !webComponent._evaluateValueInRegex($(this).val(), field.regex) ){
				webComponent._addErrorClass(id,"invalid");
			}
			else{
				webComponent._removeErrorClass(id);
			}
		});
		div.append(input);
	}
	return input;
};

function getOrCreateDatePickerInput(div, id, field){
	var input = $("#" + id );
	if(input.length === 0){
		input = $("<input/>");
		input.attr("id", id )
		input.addClass('form-control ')
		input.attr("type", "text")
		input.attr("position", field.posicion)
		input.attr("name", field.name)
		input.attr("label", field.label)
		input.focusout(	function(){
			if(field.required && $(this).val().length === 0 ){
				webComponent._addErrorClass(id,"required");
			}
			else{
				webComponent._removeErrorClass(id);
			}
		});
		if(field.startdate){
			input.datepicker({changeYear: true,  yearRange: field.startdate.slice(0,4) + ':' + field.finaldate.slice(0,4)});
		}else{
			input.datepicker();
		}
		div.append(input);
	}
	return input;
};

function getOrCreateTextAreaInput(div, id, field){
	var input = $("#" + id );
	if(input.length === 0){
		input = $("<textarea/>");
		input.attr("id", id )
		input.addClass('form-control')
		input.attr("type", field.type)
		input.attr("name", field.name)
		input.attr("label", webComponent.unescapeHtml(field.label))
		input.attr("position", field.posicion)
		input.attr("placeholder", webComponent.unescapeHtml(field.placeholder))
		input.attr("maxlength", field.maxlength)
		input.focusout(	function(){
			if(field.required && $(this).val().length === 0 ){
				webComponent._addErrorClass(id,"required");
			}
			else if (field.regex && $(this).val().length > 0 && !webComponent._evaluateValueInRegex($(this).val(), field.regex) ){
				webComponent._addErrorClass(id,"invalid");
			}
			else{
				webComponent._removeErrorClass(id);
			}
		});
		div.append(input);
	}
	return input;
};

function getOrCreateCheckBoxGroupInput(div, id, field){
	var divCheck = $("<div/>").addClass("checkbox row");
	$.each( field.options , function(index, opt) {
		var contain = $('<div/>').addClass('col-md-12 clearfix');
		var newId = id+"-"+index;
		var maxToCheck = field.nseleccionados || 100;
		var hasClickedOrder = false;
		if(field.importancia === "Si") {
			hasClickedOrder = true;
		}
		var lab = $("<label/>").html(
			"<input id='"+ newId +"' "+
			"parentId='"+div.attr("id")+"' "+
			"type='checkbox' "+
			"label='"+ webComponent.unescapeHtml(field.label) + "' "+
			"position='" + field.posicion + "." + index + "' "+
			"onclick=\'webComponent.saveChecks(this, \""+ newId  +"\" , "+ maxToCheck +" )' "+
			"resp='"+ webComponent.unescapeHtml(opt.text) + "' "+
			"name='"+ field.name +"' "+
			"clickedOrder="+hasClickedOrder+" "+
			"value='"+ opt.value +"'>"+
			opt.text+
			(opt.text === 'Otro' ? "<input type='text' maxlength='100' class='form-control' id='camOtro-"+ newId +"'>": ""));

		if(field.importancia === "Si") {
			lab.append('<span style="margin-left:8px;"></span>');
		}

		lab.on("change", function(evt) {;
			if(lab.find(':input').is(':checked')) {
				var seleccionados = lab.parent().parent().parent().find("input:checked");
				if(seleccionados.length > 0) {
					lab.find('span').text(seleccionados.length);
				}
			}
			else {
				var aux = -1;
				for(var x = 0; x < field.options.length; x++) {
					if($(this).parent().text().indexOf(field.options[x].text) != -1) {
						field.options[x].order = x;                    
						aux = parseInt($(this).parent().find("span").text());
						$(this).parent().find("span").html("")
					}
				}
				if (aux > -1) {
					var prueba = $(this).parent().parent()
					prueba.children().each(function(){
						if ( $(this).find("span").text().trim() != "") {
							var index = parseInt($(this).find("span").text())
							if (aux < index){
								index--;
								$(this).find("span").text(index.toString())
							}
						}
					});
				}
			}
		});
		lab.appendTo(contain);
		contain.appendTo(divCheck);
		divCheck.appendTo(div);
	});			
};

function getOrCreateRadioGroupInput(div, id, field){
	$.each( field.options , function( index, opt ) {
		var divRadio = $("#" + id + index);
		if(divRadio.length === 0){
			divRadio = $('<div/>')
			divRadio.attr("id", id + index)
			divRadio.addClass("radio clearfix");
			var lab = $("<label/>").html("<input  type='radio' parentId='"+div.attr("id")+"'  position='"+ field.posicion   +"' label = '"+ webComponent.unescapeHtml(field.label) + "' name='"+ field.name +"' value='"+ opt.value +"'  >" + opt.text );
			lab.on("change", function(evt){
				var seleccionados = lab.parent().parent().find("input:checked");
				if(seleccionados.length > 0){
					div.removeClass( 'has-error' );
					$( '.help-block', div.attr("id")  ).slideUp().html( '' );
					$(this).parent().find("span").html("")
				}
			});
			lab.appendTo($(divRadio))
			divRadio.appendTo(div);
		}
	});
};

function addHelperBlock (div) {
	var helper = $('<span class="help-block"></span>');
	div.append(helper);
};

function addGlyphicon (input) {
	var helper = $('<span class="glyphicon glyphicon-calendar" aria-hidden="true" style="left: 630px;"></span>');
	input.append(helper);
};

function addToolTip(input, title, side){
	input.attr("data-toggle", "tooltip" );
	input.attr("data-placement", side );
	input.attr("title", webComponent.unescapeHtml(title));
	var helper = $('<span class="tooltip-element" tooltip="' +  webComponent.unescapeHtml(title) + '" style="display: inline-block;">?</span>');
	input.append(helper);
	return input;
};


function createNavBar(holder){

	var submitButtonData =  webComponent._modelValues.submitButton;
	var navbar = $("#navBarr")
	.addClass('form-group col-md-12')
	.css({'margin-right':'12px'})
	//.appendTo(holder);
	var next = $('<button/>')
	.addClass(submitButtonData.class)
	.text(webComponent.unescapeHtml(submitButtonData.label))
	.css({'margin-right':'12px'})
	.appendTo(navbar)
	.click(function(e) {
		var captcha = $("#g-recaptcha-response").val();

		if(webComponent._isValidForm() ){
			var responses = $.map(webComponent._getAllValues(), function(n,i){
				return JSON.parse('{"' + webComponent.unescapeHtml(n.label.replace(/[.,"]/g,' ')) + '" : "' + webComponent.unescapeHtml(n.response.replace(/[",]/g,' ')) + '"}');
			});

			var cap =  webComponent._modelValues['captcha'];
			if (cap ==='f'){
				captcha = true;
			}
			if (captcha){
				var payload = {};
				payload.id_tramite  = webComponent._modelValues['id_tramite'];
				payload.id_dependencia = webComponent._modelValues['id_dependencia'];
				payload.nombre  =  webComponent.unescapeHtml(webComponent._modelValues['nombre'].replace(/\./g,' '));
				payload.dependencia = webComponent.unescapeHtml(webComponent._modelValues['dependencia'].replace(/\./g,' ') );
				payload.respuestas = responses;

				$.ajax({
					url: submitButtonData.urlbutton,
					type: 'POST',
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(payload),
					success: function(response){
						webComponent.showMessage("Encuesta Guardada.", "success" );

					},
					error: function(e){
						webComponent.showMessage("Error de comunicación con el servidor.", "danger" );
					},
					complete: function(){
					}
				});

			}else {
				webComponent.showMessage("El captcha es obligatorio.", "warning" );
			}

		}else {
			webComponent.showMessage("Formulario Invalido.", "danger" );
		}

		e.preventDefault();

	});
};
/* Genera el captcha */
function createCaptcha(){
	var captcha= webComponent._modelValues['captcha'];

	if (captcha === 't'){
		//var navbar = getOrCreateDiv("id_captcha", 'form-group col-md-12')
		/*var html = $('<div id="captcha" class=" g-recaptcha" data-sitekey="6LfulAwTAAAAALtjRGZxBinREdNMITvETTXByiyh"></div>');
		html.appendTo(navbar);*/
		grecaptcha.render('div-id_captcha', {
			'sitekey' : '6LfulAwTAAAAALtjRGZxBinREdNMITvETTXByiyh'
		});
	}
};

},

    saveChecks: function(element, indexValidation, max){
    var seleccionados = $(element).parent().parent().parent().parent().find("input:checked");
    if ($(element).is(":checked")) {
        var respuesta = $(element).attr("resp")
        if (max != -1) {
            if (seleccionados.length > max) {
                warningMessage("No puedes seleccionar más de " + max + " opciones");
                $(element).prop('checked', false);
                return false;
            }
        }
        if (respuesta.trim() == "Otro") {
            if ($("#camOtro-" + indexValidation).val().trim() == "") {
                warningMessage("Debe describir la opción, antes de seleccionar");
                $(element).prop('checked', false);
                return false;
            }
            respuesta = $("#camOtro-" + indexValidation).val().trim()
        }
        webComponent.checked.push({id: $(element).attr("id"),  idField: $(element).parent().parent().parent().parent().attr("id"), name: $(element).attr("name")  ,  label: $(element).attr("label"), response: respuesta,  clickedOrder: $(element).attr("clickedOrder") });
    }
    else {
        for (i in webComponent.checked){
            if (webComponent.checked[i].idField === $(element).attr("id") ){
                webComponent.checked.splice(i, 1);
            }
        }
    }

    function warningMessage(message){
        webComponent._addErrorClassSimple ($(element).parent().parent().parent().parent(), message)
        setTimeout(function() {
            webComponent._removeErrorClassSimple($(element).parent().parent().parent().parent());
        }, 3000);
    };

    },

    _evaluateValueInRegex: function(value,regex) {
        var exp = new RegExp(b64_to_utf8( regex ));
        return  exp.test(value);
        function b64_to_utf8( str ) {
            return decodeURIComponent(escape(window.atob( str )));
        }
    },

    _addErrorClass : function (fieldId, failType){
    var failMessage;

    if(failType === "required") {
        failMessage = "Campo Requerido"
    }
    else {
        failMessage = "Campo invalido"
    }
    var htmlInputField = $( '#'+fieldId );
    webComponent._addErrorClassSimple(htmlInputField.parent(),failMessage);
    },

    _addErrorClassSimple : function (div, failMessage){
    $(div).addClass('has-error');
    $( '.help-block', div ).html( failMessage).slideDown();
    },

    _removeErrorClass : function (fieldId){
    var htmlInputField = $( '#'+fieldId );
    webComponent._removeErrorClassSimple(htmlInputField.parent());
    },
    _removeErrorClassSimple : function (div){
    div.removeClass( 'has-error' );
    $( '.help-block', div  ).slideUp().html( '' );
    },

    unescapeHtml: function(escapedStr) {
    var div = document.createElement('div');
    div.innerHTML = escapedStr;
    var child = div.childNodes[0];
    return child ? child.nodeValue : '';
    }

};

$gmx(document).ready(function(){
	$.datepicker.regional.es = {
		closeText: 'Cerrar',
		prevText: 'Ant',
		nextText: 'Sig',
		currentText: 'Hoy',
		monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
		monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
		dayNames: ['Domingo','Lunes','Martes','Mi&eacute;rcoles','Jueves','Viernes','S&aacute;bado'],
		dayNamesShort: ['Dom','Lun','Mar','Mi&eacute;','Juv','Vie','S&aacute;b'],
		dayNamesMin: ['Dom','Lun','Mar','Mie','Jue','Vie','S&aacute;b'],
		weekHeader: 'Sm',
		dateFormat: 'dd/mm/yy',
		firstDay: 1,
		isRTL: false,
		showMonthAfterYear: false,
		yearSuffix: ''
	};
	$.datepicker.setDefaults($.datepicker.regional.es);

	$('[data-toggle="tooltip"]').tooltip();

});

