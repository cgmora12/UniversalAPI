// routes/routes.js

const http 		 = require('http');
const https = require('https');
var _ = require('underscore');
let openapiTemplate = require('./openapiTemplate.json');
const { parse } = require('json2csv');
var parserXml2json = require('xml2json');

var endpoint
var documentation
var finishedAsync
var finished
var response
var responsed
var path
var properties
var format
var limit
var offset = 0
var pathProperties = []
var fieldsArray = []
var maxResultsForClasses
var pathsResults = []
var pathsResultsAux = []
var end = false;
var wait, waitPaths, waitProperties
var request
var defaultFormatJson = true

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
				defaultFormatJson = true
				checkEndpoint(function(returnValue) {
				  	if(returnValue){
						//get documentation
						//console.log("get documentation")
						initDoc()
						getEndpointClasses()
					} else {
						//console.log("checkEndpoint false")
						finalResponse({error: "API to LOD -> Error querying the endpoint"})
					}
				});
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

					defaultFormatJson = true
					checkEndpoint(function(returnValue) {
					  	if(returnValue){
					  		sparqlQuery(sparql, sparqlGraph, debug, timeout)
					  	} else {
							//console.log("checkEndpoint false")
							finalResponse({error: "API to LOD -> Error querying the endpoint"})
						}
				  	});
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
			
			defaultFormatJson = true

			if(typeof endpoint !== 'undefined' && endpoint){
				
				if (typeof basicQuery !== 'undefined' && basicQuery){

					if(typeof step !== 'undefined' && step){
						if(step == '1'){
							checkEndpoint(function(returnValue) {
							  	if(returnValue){
									getEndpointClassesWithoutProperties()
								} else {
									//console.log("checkEndpoint false")
									finalResponse({error: "API to LOD -> Error querying the endpoint"})
								}
							});
						} else if(step == '2' && typeof path !== 'undefined' && path){
							checkEndpoint(function(returnValue) {
							  	if(returnValue){
									getEndpointPropertiesFromClass(path)
								} else {
									//console.log("checkEndpoint false")
									finalResponse({error: "API to LOD -> Error querying the endpoint"})
								}
							});
						} else {
							checkEndpoint(function(returnValue) {
							  	if(returnValue){
									getEndpointClassesWithoutProperties()
								} else {
									//console.log("checkEndpoint false")
									finalResponse({error: "API to LOD -> Error querying the endpoint"})
								}
							});
						}
					} else {
							checkEndpoint(function(returnValue) {
							  	if(returnValue){
									getEndpointClassesWithoutProperties()
								} else {
									//console.log("checkEndpoint false")
									finalResponse({error: "API to LOD -> Error querying the endpoint"})
								}
							});
					} 
				} else if(typeof path !== 'undefined' && path) {
					//if(path.charAt(0) == '/'){
						console.log('path: ' + path)
						// autogenerate sparql
						// generate sparql query with resource and properties
						checkEndpoint(function(returnValue) {
						  	if(returnValue){
								generateSparql(path, properties)
							} else {
								//console.log("checkEndpoint false")
								finalResponse({error: "API to LOD -> Error querying the endpoint"})
							}
						});
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

function checkEndpoint(callback){
	console.log("checkEndpoint")
	var httpGet = endpoint + '?query=' + escape('SELECT ?s WHERE{ ?s ?p ?o . } LIMIT 1') + '&timeout=10000'

	if(defaultFormatJson){
		httpGet += '&format=application%2Fsparql-results%2Bjson' 
	}

	try{
		if(endpoint.includes("https")){
			request = https
		} else {
			request = http
		}
		var req = request.get(httpGet, (resp) => {
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
			//console.log("data: " + data);
			var results = data
			try {
				var jsonResults
			    if(defaultFormatJson){
					results = JSON.parse(data)
					jsonResults = results.results.bindings
			    } else {
					results = JSON.parse(parserXml2json.toJson(data))
		  			jsonResults = results["sparql"].results.result
			    }

		  		if(typeof jsonResults !== 'undefined' && jsonResults){
					console.log("Endpoint working")
					//console.log(jsonResults)
					callback(true)
	    		} else {
					//console.log("return false")
					callback(false)
	    		}
		    	
	    	} catch (e){
				if(defaultFormatJson){
					//console.log("return false checkEndpoint again with default format")
					defaultFormatJson = false;
					checkEndpoint(callback);
				} else {
					//console.log("return false catch")
					callback(false)
				}
			}
		  });
		});

		req.on('error', function(e) {
			console.log('ERROR: ' + e)
			callback(false)
		});

		req.end()
	} catch (e){
		console.log(e)
		callback(false)
	}
	
}

// UAPI guided function
async function getEndpointClassesWithoutProperties(){
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
	maxResultsForClasses = 1000
	end = false;
	pathsResults = []
	wait = new Array();

	var count = 0; 
	var intervalObject = setInterval(function () {
        //console.log(count, 'seconds passed'); 
        if (end) { 
        	var waitBool = false
        	for(var waitIndex = 0; waitIndex < wait.length; waitIndex++){
        		if(wait[waitIndex] == true){
        			waitBool = true
        		}
        	}
        	//console.log(JSON.stringify(wait))
        	if(!waitBool){
	            console.log('Return results');
	        	clearInterval(intervalObject);  
				//finishedAsync = _.after(count, finalResponse, {results: pathsResults});
				if(pathsResults && pathsResults.length > 0){
					finalResponse({results: pathsResults})
				} else {
			  		finalResponse({error: "API to LOD -> Error querying the endpoint"})
				}
			}
        }  else {        	
	        getAsyncEndpointClassesWithoutProperties(count)
	        count++; 
        }
    }, 250); 

	/*for(var i = 0; !end; i++ && setTimeout(function() {console.log('Wait')}, 3000)){
		//console.log("before getAsyncResults");
	    setTimeout(getAsyncResults, 1000, i);
		//console.log("after getAsyncResults");
	}
	finalResponse({results: pathsResults})*/

	/*let promises = [];

	for (let i = 0; i < 10; i++) {
		console.log("before push")
		promises.push(getAsyncResults(i))
		console.log("after push")
	}

		console.log("before await")
	const results = await Promise.all(promises).then(finalResponse({results: pathsResults}))
		console.log("after await")*/
	

	
};

// UAPI guided function
async function getAsyncEndpointClassesWithoutProperties(counter){
	//console.log("getAsyncResults" + i);
	var offsetAsync = (maxResultsForClasses * counter)
	var httpGet = endpoint + '?query=' + escape('SELECT DISTINCT ?class WHERE { { SELECT DISTINCT ?class WHERE { ?s a ?class . }' + ' } } ORDER BY(?class) ' + ' LIMIT ' + maxResultsForClasses + ' OFFSET ' + offsetAsync) 
			+ '&timeout=2000'
	
	if(defaultFormatJson){
		httpGet += '&format=application%2Fsparql-results%2Bjson' 
	}
	//console.log(httpGet);

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	try{
		wait[counter] = true
		if(endpoint.includes("https")){
			request = https
		} else {
			request = http
		}
		var req = request.get(httpGet, (resp) => {
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
			//console.log("data: " + data);
			var results = data
			try {
				var jsonPaths
			    if(defaultFormatJson){
					results = JSON.parse(data)
					jsonPaths = results.results.bindings
			    } else {
				    results = JSON.parse(parserXml2json.toJson(data))
			  		jsonPaths = results["sparql"].results.result
			    }
		  		if(typeof jsonPaths !== 'undefined' && jsonPaths && jsonPaths.length > 0){
					//console.log(JSON.stringify(jsonPaths));
				  	var i;
				  	for(i = 0; i < jsonPaths.length; i++)
			        {
			            var jsonObject1 = jsonPaths[i];
			            var value 
			            if(defaultFormatJson){
			            	value = jsonObject1.class["value"]
			            } else {
			            	value = jsonObject1.binding.uri;
			            }
						//console.log(value)
						//pathsResults.push(value)
						if(typeof value !== 'undefined' && value && value !== ""){
							pathsResults.push({ id: value, value: pathShortener(value)})
						}
			        }
			        
					wait[counter] = false
					//console.log("finished")
			        /*finishedAsync = _.after(i, createDocumentation);
			        getClassesProperties(pathsResults)*/
		    		//finishedAsync()
	    		} else {
	    			end = true
					wait[counter] = false
	    			//console.log("end")
		    		//finishedAsync()
	    		}
		    	
	    	} catch (e){
				console.log(e)
				//console.log(JSON.stringify(results))
				//console.log(data)
		  		end = true
				wait[counter] = false
			}
		  });
		});

		req.on('error', function(e) {
		  console.log('ERROR: ' + e.message);
		  end = true
		  wait[counter] = false
		  //finalResponse({error: "API to LOD -> Error querying the endpoint"})
		});
		
		req.end()
	} catch (e){
		console.log(e)
		end = true
		wait[counter] = false
		//finalResponse({error: "API to LOD -> Error querying the endpoint"})
	}
}

// UAPI guided function
function getEndpointPropertiesFromClass(pathValue){
	//console.log("getEndpointPropertiesFromClass " + pathValue)
	try{
		sparql = 'SELECT DISTINCT ?property WHERE { ?s a <' + pathValue + '>; ?property ?o . }'
		var httpGet = endpoint + '?query=' + escape(sparql) 
					+ '&timeout=500'
		if(defaultFormatJson){
			httpGet += '&format=application%2Fsparql-results%2Bjson' 
		}
		//console.log(httpGet)

		// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
		//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		
		if(endpoint.includes("https")){
			request = https
		} else {
			request = http
		}
		var req = request.get(httpGet, (resp) => {
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
				var jsonProperties
			    if(defaultFormatJson){
					results = JSON.parse(data)
					jsonProperties = results.results.bindings
			    } else {
				    results = JSON.parse(parserXml2json.toJson(data))
			  		jsonProperties = results["sparql"].results.result
			    }

				try {
				  	var i;
				  	//console.log(JSON.stringify(jsonProperties))
				  	for(i=0; i < jsonProperties.length; i++)
			        {
			            var jsonObject1 = jsonProperties[i];
			            var value
			            if(defaultFormatJson){
			            	value = jsonObject1.property["value"];
			            } else{
			            	value = jsonObject1.binding.uri;
			            }

						//console.log(value)
						properties.push({id: value, name: pathShortener(value), schema : { type : "string" }, in: "query"})
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

		req.end()
	} catch (e) {
	    console.log(e)
  		finalResponse({error: "API to LOD -> Error querying the endpoint"})
	}
}


// API to SPARQL function
function generateSparql(pathToResource, properties){
	// generate query taking path and parameter values into account

	var sparql
	var limitBoolean = false, offsetBoolean = false

	//console.log("Limit: " + limit)
	//console.log("Offset: " + offset)
	if((typeof limit !== "undefined" && limit) || (typeof offset !== "undefined" && offset)){
		console.log("Limit and offset")
		if(offset === "" || isNaN(offset)){
			offset = 0
		} else{			
			offsetBoolean = true
		}

		sparql = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' 
				+ ' SELECT DISTINCT ?subject WHERE { { SELECT DISTINCT ?subject WHERE { ?subject rdf:type <' + pathToResource + 
				'> . ';
	
		try{
			if(typeof properties !== "undefined" && properties){
				var i 
				var properties = JSON.parse(properties)
				//console.log(JSON.stringify(Object.keys(properties)))
				//console.log(JSON.stringify(Object.values(properties)))
				for(i = 0; i < Object.keys(properties).length; i++){
					sparql += ' ?subject <' + Object.keys(properties)[i] + '> ?property' + pathShortener(Object.keys(properties)[i]) + ' '
					sparql += ' FILTER (?property' + pathShortener(Object.keys(properties)[i]) + ' LIKE \'%' + Object.values(properties)[i] + '%\') '
				}
			}
		} catch(e){
			console.log(e)
		}

		sparql += ' } ' + ' } } ORDER BY(?subject) '

		console.log("sparql query generated: " + sparql)

		maxResultsForClasses = 1000
		if(limit && limit.length > 0 && limit > 0){
			limitBoolean = true
			if(limit < maxResultsForClasses){
				maxResultsForClasses = limit
			}
		}
		
	} else{
		sparql =  'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' 
				+ ' SELECT DISTINCT ?subject ?predicate ?object WHERE { { SELECT DISTINCT ?subject ?predicate ?object WHERE { ?subject rdf:type <' + pathToResource + 
				'> . ?subject ?predicate ?object . ';
	
		try{
			if(typeof properties !== "undefined" && properties){
				var i 
				var properties = JSON.parse(properties)
				//console.log(JSON.stringify(Object.keys(properties)))
				//console.log(JSON.stringify(Object.values(properties)))
				for(i = 0; i < Object.keys(properties).length; i++){
					sparql += ' ?subject <' + Object.keys(properties)[i] + '> ?property' + pathShortener(Object.keys(properties)[i]) + ' '
					sparql += ' FILTER (?property' + pathShortener(Object.keys(properties)[i]) + ' LIKE \'%' + Object.values(properties)[i] + '%\') '
				}
			}
		} catch(e){
			console.log(e)
		}

		sparql += ' } ' + ' } } ORDER BY(?subject) '

		console.log("sparql query generated: " + sparql)

		maxResultsForClasses = 1000

	}


	end = false;
	pathsResults = []
	wait = new Array();

	var count = 0; 
	var intervalObject = setInterval(function () {
        //console.log(count, 'seconds passed'); 
        if (end) { 
        	var waitBool = false
        	for(var waitIndex = 0; waitIndex < wait.length; waitIndex++){
        		if(wait[waitIndex] == true){
        			waitBool = true
        		}
        	}
        	//console.log(JSON.stringify(wait))
        	if(!waitBool){
	        	clearInterval(intervalObject);  
				//finishedAsync = _.after(count, finalResponse, {results: pathsResults});
				if(pathsResults && pathsResults.length > 0){
					if(limitBoolean || offsetBoolean){
						//console.log("pathsResults: " + JSON.stringify(pathsResults))
						pathsResultsAux = []
						for(var pathIndex = 0; pathIndex < pathsResults.length; pathIndex++){
							generateSparqlFromPath(pathsResults[pathIndex], properties, limitBoolean, offsetBoolean, pathIndex, pathsResults.length)
						}
					} else {
	            		console.log('Return results');
						returnResults(pathsResults, sparql)
					}
				} else {
			  		finalResponse({error: "API to LOD -> Error querying the endpoint"})
				}
			}
        }  else {  

			/*if(limit && limit.length > 0 && limit > 0){
	        	if(maxResultsForClasses * count > limit){
	        		end = true;
	        	} else {
		        	getAsyncFinalResults(sparql, count)
	        	}
			}*/// else {
	        	getAsyncFinalResults(sparql, count, limitBoolean, offsetBoolean)
        	//}    	
	        count++; 
        }
    }, 250); 

	
	
}


// API to SPARQL function
function generateSparqlFromPath(pathsResult, properties, limitBoolean, offsetBoolean, pathIndex, pathLength){
	// generate query taking path and parameter values into account

	var sparql

	//console.log("Limit: " + limit)
	//console.log("Offset: " + offset)
	if(offset === "" || isNaN(offset)){
		offset = 0
	}

	try{
		//console.log("pathsResult: " + JSON.stringify(pathsResult))
		sparql = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' + ' SELECT DISTINCT ?predicate ?object WHERE { { SELECT DISTINCT ?predicate ?object WHERE { <' 
			+ pathsResult.subject.value + '> ?predicate ?object . ';

		if(typeof properties !== "undefined" && properties){
			var i 
			var properties = JSON.parse(properties)
			//console.log(JSON.stringify(Object.keys(properties)))
			//console.log(JSON.stringify(Object.values(properties)))
			for(i = 0; i < Object.keys(properties).length; i++){
				sparql += ' <' + pathsResult + '<' + Object.keys(properties)[i] + '> ?property' + pathShortener(Object.keys(properties)[i]) + ' '
				sparql += ' FILTER (?property' + pathShortener(Object.keys(properties)[i]) + ' LIKE \'%' + Object.values(properties)[i] + '%\') '
			}
		}
	} catch(e){
		console.log(e)
	}

	sparql += ' } ' + ' } } ORDER BY(?predicate)'

	//console.log("sparql query generated: " + sparql)

	maxResultsForClasses = 1000


	end = false;
	//pathsResults = []
	wait = new Array();

	var count = 0; 
	var intervalObject = setInterval(function () {
        //console.log(count, 'seconds passed'); 
        if (end) { 
        	var waitBool = false
        	for(var waitIndex = 0; waitIndex < wait.length; waitIndex++){
        		if(wait[waitIndex] == true){
        			waitBool = true
        		}
        	}
        	//console.log(JSON.stringify(wait))
        	if(!waitBool){
	        	clearInterval(intervalObject);  
				//finishedAsync = _.after(count, finalResponse, {results: pathsResults});
				if(pathIndex >= pathLength - 1){
	            	console.log('Return results');
					if(pathsResultsAux && pathsResultsAux.length > 0){
						returnResults(pathsResultsAux, sparql)
					} else {
				  		finalResponse({error: "API to LOD -> Error querying the endpoint"})
					}
				}
			}
        }  else {  

			/*if(limit && limit.length > 0 && limit > 0){
	        	if(maxResultsForClasses * count > limit){
	        		end = true;
	        	} else {
		        	getAsyncFinalResults(sparql, count)
	        	}
			}*/// else {
	        	getAsyncFinalResults(sparql, count, limitBoolean, offsetBoolean, pathsResult)
        	//}    	
	        count++; 
        }
    }, 250); 

	
}


// API to SPARQL function
async function getAsyncFinalResults(sparql, counter, limitBoolean, offsetBoolean, pathsResult){
	try{
		wait[counter] = true
		
		var offsetInitial = 0
		if (offsetBoolean){
			offsetInitial = offset
		}
		var offsetAsync = (maxResultsForClasses * counter) + parseInt(offsetInitial)
		var httpGet = endpoint + '?query=' + escape(sparql  + ' LIMIT ' + maxResultsForClasses + ' OFFSET ' + offsetAsync)  
					+ '&timeout=5000'
		if(defaultFormatJson){
			httpGet += '&format=application%2Fsparql-results%2Bjson' 
		}
		
		//console.log(httpGet)
		

		// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
		//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		
		if(endpoint.includes("https")){
			request = https
		} else {
			request = http
		}
		var req = request.get(httpGet, (resp) => {
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
				var jsonPaths
			    if(defaultFormatJson){
					results = JSON.parse(data)
					jsonPaths = results.results.bindings
			    } else {
				    results = JSON.parse(parserXml2json.toJson(data))
			  		jsonPaths = results["sparql"].results.result
			    }

		  		if(typeof jsonPaths !== 'undefined' && jsonPaths && jsonPaths.length > 0){
		  			for(var pathIndex = 0; pathIndex < jsonPaths.length; pathIndex++){
		  				if((limitBoolean || offsetBoolean) && typeof pathsResult !== "undefined" && pathsResult){
		  					jsonPaths[pathIndex].subject = pathsResult.subject
		  					pathsResultsAux.push(jsonPaths[pathIndex])
		  				} else {
		  					pathsResults.push(jsonPaths[pathIndex])
		  				}
		  			}

		  			if(limitBoolean && typeof pathsResult == "undefined"){
			  			if(pathsResults.length >= limit){
			  				end = true;
			  			}
			  		} 
			  		/*if(limitBoolean && typeof pathsResult !== "undefined" && pathsResult){
			  			if(pathsResultsAux.length >= limit){
			  				end = true;
			  				console.log("End true aux: " + pathsResultsAux.length)
			  			}

		  			}*/
					wait[counter] = false
	    		} else {
	    			end = true
					wait[counter] = false
	    		}
			} catch (e) {
				wait[counter] = false
				end = true;
			    console.log(e)
			    console.log(data)
			}
		  	
		  });

		}).on("error", (err) => {
			wait[counter] = false
			end = true;
		  	console.log("Error: " + err.message);
		});
	} catch (e) {
	 	console.log(e)
		wait[counter] = false
		end = true;
	}
}

// Documentation function
function getEndpointClasses(){

	maxResultsForClasses = 1000
	end = false;
	pathsResults = []
	wait = new Array();
	waitPaths = new Array();

	var count = 0; 
	var intervalObject = setInterval(function () {
        //console.log(count, 'seconds passed'); 
        if (end) { 
        	var waitBool = false
        	for(var waitIndex = 0; waitIndex < wait.length; waitIndex++){
        		if(wait[waitIndex] == true){
        			waitBool = true
        		}
        	}
	        //console.log("wait : " + JSON.stringify(wait))
        	if(!waitBool){
        		var waitPathsBool = false
	        	for(var waitPathsIndex = 0; waitPathsIndex < waitPaths.length; waitPathsIndex++){
	        		if(waitPaths[waitPathsIndex] == true){
	        			waitPathsBool = true
	        		}
	        	}
	        	//console.log("waitPaths : " + JSON.stringify(waitPaths))
	        	if(!waitPathsBool){
		            console.log('Return results'); 
		        	clearInterval(intervalObject); 
					if(pathsResults && pathsResults.length > 0){
						createDocumentation()
					} else {
				  		finalResponse({error: "API to LOD -> Error querying the endpoint"})
					}
				}
			}
        }  
        else{        	
	        getAsyncEndpointClasses(count)
	        count++; 
        }
    }, 250); 
	
}

// Documentation function
async function getAsyncEndpointClasses(counter){
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
	var offsetAsync = (maxResultsForClasses * counter)
	var httpGet = endpoint + '?query=' + escape('SELECT DISTINCT ?class WHERE { { SELECT DISTINCT ?class WHERE { ?s a ?class . }' + ' } } ORDER BY(?class) ' + ' LIMIT ' + maxResultsForClasses + ' OFFSET ' + offsetAsync) 
			+ '&timeout=2000'
	if(defaultFormatJson){
		httpGet += '&format=application%2Fsparql-results%2Bjson' 
	}
	//console.log(httpGet)

	// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
	//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
	try{
		wait[counter] = true
		if(endpoint.includes("https")){
			request = https
		} else {
			request = http
		}
		var req = request.get(httpGet, (resp) => {
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
				var jsonPaths
			    if(defaultFormatJson){
					results = JSON.parse(data)
					jsonPaths = results.results.bindings
			    } else {
				    results = JSON.parse(parserXml2json.toJson(data))
			  		jsonPaths = results["sparql"].results.result
			    }

		  		if(typeof jsonPaths !== 'undefined' && jsonPaths && jsonPaths.length > 0){
					//console.log(JSON.stringify(jsonPaths));
				  	var i;
				  	for(i = 0; i < jsonPaths.length; i++)
			        {
			        	try{
				        	waitPaths[i] = true
				            var jsonObject1 = jsonPaths[i];
				            var value

				            if(defaultFormatJson){
				            	value = jsonObject1.class["value"]
				            } else {
				            	value = jsonObject1.binding.uri;
				            }

							//console.log(value)
							//pathsResults.push(value)
							if(typeof value !== 'undefined' && value && value !== ""){
								pathsResults.push({id: value, value: pathShortener(value)})
								getClassProperties(value, i)
							} else {
				        		waitPaths[i] = false
							}
						} catch(e){
							console.log(e)
			        		waitPaths[i] = false
						}
			        }
			        
					wait[counter] = false
					//console.log("finished")
		    		//finishedAsync()
	    		} else {
	    			end = true
					wait[counter] = false
		    		//finishedAsync()
	    		}
		    	
	    	} catch (e){
				console.log(e)
				console.log("results: " + JSON.stringify(results))
		  		end = true
				wait[counter] = false
			}
		  });
		});

		req.on('error', function(e) {
		  console.log('ERROR: ' + e.message);
		  end = true
		  wait[counter] = false
		  //finalResponse({error: "API to LOD -> Error querying the endpoint"})
		});
		
		req.end()
	} catch (e){
		console.log(e)
		end = true
		wait[counter] = false
		//finalResponse({error: "API to LOD -> Error querying the endpoint"})
	}
}

// Documentation function
async function getClassProperties(pathValue, counter){
	try{
		sparql = 'SELECT DISTINCT ?property WHERE { ?s a <' + pathValue + '>; ?property ?o . }'
		var httpGet = endpoint + '?query=' + escape(sparql)
					+ '&timeout=500'
		if(defaultFormatJson){
			httpGet += '&format=application%2Fsparql-results%2Bjson' 
		}
		//console.log(httpGet)

		// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
		//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		if(endpoint.includes("https")){
			request = https
		} else {
			request = http
		}
		var req = request.get(httpGet, (resp) => {
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
				var jsonProperties
			    if(defaultFormatJson){
					results = JSON.parse(data)
					jsonProperties = results.results.bindings
			    } else {
				    results = JSON.parse(parserXml2json.toJson(data))
			  		jsonProperties = results["sparql"].results.result
			    }

				try {
				  	var i;
				  	for(i = 0; i < jsonProperties.length; i++)
			        {
			            var jsonObject1 = jsonProperties[i];
			            var value
			            if(defaultFormatJson){
			            	value = jsonObject1.property["value"];
			            } else{
			            	value = jsonObject1.binding.uri;
			            }
						//console.log(value)

						properties.push({name: value, description: pathShortener(value), schema : { type : "string" }, in: "query"})
			        }

				} catch (e) {
				    console.log(e)
					waitPaths[counter] = false
				}

		    	addPathToDoc(pathValue, properties, counter)

			} catch (e) {
			    console.log(e)
				waitPaths[counter] = false
			  	//console.log("Error at: " + data)
			    //finishedAsync()
			}
		  });
		});


		req.on('error', function(e) {
		  console.log('ERROR: ' + e.message);
		  waitPaths[counter] = false
		  //finalResponse({error: "API to LOD -> Error querying the endpoint"})
		});
		
		req.end()
	} catch (e) {
	    console.log(e)
		waitPaths[counter] = false
	  	//finalResponse({error: "API to LOD -> Error querying the endpoint"})
	}
}

// Documentation function
async function getAsyncPropertyExampleValue(pathValue, property, counter){
	try{
		waitPaths[counter] = true
		// Get property example:
		// sparql = SELECT DISTINCT ?o WHERE { ?s a <http://geo.linkeddata.es/ontology/Provincia>; <http://www.w3.org/2000/01/rdf-schema#label> ?o . } LIMIT 1
		sparql = 'SELECT DISTINCT ?o WHERE { ?s a <' + pathValue + '>; <' + property + '> ?o . }' + ' LIMIT 1'
		var httpGet = endpoint + '?query=' + escape(sparql)
					+ '&timeout=200'
		if(defaultFormatJson){
			httpGet += '&format=application%2Fsparql-results%2Bjson' 
		}
		//console.log(httpGet)

		// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries, http://www.ontobee.org/tutorial/sparql and https://codyburleson.com/sparql-examples-select/
		//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		//http.get(req.query.endpoint + '?default-graph-uri=&query=PREFIX+rdf%3A+<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>+%0D%0APREFIX+owl%3A+<http%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23>+%0D%0Aselect+%3Fs+%3Flabel+where+%7B%0D%0A+++%3Fs+rdf%3Atype+owl%3AClass+.%0D%0A+++%3Fs+rdfs%3Alabel+%3Flabel+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		//http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fproperty%0D%0AWHERE+%7B%0D%0A++%3Fs+%3Fproperty+%3Fo+.%0D%0A%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
		if(endpoint.includes("https")){
			request = https
		} else {
			request = http
		}
		var req = request.get(httpGet, (resp) => {
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
		  		var jsonProperty
			    if(defaultFormatJson){
					results = JSON.parse(data)
					jsonProperty = results.results.bindings
			    } else {
				    results = JSON.parse(parserXml2json.toJson(data))
			  		jsonProperty = results["sparql"].results.result
			    }

		  		//console.log(JSON.stringify(results))
		  		if(jsonProperty.length > 0){
			  		var exampleValue = ""
		            if(defaultFormatJson){
		            	//console.log("jsonProperty: " + JSON.stringify(jsonProperty))
		            	exampleValue = escape(jsonProperty[0].o["value"]);
		            } else{
		            	if(typeof jsonProperty.binding.uri == "undefined"){
				  			if(typeof jsonProperty.binding.literal == "undefined"){
					  			exampleValue = escape(jsonProperty.binding.bnode)
				  			} else {
				  				exampleValue = escape(jsonProperty.binding.literal)
				  			}
				  		} else {
				  			exampleValue = escape(jsonProperty.binding.uri)
				  		}
		            }
			  		
			  		//console.log("exampleValue: " + exampleValue)
			  		documentation.components.schemas[pathValue].properties[property] = 
		    			JSON.parse("{\"type\" : \"string\", \"example\" : \"" + exampleValue + "\" }");

		  		} 
					
				waitPaths[counter] = false
			} catch (e) {
			    console.log(e)
			    console.log(JSON.stringify(data))
				waitPaths[counter] = false
			  	//console.log("Error at: " + data)
			    //finishedAsync()
			}
		  });
		});


		req.on('error', function(e) {
		  console.log('ERROR: ' + e.message);
		  waitPaths[counter] = false
		  //finalResponse({error: "API to LOD -> Error querying the endpoint"})
		});
		
		req.end()
	} catch (e) {
	    console.log(e)
		waitPaths[counter] = false
	  	//finalResponse({error: "API to LOD -> Error querying the endpoint"})
	}
}

// Documentation function
function addPathToDoc(pathValue, properties, counter){

	//var path = { path: pathValue, parameters: properties}
	//console.log(pathValue)
	//documentation.paths.push(path)
	var pathShortened = pathShortener(pathValue)

	try{
		documentation.paths['/'].get.parameters[1].examples[pathShortened] = 
            JSON.parse("{\"summary\" : \"Example " + pathShortened + "\", \"value\" : \"" + pathValue + "\"}");
    } catch(e){
    	console.log(e);
    }

    try{
    	documentation.components.schemas[pathValue] = 
    		JSON.parse("{\"xml\" : { \"name \": \"" + pathShortened + "\"}, \"type\" : \"object\", \"properties\" : {} }");
    } catch(e){
    	console.log(e)
    }


    try{
    	if(properties && properties.length > 0){
	    	/*for(var i = 0; i < properties.length; i++){
	    		//TODO: example value and shortened version
	    		documentation.components.schemas[pathValue].properties[properties[Object.keys(properties)[i]].name] = 
	    			JSON.parse("{\"type\" : \"string\", \"example\" : \"" + "value" + "\" }");
	    	}*/

	    	var count = 0
			var intervalObject = setInterval(function () {
		        if (count < properties.length) { 
			        getAsyncPropertyExampleValue(pathValue, properties[Object.keys(properties)[count]].name, counter)
			        count++; 
		        }  
		        else{       
			        var waitPathsBool = false
		        	for(var waitPathIndex = 0; waitPathIndex < waitPaths.length; waitPathIndex++){
		        		if(waitPaths[waitPathIndex] == true){
		        			waitPathsBool = true
		        		}
		        	}
		        	//console.log("waitPaths in properties: " + JSON.stringify(waitPaths))
		        	if(!waitPathsBool){ 
			        	clearInterval(intervalObject); 
						
    					waitPaths[counter] = false 	
					}
		        }
		    }, 250); 

    	} else{
    		waitPaths[counter] = false
    	}
    } catch(e){
    	console.log(e)
    	waitPaths[counter] = false
    }
	

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
	if(typeof pathValue !== "undefined" && pathValue && pathValue.length > 0){
		if(pathValue.includes('#')){
			var splitedHastag = pathValue.split('#')
			return splitedHastag[splitedHastag.length - 1]
		} else if(pathValue.includes('/')){
			var splitedSlash = pathValue.split('/')
			return splitedSlash[splitedSlash.length - 1]
		} else {
			return pathValue
		}
	} else {
		return pathValue
	}
}

// SPARQL to endpoint function
function sparqlQuery(sparql, sparqlGraph, debug, timeout){
	try{
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

		/*if(format !== undefined){
			if(format==="json"){
				formatParameter = '&format=application%2Fsparql-results%2Bjson'
			} else{
				if(format==="triples"){
					format = 'application%2Fsparql-results%2Bjson'
				}
				formatParameter = '&format=' + format
			}
		}*/ 

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
		if(endpoint.includes("https")){
			request = https
		} else {
			request = http
		}
		var req = request.get(httpGet, (resp) => {
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
			  	if(defaultFormatJson){
			  		results = JSON.parse(data)
			  	} else {
			    	results = JSON.parse(parserXml2json.toJson(data))
			  	}
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
	} catch (e){
	  console.log(e)
	  finalResponse({error: 'API to LOD -> Error querying the endpoint'})

	}
}

function returnResults(results, sparql){
	console.log("format: " + format)
	//console.log("results: " + JSON.stringify(results).substring(0, 1000))
	try{
		if(format === "application%2Fsparql-results%2Bjson" || format === "triples"){

	        /*var limitNumber = results.length
	        var offsetNumber = 0

			if((typeof limit !== "undefined" && limit) || (typeof offset !== "undefined" && offset)){
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
			  			  	
			  	results = results.slice(offsetNumber, offsetNumber + limitNumber)
		  	} else {
		  		results = results.slice(0, 0 + limitNumber)		  		
		  	}*/
		  	finalResponse({results: results, query: sparql})
		}
		else {
			var jsonFinalResults = {results: []}

			if(defaultFormatJson){
				var jsonResults = results
			  	var jsonResultsParsed = []
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
				    //console.log("objectName: " + objectName);
				    //console.log("jsonResults i: " + JSON.stringify(jsonResults[i]))
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
		        /*var limitNumber = jsonResultsParsed.length
		        var offsetNumber = 0

				if((typeof limit !== "undefined" && limit) || (typeof offset !== "undefined" && offset)){
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
			        
			        jsonResultsParsed = jsonResultsParsed.sort(function (a, b) {
					    return (Object.keys(a)[0]).localeCompare((Object.keys(b)[0]));
					}).slice(offsetNumber, offsetNumber + limitNumber)
				} else {
					jsonResultsParsed = jsonResultsParsed.sort(function (a, b) {
					    return (Object.keys(a)[0]).localeCompare((Object.keys(b)[0]));
					}).slice(0, 0 + limitNumber)
				}*/
				jsonResultsParsed = jsonResultsParsed.sort(function (a, b) {
					    return (Object.keys(a)[0]).localeCompare((Object.keys(b)[0]));
					})
				jsonFinalResults.results = jsonResultsParsed
				//var returnResults = JSON.stringify(jsonFinalResults)
				//finalResponse({results: jsonFinalResults, query: sparql})
			  	//finalResponse({results: returnResults, query: sparql})
			
			} else {
				//console.log(JSON.stringify(results).substring(0, 2000))
				var jsonResults = results
			  	var jsonResultsParsed = []
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

		        	var object, predicate, subject			    
				    for(var bindingIndex = 0; bindingIndex < jsonResults[i].binding.length; bindingIndex++){
						if(jsonResults[i].binding[bindingIndex].name === "subject"){
							if(typeof jsonResults[i].binding[bindingIndex].uri !== "undefined"){
				    			subject = jsonResults[i].binding[bindingIndex].uri
				    		} else {
				    			if(typeof jsonResults[i].binding[bindingIndex].literal !== "undefined"){
					    			subject = jsonResults[i].binding[bindingIndex].literal
					    		} else {
					    			subject = jsonResults[i].binding[bindingIndex].bnode
					    		}
				    		}
				    	}
				    	if(jsonResults[i].binding[bindingIndex].name === "predicate"){
							if(typeof jsonResults[i].binding[bindingIndex].uri !== "undefined"){
				    			predicate = jsonResults[i].binding[bindingIndex].uri
				    		} else {
				    			if(typeof jsonResults[i].binding[bindingIndex].literal !== "undefined"){
					    			predicate = jsonResults[i].binding[bindingIndex].literal
					    		} else {
					    			predicate = jsonResults[i].binding[bindingIndex].bnode
					    		}
				    		}
				    	}
				    	if(jsonResults[i].binding[bindingIndex].name === "object"){
							if(typeof jsonResults[i].binding[bindingIndex].uri !== "undefined"){
				    			object = jsonResults[i].binding[bindingIndex].uri
				    		} else {
				    			if(typeof jsonResults[i].binding[bindingIndex].literal !== "undefined"){
					    			object = jsonResults[i].binding[bindingIndex].literal
					    		} else {
					    			object = jsonResults[i].binding[bindingIndex].bnode
					    		}
				    		}
				    	}
				    }
				    //console.log("subject " + subject + " object " + object + " predicate " + predicate)
				    objectName = subject

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
					        	var propertyName = predicate
					        	var propertyValue = object
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
			        	var propertyName = predicate
			        	var propertyValue = object
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
			        	var propertyName = predicate
			        	var propertyValue = object

			            var jsonObject = { }
			            var jsonObjectProperty = { }
			            jsonObjectProperty[propertyName] = propertyValue
			            jsonObject[objectName] = jsonObjectProperty

			            // Add JSON-LD Context property
			            if(format === "json-ld"){
			            	jsonObject[objectName]["@context"] = object;
			            	jsonObject[objectName]["@id"] = subject;
						} 

						//console.log(value)
						jsonResultsParsed.push(jsonObject)
						jsonResultsParsedAux.push(objectName)
						var objAux = { }
						objAux[objectName] = jsonResultsParsed.length - 1
		        		objectNameAuxArray.push(objAux)
		        	}

		        	objectNameAux = subject
		        	yaEncontrado = false
				        
				    //console.log(jsonResultsParsed[Object.keys(jsonResultsParsed)[Object.keys(jsonResultsParsed).length - 1]])
		        }

		        /*var limitNumber = jsonResultsParsed.length
		        var offsetNumber = 0

				if((typeof limit !== "undefined" && limit) || (typeof offset !== "undefined" && offset)){
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
			        
			        jsonResultsParsed = jsonResultsParsed.sort(function (a, b) {
					    return (Object.keys(a)[0]).localeCompare((Object.keys(b)[0]));
					}).slice(offsetNumber, offsetNumber + limitNumber)
				} else {
					jsonResultsParsed = jsonResultsParsed.sort(function (a, b) {
					    return (Object.keys(a)[0]).localeCompare((Object.keys(b)[0]));
					}).slice(0, 0 + limitNumber)
				}*/
				jsonResultsParsed = jsonResultsParsed.sort(function (a, b) {
					    return (Object.keys(a)[0]).localeCompare((Object.keys(b)[0]));
					})
				jsonFinalResults.results = jsonResultsParsed
				//var returnResults = JSON.stringify(jsonFinalResults)
			}

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