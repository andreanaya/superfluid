var less = require('less');
var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');
var liveupdate = require('./liveupdate');

var compiled = {};

function start(config) {
	if(config.watch) {
		chokidar.watch(path.resolve(config.watch)).on('change', function(path, event) {
			compiled = {};

			if(config.liveUpdate) liveupdate.update();
		});

		if(config.liveUpdate) liveupdate.start();
	}
}

function get(filename, paths) {
	var css = '';

	return function (req, res, next) {
		if(compiled[filename]) {
			res.set('Content-Type', 'text/css');
			res.send(css);
		} else {
			less.render(
				fs.readFileSync(filename).toString(),
				{
					paths: paths,
					filename: filename,
					sourceMap: {sourceMapFileInline: true}
				},
				function (err, output) {
					if(err) {
						console.log('\x1b[31mError:\x1b[0m',  err.message);
						console.log(err.filename, 'line:', err.line);

						res.send(css);
					} else {
						css = output.css;
						res.set('Content-Type', 'text/css');
						res.send(css);

						compiled[filename] = true;
					}
				}
			);
		}
	}
}

module.exports = {
	start: start,
	get: get
};