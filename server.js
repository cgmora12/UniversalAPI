// server.js

const express        = require('express');
const bodyParser     = require('body-parser');
const app            = express();

const port = 8091;
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

//app.use('/', express.static(__dirname + '/web'));
app.use('/UniversalAPI/web', express.static(__dirname + '/web'));
app.use('/UniversalAPI/web/images', express.static(__dirname + '/web/images'));
//app.use('/images', express.directory(__dirname + '/web/images'));
app.use('/UniversalAPI/web/css', express.static(__dirname + '/web/css'));
//app.use('/css', express.directory(__dirname + '/web/css'));
app.use('/UniversalAPI/web/js', express.static(__dirname + '/web/js'));
//app.use('/js', express.directory(__dirname + '/web/js'));
app.use('/UniversalAPI/docs',  express.static(__dirname + '/docs/'));

app.listen(port, () => {
  console.log('We are live on ' + port);
});