var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');
var svgicons2svgfont = require('svgicons2svgfont');
var svg2ttf = require('svg2ttf');
var ttf2eot = require('ttf2eot');
var ttf2woff = require('ttf2woff');

var handlebars = require('handlebars');

function getIcons(basedir, list) {
	var files = fs.readdirSync(basedir);
	list = list || [];

	files.forEach(function(file) {
		if (fs.statSync(basedir + '/' + file).isDirectory()) {
			list = list.concat(getIcons(basedir + '/' + file, list));
		}
		else {
			if(file.indexOf('.svg') !== -1) {
				list.push({
					name: file.split('.')[0].substr(5),
					file: basedir+'/'+file
				});
			}
		}
	});

	return list;
}

function generateFont(config) {
	var basedir = path.resolve(config.basedir);
	var output = path.resolve(config.output);
	var fontName = config.fontName;
	var list = getIcons(basedir);
	var glyphs = [];

	var fontStream = svgicons2svgfont({
		fontName: fontName,
		fontHeight: 64,
		fixedWidth: false,
		centerHorizontally: false,
		descent: 0
	});

	fontStream.pipe(fs.createWriteStream(output+'/'+fontName+'.svg'))
	.on('finish',function() {
		var ttf = svg2ttf(fs.readFileSync(output+'/'+fontName+'.svg', 'utf8'), {});
		var buffer = new Buffer(ttf.buffer);

		fs.writeFileSync(output+'/'+fontName+'.ttf', buffer);
		fs.writeFileSync(output+'/'+fontName+'.eot', ttf2eot(buffer));
		fs.writeFileSync(output+'/'+fontName+'.woff', ttf2woff(buffer));

		if(config.less) {
			var less = handlebars.compile(fs.readFileSync(path.resolve(config.less.template), 'utf8'));
			
			var data = {
				fontName: config.fontName,
				fileName: config.fileName,
				glyphs: glyphs
			}

			fs.writeFile(path.resolve(config.less.output), less(data), function(err) {
				if(err) {
					return console.log(err);
				}
			});

			if(config.demo && config.demo.template && config.demo.output) {
				var demo = handlebars.compile(fs.readFileSync(path.resolve(config.demo.template), 'utf8'));
				fs.writeFile(path.resolve(config.demo.output), demo(data), function(err) {
					if(err) {
						return console.log(err);
					}
				});
			}
		}
	})
	.on('error',function(err) {
		console.log(err);
	});

	list.forEach(function(icon, index) {
		var glyph = fs.createReadStream(icon.file);
		var chardCode = (index+1) | 0xea00;
		var character = String.fromCharCode(chardCode);

		glyph.metadata = {
			unicode: [character],
			name: icon.name
		};
		fontStream.write(glyph);

		glyphs.push({
			unicode: '\'\\'+chardCode.toString(16)+'\'',
			name: icon.name,
		});
	});

	fontStream.end();
}

function start(config) {
	handlebars.registerHelper('camelcase', function(val) {
		return val.split('-').reduce(function(value, item) {
			return value+item.charAt(0).toUpperCase()+item.substr(1).toLowerCase();
		}, '');
	});

	var basedir = path.resolve(config.basedir);	

	generateFont(config);
	chokidar.watch(basedir+'/**/**.svg', {
		cwd: basedir
	})
	.on('change', function(path, event) {
		
	});
}

module.exports = {
	start: start
}