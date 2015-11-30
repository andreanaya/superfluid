var fs = require('fs');
var path = require('path');
var express = require('express');
var style = require('./style');
var script = require('./script');
var templates = require('./templates');

var p = path.resolve('config.json');
var config = require(p);

function init() {
	var app = express();

	app.engine('html', templates({
		ignored: config.templates.ignored,
		basedir: config.templates.basedir
	}));
	app.set('views', './src/templates');
	app.set('view engine', 'html');

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

	if(config.routes) {
		var routes = require(path.resolve(config.routes));

		routes.forEach(function(route){
			app.get(route.path, function (req, res) {
				var options = {
					template: route.template
				};

				if(route.meta) options.meta = route.meta;
				if(route.data) options.data = JSON.parse(fs.readFileSync(path.resolve(route.data), 'utf8'));

				res.render(route.base, options);
			});
		})
	}

	if(config.static) {
		config.static.forEach(function(item){
			app.use(item.alias, express.static(item.dir));
		})
	}

	var server = app.listen(2000, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Example app listening at http://localhost:%s', port);
	});
}


module.exports = {
	init: init
}