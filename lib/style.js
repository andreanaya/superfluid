var less = require('less');
var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');
var liveupdate = require('./liveupdate');
var zlib = require('zlib');
var Buffer = require('buffer').Buffer;


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
	var promise, css = '', gzip = null, deflate = null;

	return function (req, res, next) {
		if(compiled[filename]) {
			var acceptEncoding = req.headers['accept-encoding'];
			if (!acceptEncoding) {
				acceptEncoding = '';
			}

			res.set('Content-Type', 'text/css');

			if (acceptEncoding.match(/\bdeflate\b/) && deflate !== null) {
				res.header('Content-Encoding', 'deflate');
				res.send(deflate);
			} else if (acceptEncoding.match(/\bgzip\b/) && gzip !== null) {
				res.header('Content-Encoding', 'gzip');
  				res.send(gzip);
			} else {
				res.send(css);
			}
		} else {
			if(promise == undefined) {
				promise = less.render(
					fs.readFileSync(filename).toString(),
					{
						paths: paths,
						filename: filename,
						sourceMap: {sourceMapFileInline: true}
					}
				)
				.then(function(output) {
					css = output.css;

					var buffer = new Buffer(css);

					zlib.gzip(buffer, function(err, data){
					    gzip = data;
					});
					zlib.deflate(buffer, function(err, data){
					    detlate = data;
					});

					compiled[filename] = true;
				})
				.catch(function(err) {
					console.log('\x1b[31mError:\x1b[0m',  err.message);
					console.log(err.filename, 'line:', err.line);
				})
			}
			
			promise.then(function () {
				res.set('Content-Type', 'text/css');
				res.send(css);
			}).catch(function() {
				res.set('Content-Type', 'text/css');
				res.send('');
			})
		}
	}
}

module.exports = {
	start: start,
	get: get
};


/*
var raw = fs.createReadStream('index.html');
var acceptEncoding = request.headers['accept-encoding'];
if (!acceptEncoding) {
acceptEncoding = '';
}

// Note: this is not a conformant accept-encoding parser.
// See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
if (acceptEncoding.match(/\bdeflate\b/)) {
response.writeHead(200, { 'Content-Encoding': 'deflate' });
raw.pipe(zlib.createDeflate()).pipe(response);
} else if (acceptEncoding.match(/\bgzip\b/)) {
response.writeHead(200, { 'Content-Encoding': 'gzip' });
raw.pipe(zlib.createGzip()).pipe(response);
} else {
response.writeHead(200, {});
raw.pipe(response);
}

 */