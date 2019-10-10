// routes/routes.js

const http 		 = require('http');
var _ = require('underscore');
let openapiTemplate = require('./openapiTemplate.json');
const { parse } = require('json2csv');

var endpoint
var documentation
var finishedAsync
var response
var responsed
var path
var properties
var format
var limit
var offset
var pathProperties = []
var fieldsArray = []

module.exports = function(app, db) {
	// Web in HTML
	app.get('/UniversalAPI', (req, res) => {
    	res.sendFile('web/webAPI.html', {root: '.' })
	});
	// Get endpoint documentation
	app.get('/UniversalAPIQuery/docs', (req, res) => {
		responsed = false
		try{
			console.log("params: " + JSON.stringify(req.query))

			response = res
			var query = req.query
			endpoint = req.query.endpoint
			limit = req.query.limit
			offset = req.query.offset
			format = req.query.format
			var debug = req.query.debug
			var timeout = req.query.timeout

			if(typeof endpoint !== 'undefined' && endpoint){
				console.log('Get endpoint documentation')
				//get documentation
				initDoc()
				getEndpointClasses()
			}
			else {
				finalResponse({error: 'API to LOD -> Missing parameter "endpoint"'})
			}
		} catch (e){
			console.log(e)
			finalResponse({error: "API to LOD -> Error querying the endpoint"})
		}
	});
	// SPARQL query
	app.get('/UniversalAPIQuery/sparql', (req, res) => {
		responsed = false
		try{
			console.log("params: " + JSON.stringify(req.query))

			response = res
			var query = req.query
			var sparql = req.query.query
			endpoint = req.query.endpoint
			limit = req.query.limit
			offset = req.query.offset
			format = req.query.format
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

					sparqlQuery(sparql, sparqlGraph, debug, timeout)
				}
				else {
					finalResponse({error: 'API to LOD -> Missing query in SPARQL'})
				}
			}
			else {
				finalResponse({error: 'API to LOD -> Missing parameter "endpoint"'})
			}
		} catch (e){
			console.log(e)
			finalResponse({error: "API to LOD -> Error querying the endpoint"})
		}
	});
	// Query the Universal API
	app.get('/UniversalAPIQuery', (req, res) => {
		responsed = false
		try{
			console.log("params: " + JSON.stringify(req.query))

			response = res
			var query = req.query
			var basicQuery = req.query.basicQuery
			var step = req.query.step
			endpoint = req.query.endpoint
			var documentationParameter = req.query.documentation
			path = req.query.path
			properties = req.query.properties
			limit = req.query.limit
			offset = req.query.offset
			var sparql = req.query.query
			var sparqlGraph = req.query['default-graph-uri']
			format = req.query.format
			var debug = req.query.debug
			var timeout = req.query.timeout

			if(typeof endpoint !== 'undefined' && endpoint){
				
				if (typeof basicQuery !== 'undefined' && basicQuery){

					if(typeof step !== 'undefined' && step){
						if(step == '1'){
							getEndpointClassesWithoutProperties()
						} else if(step == '2' && typeof path !== 'undefined' && path){
							getEndpointClassFromPath(path)
						} else {
							getEndpointClassesWithoutProperties()
						}
					} else {
						getEndpointClassesWithoutProperties()
					} 
				} else if(typeof path !== 'undefined' && path) {
					//if(path.charAt(0) == '/'){
						console.log('path: ' + path)
						// autogenerate sparql
						// generate sparql query with resource and properties
						
						//generateSparql(path);
						getEndpointClassesFromResource()
					/*} else {
						// TODO: sparql directly
						// query sparl
						sparql = path
						console.log('sparql: ' + sparql)
						sparqlQuery(sparql)
					}*/
				}
				else {
					finalResponse({error: 'API to LOD -> Missing resource to perform the query (parameter "path")'})
				}
				
			}
			else {
				finalResponse({error: 'API to LOD -> Missing parameter "endpoint"'})
			}
		} catch (e){
			console.log(e)
			finalResponse({error: "API to LOD -> Error querying the endpoint"})
		}
	});
};

// UAPI guided function
function getEndpointClassesWithoutProperties(){
	//Query similar
	/*
		SELECT DISTINCT ?directSub WHERE {
	    ?directSub rdfs:subClassOf ?super .
	    OPTIONAL {
	        ?directSub rdfs:subClassOf ?otherSub .
	        FILTER (?otherSub = ?directSub)
	    }
	    FILTER (!BOUND(?otherSub ))
	}*/
	var httpGet = endpoint + '?query=' + escape('SELECT DISTINCT ?class WHERE { ?s a ?class . }') + '&format=application%2Fsparql-results%2Bjson' + '&timeout=10000'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	try{
		var req = http.get(httpGet, (resp) => {
		  let data = '';

		  // A chunk of data has been recieved.
		  resp.on('data', (chunk) => {
		    data += chunk;
		  });

		  // The whole response has been received. Print out the result.
		  resp.on('end', () => {
		  	//console.log("data: " + data);
		  	//response.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

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


			try {
				var paths = []
			  	var jsonPaths = results.results.bindings
			  	var i;
			  	for(i=0;i<jsonPaths.length;i++)
		        {
		            var jsonObject1 = jsonPaths[i];
		            var value = jsonObject1.class["value"];
					//console.log(value)
					//paths.push(value)
					paths.push(pathShortener(value))
		        }
		        /*finishedAsync = _.after(i, createDocumentation);
		        getClassesProperties(paths)*/

				finalResponse({results: paths})
	    	} catch (e){
				console.log(e)
				finalResponse({error: "API to LOD -> Error querying the endpoint"})
			}
		  });
		});

		req.on('error', function(e) {
		  console.log('ERROR: ' + e.message);
		  finalResponse({error: "API to LOD -> Error querying the endpoint"})
		});
	} catch (e){
		console.log(e)
		finalResponse({error: "API to LOD -> Error querying the endpoint"})
	}
};

//UAPI guided function
function getEndpointClassFromPath(pathValue){
	//console.log("getEndpointClassFromPath " + pathValue)
	/*try {
		pathResource = path.substring(1)
    } catch(e) {
        console.log(e);
    }*/

	var httpGet = endpoint + '?query=' + escape('SELECT DISTINCT ?class WHERE { ?s a ?class . ' + 'FILTER (?class LIKE \'%' + pathValue + '%\')' + ' }')
	  + '&format=application%2Fsparql-results%2Bjson' + '&timeout=5000'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	var req = http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//response.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var results = data
		try {
		    results = JSON.parse(data)
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		    console.log(data);
		}

		//var paths = []
		var jsonPaths = []
		try {
		    jsonPaths = results.results.bindings
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		}
	  	var i;
	  	for(i=0;i<jsonPaths.length;i++)
        {
            var jsonObject1 = jsonPaths[i];
            var value = jsonObject1.class["value"];
            var valueShortened = pathShortener(value);
			//console.log(value)
			//paths.push(valueShortened)

			if(pathValue === valueShortened){
				//TODO: se podría llamar directamente sin comprobar si ese recurso existe (?)
				//console.log("generateSparql: pathResource=" + pathResource + " properties=" + JSON.stringify(properties))
				getEndpointPropertiesFromClass(value)
				return;
			}
        }

	  	finalResponse({error: 'API to LOD -> Error generating the SPARQL query: check that the endpoint and the path are correct...'})

	  });
	});


	req.on('error', function(e) {
	  console.log('ERROR: ' + e.message);
	  finalResponse({error: "API to LOD -> Error querying the endpoint"})
	});
}
function getEndpointPropertiesFromClass(pathValue){
	//console.log("getEndpointPropertiesFromClass " + pathValue)
	sparql = 'SELECT DISTINCT ?property WHERE { ?s a <' + pathValue + '>; ?property ?o . }'
	var httpGet = endpoint + '?query=' + escape(sparql) + '&format=application%2Fsparql-results%2Bjson' + '&timeout=500'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	var req = http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//response.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var properties = []
		var results = data
		try {
		    results = JSON.parse(data)
			var jsonProperties = results.results.bindings

			try {
			  	var i;
			  	for(i=0;i<jsonProperties.length;i++)
		        {
		            var jsonObject1 = jsonProperties[i];
		            var value = jsonObject1.property["value"];
					//console.log(value)
					properties.push({name: pathShortener(value), schema : { type : "string" }, in: "query"})
		        }

			} catch (e) {
			    if (e instanceof SyntaxError) {
			        console.log(e)
			    }
			}

	  		finalResponse({results: properties})

		} catch (e) {
		    if (e instanceof SyntaxError) {
		        //console.log(e)
		    }
		    console.log("Error at: " + data)
	  		finalResponse({error: "API to LOD -> Error querying the endpoint"})
		}
	  });
	});


	req.on('error', function(e) {
	  console.log('ERROR: ' + e.message);
	  finalResponse({error: "API to LOD -> Error querying the endpoint"})
	});
}

// Documentation function
function getEndpointClasses(){
	//Query similar
	/*
		SELECT DISTINCT ?directSub WHERE {
	    ?directSub rdfs:subClassOf ?super .
	    OPTIONAL {
	        ?directSub rdfs:subClassOf ?otherSub .
	        FILTER (?otherSub = ?directSub)
	    }
	    FILTER (!BOUND(?otherSub ))
	}*/
	var httpGet = endpoint + '?query=' + escape('SELECT DISTINCT ?class WHERE { ?s a ?class . }') + '&format=application%2Fsparql-results%2Bjson' + '&timeout=10000'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	try{
		var req = http.get(httpGet, (resp) => {
		  let data = '';

		  // A chunk of data has been recieved.
		  resp.on('data', (chunk) => {
		    data += chunk;
		  });

		  // The whole response has been received. Print out the result.
		  resp.on('end', () => {
		  	//console.log("data: " + data);
		  	//response.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

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


			try {
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
	    	} catch (e){
				console.log(e)
				finalResponse({error: "API to LOD -> Error querying the endpoint"})
			}
		  });
		});

		req.on('error', function(e) {
		  console.log('ERROR: ' + e.message);
		  finalResponse({error: "API to LOD -> Error querying the endpoint"})
		});
	} catch (e){
		console.log(e)
		finalResponse({error: "API to LOD -> Error querying the endpoint"})
	}
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
	sparql = 'SELECT DISTINCT ?property WHERE { ?s a <' + pathValue + '>; ?property ?o . }'
	var httpGet = endpoint + '?query=' + escape(sparql) + '&format=application%2Fsparql-results%2Bjson' + '&timeout=200'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	var req = http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//response.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var properties = []
		var results = data
		try {
		    results = JSON.parse(data)
			var jsonProperties = results.results.bindings

			try {
			  	var i;
			  	for(i=0;i<jsonProperties.length;i++)
		        {
		            var jsonObject1 = jsonProperties[i];
		            var value = jsonObject1.property["value"];
					//console.log(value)
					properties.push({name: pathShortener(value), schema : { type : "string" }, in: "query"})
		        }

			} catch (e) {
			    if (e instanceof SyntaxError) {
			        console.log(e)
			    }
			}

	    	addPathToDoc(pathValue, properties)

		} catch (e) {
		    if (e instanceof SyntaxError) {
		        //console.log(e)
		    }
		    console.log("Error at: " + data)
		    finishedAsync()
		}
	  });
	});


	req.on('error', function(e) {
	  console.log('ERROR: ' + e.message);
	  finalResponse({error: "API to LOD -> Error querying the endpoint"})
	});
}

// Documentation function
function addPathToDoc(pathValue, properties){

	//var path = { path: pathValue, parameters: properties}
	//console.log(pathValue)
	//documentation.paths.push(path)
	var pathShortened = pathShortener(pathValue)

	try{
		documentation.paths['/'].get.parameters[1].examples[pathShortened] = 
            JSON.parse("{\"summary\" : \"Example " + pathShortened + "\", \"value\" : \"" + pathShortened + "\"}");
    } catch(e){
    	console.log(e);
    }

    try{
    	documentation.components.schemas[pathShortened] = 
    		JSON.parse("{\"xml\" : { \"name \": \"" + pathShortened + "\"}, \"type\" : \"object\", \"properties\" : {} }");
    } catch(e){
    	console.log(e)
    }


    try{
    	for(var i = 0; i < properties.length; i++){
    		//TODO: example value
    		documentation.components.schemas[pathShortened].properties[properties[Object.keys(properties)[i]].name] = 
    			JSON.parse("{\"type\" : \"string\", \"example\" : \"" + "value" + "\" }");;
    	}
    } catch(e){
    	console.log(e)
    }

	finishedAsync()
	

}

// Documentation function
function initDoc(){
	documentation = openapiTemplate;

	try{
		var openapiTemplateString = JSON.stringify(openapiTemplate)
		openapiTemplateString = openapiTemplateString.split("defaultEndpointURL").join(endpoint);
		//console.log(openapiTemplateString)
		documentation = JSON.parse(openapiTemplateString);
	} catch(e){
		console.log(e);
	}
}

// Documentation function
function createDocumentation(){
	console.log('createDocumentation')

	try{
		finalResponse({results: documentation})
	} catch (e) {
		console.log(e)
	}
}

function pathShortener(pathValue){
	if(pathValue.includes('#')){
		var splitedHastag = pathValue.split('#')
		return splitedHastag[splitedHastag.length - 1]
	} else if(pathValue.includes('/')){
		var splitedSlash = pathValue.split('/')
		return splitedSlash[splitedSlash.length - 1]
	} else {
		return pathValue
	}
}

// API to SPARQL function
function getEndpointClassesFromResource(){

	var pathResource = path
	/*try {
		pathResource = path.substring(1)
    } catch(e) {
        console.log(e);
    }*/

	var httpGet = endpoint + '?query=' + escape('SELECT DISTINCT ?class WHERE { ?s a ?class . ' + 'FILTER (?class LIKE \'%' + pathResource + '%\')' + ' }')
	  + '&format=application%2Fsparql-results%2Bjson' + '&timeout=5000'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	var req = http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//response.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

		// Return data to users formatted in JSON
		//
		var results = data
		try {
		    results = JSON.parse(data)
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		    console.log(data);
		}

		//var paths = []
		var jsonPaths = []
		try {
		    jsonPaths = results.results.bindings
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		}
	  	var i;
	  	for(i=0;i<jsonPaths.length;i++)
        {
            var jsonObject1 = jsonPaths[i];
            var value = jsonObject1.class["value"];
            var valueShortened = pathShortener(value);
			//console.log(value)
			//paths.push(valueShortened)

			if(pathResource === valueShortened){
				//TODO: se podría llamar directamente sin comprobar si ese recurso existe (?)
				console.log("generateSparql: pathResource=" + pathResource + " properties=" + JSON.stringify(properties))
				getClassPropertiesFromParameters(value, properties, generateSparql)
				return;
			}
        }

	  	finalResponse({error: 'API to LOD -> Error generating the SPARQL query: check that the endpoint and the path are correct...'})

	  });
	});


	req.on('error', function(e) {
	  console.log('ERROR: ' + e.message);
	  finalResponse({error: "API to LOD -> Error querying the endpoint"})
	});
};

// API to SPARQL function
function getClassPropertiesFromParameters(pathValue, properties, callback){
	var httpGet = endpoint + '?query=' + escape('SELECT DISTINCT ?property WHERE { ?s a <' + pathValue + '>; ?property ?o . }') + '&format=application%2Fsparql-results%2Bjson'  + '&timeout=500'
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	var req = http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//response.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

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


		var propertiesJson = properties
		try { 
			propertiesJson = JSON.parse(properties)
		} catch (e) {
		    if (e instanceof SyntaxError) {
		        console.log(e)
		    }
		}
		var newProperties = []
	  	var jsonProperties = results.results.bindings
	  	var i;
	  	for(i=0; i < jsonProperties.length; i++)
        {
            var jsonObject1 = jsonProperties[i]
            var value = jsonObject1.property["value"]
            var valueShortened = pathShortener(value)
		  	fieldsArray.push(valueShortened)

			//console.log(value)
			//properties.push({name: pathShortener(value), schema : { type : "string" }, in: "query"})
			try{
				var j
				for(j = 0; j < Object.keys(propertiesJson).length; j++){
					if(valueShortened === unescape(Object.keys(propertiesJson)[j])){
						var valueToAdd = unescape(Object.keys(propertiesJson).map((k) => propertiesJson[k])[j])
						newProperties.push({name: value, value: valueToAdd})
					}
				}
			} catch(e){
				console.log(e)
			}
        }

        callback(pathValue, newProperties)

	  });
	});


	req.on('error', function(e) {
	  console.log('ERROR: ' + e.message);
	  finalResponse({error: "API to LOD -> Error querying the endpoint"})
	});
}

// API to SPARQL function
function generateSparql(pathToResource, properties){
	// generate query taking path and parameter values into account
	var sparql = 'SELECT DISTINCT ?subject ?predicate ?object WHERE { ?subject rdf:type <' + pathToResource + 
		'> . ?subject ?predicate ?object . ';
	
	try{
		var i 
		for(i = 0; i < properties.length; i++){
			sparql += ' ?subject <' + properties[i].name + '> ?property' + pathShortener(properties[i].name) + ' '
			sparql += ' FILTER (?property' + pathShortener(properties[i].name) + ' LIKE \'%' + properties[i].value + '%\') '
		}
	} catch(e){
		console.log(e)
	}

	sparql += ' } '

	//TODO: apply limit and offset correctly to improve performance
	/*try{
		if(limit){
			sparql += ' LIMIT ' + limit + ' '
		}
		if(offset){
			sparql += ' OFFSET ' + offset + ' '
		}
	} catch (e){
		console.log(e)
	}*/

	console.log("sparql query generated: " + sparql)


	var httpGet = endpoint + '?query=' + escape(sparql)  + '&format=application%2Fsparql-results%2Bjson' + '&timeout=5000'
	console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	var req = http.get(httpGet, (resp) => {
	  let data = '';

	  // A chunk of data has been recieved.
	  resp.on('data', (chunk) => {
	    data += chunk;
	  });

	  // The whole response has been received. Print out the result.
	  resp.on('end', () => {
	  	//console.log("data: " + data);
	  	//response.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

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

		returnResults(results, sparql)
	  	
	  });

	}).on("error", (err) => {
	  console.log("Error: " + err.message);
	  finalResponse({error: 'API to LOD -> Error querying the endpoint'})
	});
}

// SPARQL to endpoint function
function sparqlQuery(sparql, sparqlGraph, debug, timeout){
	var httpGet

	var sparqlGraphParameter = ''
	var formatParameter = ''
	var debugParameter = ''
	var timeoutParameter = ''

	if(sparql === undefined){
		// Get all triples
		var limitParameter = ''
		var offsetParameter = ''
		if(limit){
			limitParameter = ' LIMIT ' + limit
		}
		if(offset){
			offsetParameter = ' OFFSET ' + offset
		}

		sparql = 'SELECT DISTINCT ?subject ?predicate ?object WHERE {?subject ?predicate ?object} ' + limitParameter + offsetParameter
	}

	if(sparqlGraph !== undefined){
		sparqlGraphParameter = '&default-graph-uri=' + sparqlGraph
	}

	if(format !== undefined){
		if(format==="json"){
			formatParameter = '&format=application%2Fsparql-results%2Bjson'
		} else{
			if(format==="triples"){
				format = 'application%2Fsparql-results%2Bjson'
			}
			formatParameter = '&format=' + format
		}
	} 

	if(debug !== undefined){
		debugParameter = '&debug=' + debug
	}
	
	if(timeout !== undefined){
		timeoutParameter = '&timeout=' + timeout
	}
		
	httpGet = endpoint + '?query=' + escape(sparql) + sparqlGraphParameter + formatParameter + debugParameter + timeoutParameter
	
	console.log("httpGet: " + httpGet)

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
	  	//response.send('API to LOD -> OK <br><br>'+ JSON.stringify(data))

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
	  	
	  	returnResults(results, sparql);
	  });

	}).on("error", (err) => {
	  console.log("Error: " + err.message);
	  finalResponse({error: 'API to LOD -> Error querying the endpoint'})
	});
};

function returnResults(results, sparql){
	console.log("format: " + format)
	try{
		if(format === "application%2Fsparql-results%2Bjson" || format === "triples"){

	        var limitNumber = results.results.bindings.length
	        var offsetNumber = 0
	        try{
			  	if(limit){
			  		limitNumber = parseInt(limit)
			  	}
			  	if(offset) {
			  		offsetNumber = parseInt(offset)
			  	}
			} catch (e){
				console.log(e)
			}
		  	
	        results.results.bindings = results.results.bindings.slice(offsetNumber, offsetNumber + limitNumber)
		  	finalResponse({results: results, query: sparql})
		}
		else {
			var jsonResults = results.results.bindings
		  	var jsonResultsParsed = []
		  	var jsonFinalResults = {results: []}
		  	var objectNameAuxArray = []
		  	var jsonResultsParsedAux = []
		  	var objectNameAux
		  	var objectName
		  	var yaEncontrado = false
		  	var i
		  	for(i = 0; i < jsonResults.length; i++)
	        {
	        	// Uncomment for debugging ONLY
	        	/*console.log("Check results: ")
	        	console.log(jsonResultsParsed)
	        	var reloj
	        	for(reloj = 0; reloj < 1000000000; reloj++){
	        		reloj = reloj + 1
	        	}*/

			    objectName = pathShortener(jsonResults[i].subject.value)
	        	//console.log("Check last object name from results: " + JSON.stringify(lastAux))
	        	var last = jsonResultsParsedAux[jsonResultsParsedAux.length-1]
	        	if(objectName !== last){
	        		// Search for the same JSON Object processed before (but not last one)
	        		var j
		        	for(j=0; j < objectNameAuxArray.length; j++){
		        		//console.log(JSON.stringify(Object.keys(objectNameAuxArray[j])[0]))
						if(objectName === Object.keys(objectNameAuxArray[j])[0]){
			        		//console.log("Same object")
		        			yaEncontrado = true
			        		var jsonObject = jsonResultsParsed[Object.keys(jsonResultsParsed)[objectNameAuxArray[j][objectName]]] // search for correct index
				        	var propertyName = pathShortener(jsonResults[i].predicate.value)
				        	var propertyValue = pathShortener(jsonResults[i].object.value)
				        	 // avoid deleting existing properties with same key		
				        	if(jsonObject[objectName][propertyName] !== undefined ){
			        			if(jsonObject[objectName][propertyName] != propertyValue){
					        		if(! Array.isArray (jsonObject[objectName][propertyName]) ){
									   var objectToArrayAux = jsonObject[objectName][propertyName]
									   jsonObject[objectName][propertyName] = []

									}
										
									jsonObject[objectName][propertyName].push(propertyValue)	
								}			
				        	} else {
								jsonObject[objectName][propertyName] = propertyValue
				        	}
							jsonResultsParsed[Object.keys(jsonResultsParsed)[objectNameAuxArray[j][objectName]]] = jsonObject
			        	}
		        	}
	        	}	
	        	// If the last object in results is the same that this one, merge properties and values
	        	else if(objectName === last){
			        //console.log("Same previous object")
		        	yaEncontrado = true

	        		var jsonObject = jsonResultsParsed[Object.keys(jsonResultsParsed)[Object.keys(jsonResultsParsed).length - 1]]
		        	var propertyName = pathShortener(jsonResults[i].predicate.value)
		        	var propertyValue = pathShortener(jsonResults[i].object.value)
		        			//console.log(objectName)
			        		//console.log(JSON.stringify(jsonObject)) 
		        	 // avoid deleting existing properties with same key		
		        	if(jsonObject[objectName][propertyName] !== undefined ){
		        		if(jsonObject[objectName][propertyName] != propertyValue){
			        		if(! Array.isArray (jsonObject[objectName][propertyName]) ){
							   var objectToArrayAux = jsonObject[objectName][propertyName]
							   jsonObject[objectName][propertyName] = []

							}
								
							jsonObject[objectName][propertyName].push(propertyValue)
						}			
		        	} else {
						jsonObject[objectName][propertyName] = propertyValue
		        	}
					jsonResultsParsed[Object.keys(jsonResultsParsed)[Object.keys(jsonResultsParsed).length - 1]] = jsonObject
	        	}

	        	// If this object wasn't processed before, insert it into the results
	        	if(!yaEncontrado) {
	        		//console.log("Different object")
		        	var propertyName = pathShortener(jsonResults[i].predicate.value)
		        	var propertyValue = pathShortener(jsonResults[i].object.value)

		            var jsonObject = { }
		            var jsonObjectProperty = { }
		            jsonObjectProperty[propertyName] = propertyValue
		            jsonObject[objectName] = jsonObjectProperty

		            // Add JSON-LD Context property
		            if(format === "json-ld"){
		            	jsonObject[objectName]["@context"] = jsonResults[i].object.value;
		            	jsonObject[objectName]["@id"] = jsonResults[i].subject.value;
					} 

					//console.log(value)
					jsonResultsParsed.push(jsonObject)
					jsonResultsParsedAux.push(objectName)
					var objAux = { }
					objAux[objectName] = jsonResultsParsed.length - 1
	        		objectNameAuxArray.push(objAux)
	        	}

	        	objectNameAux = pathShortener(jsonResults[i].subject.value)
	        	yaEncontrado = false
			        
			    //console.log(jsonResultsParsed[Object.keys(jsonResultsParsed)[Object.keys(jsonResultsParsed).length - 1]])
	        }

	        var limitNumber = jsonResultsParsed.length
	        var offsetNumber = 0
	        try{
			  	if(limit){
			  		limitNumber = parseInt(limit)
			  	}
			  	if(offset) {
			  		offsetNumber = parseInt(offset)
			  	}
			} catch (e){
				console.log(e)
			}

	        jsonResultsParsed = jsonResultsParsed.slice(offsetNumber, offsetNumber + limitNumber)
			jsonFinalResults.results = jsonResultsParsed
			//var returnResults = JSON.stringify(jsonFinalResults)

			if(format === "csv" || format === "table"){
				try{
					/*console.log('ORIGINAL:');
					console.log(JSON.stringify(jsonFinalResults.Alicante));

					const JSONasPOJO = JSON.parse(JSON.stringify(jsonFinalResults.results));
					console.log('PARSED:');
					console.log(JSONasPOJO);
					const CSVString = JSONasPOJO[0].Alicante.join('\n');

					console.log('CONVERTED:');
					console.log(CSVString);

					finalResponse({results: JSON.stringify(CSVString), query: sparql})*/

					const opts = { fields: fieldsArray }
					//const opts2 = { fields: fieldsArray, header: false }
					var csv = ""
					var csvContents = []
					for(var i = 0; i < Object.values(jsonFinalResults.results).length; i++){
						//console.log("Object.values(jsonFinalResults.results)[i] " + JSON.stringify(Object.values(jsonFinalResults.results[i])))
						csvContents.push(Object.values(jsonFinalResults.results[i])[0])
					}
					//csv = csv.split('\\"').join("")
					//console.log("csv " + csv);
					//console.log("csvContents: " + JSON.stringify(csvContents));
					
					csv += parse(csvContents/*, opts*/);

					if(format === "csv"){
						finalResponseCSV(csv)
					} else {
						finalResponse({results: csv, query: sparql})
					}
				}
				catch(e){
					console.log(e)
					finalResponse({error: "API to LOD -> Error parsing to CSV", query: sparql})
				}
			} 
			else{
				// JSON format
				finalResponse({results: jsonFinalResults, query: sparql})
		  		//finalResponse({results: returnResults, query: sparql})
			}
		}
	} catch(e){
		console.log(e)
		finalResponse({error: "API to LOD -> Error querying the endpoint", query: sparql})
	}
}

function finalResponse(responseObject){
	if(responsed){
		console.log("The response has already been sent to the user");
	} else{
		responsed = true
		console.log("Response sent to user");
		response.json(responseObject)
	}
}

function finalResponseCSV(responseObject){
	if(responsed){
		console.log("The response has already been sent to the user");
	} else{
		responsed = true
		console.log("Response sent to user");
		//response.json(responseObject)
		response.setHeader('Content-disposition', 'attachment; filename=results.csv');
		response.set('Content-Type', 'text/csv');
		response.send(responseObject);
	}
}