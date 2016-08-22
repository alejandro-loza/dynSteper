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

	_getAllValues:function() {
		var inputValues = [];
		$('#' + webComponent.canvas +' input[type="text" ] , textarea ').each(function() {
			inputValues.push({ idField: $(this).attr("id"), name: $(this).attr("name")  ,  label: $(this).attr("label"), response: $(this).val() });
		});

		$('#' + webComponent.canvas +' input:checked').each(function() {			
			inputValues.push({ idField: $(this).attr("id"), name: $(this).attr("name")  , label: $(this).attr("label"), response: $(this).val() });			
		});

		$('#' + webComponent.canvas +'  option:selected').each(function() {
			if ($(this).val() != ''){
				inputValues.push({ idField: $(this).parent().attr("id"), name: $(this).attr("data-name") ,  label: $(this).attr("data-label"), response: $(this).val() });
			}
		});
		return inputValues;
	},

	_isValidForm: function(){

		return isFullRequired() && isFullRegexValid();

		function isFullRequired(){
			webComponent.errorFields = [];
			$('.required select').attr('required',true).filter(':visible:first').each(function(i, requiredField){
				if($(requiredField).val() == ''){
					webComponent.errorFields.push(requiredField);
				}
			});
			$('.required input').attr('required',true).filter(':visible:first').each(function(i, requiredField){
				if($(requiredField).val() == ''){
					webComponent.errorFields.push(requiredField);
				}
			});

			if(webComponent.errorFields.length !== 0){
				$.each(webComponent.errorFields, function(index,field){
					webComponent._addErrorClass(field.id);
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
				default: 
				//alert('Default case');
			}
		});

		if(webComponent.searchType === "encuesta"){
			createNavBar($("#" + container));
		}

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
			if(webComponent.selected.length === 0){
				webComponent.selected.push({"options": field.options, "selected":''});
			}
			var length = webComponent.selected.length;			
			if(webComponent.lastCount > length ){	
				for(var i=length -1; i <= webComponent.lastCount; i++){
					$("#div-" + field.name + "-"+i).remove();
				}
				webComponent.lastCount = length;
			}
			$.each(webComponent.selected, function(f,selection){
				var id = field.name + "-" + f;
				field["id"] = id;
				var div = getOrCreateDiv(id, field.class);
				getOrCreateLabel(div,id, field);
				var select =getOrCreateSelect(div, id, field, f);
				populateSelect(select,f, selection, field);
				addHelperBlock(div);
			});
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
				labelObject = $("<label class='control-label' id='label-"+ id +"' for = "+ id + " >"+ field.label + "</label>");
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
		          select.on("change", { controller: controller, index: idx }, function(evt){
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
			        });

		            // Add it to the component container
		            div.append(select);
		        }
		        return select;
		    };
		    // Add the options to the select box
		    function populateSelect(select, index, selection, field){
		    	select.html("");
		    	select.append($("<option value='' >------</option>"));
		    	var options =  selection["options"] 
			 	 // Current selected
			 	 var currentSelectedIndex = selection["selected"];
		        // Add the options to the select box
		        $.each( options , function( index, opt ) {	        	
		        	if(index === currentSelectedIndex){	        		
		        		select.append($("<option />").val(opt.value).attr("data-name", field.name).attr("data-label", field.label).text(opt.text).prop('selected', true));
		        	}
		        	else{
		        		select.append($("<option />").val(opt.value).attr("data-name", field.name).attr("data-label", field.label).text(opt.text));
		        	}
		        });
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
			//item.placeholder = unescapeHtml(item.placeholder);
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
				input.attr("type", field.subtype)
				input.attr("name", field.name)
				input.attr("label", unescapeHtml(field.label))
				input.attr("placeholder", unescapeHtml(field.placeholder))
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
				input.attr("placeholder", unescapeHtml(field.placeholder))
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
				input.attr("label", unescapeHtml(field.label))
				input.attr("placeholder", unescapeHtml(field.placeholder))
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
					var lab = $("<label/>").html("<input  type='radio' label = '"+ unescapeHtml(field.label) + "' name='"+ field.name +"' value='"+ opt.value +"'  >" + opt.text );
					lab.appendTo($(divRadio))
					divRadio.appendTo(div);
				}
			});			
		};

		function getOrCreateCheckBoxGroupInput(div, id, field){
			$.each( field.options , function( index, opt ) {
				var divCheck = $("<div/>").addClass("checkbox row");
				var lab = $("<label/>").html("<input  type='checkbox' label = '"+ unescapeHtml(field.label) + "' name='"+ field.name +"' value='"+ opt.value +"'  >" + opt.text );
				lab.appendTo($(divCheck))
				divCheck.appendTo(div);
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
            input.attr("title", unescapeHtml(title));
            var helper = $('<span class="tooltip-element" tooltip="' + title + '" style="display: inline-block;">?</span>');
            input.append(helper);
            return input;
		};

		function unescapeHtml(escapedStr) {
			var div = document.createElement('div');
			div.innerHTML = escapedStr;
			var child = div.childNodes[0];
			return child ? child.nodeValue : '';
		};

		function createNavBar(holder){
			var navbar = getOrCreateDiv("id", 'form-group col-md-12')
			.addClass('form-group col-md-12')
			.css({'margin-right':'12px'})
			.appendTo(holder);
			// var back = $('<button/>')
			// .addClass('btn btn-default btn-lg')
			// .text('Regresar')
			// .css({'margin-right':'12px'})
			// .appendTo(navbar)
			// .click(function(e) {
			// 	e.preventDefault();
			// 	hotResponse.response = [];
			// 	generalNav();
			// 	$('html,body').animate({
			// 		scrollTop: $('#generalText').offset().top - 100
			// 	}, 500);          
			// });
			var next = $('<button/>')
			.addClass('btn btn-primary btn-lg')
			.text('Enviar')
			      //.attr('disabled', true)
			      .css({'margin-right':'12px'})
			      .appendTo(navbar)
			      .click(function(e) {
			      	if(webComponent._isValidForm() ){
			      		var responses = $.map(webComponent._getAllValues(), function(n,i){
			      			return JSON.parse('{"' + n.label + '" : "' + n.response + '"}');
			      		});
			      		var payload = {};
			      		payload.id_tramite  = webComponent._modelValues['id_tramite'];
			      		payload.id_dependencia = webComponent._modelValues['id_dependencia'];
			      		payload.nombre  = webComponent._modelValues['nombre'];
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

			      			},
			      			complete: function(){
			      			}
			      		});

			      	}
			      	e.preventDefault();


			 /*     	$('html,body').animate({
			      		scrollTop: $('#generalText').offset().top - 100
			      	}, 500);*/
});
			// var stop = $('<button/>')
		 //      .addClass('btn btn-primary btn-lg')        
		 //      .text('Finalizar')
		 //      .appendTo(navbar);
		 //      $(next).click(function() {
		 //      	if (!notOk()) {
		 //      		alert("Debe llenar todos los campos")
		 //      		return false;
		 //      	}
		 //      	/*idGeneral++;
		 //      	saveData();
		 //      	if ( idGeneral == 2 || idGeneral == 6 || idGeneral == 10) { generalNav(); }
		 //      	else { begin(); }*/
		 //      });
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
	if(failType === "required") {failMessage = "Campo Requerido"}
		else {failMessage = "Campo invalido"}
			var htmlInputField = $( '#'+fieldId );	
		htmlInputField.parent().addClass( 'has-error' );
		$( '.help-block', htmlInputField.parent() ).html( failMessage).slideDown();
	},

	_removeErrorClass : function (fieldId){	
		var htmlInputField = $( '#'+fieldId );	
		htmlInputField.parent().removeClass( 'has-error' );
		$( '.help-block', htmlInputField.parent()  ).slideUp().html( '' );
	}

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

