window.onload = function() {

	// Set example endpoints
    $('#GeoLinkedData').click(function(){ GeoLinkedData(); return false; });
    $('#RISM').click(function(){ RISM(); return false; });
    $('#AEMET').click(function(){ AEMET(); return false; });
    $('#Bio2RDF').click(function(){ Bio2RDF(); return false; });
}

var jsonResults

function basicQuery(){
	//$('#collapseSubmits').collapse("hide");

	$('#endpoint').prop('disabled', true);

	$('#basicQueryBtn').val("Loading endpoint ...")
	$('#basicQueryBtn').prop('disabled', true);

	$('#documentation').prop('disabled', true);
	$('#sparqlQueryBtn').prop('disabled', true);

	var url = '/UniversalAPIQuery'
	url += '?endpoint=' + $('#endpoint').val() + "&documentation=true"

	if(jsonResults){
		basicQueryFill()
	} else {
		$.ajax({
			url: url,
			//dataType: 'jsonp',
			//dataType: "text",
			responseType:'application/json',
			success: function (data) {
				if(data){
					//console.log(data)
					if(data.results || data.error){
						if(data.results){						
							jsonResults = JSON.parse(data.results);
							basicQueryFill()
						}
					}
				}
			}
		});
	}
	
}

function basicQueryFill(){
	//$('#basicQueryBtn').prop('disabled', false);
	$('#documentation').prop('disabled', false);
	$('#sparqlQueryBtn').prop('disabled', false);

	$('#basicQueryBtn').val("Basic API query")
	$('#collapseSparqlQuery').collapse("hide");
	$('#collapsePath').collapse("show");
	$('#collapseCompleteQuery').collapse("show");

	// ordenar options alfabeticamente pero cuidado al obtener dicha posicion de jsonResults.paths
	var options = Object.keys(jsonResults.paths);
	var optionsOrdered = options.sort()
	$('#path').empty();
	$('#path').append($('<option></option>'));
	$.each(optionsOrdered, function(i, p) {
	    $('#path').append($('<option></option>').val(p).html(p.substring(1)));
	});
	$("#path").on('change', function() {
		$('#collapseProperty').collapse("show");
		$('#property').empty();
		$('#property').append($('<option></option>'));
		var selectedPath = $("#path").val()
		var jsonProperties = jsonResults.paths[selectedPath].get.parameters
		console.log(jsonProperties)
		var options = []
		var i
		for(i = 0; i < jsonProperties.length; i++){
			var value = jsonProperties[i].name
			options.push(value)
		}
		var optionsOrdered = options.sort()
		// ordenar options alfabeticamente pero cuidado al obtener dicha posicion de jsonProperties
		$.each(optionsOrdered, function(i, p) {
		    $('#property').append($('<option></option>').val(p).html(p));
		});
		$("#property").on('change', function() {
			$('#collapsePropertyValue').collapse("show");
		});
	});
}

function sparqlQuery(){
	//$('#collapseSubmits').collapse("hide");
	$('#collapsePath').collapse("hide");
	$('#collapseSparqlQuery').collapse("show");
	$('#collapseCompleteQuery').collapse("show");
	$('#basicQueryBtn').prop('disabled', false);
}

function documentation(){
	$('#endpoint').prop('disabled', true);
	$('#documentation').prop('disabled', true);
	$('#basicQueryBtn').prop('disabled', true);
	$('#sparqlQueryBtn').prop('disabled', true);

	var url = '/UniversalAPIQuery'
	url += '?endpoint=' + $('#endpoint').val() + "&documentation=true"

	if(jsonResults){
		documentationReady()
	}
	else {
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
							jsonResults = JSON.parse(data.results);
							documentationReady()
						}
						if(data.error){
							$('#textareaResult').val(data.error);
						}
					}
					else {
						$('#textareaResult').val('');
					}
				}
			}
		});
	}
	
}

function documentationReady(){
	$('#documentation').prop('disabled', false);
	$('#basicQueryBtn').prop('disabled', false);
	$('#sparqlQueryBtn').prop('disabled', false);
	$('#collapseResults').collapse("show");

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
}

function send(){
	$('#sendQuery').prop('disabled', true);
	$('#endpoint').prop('disabled', true);
	$('#documentation').prop('disabled', true);
	$('#basicQueryBtn').prop('disabled', true);
	$('#sparqlQueryBtn').prop('disabled', true);

	var url = '/UniversalAPIQuery' + '?endpoint=' + $('#endpoint').val() + '&path=' + $('#path').val()
	//TODO: check all properties
	var property = $('#property').val()
	var propertyValue = $('#propertyValue').val()
	var properties
	if(property && propertyValue){
		properties = "?" + property + "=" + propertyValue + "&"
		url += properties
	}

	//mostrar url en la interfaz
	console.log(url)
	$("#apiquery").val(url)

	$.ajax({
		url: url,
		//dataType: 'jsonp',
		//dataType: "text",
		responseType:'application/json',
		success: function (data) {
			$('#sendQuery').prop('disabled', false);
			$('#endpoint').prop('disabled', false);
			$('#documentation').prop('disabled', false);
			$('#basicQueryBtn').prop('disabled', false);
			$('#sparqlQueryBtn').prop('disabled', false);

			if(data){
				console.log(data)
				$('#collapseResults').collapse("show");
				if(data.results || data.error){
					if(data.results){
						$('#textareaResult').val(JSON.stringify(JSON.parse(data.results), null, 2));
					}
					if(data.error){
						$('#textareaResult').val(data.error);
					}
				}
				else {
					$('#textareaResult').val('');
				}

				if(data.query){
					$('#query').val(data.query);
				} else {
					$('#query').val('');
				}
			}
		}
	});
}

function GeoLinkedData(){
	$('#endpoint').val('http://geo.linkeddata.es/sparql')
}

function RISM(){
	$('#endpoint').val('http://data.rism.info/sparql')
}

function AEMET(){
	$('#endpoint').val('http://aemet.linkeddata.es/sparql')
}

function Bio2RDF(){
	$('#endpoint').val('http://bio2rdf.org/sparql')
}