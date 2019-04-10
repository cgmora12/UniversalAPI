// routes/routes.js

const http 		 = require('http');

module.exports = function(app, db) {
	// Web in HTML
	app.get('/UniversalAPI', (req, res) => {
    	res.sendFile('web/webAPI.html', {root: '.' })
	});
	// Query the Universal API
	app.get('/UniversalAPIQuery', (req, res) => {
		console.log("params: " + JSON.stringify(req.query))
		console.log("params: " + JSON.stringify(req.query.endpoint))

		//TODO: query the endpoint to get possible paths or generate the SPARQL query from users query
		var query = req.query
		var endpoint = req.query.endpoint

		if(typeof endpoint !== 'undefined' && endpoint){
			// See more about sparql queries at: https://stackoverflow.com/questions/2930246/exploratory-sparql-queries
			//http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
			
			http.get(req.query.endpoint + '?default-graph-uri=&query=SELECT+DISTINCT+%3Fclass%0D%0AWHERE+%7B%0D%0A++%3Fs+a+%3Fclass+.%0D%0A%7D%0D%0ALIMIT+25%0D%0AOFFSET+0&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
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
			  	res.json({results: data, query: 'SPARQL query'})
			  });

			}).on("error", (err) => {
			  console.log("Error: " + err.message);
			  res.json({error: 'API to LOD -> Error'})
			});
		}
		else {
			  res.json({error: 'API to LOD -> Missing parameter "endpoint"'})
		}
	});
};