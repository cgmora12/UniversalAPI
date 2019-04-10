// server.js

const express        = require('express');
const bodyParser     = require('body-parser');
const app            = express();

const port = 8081;
require('./app/routes')(app, {});

//app.use(bodyParser.urlencoded({ extended: true }));
// Configurar cabeceras y cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

app.use(express.static('web'));

app.listen(port, () => {
  console.log('We are live on ' + port);
});