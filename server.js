/*jslint node: true, indent: 2, nomen: true, stupid:true, regexp: true */
'use strict';

var express     = require('express'),
  http          = require('http'),
  path          = require('path'),
  url           = require('url'),
  expressLess   = require('express-less'),
  fs            = require('fs'),
  //config        = require('./ikenga.json'),
  pkg           = require('./package.json'),
  browserify    = require('browserify-middleware'),
  request       = require('request'),
  cors          = require('cors'),
  baseRequest,

// Create server
  app           = express();

baseRequest = request.defaults({
  headers: { Accept : 'application/json,*/*' }
});


app.set('port', process.env.PORT || 3000);
app.set('views', './src');
app.set('view engine', 'jade');

app.use(cors());
app.use('/bower_components', express.static('./bower_components'));
app.use('/dist', express.static('./dist'));

app.get(/\/src\/(.+)\.html$/, function (req, res) {
  res.render(__dirname + '/src/' + req.params[0]);
});

app.use('/src', expressLess(__dirname + '/src/'));

app.get(/\/src\/(.+\.browserify\.js)$/, function (req, res, next) {
  var name, func;
  name = __dirname + '/src/' + req.params[0];

  if (fs.existsSync(name)) {
    func = browserify(name, {
      run: true,
      transform: [ 'browserify-shim'],
      external: Object.keys(pkg['browserify-shim'])
    });
    func(req, res, next);
  } else {
    next();
  }
});

/*jslint unparam:true*/
app.get('/', function (req, res) {
  var doc;

  doc = [
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\">",
    "<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">",
    "<meta name=\"viewport\" content=\"width=device-width, minimum-scale=1.0, ",
    "initial-scale=1.0, user-scalable=yes\"><title>Polymer tour</title>",
    "<link rel=\"import\" href=\"/src/vainilla-tour.html\"></head>",
    "<script src=\"/bower_components/webcomponentsjs/webcomponents.min.js\"></script>",
    "<body><vainilla-tour whit-labels=\"true\"><step-tour value=\"ads\"></step-tour><step-tour value=\"Enrique\"></step-tour></vainilla-tour></body></html>"
  ].join('');
  res.send(doc);

});
/*jslint unparam:false*/

app.use('/', express.static('./static'));

http.createServer(app).listen(app.get('port'), function () {
  console.log('Ikenga app listening on port ' + app.get('port'));
});
