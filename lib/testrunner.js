var Jasmine = require('jasmine');
var jasmine = new Jasmine();

function init() {
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

	jasmine.loadConfig({
		spec_files: [
			'./**/specs/*.js'
		]
	});

	jasmine.onComplete(function(passed) {
		if(passed) {
			console.log('All specs have passed');
		}
		else {
			console.log('At least one spec has failed');
		}
	});

	jasmine.execute();
}

module.exports = {
	init: init
}