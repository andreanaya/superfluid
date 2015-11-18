var fs = require('fs');
var path = require('path');
var ttf2eot = require('ttf2eot');
var ttf2woff = require('ttf2woff');
var ttf2woff2 = require('ttf2woff2');
var timestamp = require('./timestamp');

var config = require(path.resolve('config.json')).fonts;
var dest = path.resolve(config.dest);
var fonts = [];

function getVariants(arr) {
	var variants = [];

	var i, t = arr.length;

	for(i = 0; i<t; i++) {
		var src = path.resolve(arr[i].source);

		if(fs.existsSync(src)) {
			var filename = src.split('/').slice(-1)[0].split('.')[0];
			var buffer = fs.readFileSync(src);
			
			variants.push({
				weight: arr[i].weight,
				style: arr[i].style,
				eot: {
					path: dest+'/'+filename+'.eot',
					buffer: new Buffer(ttf2eot(buffer).buffer)
				},
				woff: {
					path: dest+'/'+filename+'.woff',
					buffer: new Buffer(ttf2woff(buffer).buffer)
				},
				/*woff2: {
					path: dest+'/'+filename+'.woff2',
					buffer: ttf2woff2(buffer)
				},*/
				ttf: {
					path: dest+'/'+filename+'.ttf',
					buffer: buffer
				}
			})
		}
	}

	return variants;
}

function getFont(pathname) {
	var i, j, ext = pathname.split('.')[1];
	
	if(ext == 'eot' || ext == 'woff' || ext == 'ttf') {
		i = fonts.length;

		while(--i>-1) {
			j = fonts[i].variants.length;

			while(--j>-1) {
				if(fonts[i].variants[j][ext].path == pathname) {
					return fonts[i].variants[j][ext].buffer;
				}
			}
		}
	}

	return null;
}

function start() {
	//generateFont(path.resolve(config.fonts.source))

	var i, t = config.family.length;

	for(i = 0; i<t; i++) {
		console.log(timestamp(), 'Generate', config.family[i].name);
		fonts.push({
			family: config.family[i].name,
			variants: getVariants(config.family[i].variants)
		});
	}
}

module.exports.start = start;
module.exports.getFont = getFont;