var path = require('path');
var chokidar = require('chokidar');
var browserify = require('browserify');

var compiled = {};

function start(config) {
	if(config.watch) {
		chokidar.watch(path.resolve(config.watch)).on('change', function(path, event) {
			compiled = {};
		});
	}
}

function get(filename, paths) {
	var b = browserify(filename, {
		paths: paths,
		debug: true
	});

	var js = '';

	return function (req, res, next) {
		if(compiled[filename]) {
			res.set('Content-Type', 'application/javascript');
			res.send(js);
		} else {
			b.bundle(function(err, buf) {
				if(err) {
					console.log('\x1b[31mError:\x1b[0m',  err.message);
					res.set('Content-Type', 'application/javascript');
					res.send(js);
				} else {
					js = buf.toString();
					res.set('Content-Type', 'application/javascript');
					res.send(js);
				}
			});
		}
	}
}

module.exports = {
	start: start,
	get: get
};