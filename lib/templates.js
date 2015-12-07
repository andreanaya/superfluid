var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');
var handlebars = require('handlebars');

function getNamespace(path) {
	var arr = path.split(/\/|\\/);

	var name = arr.pop().split('.')[0].split('-').reduce(function(value, item) {
		return value+item.charAt(0).toUpperCase()+item.substr(1).toLowerCase();
	}, '');

	arr.push(name);

	return arr.join('.');
}

function exportTemplates(basedir, list) {
	var templates = list.reduce(function(templates, src) {
		var namespace = getNamespace(src);
		var template = handlebars.precompile(fs.readFileSync(path.resolve(basedir+'/'+src), 'utf8'));

		return templates+'<script type="text/x-handlebars-template" data-id="'+namespace+'">'+template+'</script>\n';
	}, '');
	
	handlebars.registerPartial('templates', templates);
}

function render(config) {
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
		handlebars.registerPartial(getNamespace(path), fs.readFileSync(basedir+'/'+path, 'utf8'));
	})
	.on('change', function(path, event) {
		handlebars.registerPartial(getNamespace(path), fs.readFileSync(basedir+'/'+path, 'utf8'));
		exportTemplates(basedir, config.export);
	});

	if(config.export) {
		exportTemplates(basedir, config.export);
	}

	return function (filePath, options, callback) {
		var template = handlebars.compile(fs.readFileSync(filePath, 'utf8'));
		
		return callback(null, template(options));
	}
}

module.exports = {
	render: render
}