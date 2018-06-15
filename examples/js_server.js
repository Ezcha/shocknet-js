const shocknet = require('../index.js');

// Setup variables
var exampleServer = new shocknet.Server;
const idIn = {
	MESSAGE: 0
}
const idOut = {
	MESSAGE: 0
}
var players = [];

// Server logic
exampleServer.on('ready', function() {
	console.log('Server listening on port '+exampleServer.port);
});
exampleServer.on('packet', function(connection, packet) {
	switch(packet.netId) {
		case idIn.MESSAGE:
			var msg = connection.id.toString() + ': ' + packet.get(0);
			console.log(msg);
			var messagePacket = new shocknet.Packet(idOut.MESSAGE);
			messagePacket.add(msg);
			exampleServer.broadcast(messagePacket);
			break;
	}
});
exampleServer.on('connect', function(connection) {
	console.log('Connection opened ('+connection.id+')');
	var helloPacket = new shocknet.Packet(idOut.MESSAGE);
	helloPacket.add('Welcome to the Shocknet example!');
	connection.send(helloPacket);
});
exampleServer.on('disconnect', function(connection) {
	console.log('Connection closed ('+connection.id+')');
});

// Start
exampleServer.listen(1000);