window.onload = function() {

	// Set example endpoints
    $('#GeoLinkedData').click(function(){ GeoLinkedData(); return false; });
    $('#RISM').click(function(){ RISM(); return false; });
    $('#AEMET').click(function(){ GeoLinkedData(); return false; });
    $('#Bio2RDF').click(function(){ GeoLinkedData(); return false; });
}

function send(){
	var url = '/UniversalAPIQuery'
	url += '?endpoint=' + $('#endpoint').val()

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
	alert('documentation')
}

function seeQuery(){
	if($('#collapse').is(':visible')){
		$('#collapse').hide()
	} else {
		$('#collapse').show()
	}
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