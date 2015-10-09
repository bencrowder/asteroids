function calcVector(x, y, angle, magnitude) {
	var pos = {};
	pos.x = x + magnitude * Math.cos(angle);
	pos.y = y + magnitude * Math.sin(angle);

	return pos;
};

function addVector(v1, v2) {
	return {
		x: v1.x + v2.x,
		y: v1.y + v2.y,
	};
}

function magnitude(vector) {
	return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
}

function limitToRange(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function distanceToPoint(v1, v2) {
	var dx = v2.x - v1.x;
	var dy = v2.y - v1.y;

	return Math.sqrt(dx * dx + dy * dy);
};

// http://nokarma.org/2011/02/27/javascript-game-development-keyboard-input/
var Key = {
	_pressed: {},

	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	SPACE: 32,

	isDown: function(keyCode) {
		return this._pressed[keyCode];
	},

	onKeydown: function(event) {
		this._pressed[event.keyCode] = true;
	},

	onKeyup: function(event) {
		delete this._pressed[event.keyCode];
	}
};
