var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var chokidar = require('chokidar');
var style = require('./style');
var script = require('./script');
var templates = require('./templates');
var icons = require('./icons');

var p = path.resolve('superfluid.config.json');
var config = require(p);

function init() {
	var app = express();

	app.engine('html', templates.render(config.templates));
	app.set('views', config.templates.basedir);
	app.set('view engine', 'html');

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

	if(config.icons) {
		icons.start(config.icons);
	}

	if(config.css) {
		style.start(config.css);

		var paths = [path.resolve(config.css.paths)];

		config.css.output.forEach(function(output) {
			app.use(output.dest, style.get(path.resolve(output.filename), paths));
		})
	}

	if(config.js) {
		script.start(config.js);

		var paths = config.js.paths;

		config.js.output.forEach(function(output) {
			app.use(output.dest, script.get(path.resolve(output.filename), paths));
		})
	}

	if(config.proxy) {
		app.post('/proxy', function (req, res, next) {
			var options = JSON.parse(req.body.options);
			
			http.request(options, function(response) {
				response.on('data', function (chunk) {
					res.write(chunk);
				});

				response.on('end', function () {
					res.end();
				});
			}).end();
		});
	}

	if(config.static) {
		config.static.forEach(function(item){
			app.use(item.alias, express.static(item.dir));
		})
	}

	if(config.routes) {
		var routesPath = path.resolve(config.routes);
		var routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));

		function reduce(obj, route, index) {
			obj[route.path] = index;
			return obj;
		}

		var indexes = routes.reduce(reduce, {});

		chokidar.watch(routesPath).on('change', function(path, event) {
			routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));;

			indexes = routes.reduce(reduce, {});
		});

		app.use(function(req, res, next) {
			var route = routes[indexes[req.path]];
			
			if(route) {
				var options = {
					template: route.template
				};

				if(route.meta) options.meta = route.meta;
				if(req.params) options.params = req.params;
				if(route.data) options.data = JSON.parse(fs.readFileSync(path.resolve(route.data), 'utf8'));

				res.render(route.base, options);
			} else {
				res.status(404).send('Not found');
			}
		});
	}

	var server = app.listen(process.env.PORT || 2000, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Example app listening at http://localhost:%s', port);
	});
}


module.exports = {
	init: init
}