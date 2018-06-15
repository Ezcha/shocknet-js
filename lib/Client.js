const net = require('net');
const EventEmitter = require('events').EventEmitter;
const Packet = require('./Packet.js');
const Buffer = require('buffer').Buffer;

/* EVENTS
	connect: once the socket connects to a server
	disconnect: when the socket disconnects
	packet: when data is recieved
*/

function handleData(client, data) {
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
		client.emit('packet', recievedPacket);

		idx += packetSize;
		attempts += 1;
	}
}

class Client extends EventEmitter {
	constructor() {
		super();

		this._socket = new net.Socket();
		this._host = null;
		this._port = null;
		this.connected = false;

		var self = this;
		this._socket.on('connect', function() {
			self.emit('connect');
			this.connected = true;
		});
		this._socket.on('close', function() {
			self.emit('disconnect');
			this.connected = false;
		});
		this._socket.on('error', function() {
			// Ignore as it also throws close
		});
		this._socket.on('data', function(data) {
			handleData(self, data);
		});
	}
	connect(ip, port) {
		this._host = ip;
		this._port = port;
		this._socket.connect({host: ip, port: port});
	}
	disconnect() {
		this._host = null;
		this._port = null;
		this._socket.destroy();
	}
	send(packet) {
		this._socket.write(packet._build());
	}
}

module.exports = Client;