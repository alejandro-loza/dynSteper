webComponent = {
	formValues : [],	
	responseFields: [],
	errorFields: [],

	_isValidForm: function(){
       isFullRequired();
  

		function isFullRequired(){
			var requiredFields ;
			requiredFields = $.grep(webComponent.formValues, function(e){ return e.required === true; }); 
        	$.each( requiredFields , function( index, field ) {
				var search = $.grep(webComponent.responseFields, function(e){ return e.name === field.name; });
				if(search.length === 0){
					webComponent.errorFields.push(field);
				}
				else{
					return true;	
				}
			});
		};		
	},

	main: function (entidad, tipoPago) {
		var controller = this;
		$.ajax({
			//url: 'http://10.15.3.31:3000/vun/actas_nacimiento/findOne?filter={"where":{"id_estado":"'+entidad+'","id_tipo_pago":'+ tipoPago +'}}',
			url:'http://localhost:1337/options/1',
			type: 'GET',
			dataType: 'json',
			contentType: 'application/json; charset=UTF-8;',
		}).done(function(entityFields) {
			if(entityFields.PagoEnLinea){
				controller.formValues = entityFields.PagoEnLinea; 
			}
			else if (entityFields.PagoReferenciado){
				controller.formValues = entityFields.PagoReferenciado ;
			}
			else{
				alert("No existen campos")
			}
			render( controller.formValues );
		})
		.fail(function(e) {
			alert(JSON.stringify(e));
		});

		function render(entityFields, canvas){
			
			$.each( entityFields, function( index, field ) {
				validateFieldsClass(field);
				switch(field.type) {					
					case "text":
						var id = field.name + index;
						var div = getOrCreateDiv(id, field.class);
						getOrCreateLabel(div,id, field.label);
						getOrCreateTextInput(div,id, field);
						addHelperBlock(div);
						break;
					default: 
						alert('Default case');
				}
			});
		};

		function getOrCreateDiv(id, clazz){
			var div = $("#" + id + "div");
			if(div.length === 0){
				div = $('<div/>')
				div.attr("id", id + "div")
				div.addClass(clazz);
				$("#container").append(div);
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
				input.attr("placeholder", unescapeHtml(field.placeholder))
				input.attr("maxlength", field.maxlength) 
				input.focusout(
					function(){
						if(field.required && $(this).val().length === 0 ){
							alert("requerido " + field.name);
							addErrorClass(id);
						}
						else if (field.regex && webComponent.evaluateValueInRegex($(this).val(), field.regex) ){
							alert("regex no valido");
						}
						else{
							webComponent.isValidForm = true;
							controller.responseFields.push({ idField: id, name: field.name, response: $(this).val() })
						}				        
					}
				);
				div.append(input);
			}
			return input;
		};

		function addHelperBlock (div) {
			var helper = $('<span class="help-block"></span>');
			div.append(helper);
		};

		function addErrorClass(fieldId){
			var htmlInputField = $( '#'+fieldId );
			htmlInputField.parent().addClass( 'has-error' );
            $( '.help-block', htmlInputField.parent() ).html( "Verifique este campo" ).slideDown();
		};	


		function validateFieldsClass(item){
			var re = /form-control/gi;
			item.class = item.class.replace(re, "").split(" ").join(' ');
			item.placeholder = item.placeholder || "";
			//item.placeholder = unescapeHtml(item.placeholder);
			if(item.required){
				item.class = item.class.concat(" required");
			}
		};

		function unescapeHtml(escapedStr) {
			var div = document.createElement('div');
			div.innerHTML = escapedStr;
			var child = div.childNodes[0];
			return child ? child.nodeValue : '';
		};

	},

	evaluateValueInRegex: function(value,regex) {
		var exp = new RegExp(b64_to_utf8( regex ));
		return  exp.test(value);
		function b64_to_utf8( str ) {
			return decodeURIComponent(escape(window.atob( str )));
		}
	}


}