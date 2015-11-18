var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var chokidar = require('chokidar');
var style = require('./style');
var script = require('./script');
var fonts = require('./fonts');
var templates = require('./templates');
var timestamp = require('./timestamp');

var config = require(path.resolve('config.json'));

var root = path.resolve(config.server.root);
var routes;

function handler(req, res){
	var url_parts = url.parse(req.url);
	var pathname = url_parts.pathname;
	
	var route = routes.filter(function(value) {
		return value.route == pathname;
	})[0]

	if(route) {
		res.setHeader('Content-Type', 'text/html');
		res.writeHead(200);

		var data = {};

		if(fs.existsSync(path.resolve(route.data))) {
			data = JSON.parse(fs.readFileSync(path.resolve(route.data), 'utf8'));
		}

		return res.end(templates.render({
			meta: route.meta,
			template: route.template,
			data: data
		}));
	}
	
	if(pathname == path.resolve(config.css.dest)) {
		res.setHeader('Content-Type', 'text/css');
		res.writeHead(200);
		return res.end(style.css);
	}

	if(pathname == path.resolve(config.js.dest)) {
		res.setHeader('Content-Type', 'application/javascript');
		res.writeHead(200);
		return res.end(script.js);
	}
	
	var font = fonts.getFont(pathname);
	if(font) {
		switch(pathname.split('.')[1].toLowerCase(0)) {
			case 'ttf':
				res.setHeader('Content-Type', 'application/x-font-ttf');
				break;
			case 'otf':
				res.setHeader('Content-Type', 'application/x-font-otf');
				break;
			case 'woff':
				res.setHeader('Content-Type', 'application/x-font-woff');
		}

		res.writeHead(200);
		return res.end(font);
	}

	if(!fs.existsSync(path.resolve(root+pathname))) {
		res.writeHead(500);
		return res.end('Error loading '+pathname);
	} else {
		fs.readFile(path.resolve(root+pathname), function (err, data) {
			if (err) {
				res.writeHead(500);
				return res.end('Error loading '+pathname);
			}
			
			var type;

			switch(pathname.split('.')[1].toLowerCase(0)) {
				case 'css':
					type = 'text/css';
					break;
				case 'js':
					type = 'application/javascript';
					break;
				case 'json':
					type = 'application/json';
					break;
				case 'jpg':
				case 'jpeg':
					type = 'image/jpeg';
					break;
				case 'gif':
					type = 'image/gif';
					break;
				case 'png':
					type = 'image/png';
					break;
				case 'svg':
					type = 'image/svg+xml';
					break;
				case 'ttf':
					type = 'application/x-font-ttf';
					break;
				case 'otf':
					type = 'application/x-font-otf';
					break;
				case 'woff':
					type = 'application/x-font-woff';
					break;
				default:
					type = 'plain/text';
					break;
			}

			res.setHeader('Content-Type', type);
			res.writeHead(200);
			return res.end(data);
		});
	}
}

function start() {
	routes = JSON.parse(fs.readFileSync(path.resolve(config.server.routes), 'utf8'));
	http.createServer(handler).listen(2000);

	chokidar.watch(path.resolve(config.server.routes)).on('change', function(path, event) {
		console.log(timestamp(), 'Update routes');
		routes = JSON.parse(fs.readFileSync(path, 'utf8'));
	});
}

module.exports.start = start;