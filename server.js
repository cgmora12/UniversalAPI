// server.js

const express        = require('express');
const bodyParser     = require('body-parser');
const app            = express();

const port = 8081;
require('./app/routes')(app, {});

app.use(bodyParser.urlencoded({ extended: true }));
app.listen(port, () => {
  console.log('We are live on ' + port);
});