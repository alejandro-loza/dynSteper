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

		$('#' + webComponent.canvas +' input[type="text"], textarea').each(function() {
			if($(this).attr("id").substr(0, 7) != "camOtro"){
				inputValues.push({ idField: $(this).attr("id"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response: $(this).val() });
			}
		});

		$('#' + webComponent.canvas +' input[type="radio"]:checked ').each(function() {
			//if($(this).val().length > 0){
				inputValues.push({ idField: $(this).attr("parentId"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response: $(this).val() });
			//}
		});

		$('#' + webComponent.canvas +' input[type="radio"]').not(':checked').each(function() {
			if($(this).attr("parentId")){
				var div = $(this).attr("parentId");
				var seleccionados =  $("#"+div).find(":checked");
				if(seleccionados.length === 0 && notChecked.indexOf($(this).attr("label")) === -1){
					notChecked.push($(this).attr("label"));
					inputValues.push({ idField: $(this).attr("parentId"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response:'' });
				}
			}
		});

		$('#' + webComponent.canvas +' input[type="checkbox"]').each(function() {
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
					inputValues.push({ idField: $(this).attr("parentId"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response: response+"-"+order, order:order });
				}else {	
					inputValues.push({ idField: $(this).attr("parentId"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response: response, order:order });
				}
			});

		$('#' + webComponent.canvas +'  option:selected').each(function() {
			//if ($(this).val() != ''){
				inputValues.push({  idField: $(this).parent().attr("id"), name: $(this).attr("data-name") ,  label: $(this).attr("data-label"), response: $(this).val() });
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

		return inputValues;
	},

	_isValidForm: function(){
		return isFullRequired() && isFullRegexValid();

		function isFullRequired(){
			webComponent.errorFields = [];
			$('.required select').each(function(i, requiredField){
				if($(requiredField).val() == ''){
					webComponent.errorFields.push(requiredField);
					webComponent._addErrorClassSimple($("#div-" + $(requiredField).attr('id') ), "Campo Requerido");
				}
			});
			$('.required   input[type="text"], textarea ').each(function(i, requiredField){
				if($(requiredField).val() == ''){
					webComponent.errorFields.push($(requiredField));
					webComponent._addErrorClassSimple($("#div-" + $(requiredField).attr('id') ), "Campo Requerido");	
				}
			});

			$('.required   input[type="checkbox"]').each(function(i, requiredField){
				var seleccionados = $(requiredField).parent().parent().parent().parent().find("input:checked");
				if (seleccionados.length === 0 ) {
					webComponent.errorFields.push($(requiredField));
					webComponent._addErrorClassSimple($("#" + $(requiredField).parent().parent().parent().parent().attr('id') ), "Campo Requerido");
				}
			});

			$('.required   input[type="radio"]').each(function(i, requiredField){
				var seleccionados = $(requiredField).parent().parent().parent().parent().find("input:checked");
				if (seleccionados.length === 0 ) {
					webComponent.errorFields.push($(requiredField));
					webComponent._addErrorClassSimple($("#" + $(requiredField).parent().parent().parent().attr('id') ), "Campo Requerido");
				}
			});



			if(webComponent.errorFields.length !== 0){
				$.each(webComponent.errorFields, function(index,field){
					// alert(field.attr("name"));
					if($(field).attr("parentId")){
						var divId = $(field).attr("parentId");
						webComponent._addErrorClassSimple($("#"+divId), "Campo Requerido");
					}else{
						webComponent._addErrorClass(field.id);
					}
				})
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
				$.each(webComponent.errorFields, function(index,field){
					webComponent._addErrorClass(field.id);
				})
				return false;
			}
			else{
				return true;
			}
		};
	},

	main: function (url) {
		var controller = this;
		$.ajax({
			url: url,
			'async': false,
			type: 'GET',
			dataType: 'json',
			contentType: 'application/json; charset=UTF-8;',
			success: function(entityFields){
				controller._modelValues = entityFields; 
				controller._formValues = entityFields.fields ;
			},
			error: function(e){
				alert("Error: Encuesta no encontrada");
				if(e.status === 404){
					controller.error = e.status;
				}
			},
			complete: function(){
			}

		});
		return controller._formValues;
	},

	_render: function (container){
		$("#" + container).html("");
		webComponent.canvas = container;
		var controller = this;
		$.each( webComponent._formValues, function( index, field ) {
			
			validateFieldsClass(field);
			switch(field.type) {
				case "text":
				createTextInput(field, index);
				break;
				case "textarea":
				createTextAreaInput(field, index);
				break;
				case "radio-group":
				createRadioGroup(field,index);
				break;
				case "checkbox-group":
				createCheckBoxGroup(field,index);		
				break;
				case "select":
				createSelect(field,index);		
				break;
				case "date":
				createDatePicker(field,index);	
				break;			
				case "header":
				createHeader(field,index);
				break;
				default: 
				//alert('Default case');
			}
		});

		if(webComponent.searchType !== "acta"){
			createCaptcha($("#" + container));
			createNavBar($("#" + container));
		}
		$("#PuzzleCaptcha").PuzzleCAPTCHA({
			rows:3,
			targetInput:'.validationValue',
			targetVal:'true',
			targetButton:'.btnSubmit'
		});
		function createHeader(field, index){
			var div = getOrCreateDiv("id" + index, field.class);
			getOrCreateHeader(div,field);
		};

		function createTextInput(field, index){
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv(id, field.class);
			getOrCreateLabel(div,id, field);
			getOrCreateTextInput(div,id, field);
			addHelperBlock(div);
		};
		function createTextAreaInput(field, index){
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv(id, field.class);
			getOrCreateLabel(div,id, field);
			getOrCreateTextAreaInput(div,id, field);
			addHelperBlock(div);
		};
		function createDatePicker (field, index) {
			var id = field.name + index;

			field["id"] = id;
			var div = getOrCreateDiv(id, field.class + ' datepicker-group');
			getOrCreateLabel(div,id, field);
			getOrCreateDatePickerInput(div,id, field);

			addGlyphicon(div);
			addHelperBlock(div);		
		};
		function createRadioGroup(field, index){
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv(id, field.class);
			getOrCreateLabel(div,id, field);
			getOrCreateRadioGroupInput(div, id,  field);
			addHelperBlock(div);
		};
		function createCheckBoxGroup(field,index){
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv(id, field.class);
			getOrCreateLabel(div,id, field);
			getOrCreateCheckBoxGroupInput(div, id,  field);
			addHelperBlock(div);
		};
		function createSelect(field, index){
			//if(webComponent.selected.length === 0){
				webComponent.selected.push({"options": field.options, "selected":''});
			//}
			var length = webComponent.selected.length;			
			if(webComponent.lastCount > length ){	
				for(var i=length -1; i <= webComponent.lastCount; i++){
					$("#div-" + field.name + "-"+i).remove();
				}
				webComponent.lastCount = length;
			}

		//	$.each(webComponent.selected, function(f,selection){
				var id = field.name //+ "-" + f;
				field["id"] = id;
				var div = getOrCreateDiv(id, field.class);
				getOrCreateLabel(div,id, field);
				var select =getOrCreateSelect(div, id, field);
				populateSelect(select, field);
				addHelperBlock(div);
	//		});
};

function getOrCreateDiv(id, clazz){
	var div = $("#div-" + id );
	if(div.length === 0){
		div = $('<div/>')
		div.attr("id", "div-" + id)
		div.addClass(clazz);
		$("#" + webComponent.canvas).append(div);
	}
	return div;
};

function getOrCreateLabel(div, id, field){
	var labelObject = $("#label-" + id );
	if(labelObject.length === 0){
		labelObject = $("<label class='control-label' id='label-"+ id +"' for = "+ id + " >"+ webComponent.unescapeHtml(field.label) + "</label>");
		div.append(labelObject);
	}
	if(field.description){
		addToolTip(labelObject, field.description, "top");
	}
	if( field.textoapoyo != undefined ) {
		var p = $('<p/>')
		.text(field.textoapoyo)
		.appendTo(div);
	}
	return labelObject;
};

function getOrCreateHeader(div, field){
	var labelObject = $("#header");
	if(labelObject.length === 0){
		labelObject = $("<"+field.subtype+" class='"+ field.class +"' >"+ field.label + "</"+field.subtype+">");
		div.append(labelObject);
	}
	if(field.description){
		addToolTip(labelObject, field.description, "top");
	}
	return labelObject;
};

function getOrCreateSelect (div , id, field, idx){
		        // Determine the id of the select box
		        id = "select-" + id + "_" + idx;
		        // Try get the select box if it exists
		        var select = $("#" + id ); 
		        if(select.length === 0){
		          // Create select box
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
/*		          select.on("change", { controller: controller, index: idx }, function(evt){
			            // Restore the state
			            var controller = evt.data.controller;
			            var index = evt.data.index;
			            var selected = webComponent.selected;

			            // The selected field
			            var selectedFieldName = $(this).val();
			            // Update the selected
			            selected = selected.slice(0, index + 1);
			            var selectedOptionModel = setModelNameFromFieldName(selectedFieldName, idx);
			            if(selectedOptionModel){		           
			            	if (selectedOptionModel.options){
			            		controller.lastCount = controller.lastCount + 1;
			            		selected.push({"options":selectedOptionModel.options,"selected":''} );
			            	}
			            }
			            webComponent.selected = selected;
			            createSelect(field);
			        });*/

		            // Add it to the component container
		            div.append(select);
		        }
		        return select;
		    };
		    // Add the options to the select box
		    function populateSelect(select, field){
		    	var label = webComponent.unescapeHtml(field.label);
		    	var name = webComponent.unescapeHtml(field.name);
		    	select.html("");
		    	select.append($("<option />").val('').attr("data-name", name).attr("data-label", label).text('').prop('selected', true));
		    	var options =  field["options"]; 
			 	 // Current selected
			 	 //var currentSelectedIndex = selection["selected"];
		        // Add the options to the select box
		        for (opt  in options){
		        	select.append($("<option />").val(options[opt].value).attr("data-name", name).attr("data-label", label).text(options[opt].text));
		        }

		   /*     $.each( options , function( index, opt ) {	 

		        	// if(index === currentSelectedIndex){	        		
		        	// 	select.append($("<option />").val(opt.value).attr("data-name", name).attr("data-label", label).text(opt.text).prop('selected', true));
		        	// }
		        	// else{
		        		alert("opt" +  JSON.stringify(opt));
		        		select.append($("<option />").val(opt.value).attr("data-name", name).attr("data-label", label).text(opt.text));
		        	//}
		        });*/
};

function setModelNameFromFieldName(fieldName,selectedIndex){

	var selectOptions = webComponent.selected[selectedIndex]["options"];
	if(fieldName){
		var optionModel =  $.grep(selectOptions, function(e){ return e.value === fieldName; });          
		webComponent.selected[selectedIndex]["selected"] = selectOptions.indexOf(optionModel[0]);
		return optionModel[0];
	}else{
		webComponent.selected[selectedIndex]["selected"] = -1;
	}
};

function validateFieldsClass(item){
	var re = /form-control/gi;
	item.class = item.class.replace(re, "").split(" ").join(' ');
	item.placeholder = item.placeholder || "";
	if(item.required){
		item.class = item.class.concat(" required");
	}
/*			if(item.options){
				item.options = $.parseJSON(item.options);
			}*/
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
				input.attr("name", field.name)
				input.attr("label", field.label)
				//input.attr("placeholder", webComponent.unescapeHtml(field.placeholder))
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

		function getOrCreateRadioGroupInput(div, id, field){
			$.each( field.options , function( index, opt ) {
				var divRadio = $("#" + id + index);
				if(divRadio.length === 0){
					divRadio = $('<div/>')
					divRadio.attr("id", id + index)
					divRadio.addClass("radio row clearfix");
					var lab = $("<label/>").html("<input  type='radio' parentId='"+div.attr("id")+"' label = '"+ webComponent.unescapeHtml(field.label) + "' name='"+ field.name +"' value='"+ opt.value +"'  >" + opt.text );
					lab.on("change", function(evt){
					var seleccionados = lab.parent().parent().find("input:checked");  
					if(seleccionados.length > 0){
						lab.parent().parent().parent().removeClass( 'has-error' );
						$( '.help-block', lab.parent().parent().parent()  ).slideUp().html( '' );
					}
				});
					lab.appendTo($(divRadio))
					divRadio.appendTo(div);
				}
			});			
		};

		function getOrCreateCheckBoxGroupInput(div, id, field){
			var divCheck = $("<div/>").addClass("checkbox row");
			$.each( field.options , function( index, opt ) {
				var contain = $('<div/>').addClass('col-md-12 clearfix');
				var newId = id + "-" + index ;
				var maxToCheck = field.nseleccionados || 100;
				var hasClickedOrder = false;
				if(field.importancia === "Si"){
					hasClickedOrder = true;
				}	
				var lab = $("<label/>").html("<input id='"+ newId +"' parentId='"+div.attr("id")+"' type='checkbox' label = '"+ webComponent.unescapeHtml(field.label) + "' onclick=\'webComponent.saveChecks(this, \""+ newId  +"\" , "+ maxToCheck +" )' resp = '"+ webComponent.unescapeHtml(opt.text) + "' name='"+ field.name +"' clickedOrder= " + hasClickedOrder + " value='"+ opt.value +"'  >" + opt.text +
					((opt.text=='Otro')? "<input type='text' maxlength='100' class='form-control' id='camOtro-"+ newId +"'>": ""));
				lab.on("change", function(evt){
					var seleccionados = lab.parent().parent().parent().find("input:checked");  
					if(seleccionados.length > 0){
						lab.parent().parent().parent().removeClass( 'has-error' );
						$( '.help-block', lab.parent().parent().parent()  ).slideUp().html( '' );
					}
				});
				lab.appendTo(contain)
				contain.appendTo(divCheck)
				divCheck.appendTo(div)
			});
};

function addHelperBlock (div) {
	var helper = $('<span class="help-block"></span>');
	div.append(helper);
};

function addGlyphicon (input) {
	var helper = $('<span class="glyphicon glyphicon-calendar" aria-hidden="true"></span>');
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

	var navbar = getOrCreateDiv("id", 'form-group col-md-12')
	.addClass('form-group col-md-12')
	.css({'margin-right':'12px'})
	.appendTo(holder);
	var next = $('<button/>')
	.addClass('btn btn-primary btn-lg')
	.text('Enviar')
	.css({'margin-right':'12px'})
	.appendTo(navbar)
	.click(function(e) {
		var captcha = $('.validationValue').val();

		if(webComponent._isValidForm() ){
			var responses = $.map(webComponent._getAllValues(), function(n,i){
				return JSON.parse('{"' + webComponent.unescapeHtml(n.label.replace(/\./g,' ')) + '" : "' + webComponent.unescapeHtml(n.response.replace(/\./g,' ')) + '"}');				
				
			});

			var cap =  webComponent._modelValues['captcha'];
			if (cap ==='f'){
				captcha = true;
			}
			if (captcha){

				var responses = $.map(webComponent._getAllValues(), function(n,i){
					return JSON.parse('{"' + n.label + '" : "' + n.response + '"}');
				});

				var payload = {};
				payload.id_tramite  = webComponent._modelValues['id_tramite'];
				payload.id_dependencia = webComponent._modelValues['id_dependencia'];
				payload.nombre  =  webComponent.unescapeHtml(webComponent._modelValues['nombre'].replace(/\./g,' '));
				payload.dependencia = webComponent._modelValues['dependencia'];
				payload.respuestas = responses;

				$.ajax({
					url: 'http://10.15.9.2:3000/gobmx/resultados',
					type: 'POST',
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(payload),
					success: function(response){
						alert("Encuesta Guardada.");
					},
					error: function(e){
						alert("Error: " + JSON.stringify(e));
					},
					complete: function(){
					}
				});

			}else {
				alert ("El captcha es obligatorio");
			}

		}else {
			alert ("Formulario Invalido");
		}

		e.preventDefault();

	});
};
/* Genera el captcha */
function createCaptcha(holder){
	var captcha= webComponent._modelValues['captcha'];

	if (captcha === 't'){
		var navbar = getOrCreateDiv("id_captcha", 'form-group col-md-12')

		var html = $('<input type="hidden" name="" class="validationValue"><br><br>	<label>Eres un Humano? &nbsp;</label><label class="respuesta_captcha" > </label>	<div id="PuzzleCaptcha"></div>');
		html.appendTo(navbar);

	}

};

},

saveChecks: function(element, indexValidation, max){
	var seleccionados = $(element).parent().parent().parent().parent().find("input:checked");
	if ($(element).is(":checked")) {
		var respuesta = $(element).attr("resp")
		if (max != -1) {
			if (seleccionados.length > max) {
				alert("No puedes seleccionar más de " + max + " opciones");
				$(element).prop('checked', false);
				return false;
			}
		}

		if (respuesta.trim() == "Otro") {
			if ($("#camOtro-" + indexValidation).val().trim() == "") {
				alert("Debe describir la opción, antes de seleccionar")
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
	htmlInputField.parent().removeClass( 'has-error' );
	$( '.help-block', htmlInputField.parent()  ).slideUp().html( '' );
},

unescapeHtml: function(escapedStr) {
	var div = document.createElement('div');
	div.innerHTML = escapedStr;
	var child = div.childNodes[0];
	return child ? child.nodeValue : '';
},


}


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

