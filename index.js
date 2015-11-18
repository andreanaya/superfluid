#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var style = require('./lib/style');
var script = require('./lib/script');
var templates = require('./lib/templates');
var server = require('./lib/server');
var fonts = require('./lib/fonts');
var p = path.resolve('config.json');

if(fs.existsSync(p)) {
	
}
else {
	console.log('config.json not found')
}


fonts.start();
style.start();
script.start();
templates.start();
server.start();








/*var commands = require('./lib/commands');
var path = require('path');
var fs = require("fs");
var child_process = require('child_process');

//var p = require(path.resolve('package.json'));

console.log(process.env.SUDO_UID)

var http = require('http');

var app = function(req, res) {};

http.createServer(handler).listen(3000, function(err) {
	if (err) return cb(err);

	// Find out which user used sudo through the environment variable
	var uid = parseInt(process.env.SUDO_UID);
	// Set our server's uid to that user
	if (uid) process.setuid(uid);
	console.log('Server\'s UID is now ' + process.getuid());
});


function handler (req, res) {
	res.writeHead(200);
	res.end('Superfluid');
}*/


/*function Superfluid() {
	console.log('Superfluid workflow2');
}

module.exports = Superfluid;*/


/*var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("What do you think of Node.js? ", function(answer) {
  // TODO: Log the answer in a database
  console.log("Thank you for your valuable feedback:", answer);

  rl.close();
});*/