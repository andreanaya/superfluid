#!/usr/bin/env node
var process = require('process');
var path = require('path');
var server = require('./lib/superfluid');
var isGlobal = require ("is-global");

if(isGlobal()) {
	server.init();	
}

module.exports = server.init;


/*process.on('SIGINT', function() {
  console.log('STOP mongod');
});*/


/*process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});*/