const shocknet = require('../index.js');

// Variables
var exampleClient = new shocknet.Client;
const idIn = {
	MESSAGE: 0
}
const idOut = {
	MESSAGE: 0
}
var messages = [];

// Functions
function clear() {
	process.stdout.write('\033c');
}
function reprint() {
	for (var i = 0; i < messages.length; i++) {
		console.log(messages[i]);
	}
	console.log('---');
}

// Client logic
exampleClient.on('packet', function(packet) {
	switch(packet.netId) {
		case idIn.MESSAGE:
			messages.push(packet.get(0));
			clear();
			reprint();
			break;
	}
});

exampleClient.on('connect', function() {
	console.log('Connected');
});
exampleClient.on('disconnect', function() {
	console.log('Disconnected');
});

exampleClient.connect('localhost', 1000);

var stdin = process.openStdin();
stdin.addListener("data", function(e) {
	var msg = e.toString().trim();
	var messagePacket = new shocknet.Packet(idOut.MESSAGE);
	messagePacket.add(msg);
	exampleClient.send(messagePacket);
});

clear();