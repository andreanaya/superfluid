var fs = require('fs');
var timestamp = require('./timestamp');
var path = require('path');
var process = require('process');
var chokidar = require('chokidar');
var handlebars = require('handlebars');

var config = require(path.resolve('config.json'));
var src = path.resolve(config.js.file);

if(!fs.existsSync(src)){
	console.log('Script not found');
	process.exit();
}

var basedir = path.resolve(config.templates.cwd);
var base = path.resolve(basedir, config.templates.base);

function registerPartial(path) {
	var arr = path.split('/');

	var name = arr.pop().split('.')[0].split('-').reduce(function(value, item) {
		return value+item.charAt(0).toUpperCase()+item.substr(1).toLowerCase();
	}, '');

	arr.push(name);

	var namespace = arr.join('.');
	
	handlebars.registerPartial(namespace, fs.readFileSync(basedir+'/'+path, 'utf8'));
}


function start() {
	chokidar.watch(basedir+'/**/**.html', {
		ignored: config.templates.base,
		cwd: path.resolve(config.templates.cwd)
	})
	.on('add', function(path, event) {
		console.log(timestamp(), 'Register template:', path);
		registerPartial(path);
	})
	.on('change', function(path, event) {
		console.log(timestamp(), 'Update template:', path);
		registerPartial(path);
	});
}

function render(data) {
	var template = handlebars.compile(fs.readFileSync(base, 'utf8'));

	return template(data);
}

module.exports.start = start;
module.exports.render = render;