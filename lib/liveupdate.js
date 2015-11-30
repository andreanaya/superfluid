var path = require('path');
var ws = require('ws');

var socket, wss, timeout;

function start() {
	wss = new ws.Server({ port: 5000 });
			
	wss.on('connection', function connection(ws) {
		socket = ws;
	});
}

function update() {
	if(socket) socket.send('update');
}


module.exports.start = start;
module.exports.update = update;