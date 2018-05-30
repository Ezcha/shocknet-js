const Buffer = require('buffer').Buffer;
const Parser = require('binary-parser').Parser;
const gmConvert = require('./gmConvert.js');

class Packet {

	/**
	 * Represents a packet
	 * @constructor
	 * @param {number} networkId 
	 */
	constructor(netId) {
		this.netId = netId;
		this.data = [];
	}

	/**
	 * Add data to the packet
	 * @param {{string|number|array}} data 
	 */
	add(newData) {
		if (Array.isArray(newData)) {
			this.data = this.data.concat(newData);
		} else {
			this.data.push(newData);
		}
	}

	/**
	 * Return the data at the index
	 * @param {number} index 
	 */
	get(index) {
		return this.data[index];
	}

	_load(dataBuffer) {

		var netIdParse = new Parser().skip(1).uint16le("id");
		this.netId = netIdParse.parse(dataBuffer).id;

		if (dataBuffer.length !== 3) {
			var index = 3;
			while (index < dataBuffer.length) {
				try {
					var conv = gmConvert.parse(dataBuffer, index);
					index += conv.size+1;
					this.data.push(conv.value);
				} catch(err) {
					console.log(err.stack);
					break;
				}
			}
		}
		
	}

	_build() {

		var packetParts = [];
		var packetSize = 0;

		var idBuffer = Buffer.alloc(2);
		idBuffer.writeInt16LE(this.netId, 0);
		packetSize += idBuffer.length;
		packetParts.push(idBuffer);

		for (var i = 0; i < this.data.length; i++) {
			var selectedData = this.data[i];
			var buffer = gmConvert.createBuffer(selectedData);
			packetSize += buffer.length;
			packetParts.push(buffer);
		}

		var dataBuffer = Buffer.concat(packetParts, packetSize);
		var sizeBuffer = Buffer.alloc(1);
		sizeBuffer.writeUInt8(dataBuffer.length+1);

		var finalPacket = Buffer.concat([sizeBuffer, dataBuffer], sizeBuffer.length+dataBuffer.length);
		return finalPacket;

	}

}

module.exports = Packet;