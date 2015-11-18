var process = require('process');
var chokidar = require('chokidar');
var browserify = require('browserify');
var path = require('path');
var fs = require('fs');
var ws = require('ws');
var timestamp = require('./timestamp');

var config = require(path.resolve('config.json'));
var src = path.resolve(config.js.file);

if(!fs.existsSync(src)){
	console.log('Script not found');
	process.exit();
}

var js = '', b;

function start() {
	b = browserify(src, {
		paths: config.js.paths,
		debug: true
	});

	chokidar.watch(path.resolve(config.js.watch)).on('change', function(path, event) {
		compile();
	});

	compile();
}

function compile() {
	console.log(timestamp(), 'Compile JavaScript');

	b.bundle(function(err, buf) {
		if(err) {
			console.log('\x1b[31mError:\x1b[0m',  err.message);
		} else {
			js = buf.toString();
			console.log('\x1b[32mJavaScript updated\x1b[0m')
		}
	});
}

Object.defineProperty(module.exports, 'js', {
	get: function() {
		return js;
	},
	configurable: true
});

module.exports.compile = compile;
module.exports.start = start;