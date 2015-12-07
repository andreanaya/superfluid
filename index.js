#!/usr/bin/env node
var path = require('path');
var server = require('./lib/superfluid');
var isGlobal = require ("is-global");

if(isGlobal()) {
	server.init();	
}

module.exports = server.init;