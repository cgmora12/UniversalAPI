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
			console.log(data)
			$('#textareaResult').val(JSON.stringify(data));
		}
	});
}

function documentation(){
	alert('documentation')
}

function GeoLinkedData(){
	alert('GeoLinkedData')
}

function RISM(){
	alert('RISM')
}

function AEMET(){
	alert('AEMET')
}

function Bio2RDF(){
	alert('Bio2RDF')
}