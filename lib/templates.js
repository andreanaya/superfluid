var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');
var handlebars = require('handlebars');

function registerPartial(basedir, path) {
	var arr = path.split('/');

	var name = arr.pop().split('.')[0].split('-').reduce(function(value, item) {
		return value+item.charAt(0).toUpperCase()+item.substr(1).toLowerCase();
	}, '');

	arr.push(name);

	var namespace = arr.join('.');
	
	handlebars.registerPartial(namespace, fs.readFileSync(basedir+'/'+path, 'utf8'));
}

module.exports = function(config) {
	var basedir = path.resolve(config.basedir);

	handlebars.registerHelper('if_eq', function(v1, v2, options) {
		if(v1 === v2) {
			return options.fn(this);
		}
		return options.inverse(this);
	});

	handlebars.registerHelper('if_not_eq', function(v1, v2, options) {
		if(v1 !== v2) {
			return options.fn(this);
		}
		return options.inverse(this);
	});

	handlebars.registerHelper('raw', function(partialName) {
		return handlebars.partials[partialName];
    });

	chokidar.watch(basedir+'/**/**.html', {
		ignored: config.ignored,
		cwd: basedir
	})
	.on('add', function(path, event) {
		registerPartial(basedir, path);
	})
	.on('change', function(path, event) {
		registerPartial(basedir, path);
	});

	return function (filePath, options, callback) {
		var template = handlebars.compile(fs.readFileSync(filePath, 'utf8'));
		
		return callback(null, template(options));
	}
}