var path = require('path');
var chokidar = require('chokidar');
var browserify = require('browserify');
var zlib = require('zlib');

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

	var promise, js = '', gzip = null, deflate = null;

	return function (req, res, next) {
		if(compiled[filename]) {
			
			var acceptEncoding = req.headers['accept-encoding'];
			if (!acceptEncoding) {
				acceptEncoding = '';
			}

			res.set('Content-Type', 'application/javascript');

			if (acceptEncoding.match(/\bdeflate\b/) && deflate !== null) {
				res.header('Content-Encoding', 'deflate');
				res.send(deflate);
			} else if (acceptEncoding.match(/\bgzip\b/) && gzip !== null) {
				res.header('Content-Encoding', 'gzip');
  				res.send(gzip);
			} else {
				res.send(js);
			}
		} else {
			if(promise == undefined) {
				promise = new Promise(function(resolve, reject) {
					b.bundle(function(err, buffer) {
						if(err) {
							console.log('\x1b[31mError:\x1b[0m',  err.message);

							reject();
						} else {
							js = buffer.toString();

							zlib.gzip(buffer, function(err, data){
							    gzip = data;
							});
							zlib.deflate(buffer, function(err, data){
							    detlate = data;
							});

							compiled[filename] = true;

							resolve();
						}
					})
				});
			}
			
			promise.then(function() {
				res.set('Content-Type', 'application/javascript');
				res.send(js);
			}).catch(function() {
				res.set('Content-Type', 'application/javascript');
				res.send('');
			})
		}
	}
}

module.exports = {
	start: start,
	get: get
};