var process = require('process');
var chokidar = require('chokidar');
var less = require('less');
var path = require('path');
var fs = require('fs');
var ws = require('ws');
var timestamp = require('./timestamp');

var config = require(path.resolve('config.json'));
var src = path.resolve(config.css.file);

if(!fs.existsSync(src)){
	console.log('Style not found');
	process.exit();
}

var socket, wss, css = '';

function start() {
	wss = new ws.Server({ port: 5000 });
	
	wss.on('connection', function connection(ws) {
		socket = ws;
	});

	chokidar.watch(path.resolve(config.css.watch)).on('change', function(path, event) {
		compile();
	});

	compile();
}

function compile() {
	console.log(timestamp(), 'Compile styles');

	less.render(
		fs.readFileSync(src).toString(),
		{
			paths: [__dirname+'/src/less'],
			filename: src,
			sourceMap: {sourceMapFileInline: true}
		},
		function (err, output) {
			if(err) {
				console.log('\x1b[31mError:\x1b[0m',  err.message);
				console.log(err.filename, 'line:', err.line);
			} else {
				css = output.css;
				console.log('\x1b[32mStyles updated\x1b[0m')

				if(socket) socket.send('update');
			}
		}
	);
}

Object.defineProperty(module.exports, 'css', {
	get: function() {
		return css;
	},
	configurable: true
});

module.exports.start = start;
module.exports.compile = compile;