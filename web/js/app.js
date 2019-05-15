window.onload = function() {

	// Set example endpoints
    $('#GeoLinkedData').click(function(){ GeoLinkedData(); return false; });
    $('#RISM').click(function(){ RISM(); return false; });
    $('#AEMET').click(function(){ AEMET(); return false; });
    $('#Bio2RDF').click(function(){ Bio2RDF(); return false; });
}

function send(){
	$('#sendQuery').prop('disabled', true);

	var url = '/UniversalAPIQuery'
	url += '?endpoint=' + $('#endpoint').val() + '&path=' + $('#path').val()

	$.ajax({
		url: url,
		//dataType: 'jsonp',
		//dataType: "text",
		responseType:'application/json',
		success: function (data) {
			$('#sendQuery').prop('disabled', false);
			if(data){
				console.log(data)
				if(data.results || data.error){
					if(data.results){
						$('#textareaResult').val(data.results);
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

function documentation(){
	$('#documentation').prop('disabled', true);

	var url = '/UniversalAPIQuery'
	url += '?endpoint=' + $('#endpoint').val() + "&documentation=true"

	$.ajax({
		url: url,
		//dataType: 'jsonp',
		//dataType: "text",
		responseType:'application/json',
		success: function (data) {
			$('#documentation').prop('disabled', false);
			if(data){
				console.log(data)
				if(data.results || data.error){
					if(data.results){
						$('#textareaResult').val(data.results);
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