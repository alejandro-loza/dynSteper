webComponent = {
	_formValues : [],
	errorFields: [],
	invalidFields : [],
    canvas:'',

    _getAllValues:function() {
		var inputValues = [];
		$('#' + webComponent.canvas +' input').each(function() {
			inputValues.push({ idField: $(this).attr("id"), name: $(this).attr("name")  , response: $(this).val() });
		})
		return inputValues;
	},

	_isValidForm: function(){

		return isFullRequired() && isFullRegexValid();

		function isFullRequired(){
			webComponent.errorFields = [];
			var requiredFields  = $.grep(webComponent._formValues, function(e){ return e.required === true; }); 
			$.each( requiredFields , function( index, field ) {
				var search = $.grep(webComponent._getAllValues(), function(e){ return e.name === field.name; });
				if(search.length === 0){
					webComponent.errorFields.push(field);
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

	main: function (entidad, tipoPago) {
		var controller = this;
		$.ajax({
			url: 'http://10.15.3.31:3000/vun/actas_nacimiento/findOne?filter={"where":{"id_estado":"'+entidad+'","id_tipo_pago":'+ tipoPago +'}}',
			//url:'http://localhost:1337/options/1',
			type: 'GET',
			dataType: 'json',
			contentType: 'application/json; charset=UTF-8;',
		}).done(function(entityFields) {
			if(entityFields.PagoEnLinea){
				controller._formValues = entityFields.PagoEnLinea;
			}
			else if (entityFields.PagoReferenciado){
				controller._formValues = entityFields.PagoReferenciado ;
			}
			else{
				alert("No existen campos")
			}
			//render( controller._formValues );
		})
		.fail(function(e) {
			alert(JSON.stringify(e));
		});
	},

	_render: function (container){
        webComponent.canvas = container;
		$.each( webComponent._formValues, function( index, field ) {
			validateFieldsClass(field);
			switch(field.type) {
				case "text":
				var id = field.name + index;
				field["id"] = id;
				var div = getOrCreateDiv(id, field.class);
				getOrCreateLabel(div,id, field.label);
				getOrCreateTextInput(div,id, field);
				addHelperBlock(div);
				break;
				default: 
				alert('Default case');
			}
		});


		function getOrCreateDiv(id, clazz){
			var div = $("#" + id + "div");
			if(div.length === 0){
				div = $('<div/>')
				div.attr("id", id + "div")
				div.addClass(clazz);
				$("#" + webComponent.canvas).append(div);
			}
			return div;
		};

		function getOrCreateLabel(div, id, label){
			var labelObject = $("#" + id + "_label");
			if(labelObject.length === 0){
				labelObject = $("<label class='control-label' id='" + id + "_label' for = "+ id + '_input' +" >"+ label + "</label>");
				div.append(labelObject);
			}
			return label;
		};

		function getOrCreateTextInput(div, id, field){
			var input = $("#" + id );
			if(input.length === 0){
				input = $("<input/>");
				input.attr("id", id )
				input.addClass('form-control')
				input.attr("type", field.subtype)
				input.attr("name", field.name)
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
						//webComponent.responseFields.push({ idField: id, name: field.name, response: $(this).val() })
					}				        
				});
				div.append(input);
			}
			return input;
		};

		function addHelperBlock (div) {
			var helper = $('<span class="help-block"></span>');
			div.append(helper);
		};

		function validateFieldsClass(item){

			var re = /form-control/gi;
			item.class = item.class.replace(re, "").split(" ").join(' ');
			item.placeholder = item.placeholder || "";
			//item.placeholder = unescapeHtml(item.placeholder);
			if(item.required){
				item.class = item.class.concat(" required");
			}
			return item;
		};

		function unescapeHtml(escapedStr) {
			var div = document.createElement('div');
			div.innerHTML = escapedStr;
			var child = div.childNodes[0];
			return child ? child.nodeValue : '';
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