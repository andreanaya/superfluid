var webdriver = require('selenium-webdriver'),
	By = webdriver.By,
	until = webdriver.until;

var fs = require('fs');

var Canvas = require('canvas'),
  	Image = Canvas.Image;

var resemble = require('node-resemble-js');

function init() {
	var driver = new webdriver.Builder()
		.forBrowser('chrome')
		.build();

	driver.get('http://localhost:2000');
	
	/*driver.sleep(1000);
	driver.executeScript('alert("ok")');
	driver.sleep(5000);
	driver.takeScreenshot().then(
		function(image, err) {
			require('fs').writeFile('out.png', image, 'base64', function(err) {
				console.log(err);
			});
		}
	);

	driver.quit();*/

	var element = driver.findElement(By.css('.js-list > li'));

	element.then(
		function(element) {

		}
	).catch(function(err) {
		console.log(err.message);
	});

	var bounds = {};

	element.getLocation().then(
		function(location) {
			bounds.x = location.x >> 0;
			bounds.y = location.y >> 0;

			console.log(bounds);
		}
	).catch(function(err) {
		console.log(err.message);
	});

	element.getSize().then(
		function(size) {
			bounds.width = size.width >> 0;
			bounds.height = size.height >> 0;
		}
	).catch(function(err) {
		console.log(err);
	});

	driver.takeScreenshot().then(
		function(image, err) {
			var canvas = new Canvas(300, 90);
			var ctx =  canvas.getContext('2d');

			var img = new Image();
			img.src = new Buffer(image, 'base64');
			ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);

			var buffer = canvas.toBuffer();

			var control = fs.readFileSync('control.png');

			resemble.outputSettings({
				errorColor: {
					red: 0,
					green: 255,
					blue: 0
				},
				errorType: 'movement',
				transparency: 0.7
			});

			resemble(control)
				.compareTo(buffer)
				.onComplete(function(data){
					console.log('Difference: '+data.misMatchPercentage+'%');

					data.getDiffImage().pack().pipe(fs.createWriteStream('diff.png'));

					var out = fs.createWriteStream('test.png')
					var stream = canvas.pngStream();
					 
					stream.on('data', function(chunk){
						out.write(chunk);
					});
					 
					stream.on('end', function(){
						console.log('saved png');

						driver.findElement(By.css('.js-list')).click();

						//driver.quit();
					});

					/*if (Number(data.misMatchPercentage) <= 0.01) {
						callback();
					} else {
						data.getDiffImage().pack().pipe(fs.createWriteStream(image + 'diff.png'));
						callback.fail(new Error("Screenshot '" + image+  "' differ " + data.misMatchPercentage + "%"));
					}*/
				});

			/*var out = fs.createWriteStream('test.png')
			var stream = canvas.pngStream();
			 
			stream.on('data', function(chunk){
				out.write(chunk);
			});
			 
			stream.on('end', function(){
				console.log('saved png');

				driver.quit();
			});*/
		}
	);
}

module.exports = {
	init: init
}