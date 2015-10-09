var Game = function() {
	this.paused = false;
	this.gameOver = false;
	this.wonGame = false;
	this.ROTATE_AMOUNT = 0.08;
	this.THRUST_AMOUNT = 1;
	this.MAX_THRUST = 12;

	this.NUM_STARS = 50;

	this.NUM_ROCKS = 8;
	this.ROCK_SIZE = 50;       // Size of larger rocks (roughly)
	this.SMALL_ROCK_SIZE = 15; // Size of smaller rocks (roughly)
	this.ROCK_SPLIT_SIZE = 36; // Size at which a rock will split instead of dying
	this.MAX_ROCK_VELOCITY = 5;
	this.MAX_SMALL_ROCK_VELOCITY = 25;

	this.BULLET_SPEED = 10;
	this.SHOOT_DELAY = 10;

	this.setup = function(player) {
		this.player = player;
		this.player.game = this;

		// Set player's initial location to middle of world
		this.player.pos.x = (this.world.width / 2) - (this.player.size / 2);
		this.player.pos.y = (this.world.height / 2) - (this.player.size / 2);

		// Set player's initial velocity to middle of world
		this.player.velocity.x = Math.random() * 5 - 2.5;
		this.player.velocity.y = Math.random() * 5 - 2.5;

		// Create stars
		this.stars = [];
		for (var i=0; i<this.NUM_STARS; i++) {
			this.stars.push({
				x: Math.random() * this.world.width,
				y: Math.random() * this.world.height,
				size: (Math.random() * 3) + 1,
			});
		}

		// Create rocks
		this.rocks = [];
		for (var i=0; i<this.NUM_ROCKS; i++) {
			// Inheritance
			Rock.prototype = new Entity();

			var rock = new Rock();
			rock.pos.x = Math.random() * this.world.width;
			rock.pos.y = Math.random() * this.world.height;
			rock.size = Math.random() * this.ROCK_SIZE + this.ROCK_SIZE;
			rock.game = this;
			rock.velocity.x = (Math.random() * this.MAX_ROCK_VELOCITY) - (this.MAX_ROCK_VELOCITY / 2);
			rock.velocity.y = (Math.random() * this.MAX_ROCK_VELOCITY) - (this.MAX_ROCK_VELOCITY / 2);

			this.rocks.push(rock);
		}
	};

	this.update = function() {
		// Update the rocks
		for (var i=0; i<this.rocks.length; i++) {
			var rock = this.rocks[i];
			rock.update();
		}

		// Update the bullets
		bulletsToRemove = [];
		for (var i=0; i<this.player.bullets.length; i++) {
			var bullet = this.player.bullets[i];
			bullet.update();

			// Check if bullet is still alive
			if (!bullet.alive) {
				// It's not, so remove it from the list
				bulletsToRemove.push(i);
			}
		}

		// Remove any dead bullets
		if (bulletsToRemove.length > 0) {
			bulletsToRemove.reverse();
			bullets = this.player.bullets;

			for (var i=0; i<bulletsToRemove.length; i++) {
				bullets.splice(bulletsToRemove[i], 1);
			}

			this.player.bullets = bullets;
		}

		// Update the player
		this.player.update();

		// Check for game over condition
		if (!this.player.alive) {
			this.gameOver = true;
		}

		// Check for game won condition
		if (this.rocks.length == 0) {
			this.wonGame = true;
		}
	};

	this.draw = function() {
		// Clear the screen
		this.context.clearRect(0, 0, this.world.width, this.world.height);

		// Draw the stars
		this.context.fillStyle = "rgba(255, 255, 255, 0.25)";
		for (var i=0; i<this.stars.length; i++) {
			var star = this.stars[i];
			this.context.beginPath();
			this.context.arc(star.x, star.y, star.size, 0, Math.PI * 2, true);
			this.context.closePath();
			this.context.fill();
		}

		// Draw the player
		this.player.draw(this.context);

		// Draw the rocks
		for (var i=0; i<this.rocks.length; i++) {
			var rock = this.rocks[i];
			rock.draw(this.context);
		}

		// Draw the bullets
		for (var i=0; i<this.player.bullets.length; i++) {
			var bullet = this.player.bullets[i];
			bullet.draw(this.context);
		}
	};

	this.loop = function() {
		if (!this.paused) {
			this.update();
			this.draw();
		}

		if (!this.gameOver && !this.wonGame) {
			var t = this;
			intervalId = window.requestAnimationFrame(function() {
				t.loop();
			});
		}

		if (this.gameOver) {
//			$("#canvas").css("opacity", 0.3);
			$("#canvas").addClass("blur");
			$("#game-over").fadeIn(250);
		}

		if (this.wonGame) {
			$("#canvas").css("opacity", 0.3);
			$("#won-game").fadeIn(250);
		}
	};
};


var Entity = function() {
	this.pos = {
		x: 0,
		y: 0,
	};
	this.angle = 0;
	this.velocity = {
		x: 0,
		y: 0,
	};
	this.game = null;

	this.move = function() {
		this.pos = addVector(this.pos, this.velocity);
	};

	this.checkBoundaries = function() {
		// Reflect off boundaries
		if (this.pos.x < 0 || this.pos.x > this.game.world.width) {
			this.velocity.x *= -1;
			this.collidedWithBoundary = true;
		}
		if (this.pos.y < 0 || this.pos.y > this.game.world.height) {
			this.velocity.y *= -1;
			this.collidedWithBoundary = true;
		}

		// Don't allow going through the boundaries
		this.pos.x = limitToRange(this.pos.x, 0, this.game.world.width);
		this.pos.y = limitToRange(this.pos.y, 0, this.game.world.height);
	};
};

var Player = function() {
	this.alive = true;
	this.bullets = [];
	this.shootTimer = 0;
	this.size = 30;

	this.checkKeys = function() {
		// Rotate
		if (Key.isDown(Key.LEFT)) {
			this.angle -= this.game.ROTATE_AMOUNT;
		}

		if (Key.isDown(Key.RIGHT)) {
			this.angle += this.game.ROTATE_AMOUNT;
		}

		// Thrust
		if (Key.isDown(Key.UP)) {
			// Calculate the thrust vector
			var thrustVector = calcVector(0, 0, this.angle, this.game.THRUST_AMOUNT);

			// Now add it to the velocity
			this.velocity = addVector(thrustVector, this.velocity);

			// Cap thrust (this is a hack)
			if (magnitude(this.velocity) > this.game.MAX_THRUST) {
				this.velocity.x *= 0.5;
				this.velocity.y *= 0.5;
			}
		}

		// Shoot
		if (Key.isDown(Key.SPACE)) {
			// Make sure we aren't overusing bullets
			if (this.shootTimer == 0) {
				Bullet.prototype = new Entity();

				// Create a new bullet
				var bullet = new Bullet();
				bullet.pos = calcVector(this.pos.x, this.pos.y, this.angle, this.size + 5);
				bullet.size = 3;
				bullet.game = this.game;
				bullet.velocity = calcVector(0, 0, this.angle, this.game.BULLET_SPEED);

				this.bullets.push(bullet);

				// Wait X ticks before allowing player to shoot again
				this.shootTimer = this.game.SHOOT_DELAY;
			}
		}
	};

	this.update = function() {
		// Shooting timer
		if (this.shootTimer > 0) {
			this.shootTimer--;
		}

		this.checkKeys();
		this.move();
		this.checkBoundaries();
		this.checkCollisions();
	};

	this.draw = function(c) {
		// Save state
		c.save();

		// Translate to the player's position
		c.translate(this.pos.x, this.pos.y);
		c.rotate(this.angle);

		// Settings
		c.fillStyle = "#333";
		c.strokeStyle = "#ffffff";
		c.lineWidth = 4;

		// Draw triangle
		var halfSize = this.size / 1.2;
		c.beginPath();
		c.moveTo(-this.size, -halfSize);
		c.lineTo(-this.size + (halfSize / 2), 0);
		c.lineTo(-this.size, halfSize);
		c.lineTo(this.size, 0);
		c.lineTo(-this.size, -halfSize);
		c.closePath();
		c.fill();
		c.stroke();

		c.restore();
	};

	this.checkCollisions = function() {
		// Check for rock collisions
		for (var i=0; i<this.game.rocks.length; i++) {
			var rock = this.game.rocks[i];

			if (distanceToPoint(rock.pos, this.pos) < rock.size) {
				this.alive = false;
			}
		}
	};
};

var Rock = function() {
	this.update = function() {
		this.move();
		this.checkBoundaries();
	};

	this.draw = function(c) {
		// Save state
		c.save();

		// Translate to the rock's position
		c.translate(this.pos.x, this.pos.y);
		c.rotate(this.angle);

		// Settings
		c.fillStyle = "#751b1b";
		c.strokeStyle = "#f00";
		c.lineWidth = 4;

		c.beginPath();
		c.arc(0, 0, this.size, 0, Math.PI * 2, true);
		c.closePath();
		c.fill();
		c.stroke();

		c.restore();
	};
};

var Bullet = function() {
	this.alive = true;
	this.collidedWithBoundary = false;

	this.update = function() {
		this.move();
		this.checkBoundaries();
		this.checkCollisions();
	};

	this.checkCollisions = function() {
		// Check for boundary collisions
		if (this.collidedWithBoundary) {
			this.alive = false;
		}

		// Check for rock collisions
		var rocksToRemove = [];
		var rocksToAdd = [];
		for (var i=0; i<this.game.rocks.length; i++) {
			var rock = this.game.rocks[i];
			var halfSplitDistance = rock.size / 2;

			if (distanceToPoint(rock.pos, this.pos) < rock.size) {
				this.alive = false;

				// Remove this rock instance
				rocksToRemove.push(i);

				// Split the rock
				if (rock.size > this.game.ROCK_SPLIT_SIZE) {
					// Get number of rocks to split into
					numSplitRocks = Math.ceil(rock.size / 18);

					// Create new smaller rocks
					for (var j=0; j<numSplitRocks; j++) {
						// Inheritance
						Rock.prototype = new Entity();

						var newRock = new Rock();
						newRock.pos.x = rock.pos.x + (Math.random() * rock.size) - halfSplitDistance;
						newRock.pos.y = rock.pos.y + (Math.random() * rock.size) - halfSplitDistance;
						newRock.size = Math.random() * this.game.SMALL_ROCK_SIZE + this.game.SMALL_ROCK_SIZE;
						newRock.game = this.game;
						newRock.velocity.x = (Math.random() * this.game.MAX_SMALL_ROCK_VELOCITY) - (this.game.MAX_SMALL_ROCK_VELOCITY / 2);
						newRock.velocity.y = (Math.random() * this.game.MAX_SMALL_ROCK_VELOCITY) - (this.game.MAX_SMALL_ROCK_VELOCITY / 2);

						rocksToAdd.push(newRock);
					}
				}
			}
		}

		// Remove any rocks that split
		if (rocksToRemove.length > 0) {
			rocksToRemove.reverse();
			rocks = this.game.rocks;

			for (var i=0; i<rocksToRemove.length; i++) {
				rocks.splice(rocksToRemove[i], 1);
			}

			this.game.rocks = rocks;
		}

		// Add any new rocks
		for (var i=0; i<rocksToAdd.length; i++) {
			this.game.rocks.push(rocksToAdd[i]);
		}
	};

	this.draw = function(c) {
		// Save state
		c.save();

		// Translate to the player's position
		c.translate(this.pos.x, this.pos.y);

		// Settings
		c.fillStyle = "#0f0";
		c.lineWidth = 4;

		c.beginPath();
		c.arc(0, 0, this.size, 0, Math.PI * 2, true);
		c.closePath();
		c.fill();

		c.restore();
	};
};


$(document).ready(function() {
	// Set up inheritance for player
	Player.prototype = new Entity();

	var game = new Game();
	var player = new Player();

	// Set up the canvas
	game.canvas = document.getElementById("canvas");
	game.context = game.canvas.getContext("2d");
	game.world = {
		width: game.canvas.width,
		height: game.canvas.height,
	};

	// Set up the game
	game.setup(player);

	// Start the game loop
	game.intervalId = window.requestAnimationFrame(function() {
		game.loop();
	});

	// Keyboard handlers
	$(document).keyup(function(e) {
		Key.onKeyup(e);
	});

	$(document).keydown(function(e) {
		// 'p' to toggle pause
		if (e.which == 80) {
			game.paused = !game.paused;
		}

		Key.onKeydown(e);
	});
});
