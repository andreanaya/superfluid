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

function exportTemplate(basedir, src, dest) {
	var namespace = getNamespace(src);
	var template = handlebars.precompile(fs.readFileSync(path.resolve(basedir+'/'+src), 'utf8'));

	var str = 'module.exports = require(\'handlebars/runtime\').template('+template+')';

	var	fullPath = (path.resolve(dest)+'/'+namespace.replace(/\./g, "/")+'.js').split('/');

	var i, t = fullPath.length;
	var dir = '';

	for(i = 1; i<t-1; i++) {
		if(fullPath[i] == '' && fullPath[i].indexOf('.js') != -1) continue;

		dir += '/'+fullPath[i];
		
		if (!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		}
	}

	fs.writeFileSync(fullPath.join('/'), str);
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

	chokidar.watch(basedir+'/**/**.hbs', {
		ignored: config.ignored,
		cwd: basedir
	})
	.on('add', function(path, event) {
		handlebars.registerPartial(getNamespace(path), fs.readFileSync(basedir+'/'+path, 'utf8'));

		if(config.export && config.export.indexOf(path) != -1) {
			exportTemplate(basedir, path, config.dest);
		}
	})
	.on('change', function(path, event) {
		handlebars.registerPartial(getNamespace(path), fs.readFileSync(basedir+'/'+path, 'utf8'));

		if(config.export && config.export.indexOf(path) != -1) {
			exportTemplate(basedir, path, config.dest);
		}
	});

	return function (filePath, options, callback) {
		var template = handlebars.compile(fs.readFileSync(filePath, 'utf8'));
		
		return callback(null, template(options));
	}
}

module.exports = {
	render: render
}