const Parser = require('binary-parser').Parser;
const Buffer = require('buffer').Buffer;

var stringOptions = {length: 99, zeroTerminated: true};
var typeMap = ['u8','u16','u32','s8','s16','s32','f16','f32','f64','string'];
var sizeMap = {u8: 1, u16: 2, u32: 4, s8: 1, s16: 2, s32: 4, f16: 2, f32: 4, f64: 8};
var endStringBuffer = Buffer.from('00', 'hex');

module.exports = {
	createBuffer(data) {
		// Type
		var dataType = this.determineType(data);
		var dataTypeName = typeMap[dataType];
		var typeBuffer = Buffer.alloc(1);
		typeBuffer.writeUInt8(dataType);

		// Write data
		var buffer;
		if (dataTypeName === 'string') {
			// String
			buffer = Buffer.from(data, 'utf8');
			buffer = Buffer.concat([buffer, endStringBuffer], buffer.length+1);
		} else {
			// Number
			buffer = Buffer.alloc(sizeMap[dataTypeName]);
			switch(dataTypeName) {
				case 'u8':
					buffer.writeUInt8(data, 0);
					break;
				case 'u16':
					buffer.writeUInt16LE(data, 0);
					break;
				case 'u32':
					buffer.writeUInt32LE(data, 0);
					break;
				case 's8':
					buffer.writeInt8(data, 0);
					break;
				case 's16':
					buffer.writeInt16LE(data, 0);
					break;
				case 's32':
					buffer.writeInt32LE(data, 0);
					break;
				case 'f16':
				case 'f32':
				case 'f64':
					buffer.writeFloatLE(data, 0);
					break;
			}
		}

		return Buffer.concat([typeBuffer, buffer]);
	},
	determineType: function(val) {
		if (typeof val === 'string') {
			return typeMap.indexOf('string');
		}
		else if (typeof val === 'number' || typeof val === 'boolean') {
			if (Math.round(val) === val) {
				// Integer
				if (val < 0) {
					// Signed
					if (Math.abs(val) <= 127) {
						return typeMap.indexOf('s8');
					}
					if (Math.abs(val) <= 32767) {
						return typeMap.indexOf('s16');
					}
					return typeMap.indexOf('s32');
				} else {
					// Unsigned
					if (val <= 255) {
						return typeMap.indexOf('u8');
					}
					if (val <= 65535) {
						return typeMap.indexOf('u16');
					}
					return typeMap.indexOf('u32');
				}
			} else {
				// Float
				/* Not supported by GM yet
				if (val <= 65504) {
					return typeMap.indexOf('f16');
				}
				*/
				if (Math.abs(val) <= 16777216) {
					return typeMap.indexOf('f32');
				}
				return typeMap.indexOf('f64');
			}
		}
	},
	parse: function(buffer, index) {
		// Type
		var parseType = new Parser().skip(index).uint8("type");
		var typeNum = parseType.parse(buffer).type;
		var type = typeMap[typeNum];
	
		// Value
		var parseValue = new Parser().skip(index+1).endianess("little");
		switch(type) {
			case "u8":
				parseValue.uint8("val");
				break;
			case "u16":
				parseValue.uint16("val");
				break;
			case "u32":
				parseValue.uint32("val");
				break;
			case "s8":
				parseValue.int8("val");
				break;
			case "s16":
				parseValue.int16("val");
				break;
			case "s32":
				parseValue.int32("val");
				break;
			case "f16":
			case "f32":
			case "f64":
				parseValue.float("val");
				break;
			case "string":
				parseValue.string("val", stringOptions);
				break;
		}
		var value = parseValue.parse(buffer).val;
		var size = 0;
		if (type != "string") {
			size = sizeMap[type];
		} else {
			size = value.length+1;
		}
		if (type === "f16" || type === "f32" || type == "f64") {
			value = Math.round(value*100)/100;
		}
	
		return {value: value, size: size};
	}
}