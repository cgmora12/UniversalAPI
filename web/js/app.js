window.onload = function() {

	// Set example endpoints
    /*$('#GeoLinkedData').click(function(){ GeoLinkedData(); return false; });
    $('#RISM').click(function(){ RISM(); return false; });
    $('#AEMET').click(function(){ AEMET(); return false; });
    $('#Bio2RDF').click(function(){ Bio2RDF(); return false; });*/
}

function editEndpoint(){
	//$('#endpoint').prop('disabled', false);
	//$("#editEndpoint").collapse("hide");
	$('#collapseSparqlQuery').collapse("hide");
	$('#collapsePath').collapse("hide");
	$('#collapseCompleteQuery').collapse("hide");
	$('#collapseFormat').collapse("hide");
	$('#collapseSend').collapse("hide");
	$('#collapseSendSparql').collapse("hide");
	$('#collapseProperties').collapse("hide");
	$('#collapseResults').collapse("hide");
	document.getElementById("loader").style.display = "none";
	document.getElementById("csvTable").style.display = "none";
	jsonResults = ""
}

var jsonResults

function basicQuery(){

	$('#collapsePath').collapse("hide");
	$('#collapseSendSparql').collapse("hide");
	$('#collapseSparqlQuery').collapse("hide");
	$('#collapseCompleteQuery').collapse("hide");
	$('#collapseFormat').collapse("hide");
	$('#collapseResults').collapse("hide");

	//$('#collapseSubmits').collapse("hide");

	//$('#endpoint').prop('disabled', true);

	$('#basicQueryBtn').val("Loading endpoint...")
	$('#basicQueryBtn').prop('disabled', true);

	$('#documentation').prop('disabled', true);
	$('#sparqlQueryBtn').prop('disabled', true);

	document.getElementById("loader").style.display = "block";
	document.getElementById("csvTable").style.display = "none";

	var url = '/UniversalAPIQuery'
	url += '?endpoint=' + $('#endpoint').val() + '&basicQuery=true&step=1'

	$.ajax({
		url: url,
		//dataType: 'jsonp',
		//dataType: "text",
		responseType:'application/json',
		success: function (data) {
			if(data){
				console.log(data)
				if(data.results || data.error){
					if(data.results){						
						jsonResults = data.results;
						basicQueryFill()
					} else {
						basicQueryNotFill(data.error)
					}
				}
				else {
					basicQueryNotFill()
				}
			}
			else {
				basicQueryNotFill()
			}
		},
		error: function(error){
			basicQueryNotFill()
		}
	});
	
}

function basicQueryFill(){
	//$('#basicQueryBtn').prop('disabled', false);
	$('#documentation').prop('disabled', false);
	$('#basicQueryBtn').prop('disabled', false);
	$('#sparqlQueryBtn').prop('disabled', false);

	document.getElementById("loader").style.display = "none";
	document.getElementById("csvTable").style.display = "none";

	$('#basicQueryBtn').val("API query")
	$('#collapseSparqlQuery').collapse("hide");
	$('#collapsePath').collapse("show");
	$('#collapseFormat').collapse("show");
	$('#collapseSend').collapse("show");
	$('#collapseSendSparql').collapse("hide");
	//$("#editEndpoint").collapse("show");
	$('#collapseResults').collapse("hide");
	$('#collapsePath').collapse("show");

	// ordenar options alfabeticamente pero cuidado al obtener dicha posicion de jsonResults.paths
	var options = jsonResults//Object.keys(jsonResults.paths["/"].get.parameters[1].examples);
	var optionsOrdered = options.sort(dynamicSort("value"))
	$('#path').empty();
	$('#path').append($('<option></option>'));
	$.each(optionsOrdered, function(i, p) {
	    $('#path').append($('<option></option>').val(p.id).html(p.value + " (" + p.id + ")"));
	});
	$("#path").on('change', function() {

		$('.jsonpanel').html("");
		$('#apiquery').val('');
		$('#query').val('');

		document.getElementById("loader").style.display = "block";
		document.getElementById("csvTable").style.display = "none";
		$('.property').empty();
		$('.property').append($('<option></option>'));
		var selectedPath = $("#path").val()

		var url = '/UniversalAPIQuery'
		url += '?endpoint=' + $('#endpoint').val() + '&path=' + escape(selectedPath) + '&basicQuery=true&step=2'

		$.ajax({
			url: url,
			//dataType: 'jsonp',
			//dataType: "text",
			responseType:'application/json',
			success: function (data) {
				if(data){
					console.log(data)
					if(data.results || data.error){
						if(data.results){		

							var jsonProperties = data.results
							//console.log(jsonProperties)
							var options = []
							var i
							for(i = 0; i < jsonProperties.length; i++){
								options.push({id: jsonProperties[i].id, name: jsonProperties[i].name})
							}
							var optionsOrdered = options.sort(dynamicSort("name"))
							// ordenar options alfabeticamente pero cuidado al obtener dicha posicion de jsonProperties
							$.each(optionsOrdered, function(i, p) {
							    $('.property').append($('<option></option>').val(p.id).html(p.name + " (" + p.id + ")"));
							});
							$(".property").on('change', function() {
								$('.collapsePropertyValue').collapse("show");
							});

							$('#collapseCompleteQuery').collapse("show");
							$('.collapseProperty').collapse("show");
							$('#collapseProperties').collapse("show");	
							$('#collapseFormat').collapse("show");
							$('#collapseSend').collapse("show");
						} else {
							basicQueryNotFill(data.error)
						}
					}
					else {
						basicQueryNotFill()
					}
				}
				else {
					basicQueryNotFill()
				}

				document.getElementById("loader").style.display = "none";
				document.getElementById("csvTable").style.display = "none";
			},
			error: function(error){
				basicQueryNotFill()

				document.getElementById("loader").style.display = "none";
				document.getElementById("csvTable").style.display = "none";
			}
		});

		
	});
}

function basicQueryNotFill(errorObject){
	//$('#basicQueryBtn').prop('disabled', false);
	$('#documentation').prop('disabled', false);
	$('#basicQueryBtn').prop('disabled', false);
	$('#sparqlQueryBtn').prop('disabled', false);
	$('#collapseResults').collapse("show");
	$('#basicQueryBtn').val("API query")
	//$('#endpoint').prop('disabled', false);

	document.getElementById("loader").style.display = "none";
	document.getElementById("csvTable").style.display = "none";

	var error = "Error querying the endpoint"
	if(errorObject){
		error = errorObject
	}
	$('#textareaResult').val(error);

	$('.jsonpanel').html("");
	document.getElementById('textareaResult').style.display = "block";
	$('#apiquery').val('');
	$('#query').val('');
}

function sparqlQuery(){
	//$('#collapseSubmits').collapse("hide");
	$('#collapsePath').collapse("hide");
	$('#collapseSparqlQuery').collapse("show");
	$('#collapseCompleteQuery').collapse("show");
	$('#collapseFormat').collapse("show");
	$('#basicQueryBtn').prop('disabled', false);
	$('#collapseSend').collapse("hide");
	$('#collapseSendSparql').collapse("show");
	$('#collapseProperties').collapse("hide");
	$('#collapseResults').collapse("hide");
}

function documentation(){

	$('#collapseSendSparql').collapse("hide");
	$('#collapseSparqlQuery').collapse("hide");
	$('#collapseCompleteQuery').collapse("hide");
	$('#collapseFormat').collapse("hide");
	$('#collapseResults').collapse("hide");
	$('#collapsePath').collapse("hide");

	//$('#endpoint').prop('disabled', true);
	$('#documentation').prop('disabled', true);

	$('#documentation').val("Loading documentation...")
	$('#basicQueryBtn').prop('disabled', true);
	$('#sparqlQueryBtn').prop('disabled', true);

	document.getElementById("loader").style.display = "block";
	document.getElementById("csvTable").style.display = "none";

	var url = '/UniversalAPIQuery/docs'
	url += '?endpoint=' + $('#endpoint').val()

	$.ajax({
		url: url,
		//dataType: 'jsonp',
		//dataType: "text",
		responseType:'application/json',
		success: function (data) {
			if(data){
				$('#collapseResults').collapse("show");
				//console.log(data)
				if(data.results || data.error){
					if(data.results){
						jsonResults = data.results;
						/*if(data.sparql){
							$('#query').val(data.sparql);
						} else {
							$('#query').val("");
						}*/
						if(data.query){
							$('#query').val(data.query);
						} else {
							$('#query').val("");
						}
						$('#apiquery').val("https://wake.dlsi.ua.es" + url);
						documentationReady()
					}
					else {
						documentationNotReady(data.error)
					}
				}
				else {
					documentationNotReady()
				}
			} 
			else {
				documentationNotReady()
			}
		},
		error: function(error){
			documentationNotReady()
		}
	});
	
}

function documentationReady(){
	$('#documentation').prop('disabled', false);
	$('#documentation').val("Get endpoint documentation");
	$('#basicQueryBtn').prop('disabled', false);
	$('#sparqlQueryBtn').prop('disabled', false);
	$('#collapseResults').collapse("show");

	document.getElementById("loader").style.display = "none";
	document.getElementById("csvTable").style.display = "none";

	var jsonResultsFormatted = JSON.stringify(jsonResults, null, 2);
	$('#textareaResult').val(jsonResultsFormatted);
	var blob = new Blob([jsonResultsFormatted], {
	    type: "application/json",
	});
	var filename = "endpointOpenAPI.json";
	if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else{
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }

	$('.jsonpanel').html("");
    $('.jsonpanel').jsonpanel({
	  data: jsonResults
	});
	document.getElementById('textareaResult').style.display = "none";
}

function documentationNotReady(errorObject){
	$('#documentation').prop('disabled', false);
	$('#documentation').val("Get endpoint documentation");
	$('#basicQueryBtn').prop('disabled', false);
	$('#sparqlQueryBtn').prop('disabled', false);
	$('#collapseResults').collapse("show");
	//$('#endpoint').prop('disabled', false);

	document.getElementById("loader").style.display = "none";
	document.getElementById("csvTable").style.display = "none";

	var error = "Error querying the endpoint"
	if(errorObject){
		error = errorObject
	}
	$('#textareaResult').val(error);

	$('.jsonpanel').html("");
	document.getElementById('textareaResult').style.display = "block";
	$('#apiquery').val('');
	$('#query').val('');
}

function addProperty(){

	var collapseNewProperties = document.getElementById("collapseNewProperties");
	var property = document.getElementsByClassName("property")[0];
	var propertyClone = property.cloneNode(true);
	var newProperty = document.createElement("div");
	newProperty.innerHTML = "<div class=\"collapseProperty row form-group panel-collapse collapse in show col-sm-12 col-lg-12\"> \
                                    <div class=\"col-sm-3 col-sm-offset-1 form-group\"> \
                                        <label>Property</label> \
                                    </div> \
                                    <div class=\"col-sm-5 form-group\"> \
                                        <select class=\"form-control property\"> \
                                        </select> \
                                    </div> \
                                </div> \
                                <div class=\"collapsePropertyValue row form-group panel-collapse collapse in show col-sm-12 col-lg-12\"> \
                                    <div class=\"col-sm-3 col-sm-offset-1 form-group\"> \
                                        <label>Property Value</label> \
                                    </div> \
                                    <div class=\"col-sm-5 form-group\"> \
                                        <input class=\"form-control propertyValue\"> \
                                    </div> \
                                </div>";
	collapseNewProperties.appendChild(newProperty);
	$(".property")[$(".property").length -1].replaceWith(propertyClone);
	//document.replaceChild(propertyClone, document.getElementsByClassName("property")[document.getElementsByClassName("property").length - 1]);
}

function send(){
	$('#sendQuery').prop('disabled', true);
	//$('#endpoint').prop('disabled', true);
	$('#documentation').prop('disabled', true);
	$('#basicQueryBtn').prop('disabled', true);
	$('#sparqlQueryBtn').prop('disabled', true);
	$('#collapseResults').collapse("hide");
	$("#format").prop('disabled', true);

	document.getElementById("loader").style.display = "block";
	document.getElementById("csvTable").style.display = "none";

	var limit = ""
	var offset = ""
	if($("#limit").val()){
		limit = "&limit=" + $("#limit").val()
	}
	if($("#offset").val()){
		offset = "&offset=" + $("#offset").val()
	}

	var url = '/UniversalAPIQuery' + '?endpoint=' + $('#endpoint').val() + "&format=" + $('#format').val() + limit + offset + '&path=' + escape($('#path').val())
	// check all properties
	var properties = $('.property')
	var propertiesUrl = { }
	var i 
	for (i = 0; i < properties.length; i++){

		var property = escape(properties[i].value)
		var propertyValue = escape($('.propertyValue')[i].value)
		if(property && propertyValue){
			propertiesUrl[property] = propertyValue
		}
	}

	if(propertiesUrl && !jQuery.isEmptyObject(propertiesUrl)){
			url +=  "&properties=" + JSON.stringify(propertiesUrl)
	}

	//mostrar url en la interfaz
	//console.log(url)
	$("#apiquery").val("https://wake.dlsi.ua.es" + url)

	$.ajax({
		url: url,
		//dataType: 'jsonp',
		//dataType: "text",
		responseType:'application/json',
		success: function (data) {
			$('#sendQuery').prop('disabled', false);
			//$('#endpoint').prop('disabled', false);
			//$('#editEndpoint').collapse("show");
			$('#documentation').prop('disabled', false);
			$('#basicQueryBtn').prop('disabled', false);
			$('#sparqlQueryBtn').prop('disabled', false);
			$("#format").prop('disabled', false);

			document.getElementById("loader").style.display = "none";
			document.getElementById("csvTable").style.display = "none";

			if(data){
				console.log(data)
				$('#collapseResults').collapse("show");
				if(data.results || data.error){
					if(data.results){
						if($("#format").val() === "triples"){
							$('#textareaResult').val(JSON.stringify(data.results, null, 2));
							document.getElementById('textareaResult').style.display = "block";
							$('.jsonpanel').html("");
						}
						else if($("#format").val() === "csv"){
							$('#textareaResult').val(data.results);
							document.getElementById('textareaResult').style.display = "block";
						}
						else if($("#format").val() === "table"){
							showTable(data.results);
						}
						else {
							$('#textareaResult').val(JSON.stringify(data.results, null, 2));

							$('.jsonpanel').html("");
						    $('.jsonpanel').jsonpanel({
							  data: data.results.results
							});
							document.getElementById('textareaResult').style.display = "none";
						}
					}
					else {
						$('#textareaResult').val(data.error);
						$('.jsonpanel').html("");
						document.getElementById('textareaResult').style.display = "block";
						$('#apiquery').val('');
						$('#query').val('');
					}
				}
				else {
					showTable(data);
				}

				if(data.query){
					$('#query').val(data.query);
				} else {
					$('#query').val('');
				}
			} else {
				$('#textareaResult').val("Error querying the endpoint");
				$('.jsonpanel').html("");
				document.getElementById('textareaResult').style.display = "block";
				$('#apiquery').val('');
				$('#query').val('');
			}
		},
		error: function(error){
			console.log(error)
			$('#textareaResult').val("Error querying the endpoint");
			$('.jsonpanel').html("");
			document.getElementById('textareaResult').style.display = "block";
			$('#apiquery').val('');
			$('#query').val('');
		}
	});
}

function showTable(data){
	
	$('#textareaResult').val(data);
	document.getElementById('textareaResult').style.display = "block";

	$('#csvTable').html('');

    var parsedCSV = d3.csv.parseRows(data);
    var container = d3.select("#csvTable")
        .append("table")

        .selectAll("tr")
            .data(parsedCSV).enter()
            .append("tr")

        .selectAll("td")
            .data(function(d) { return d; }).enter()
            .append("td")
            .text(function(d) { return d; });

	document.getElementById("csvTable").style.display = "block";
}

function sendSparql(){
	$('#sendSparqlQuery').prop('disabled', true);
	//$('#endpoint').prop('disabled', true);
	$('#documentation').prop('disabled', true);
	$('#basicQueryBtn').prop('disabled', true);
	$('#sparqlQueryBtn').prop('disabled', true);
	$('#collapseResults').collapse("hide");

	document.getElementById("loader").style.display = "block";
	document.getElementById("csvTable").style.display = "none";
	
	var limit = ""
	var offset = ""
	if($("#limit").val()){
		limit = "&limit=" + $("#limit").val()
	}
	if($("#offset").val()){
		offset = "&offset=" + $("#offset").val()
	}

	var url = '/UniversalAPIQuery/sparql' + '?endpoint=' + $('#endpoint').val() + "&format=" + $('#format').val() + limit + offset + '&query=' + escape($('#sparqlQuery').val())

	//mostrar url en la interfaz
	//console.log(url)
	$("#apiquery").val("https://wake.dlsi.ua.es" + url)

	$.ajax({
		url: url,
		//dataType: 'jsonp',
		//dataType: "text",
		responseType:'application/json',
		success: function (data) {
			$('#sendSparqlQuery').prop('disabled', false);
			//$('#endpoint').prop('disabled', false);
			//$('#editEndpoint').collapse("show");
			$('#documentation').prop('disabled', false);
			$('#basicQueryBtn').prop('disabled', false);
			$('#sparqlQueryBtn').prop('disabled', false);

			document.getElementById("loader").style.display = "none";
			document.getElementById("csvTable").style.display = "none";

			if(data){
				console.log(data)
				$('#collapseResults').collapse("show");
				if(data.results || data.error){
					if(data.results){
						if($("#format").val() === "triples"){
							$('#textareaResult').val(JSON.stringify(data.results, null, 2));
						}
						else {
							$('#textareaResult').val(JSON.stringify(data.results, null, 2));
						}
					}
					else {
						$('#textareaResult').val(data.error);						
						$('.jsonpanel').html("");
						document.getElementById('textareaResult').style.display = "block";
						$('#apiquery').val('');
						$('#query').val('');
					}
				}
				else {
					$('#textareaResult').val('Error querying the endpoint');					
					$('.jsonpanel').html("");
					document.getElementById('textareaResult').style.display = "block";
					$('#apiquery').val('');
					$('#query').val('');
				}

				if(data.query){
					$('#query').val(data.query);
				} else {
					$('#query').val('');
				}
			}
		},
		error: function(error){
			console.log(error)
			$('#textareaResult').val('Error querying the endpoint');			
			$('.jsonpanel').html("");
			document.getElementById('textareaResult').style.display = "block";
			$('#apiquery').val('');
			$('#query').val('');
		}
	});
}

/*function GeoLinkedData(){
	if(!$('#endpoint').prop('disabled')){
		$('#endpoint').val('http://geo.linkeddata.es/sparql')
	}
}

function RISM(){
	if(!$('#endpoint').prop('disabled')){
		$('#endpoint').val('http://data.rism.info/sparql')
	}
}

function AEMET(){
	if(!$('#endpoint').prop('disabled')){
		$('#endpoint').val('http://aemet.linkeddata.es/sparql')
	}
}

function Bio2RDF(){
	if(!$('#endpoint').prop('disabled')){
		$('#endpoint').val('http://bio2rdf.org/sparql')
	}
}*/

function dynamicSort(property) {
    var sortOrder = 1;

    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }

    return function (a,b) {
        if(sortOrder == -1){
            return b[property].localeCompare(a[property]);
        }else{
            return a[property].localeCompare(b[property]);
        }        
    }
}