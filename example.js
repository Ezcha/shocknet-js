const shocknet = require('./index.js');

// Setup variables
var exampleServer = new shocknet.Server;
const idIn = {
	PLAYER_SYNC: 0,
	MESSAGE: 1
}
const idOut = {
	MESSAGE: 0,
	PLAYER_READY: 1,
	PLAYER_ADD: 2,
	PLAYER_KICK: 3,
	PLAYER_COLOR: 4,
	PLAYER_MOVE: 5,
	PLAYER_REMOVE: 6,
	PLAYER_NAME: 7
}
var players = [];

// Player class
class Player {
	constructor(connection) {
		// Setup
		this.x = 0;
		this.y = 0;
		this.color = {r: 0, g: 0, b: 0};
		this.name = 'Player';
		this.connection = connection;

		// Register
		var addPacket = new shocknet.Packet(idOut.PLAYER_ADD);
		addPacket.add([this.connection.id, this.x, this.y]);
		this.connection.broadcast(addPacket);

		// Ready
		var readyPacket = new shocknet.Packet(idOut.PLAYER_READY);
		readyPacket.add([this.connection.id, this.x, this.y]);
		this.connection.send(readyPacket);

		// Set name and color
		this.rename('Player #'+this.connection.id);
		this.randomColor();
	}
	send(connection) {
		// Add player
		var addPacket = new shocknet.Packet(idOut.PLAYER_ADD);
		addPacket.add([this.connection.id, this.x, this.y]);
		connection.send(addPacket);

		// Set color
		var colorPacket = new shocknet.Packet(idOut.PLAYER_COLOR);
		colorPacket.add([this.connection.id, this.color.r, this.color.g, this.color.b]);
		exampleServer.broadcast(colorPacket);

		// Set name
		var namePacket = new shocknet.Packet(idOut.PLAYER_NAME);
		namePacket.add([this.connection.id, this.name]);
		exampleServer.broadcast(namePacket);
	}
	randomColor() {
		// Create random RGB value
		this.color.r = Math.floor(Math.random()*255);
		this.color.g = Math.floor(Math.random()*255);
		this.color.b = Math.floor(Math.random()*255);

		// Recolor
		var colorPacket = new shocknet.Packet(idOut.PLAYER_COLOR);
		colorPacket.add([this.connection.id, this.color.r, this.color.g, this.color.b]);
		exampleServer.broadcast(colorPacket);
	}
	rename(name) {
		this.name = name;

		// Rename
		var namePacket = new shocknet.Packet(idOut.PLAYER_NAME);
		namePacket.add([this.connection.id, this.name]);
		exampleServer.broadcast(namePacket);
	}
	teleport(newX, newY) {
		this.x = newX;
		this.y = newY;

		// Teleport
		var teleportPacket = new shocknet.Packet(idOut.PLAYER_MOVE);
		teleportPacket.add([this.connection.id, this.x, this.y]);
		exampleServer.broadcast(teleportPacket);
	}
	kick(reason) {
		var kickPacket = new shocknet.Packet(idOut.PLAYER_KICK);
		kickPacket.add([this.connection.id, reason]);
		this.connection.send(kickPacket);
		this.connection.kick();
	}
}

// Functions
function sendPlayers(connection) {
	for (var i = 0; i < players.length; i++) {
		var sendPlayer = players[i];
		sendPlayer.send(connection);
	}
}
function getPlayer(connection) {
	for (var i = 0; i < players.length; i++) {
		var searchPlayer = players[i];
		if (searchPlayer.connection.id === connection.id) {
			return searchPlayer;
		}
	}
}

// Server logic
exampleServer.on('ready', function() {
	console.log('Server listening on port '+exampleServer.port);
});
exampleServer.on('packet', function(connection, packet) {
	switch(packet.netId) {
		case idIn.PLAYER_SYNC:
			var syncPacket = new shocknet.Packet(idOut.PLAYER_MOVE);
			// In the real world you'll want to validate the data
			syncPacket.add([connection.id, packet.get(0), packet.get(1)]);
			// connection.broadcast sends a packet to all connections EXCEPT the one is broadcasting from
			connection.broadcast(syncPacket);
			break;
		case idIn.MESSAGE:
			var player = getPlayer(connection);
			if (packet.get(0) === 'kick') {
				player.kick('oof');
			}
			var message = player.name+': '+packet.get(0);
			var messagePacket = new shocknet.Packet(idOut.MESSAGE);
			messagePacket.add(message);
			connection.broadcast(messagePacket);
			break;
	}
});
exampleServer.on('connect', function(connection) {
	console.log('Connection opened ('+connection.id+')');

	// Send all other players to new connection
	sendPlayers(connection);

	// Create new player object
	var newPlayer = new Player(connection);
	players.push(newPlayer);

	// Teleport
	newPlayer.teleport(500, 600);

	// Send welcome message
	var helloPacket = new shocknet.Packet(idOut.MESSAGE);
	helloPacket.add('Welcome to the Shocknet example!');
	connection.send(helloPacket);
});
exampleServer.on('disconnect', function(connection) {
	console.log('Connection closed ('+connection.id+')');

	// Remove player from list
	for (var i = 0; i < players.length; i++) {
		var rm = players[i];
		if (rm.connection.id === connection.id) {
			players.splice(i, 1);
			break;
		}
	}

	// Tell connections to remove player
	var removePacket = new shocknet.Packet(idOut.PLAYER_REMOVE);
	removePacket.add(connection.id);
	exampleServer.broadcast(removePacket);
});

// Start
exampleServer.listen(1000);