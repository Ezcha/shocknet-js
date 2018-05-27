const net = require('net');
const EventEmitter = require('events').EventEmitter;

/* EVENTS
	none yet
*/

/** Class representing a connection */
class Connection extends EventEmitter {

	constructor(socket, id, server) {
		super();
		this._socket = socket;
		this.id = id;
		this.server = server;
		this.data = {};
		this.sync = {};
	}

	/**
	 * Set a value to the connection
	 * @param {string} key
	 * @param {*} value
	 */
	set(key, value) {
		this.data[key] = value;
	}

	/**
	 * Get a value that was set to the connection
	 * @param {string} key 
	 * @return {*} value
	 */
	get(key) {
		return this.data[key];
	}

	/**
	 * Sends a packet to the connection
	 * @param {Packet} packet 
	 */
	send(packet) {
		this._socket.write(packet._build());
	}

	/**
	 * Sends a packet to all connections except the one it's called from
	 * @param {Packet} packet 
	 */
	broadcast(packet) {
		for (var i = 0; i < this.server.connections.length; i++) {
			var reciever = this.server.connections[i];
			if (reciever.id !== this.id) {
				reciever._socket.write(packet._build());
			}
		}
	}

	/**
	 * Forces the connection to disconnect
	 */
	kick() {
		for (var i = 0; i < this.server.connections.length; i++) {
			var connection = this.server.connections[i];
			if (connection.id === this.id) {
				this.server.connections.splice(i, 1);
				this._socket.destroy();
				this.server.emit('disconnect', this);
				return true;
			}
		}
		return false;
	}
	
}

module.exports = Connection;