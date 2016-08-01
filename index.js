webComponent = {
	_formValues : [],
	errorFields: [],
	invalidFields : [],
	canvas:'',
	error:'',
	selected: [],

	_getAllValues:function() {
		var inputValues = [];
		$('#' + webComponent.canvas +' input[type="text"]').each(function() {
			inputValues.push({ idField: $(this).attr("id"), name: $(this).attr("name")  , response: $(this).val() });
		})
		$('#' + webComponent.canvas +' input:checked').each(function() {
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

	main: function (url) {
		var controller = this;
		$.ajax({
			url:url,
			'async': false,
			type: 'GET',
			dataType: 'json',
			contentType: 'application/json; charset=UTF-8;',
			success: function(fields){
				controller._formValues = fields.fields ;				
			},
			error: function(e){
				if(e.status === 404){
					webComponent.error = e.status;
				}
			},
			complete: function(){
			}

		});
		return controller._formValues;
	},

	_render: function (container){
		webComponent.canvas = container;
		var controller = this;
		$.each( webComponent._formValues, function( index, field ) {
			validateFieldsClass(field);
			switch(field.type) {
				case "text":
				createTextInput(field, index);
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
				default: 
				alert('Default case');
			}
		});

		function createTextInput(field, index){
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv(id, field.class);
			getOrCreateLabel(div,id, field.label);
			getOrCreateTextInput(div,id, field);
			addHelperBlock(div);
		};
		function createRadioGroup(field, index){
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv(id, field.class);
			getOrCreateLabel(div,id, field.label);
			getOrCreateRadioGroupInput(div, id,  field);
			addHelperBlock(div);
		};
		function createCheckBoxGroup(field,index){
			var id = field.name + index;
			field["id"] = id;
			var div = getOrCreateDiv(id, field.class);
			getOrCreateLabel(div,id, field.label);
			getOrCreateCheckBoxGroupInput(div, id,  field);
			addHelperBlock(div);
		};
		function createSelect(field, index){
			var length = webComponent.selected.length;
			if(length === 0){
				webComponent.selected.push({"options": field.options, "selected":''});
			}
			for(var f = 1; f <= webComponent.selected.length; f++){
				var id = field.name + index;
				field["id"] = id;
				var div = getOrCreateDiv(id, field.class);
				getOrCreateLabel(div,id, field.label);
		        var select =getOrCreateSelect(div, id, field, f);
		        populateSelect(select,f, field);
            }
		};

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

		function getOrCreateSelect(div, id, field, index){
	        // Try get the select box if it exists
	        var select = $("#" + id ); 
	        if(select.length === 0){
	          // Create select box
	        	select = $("<select class='form-control' id='" + id + "' ></select>");

	          // Action to take if select is changed. State is made available through evt.data
	        	select.on("change", { controller: controller, index: index }, function(evt){
	            // Restore the state
		            var controller = evt.data.controller;
		            var index = evt.data.index;
		            var selected = webComponent.selected;
		            // The selected field
		            var selectedFieldName = $(this).val();
		            // Update the selected
		            selected = selected.slice(0, index );
		            var selectedOptionModel = setModelNameFromFieldName(selectedFieldName, index -1);
		            alert("selectedOptionModel" + JSON.stringify(selectedOptionModel));
		            if(selectedOptionModel){
		            	if (selectedOptionModel.options){
		            		controller.lastCount = controller.lastCount + 1;
		            		selected.push({"options":selectedOptionModel.options,"selected":''} );
		            	}
		            }
	                //controller.set("selected", selected);
	                webComponent.selected = selected;
	        	});
	          div.append(select);
	        }
	        return select;
	    };
	    // Add the options to the select box
        function populateSelect(select, index, field){
	        select.html("");
	        select.append($("<option value='' >------</option>"));
	        var options =  webComponent.selected[index-1]["options"] 
		 	 // Current selected
            var currentSelectedIndex = webComponent.selected[index-1]["selected"];
	        // Add the options to the select box
	        $.each( options , function( index, opt ) {
	        	if(index === currentSelectedIndex){
                    select.append($("<option  selected >" + opt.text + "</option>"));
	        	}
	        	else{
	        	    select.append($("<option >" + opt.text + "</option>"));
	        	}
	        });
        };

        function setModelNameFromFieldName(fieldName,selectedIndex){
          var selectOptions = webComponent.selected[selectedIndex]["options"];
          if(fieldName){
            var optionModel =  $.grep(selectOptions, function(e){ return e.text === fieldName; });          
            webComponent.selected[selectedIndex]["selected"] = selectOptions.indexOf(optionModel[0]);
            return optionModel[0];
          }else{
          	 webComponent.selected[selectedIndex]["selected"] = -1;
          }
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
				}				        
			});
	  		div.append(input);
	  	}
	  	return input;
	  };

	  function getOrCreateRadioGroupInput(div, id, field){
	  	$.each( field.option , function( index, opt ) {
	  		var divRadio = $("#" + id + index);
	  		if(divRadio.length === 0){
	  			divRadio = $('<div/>')
	  			divRadio.attr("id", id + index)
	  			divRadio.addClass("radio row clearfix");
	  			var lab = $("<label/>").html("<input  type='radio' name='"+ field.name +"' value='"+ opt.value +"'  >" + opt.text );
	  			lab.appendTo($(divRadio))
	  			divRadio.appendTo(div);
	  		}
	  	});			
	  };

	  function getOrCreateCheckBoxGroupInput(div, id, field){
	  	$.each( field.option , function( index, opt ) {
	  		var divCheck = $("<div/>").addClass("checkbox row");
	  		var lab = $("<label/>").html("<input  type='checkbox' name='"+ field.name +"' value='"+ opt.value +"'  >" + opt.text );
	  		lab.appendTo($(divCheck))
	  		divCheck.appendTo(div);
	  	});			
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