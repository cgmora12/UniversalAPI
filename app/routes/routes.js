// routes/routes.js

module.exports = function(app, db) {
	app.get('/UniversalAPI', (req, res) => {
		console.log("params: " + JSON.stringify(req.query))

		// Return data to users
		res.send('API to LOD')
	});
};