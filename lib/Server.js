const net = require('net');
const EventEmitter = require('events').EventEmitter;
const Connection = require('./Connection.js');
const Packet = require('./Packet.js');
const Buffer = require('buffer').Buffer;

/* EVENTS
	ready: when the server is started and listening
	connect: when the server recieves a connection
	discount: when a connection disconnects
	packet: when a packet is recieved
*/

function handleData(server, connection, data) {
	var idx = 0;
	var attempts = 0;
	// Seperate packet buffers
	while (idx < data.length) {
		if (attempts >= 5) {
			break;
		}

		var packetSize = data.readUInt8(idx);
		var extractedData = Buffer.alloc(packetSize);
		data.copy(extractedData, 0, idx, idx + packetSize);

		// Add data
		var recievedPacket = new Packet;
		recievedPacket._load(extractedData);
		server.emit('packet', connection, recievedPacket);
		connection.emit('packet', recievedPacket);

		idx += packetSize;
		attempts += 1;
	}
}

function handleConnect(server, connection) {
	connection._socket.setNoDelay(true);
	server.connections.push(connection);
	connection._socket.on('data', function(buffer) {
		handleData(server, connection, buffer);
	});
	connection._socket.on('close', function() {
		connection.kick(server, connection);
	});
	connection._socket.on('error', function() {
		// Needs to handled otherwise an error is thrown
	});
	server.emit('connect', connection);
}

class Server extends EventEmitter {

	/**
	 * Represents a server
	 * @consturctor
	 */
	constructor() {
		super();
		this.nextId = 0;
		this.connections = [];
		this._net = null;
		this.port = null;
	}

	/**
	 * Makes the server listen on a port
	 * @param {number} port 
	 */
	listen(port) {
		var self = this;
		this.port = port;
		this._net = net.createServer();
		this._net.on('connection', function(socket) {
			var newConnection = new Connection(socket, self.nextId, self);
			self.nextId += 1;
			handleConnect(self, newConnection);
		});
		this._net.listen(port, '0.0.0.0', function(e) {
			if (!e) {
				self.emit('ready');
			} else {
				console.log(e);
			}
		});
	}

	/**
	 * Stop listening and close the server
	 */
	close() {
		this._net.removeAllListeners();
		this._net.close();
	}

	/**
	 * Sends a packet to all connections
	 * @param {Packet} packet
	 */
	broadcast(packet) {
		for (var i = 0; i < this.connections.length; i++) {
			var connection = this.connections[i];
			connection._socket.write(packet._build());
		}
	}

}

module.exports = Server;