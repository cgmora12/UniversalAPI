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
			http.get(req.query.endpoint + '?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D&format=application%2Fsparql-results%2Bjson&debug=on&timeout=', (resp) => {
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
			  	res.json({a: JSON.parse(data)})
			  });

			}).on("error", (err) => {
			  console.log("Error: " + err.message);
			  res.send('API to LOD -> Error')
			});
		}
		else {
			  res.send('API to LOD -> Missing parameter "endpoint"')
		}
	});
};