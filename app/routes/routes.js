// routes/routes.js

const http 		 = require('http');
var _ = require('underscore');

var endpoint
var documentation
var finishedAsync
var response
var path
var pathParameters = []

module.exports = function(app, db) {
	// Web in HTML
	app.get('/UniversalAPI', (req, res) => {
    	res.sendFile('web/webAPI.html', {root: '.' })
	});
	// Query the Universal API
	app.get('/UniversalAPIQuery', (req, res) => {
		console.log("params: " + JSON.stringify(req.query))
		console.log("params: " + JSON.stringify(req.query.endpoint))
		console.log("params: " + JSON.stringify(req.query.documentation))

		response = res
		var query = req.query
		endpoint = req.query.endpoint
		var documentationParameter = req.query.documentation
		path = req.query.path
		var sparql = req.query.query
		var sparqlGraph = req.query['default-graph-uri']
		var format = req.query.format
		var debug = req.query.debug
		var timeout = req.query.timeout

		if(typeof endpoint !== 'undefined' && endpoint){

			if(typeof sparql !== 'undefined' && sparql){
				// query sparql
				console.log('sparql: ' + sparql)

				if(typeof sparqlGraph !== 'undefined' && sparqlGraph){
					console.log('sparqlGraph: ' + sparqlGraph)
				} else {
					sparqlGraph = ''
				}
				if(typeof format !== 'undefined' && format){
					console.log('format: ' + format)
				} else {
					format = 'application%2Fsparql-results%2Bjson'
				}
				if(typeof debug !== 'undefined' && debug){
					console.log('debug: ' + debug)
				} else {
					debug = 'on'
				}
				if(typeof timeout !== 'undefined' && timeout){
					console.log('timeout: ' + timeout)
				} else {
					timeout = ''
				}

				sparqlQuery(sparql, sparqlGraph, format, debug, timeout)
			} else if(documentationParameter === "true"){
						console.log('documentation: ' + documentationParameter)
						//get documentation
						initDoc()
						getEndpointClasses()
			} else {
				if(typeof path !== 'undefined' && path) {
					if(path.charAt(0) == '/'){
						console.log('path: ' + path)
						// autogenerate sparql
						// generate sparql query with resource and properties
						
						//generateSparql(path);
						getEndpointClassesFromResource()
					} else {
						// query sparl
						sparql = path
						console.log('sparql: ' + sparql)
						sparqlQuery(sparql)
					}
				} else {
					// Get all triples
					sparql = 'SELECT ?subject ?predicate ?object WHERE {?subject ?predicate ?object}' //' LIMIT 100'

					sparqlQuery(sparql)
				}
			}

			
		}
		else {
			  res.json({error: 'API to LOD -> Missing parameter "endpoint"'})
		}
	});
};


// Documentation function
function getEndpointClasses(){
	var httpGet = endpoint + '?query=' + 'SELECT DISTINCT ?class WHERE { ?s a ?class . }' + '&format=application%2Fsparql-results%2Bjson'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//res.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var results = data
		try {
		    results = JSON.parse(data)
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		}

		var paths = []
	  	var jsonPaths = results.results.bindings
	  	var i;
	  	for(i=0;i<jsonPaths.length;i++)
        {
            var jsonObject1 = jsonPaths[i];
            var value = jsonObject1.class["value"];
			//console.log(value)
			paths.push(value)
        }
        finishedAsync = _.after(i, createDocumentation);
        getClassesProperties(paths)
	  });
	});
};

// Documentation function
function getClassesProperties(paths) {
	//console.log(paths)

  	for(i=0;i<paths.length;i++)
    {
        var pathValue = paths[i];
		// wait for properties get request
		getClassProperties(pathValue, addPathToDoc)
    }
}

// Documentation function
function getClassProperties(pathValue, addPathToDoc){
	var httpGet = endpoint + '?query=' + escape('SELECT DISTINCT ?property WHERE { ?s a <' + pathValue + '>; ?property ?o . }') + '&format=application%2Fsparql-results%2Bjson'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//res.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var results = data
		try {
		    results = JSON.parse(data)
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		}

		var properties = []
	  	var jsonProperties = results.results.bindings
	  	var i;
	  	for(i=0;i<jsonProperties.length;i++)
        {
            var jsonObject1 = jsonProperties[i];
            var value = jsonObject1.property["value"];
			//console.log(value)
			properties.push({name: pathShortener(value), schema : { type : "string" }, in: "query"})
        }

        addPathToDoc(pathValue, properties)
	  });
	});
}

// Documentation function
function addPathToDoc(pathValue, properties){

	//var path = { path: pathValue, parameters: properties}
	//console.log(path)
	//documentation.paths.push(path)
	var pathShortened = pathShortener(pathValue)
	documentation.paths['/' + pathShortened] = { get: { summary: "GET " + pathShortened, description: "" + pathValue, operationId: "get" + pathShortened, 
		responses : { "200" : { description : "successful operation" } }, parameters: properties }};
	finishedAsync()
	

}

// Documentation function
function initDoc(){
	documentation = {
		openapi: "3.0.0", info: { version: "1", title: "API to endpoint", description: "Endpoint url: " + endpoint }, 
		paths: {}, servers: [ { url : "https://wake.dlsi.ua.es/UniversalAPI/?endpoint=" + endpoint } ]
	}
}

// Documentation function
function createDocumentation(){
	console.log('createDocumentation')

	response.json({results: JSON.stringify(documentation)})
}

function pathShortener(pathValue){
	if(pathValue.includes('#')){
		var splitedHastag = pathValue.split('#')
		return splitedHastag[splitedHastag.length - 1]
	} else {
		var splitedSlash = pathValue.split('/')
		return splitedSlash[splitedSlash.length - 1]
	}
}

// API to SPARQL function
function getEndpointClassesFromResource(){
	var httpGet = endpoint + '?query=' + 'SELECT DISTINCT ?class WHERE { ?s a ?class . }' + '&format=application%2Fsparql-results%2Bjson'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//res.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var results = data
		try {
		    results = JSON.parse(data)
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		}

		//var paths = []
	  	var jsonPaths = results.results.bindings
	  	var i;
	  	for(i=0;i<jsonPaths.length;i++)
        {
            var jsonObject1 = jsonPaths[i];
            var value = jsonObject1.class["value"];
            var valueShortened = pathShortener(value);
			//console.log(value)
			//paths.push(valueShortened)

			var pathResource = path
			var parameters = []
			try {
				if(path.split('/').length <= 2){
					pathResource = path.split('?')[0].substring(1)
					parameters = path.split('?')[1].split('&')
				} else {
					pathResource = path.split('?')[0].split('/')[1]
					parameters = path.split('?')[1].split('&')
				}
		    } catch(e) {
		        console.log(e);
		    }

			if(pathResource === valueShortened){
				//TODO: se podría llamar directamente sin comprobar si ese recurso existe (?)
				console.log("generateSparql: pathResource=" + pathResource + " parameters=" + JSON.stringify(parameters))
				getClassPropertiesFromParameters(value, parameters, generateSparql)
				return;
			}
        }

	  	response.json({error: 'API to LOD -> Error generating the SPARQL query: check that the endpoint and the path are correct...'})

	  });
	});
};

// API to SPARQL function
function getClassPropertiesFromParameters(pathValue, parameters, callback){
	var httpGet = endpoint + '?query=' + escape('SELECT DISTINCT ?property WHERE { ?s a <' + pathValue + '>; ?property ?o . }') + '&format=application%2Fsparql-results%2Bjson'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//res.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var results = data
		try {
		    results = JSON.parse(data)
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		}

		//var properties = []
		var newParameters = []
	  	var jsonProperties = results.results.bindings
	  	var i;
	  	for(i=0;i<jsonProperties.length;i++)
        {
            var jsonObject1 = jsonProperties[i]
            var value = jsonObject1.property["value"]
            var valueShortened = pathShortener(value)
			//console.log(value)
			//properties.push({name: pathShortener(value), schema : { type : "string" }, in: "query"})
			try{
				var j
				for(j=0; j<parameters.length; j++){
					if(valueShortened === parameters[j].split('=')[0]){
						newParameters.push({name: value, value: parameters[j].split('=')[1]})
					}
				}
			} catch(e){
				console.log(e)
			}
        }

        callback(pathValue, newParameters)

	  });
	});
}

// API to SPARQL function
function generateSparql(pathToResource, parameters){
	// TODO: generate query taking PARAMETER value (search for resources) into account
	var sparql = 'SELECT ?subject ?predicate ?object WHERE { ?subject rdf:type <' + pathToResource + 
		'> . ?subject ?predicate ?object . ';
	
	try{
		var i 
		for(i = 0; i < parameters.length; i++){
			sparql += ' ?subject <' + parameters[i].name + '> <' + parameters[i].value + '> '
		}
	} catch(e){
		console.log(e)
	}

	sparql += '}'

	console.log("sparql query generated: " + sparql)


	var httpGet = endpoint + '?query=' + escape(sparql)  + '&format=application%2Fsparql-results%2Bjson'
	console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//res.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var results = data
		try {
		    results = JSON.parse(data)
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		}
	  	response.json({results: data, query: sparql})
	  });

	}).on("error", (err) => {
	  console.log("Error: " + err.message);
	  response.json({error: 'API to LOD -> Error'})
	});
}

// SPARQL to endpoint function
function sparqlQuery(sparql, sparqlGraph, format, debug, timeout){
	var httpGet
	if(sparqlGraph === undefined || format === undefined || debug === undefined || timeout === undefined){
		httpGet = endpoint + '?query=' + sparql + '&format=application%2Fsparql-results%2Bjson'
	} else {
		httpGet = endpoint + '?query=' + sparql + '&default-graph-uri=' + sparqlGraph + '&format=' + format + '&debug=' + debug + '&timeout=' + timeout
	}
	console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//res.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var results = data
		try {
		    results = JSON.parse(data)
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		}
	  	response.json({results: data, query: sparql})
	  });

	}).on("error", (err) => {
	  console.log("Error: " + err.message);
	  response.json({error: 'API to LOD -> Error'})
	});
};