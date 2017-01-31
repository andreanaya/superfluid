var path = require("path");
var MemoryFS = require("memory-fs");
var webpack = require("webpack");

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var autoprefixer = require('autoprefixer');
var postcssFlexbugsFixes = require('postcss-flexbugs-fixes');
var postcssInitial = require('postcss-initial');

var liveupdate = require('./liveupdate');
var zlib = require('zlib');
var Buffer = require('buffer').Buffer;

var fs, cache;

function start(config) {
	if(config.liveUpdate) liveupdate.start();

	fs = new MemoryFS();

	var compiler = webpack(
	{
		entry: {
			'app': ['babel-polyfill', './src/app/app']
		},
		output : {
			path: path.resolve(__dirname, '/dist'),
			publicPath: '/dist/',
			filename      : "[name].js",
			chunkFilename : "[name].[chunkhash].js"
		},
		devtool : 'source-map',
		resolve : {
			extensions: [".js", ".min.js", ".custom.js"],
			modules : [
				"app",
				"app/components",
				"app/layout",
				"app/general/less",
				"app/general/less/modules",
				"app/general/less/settings",
				"app/general/js",
				"app/general/fonts",
				"app/general/img",
				"app/general/sprites",
				"app/general/icons",
				"node_modules",
				path.resolve(__dirname, "../node_modules")
			],
			alias: {
				'TweenMax': 'gsap/src/uncompressed/TweenMax'
			}
		},
		resolveLoader: {
			extensions: [".js", ".min.js", ".custom.js"],
			modules: [path.resolve(__dirname, "../node_modules")],
		},
		module: {
			loaders: [
				{
					test: /\.js$/,
					exclude: /(node_modules|specs)/,
					loader: 'babel-loader',
					query: {
						babelrc: false,
						presets: [
							require.resolve('babel-preset-es2015'),
							require.resolve('babel-preset-es2015-loose')
						],
						plugins: [
							require.resolve('babel-plugin-transform-object-assign')
						]
					}
				},
				{
					test: /\.(svg|png|jpg|jpeg|eot|ttf|woff|woff2|gif)$/i,
					exclude: /(sprites|inconfont)[\/\\]/,
					loader  : 'file-loader?limit=5000'
				},
				{
					test   : /\.css$/,
					loader : ExtractTextPlugin.extract({
						fallbackLoader: 'style-loader',
						loader: [
							{
								loader: 'css-loader',
								options: {
									sourceMap: true,
									importLoaders: 1
								}
							},
							{
								loader: 'postcss-loader'
							}
						]
					})
				},
				{
					test   : /\.less$/,
					loader : ExtractTextPlugin.extract({
						fallbackLoader: 'style-loader',
						loader: [
							'css-loader?sourceMap',
							'postcss-loader',
							'less-loader?sourceMap'
						]
					})
				},
				{
					test: /\.svg$/,
					include: /sprites[\/\\]/,
					loader: 'svg-sprite-loader?' + JSON.stringify({
						name: 'icon-' + '[name]',
						prefixize: true
					}) + '!svgo-loader?useConfig=svgoConfig'
				},
				{
					test: /\.(hbs|handlebars)$/i,
					loader: 'handlebars-loader'
				}
			]
		},
		plugins: [
			new webpack.LoaderOptionsPlugin({
				options: {
					context: __dirname,
					postcss: [
						postcssInitial({
							reset: 'inherited'
						}),
						autoprefixer({ browsers: ["last 3 versions", "ie 10"] }),
						postcssFlexbugsFixes()
					],
					svgoConfig: {
						plugins:
						[
							{
								cleanupIDs: false,
								removeHiddenElems: false
							}
						]
					}
				}
			}),
			new ExtractTextPlugin({ filename: '[name].css', allChunks: true})
		]
	});

	compiler.outputFileSystem = fs;

	var watching = compiler.watch({
	}, function(err, stats) {
		if (err || stats.hasErrors()) {
		
		}

		var info = stats.toString("minimal");

		console.log(info);

		/*function getFiles(basedir) {
			var files = fs.readdirSync(basedir);

			files.forEach(function(file) {
				if (fs.statSync(basedir + '/' + file).isDirectory()) {
					console.log('>>', file);
					getFiles(basedir + '/' + file);
				}
				else {
					console.log(file);
				}
			});
		}

		getFiles('/');*/

		cache = {};

		if(config.liveUpdate) liveupdate.update();
	})
}

function get() {
	return function (req, res, next) {
		var url = req.path;

		if(fs.existsSync(url)) {
			switch(url.split('.').pop()) {
				case 'js':
				case 'jsonp':
					res.set('Content-Type', 'application/javascript');
					break;
				case 'css':
					res.set('Content-Type', 'text/css');
					break;
				case 'json':
					res.set('Content-Type', 'application/json');
					break;
				case 'ttf':
					res.set('Content-Type', 'application/x-font-ttf');
					break;
				case 'otf':
					res.set('Content-Type', 'application/x-font-opentype');
					break;
				case 'woff':
					res.set('Content-Type', 'application/font-woff');
					break;
				case 'woff2':
					res.set('Content-Type', 'application/font-woff2');
					break;
				case 'eot':
					res.set('Content-Type', 'application/vnd.ms-fontobject');
					break;
				case 'svg':
					res.set('Content-Type', 'image/svg+xml');
					break;
				case 'png':
					res.set('Content-Type', 'image/png');
					break;
				case 'gif':
					res.set('Content-Type', 'image/gif');
					break;
				case 'jpeg':
				case 'jpg':
					res.set('Content-Type', 'image/jpeg');
					break;
				case 'map':
					res.set('Content-Type', 'application/octet-stream');
					break;
			}

			var acceptEncoding = req.headers['accept-encoding'];
			if (!acceptEncoding) {
				acceptEncoding = '';
			}

			if(cache[url] === undefined) {
				cache[url] = {
					gzip: null,
					deflate: null,
					raw: fs.readFileSync(url)
				}
			}

			var acceptEncoding = req.headers['accept-encoding'];
			
			if (!acceptEncoding) {
				acceptEncoding = '';
			}
			
			if (acceptEncoding.match(/\bdeflate\b/)) {
				res.header('Content-Encoding', 'deflate');

				if(cache[url].deflate !== null) {
					res.send(cache[url].deflate);
				} else {
					zlib.deflate(new Buffer(cache[url].raw), function(err, data){
						cache[url].deflate = data;
						
						res.send(data);
					});
				}
			} else if (acceptEncoding.match(/\bgzip\b/)) {
				res.header('Content-Encoding', 'gzip');

				if(cache[url].gzip !== null) {
					res.send(cache[url].gzip);
				} else {
					zlib.gzip(new Buffer(cache[url].raw), function(err, data){
						cache[url].gzip = data;

						res.send(data);
					});
				}
			} else {
				res.send(cache[url].raw);
			}
		} else {
			next();
		}
	}
}

module.exports = {
	start: start,
	get: get
}