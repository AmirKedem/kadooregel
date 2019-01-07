let Matter = require('matter-js');
let Bodies = Matter.Bodies;
let	Body = Matter.Body;
let Vector = Matter.Vector;

/*
exports.Spectator = class Spectator {
	constructor(ID, name) {
		this.Id = ID;
		this.name = name;
	}
}
*/

// Player
exports.Player = class Player {
	constructor(ID, countdownMode, Width, Height, TheEngine) {
		this.Id = ID;
		this.team = null; // Null means Spectator.
		this.nickname = null;
		this.isStaticBol = countdownMode;
		
		this.width = Width;
		this.height = Height;
		
		this.carW = 20;
		this.carH = 42;
		
		this.isDrifting = false;
		this.isMoving = false;
		this.isBoosting = false;
		this.leftKeyPressed = false;
		this.rightKeyPressed = false;
		this.lastKeyPressed = 0;
		this.rot = 0;
		
		this.theEngine = TheEngine;
	}

	setTeam(team, name) {
		this.team = team;
		this.nickname = name;
		if (this.team == 'teamBlue') {
			this.posx = this.width/2 - this.width/3;
			this.posy = this.height/2;
			this.heading = Math.PI/2;
		} 
		else if (this.team == 'teamRed') {
			this.posx = this.width/2 + this.width/3;
			this.posy = this.height/2;
			this.heading = -Math.PI/2;
		}
		
		this.vertices = [
			Vector.create(  this.carW,  this.carH),
			Vector.create(  this.carW, -this.carH * 0.5),
		  Vector.create(  this.carW * 0.5, -this.carH * 0.8),
		  Vector.create( -this.carW * 0.5, -this.carH * 0.8),
			Vector.create( -this.carW, -this.carH * 0.5),
			Vector.create( -this.carW,  this.carH)
		];
		
		this.options = {
			angle: this.heading,
			isStatic: this.isStaticBol,
			mass: Player.PlayerMass,
			frictionAir: 0.05,
			friction: 0.0001
		};
		
		this.body = Bodies.fromVertices(this.posx, this.posy, this.vertices, this.options);
	}
	
	static get PlayerMass() {
		return 4;
	}

	get Body() {
		return this.body;
	}
	
	setRot(rot) {
		this.rot = this.isDrifting ? 0.31 * rot : 0.12 * rot;
	}	
	
	setLastRot(rot) {
		this.rot = this.isDrifting ? 0.02 * rot : 0.007 * rot;
	}
	
	turn() {
		if (this.rot != 0) {
			Body.setAngularVelocity(this.body, this.rot)
			if (Math.abs(this.rot) < 0.03) {
				this.rot = 0;
			}
		}
	}
	
	move() {
		if (this.isMoving) {
			let vector = Vector.create(0,-0.0018);
			this.body.force = Vector.rotate(vector, this.body.angle);
		}
		if (this.isBoosting) {
			let vector = Vector.create(0,-0.0035);
			this.body.force = Vector.rotate(vector, this.body.angle);
		}
	}
}

// Ball
exports.Ball = class Ball {
	constructor(x,y,r) {
		this.r = r;
		this.options = {
			mass: 1,
			friction: 0,
			frictionAir: 0.005,
			restitution: 0.7
		}
		
		this.body = Bodies.circle(x, y, this.r,this.options);
	}
	
	get Body() {
			return this.body
	}
}

// Border
exports.Border = class Border {
	constructor(x,y,w,h,side) {
		this.border = {
			x: x,
			y: y,
			w: w,
			h: h,
			side: side 
		};
		
		this.options = {
			isStatic: true,
			frictionAir: 0,
			friction: 0
		};
		
		this.body = Bodies.rectangle(x,y,w,h,this.options);
	}
	
	get Body() {
			return this.body;
	}
}
