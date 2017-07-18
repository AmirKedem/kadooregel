// module aliases
var Matter = require('matter-js');
var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
		Body = Matter.Body,
		Vector = Matter.Vector;

var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();

app.set('port', (process.env.PORT || 5000));

var server = app.listen(app.get('port'),listen);

// This call back just tells us that the server has started
function listen() {
	console.log('Node app is running on port', app.get('port'));
	console.log("The amazing soccer server");
}

// need cookieParser middleware before we can do anything with cookies
app.use(cookieParser());

app.use(function (req, res, next) {
	res.cookie('Kport',app.get('port'), { maxAge: 900000, httpOnly: true });
	next(); // <-- important!
});
				
app.use(express.static('public'));

var socket = require('socket.io'); 
var io = socket(server);
// Player
function Player(team,Id) {
	this.Id = Id;
	this.team = team;
	this.isStaticBol = true;
	if (!countdownMode) {
		this.isStaticBol = false;
	}
	this.w = 20;
	this.h = 42;
	this.posy = height/2;
	if (team == 'teamBlue') {
		this.posx = width/2 - width/3;
		this.heading = Math.PI/2;
	} else if (team == 'teamRed') {
		this.posx = width/2 + width/3;
		this.heading = -Math.PI/2;
	}
	
	this.options = {
		mass: 5,
		angle: this.heading,
		isStatic: this.isStaticBol,
		frictionAir: 0.05,
		friction: 0.0001
		
	}
	this.vertices = [
		Vector.create(-this.w, this.h),
		Vector.create(-this.w, -this.h/2),
		Vector.create(-this.w/2, -this.h * 0.85),
		Vector.create(this.w/2, -this.h * 0.85),
		Vector.create(this.w, -this.h/2),
		Vector.create(this.w, this.h)]
	this.body = Bodies.fromVertices(this.posx, this.posy, this.vertices, this.options);
	World.add(engine.world, this.body);
	this.rot = 0;
	this.isDrifting = false;
	this.isMoving = false;
	this.isBoosting = false;
	this.leftKeyPressed = false;
	this.rightKeyPressed = false;
	this.setRot = function(rot) {
		if (this.isDrifting) {
			this.rot = 0.32 * rot;
		} else {
			this.rot = 0.14 * rot;
		}
	}	
	this.setLastRot = function(rot) {
		if (this.isDrifting) {
			this.rot = 0.04 * rot;
		} else {
			this.rot = 0.025 * rot;
		}
	}	
	this.turn = function() {
		if (this.rot != 0) {
			Body.setAngularVelocity(this.body, this.rot)
			if (Math.abs(this.rot) < 0.1) {
				this.rot = 0;
			}
		}
	}
	this.move = function() {
		if (this.isMoving) {
			var vector = Vector.create(0,-0.0007);
			this.body.force = Vector.rotate(vector, this.body.angle);
		}
		if (this.isBoosting) {
			var vector = Vector.create(0,-0.0027);
			this.body.force = Vector.rotate(vector, this.body.angle);
		}
	}
}
// Ball
function Ball(x,y,r) {
	this.r = r;
	this.options = {
		mass: 1,
		friction: 0,
		frictionAir: 0.005,
		restitution: 0.7
	}
	this.body = Bodies.circle(x, y, this.r,this.options);
	World.add(engine.world, this.body);
	//this.body.force = Vector.create(0.001, 0.001);
}
// Border
function Border(x,y,w,h,side) {
	this.options = {
		isStatic: true,
		frictionAir: 0,
		friction: 0
	};
	this.border = {
		x: x,
		y: y,
		w: w,
		h: h,
		side: side
	}
	this.body = Bodies.rectangle(x,y,w,h,this.options);
	World.add(engine.world, this.body);
}
//
function resetPlayers(xOffSet,yOffSet,angle) {
	var BluePlayersPosVector = Vector.create(width/2-xOffSet, height/2-yOffSet);
	var RedPlayersPosVector = Vector.create(width/2+xOffSet, height/2-yOffSet);
	var BluePlayersAngle = angle;
	var RedPlayersAngle = -angle;
	for (var i=0;i<players.length;i++) {
		Matter.Body.setStatic(players[i].body,true);
		if (players[i].team == 'teamBlue') {
			Matter.Body.setPosition(players[i].body,BluePlayersPosVector);
			Matter.Body.setAngle(players[i].body, BluePlayersAngle);
		} else {
			Matter.Body.setPosition(players[i].body,RedPlayersPosVector);
			Matter.Body.setAngle(players[i].body, RedPlayersAngle);
		}
	}
}
//
function resetBall() {
	var ballPosVector = Vector.create(width/2, height/2);
	var ballVelVector = Vector.create(0, 0);
	Matter.Body.setPosition(ball.body,ballPosVector);
	Matter.Body.setVelocity(ball.body, ballVelVector);
}
// restarts the game.
function restart() {
	goalStopWatch = 0;
	goalMode = false;
	resetPlayers(width/3,0,Math.PI/2);
	resetBall();
	countdown = 0;
	countdownMode = true;
	blueTeamScore = 0;
  redTeamScore = 0;
  blueTeamPlayers = 0;
  redTeamPlayers = 0;
	clock = 300;
	stopCountdownSent = false;
	gameLoopRunning = false;
	gameLoop();
}
// Map message
function worldMap() {
	var score = [blueTeamScore,redTeamScore];
	var states = []
	for (var i=0; i<borders.length; i++) {
		states.push(borders[i].border);
	}
	states.push(score);
	return states;
}
// update status message
function worldStatus() {
	var players_state = [];
	for (var i=0; i<players.length; i++) {
		var vertices = [];
		for (var j=0;j<players[i].body.vertices.length;j++) {	
			vertices.push([players[i].body.vertices[j].x,players[i].body.vertices[j].y]);
		}
		var player_state = {points: vertices,
											  team: players[i].team};
		players_state.push(player_state);
	}
	var state = {ballposx: ball.body.position.x,
							ballposy: ball.body.position.y,
							ballsize: ball.r,
							players: players_state,
							clock: clock}
	return state;
}
// check who scored
function whoScored() {
	var posx = ball.body.position.x;
	var rad = ball.r;
	if (posx <= borders[0].border.x + borders[0].border.w/2 - rad) {
		redTeamScore++;
		return 'Red Team';
	} else if (posx >= borders[2].border.x - borders[2].border.w/2 + rad) {
		blueTeamScore++;
		return 'Blue Team';
	}
	return null;
}
// gets the player Id out of the list of players.
function getPlayer(Id) {
	for(var i=0;i<players.length;i++) {
		if (players[i].Id == Id) {
			return players[i];
		}
	}
	return null
}
//
var fps = 30;
var blueTeamScore = 0;
var redTeamScore = 0;
var blueTeamPlayers = 0;
var redTeamPlayers = 0;
var space = 0;
var up = 1;
var shift = 2;
var rightKey = 3;
var leftKey = 4;
var rightDir = 1;
var leftDir = -1;
var countdown = 0;
// this is the message that we send to our clients.
var sendCount = fps;
var countdownTime = fps * 3;
// asks whether we told our clients that the countdown is over.
var stopCountdownSent = false;
var countdownMode = true;
var goalMode = false;
var goalStopWatch = 0;
var goalStopWatchTime = fps * 5;
var startLoop = true;
var gameLoopRunning = false;
var needRestart = false;
// a stop watch for one sec.
var onesecstopper = 0;
var clock = 300;
var IntervalId;
var players = [];
var engine;
var width = 1600;
var height = 900;
// Creates the Engine.
engine = Engine.create();
engine.world.gravity.x = 0;
engine.world.gravity.y = 0;
// Borders.
var borders = [];
var bordersWidth = width/13;
var bordersHeight = height/2.6;
borders.push(// the left and right borders.
						 new Border(-10,height/8,bordersWidth,bordersHeight,-1),
						 new Border(-10,height - height/8,bordersWidth,bordersHeight,-1),
						 new Border(width+10,height/8,bordersWidth,bordersHeight,1),
						 new Border(width+10,height - height/8,bordersWidth,bordersHeight,1),
						 // the up & down borders.
						 new Border(width/2, height+50, width*2, 200,0),
						 new Border(width/2, -50, width*2, 200,0),
						 // the right and left long borders.
						 new Border(-130,height/2,bordersWidth,bordersHeight*4,-1),
						 new Border(width+130,height/2,bordersWidth,bordersHeight*4,1));
// Ball. 
ball = new Ball(width/2,height/2,50);
// the game loop.
function gameLoop() {
	gameLoopRunning = true;
	IntervalId = setInterval(
		function() {
				onesecstopper++
				if (onesecstopper % fps == 0) {
					onesecstopper = 0;
					if (!stopCountdownSent) {
						io.sockets.emit('countdownStop');
						stopCountdownSent = true;
					}
					if (!goalMode && !countdownMode) {
						if (clock <= 0) {
							clearInterval(IntervalId);
							gameLoopRunning = false; 
							needRestart = true;
						} else {
							clock--;
						}
					}
				}
				for (var i=0;i<players.length;i++) {
					players[i].turn();
					players[i].move();
				}
				if (goalMode) {
					goalStopWatch++;
					if (goalStopWatch>=goalStopWatchTime) {
						goalStopWatch = 0;
						goalMode = false;
						resetPlayers(width/3,0,Math.PI/2);
						resetBall();
						io.sockets.emit('goalStop');
						countdown = 0;
						countdownMode = true;
					}
				} else {
					var whoScore = whoScored();	
					if (whoScore != null) {
						io.sockets.emit('goalStart', (whoScore + ' Scored A Goal!!!'));
						goalMode = true;
					}
				}
				if (countdownMode) {
					countdown++;
					io.sockets.emit('countdownStart', sendCount);
					if (countdown % fps == 0) {
						sendCount--;
						io.sockets.emit('countdownStart', sendCount);
					}
					if(countdown >= countdownTime) {
						for (var i=0;i<players.length;i++) {
							Matter.Body.setStatic(players[i].body,false);
						}
						sendCount = 'Go!'
						io.sockets.emit('countdownStart', sendCount);
						stopCountdownSent = false;
						sendCount = 3;
						countdown = 0;
						countdownMode = false;
					}
				}	
				Engine.update(engine, 1000/fps);
				io.sockets.emit('update', worldStatus());	
			}, 
		1000/fps);
}

io.sockets.on('connection',
// We are given a websocket object in our function
function(socket) {
	console.log('We have a new client: ' + socket.id);
	var team = 'teamBlue';
	if (redTeamPlayers < blueTeamPlayers) {
		team = "teamRed";
		redTeamPlayers++;
	} else {
		blueTeamPlayers++;
	}
	if (redTeamPlayers + blueTeamPlayers <= 6) {
		var player = new Player(team,socket.id);
		players.push(player);
		// 
		socket.emit('start', worldMap());
		// check if we have enough players to start the game loop.
		if (players.length >= 2) {
			if (!gameLoopRunning) {
				gameLoop();
			} else if (needRestart) {
				restart();
				needRestart = false;
			}
		}
		socket.on('PressedEvents', function(key) {
			player = getPlayer(socket.id)
			if (player != null) {
				switch (key) {	
					case space:
						player.isBoosting = true;
						break;

					case up:	
						player.isMoving = true;
						break;

					case shift:
						player.isDrifting = true;
						if (player.rot > 0) {
							player.setRot(rightDir);
						} else if(player.rot < 0) {
							player.setRot(leftDir);
						}
						break;
						
					case rightKey:
						player.setRot(rightDir);	
						player.rightKeyPressed = true;	
						break;

					case leftKey:	
						player.setRot(leftDir);
						player.leftKeyPressed = true;	
						break;
				} 
			}
		});

		socket.on('ReleasedEvents', function(key) {
			player = getPlayer(socket.id);
			switch (key) {	
				case space:
					player.isBoosting = false;
					break;

				case up:	
					player.isMoving = false;
					break;
					
				case shift:
					player.isDrifting = false;
					if (player.rot > 0) {
						player.setRot(rightDir);
					} else if(player.rot < 0) {
						player.setRot(leftDir);
					}
					break;
					
				case rightKey:	
					if (player.leftKeyPressed) {
						player.setRot(leftDir);
					} else {
						player.setLastRot(rightDir);
					}
					player.rightKeyPressed = false;	
					break;

				case leftKey:	
					if (player.rightKeyPressed) {
						player.setRot(rightDir);
					} else {
						player.setLastRot(leftDir);
					}
					player.leftKeyPressed = false;	
					break;
			} 
		});

		socket.on('disconnect', function() {
			var player = getPlayer(socket.id);
			if (player.team == "teamBlue") {
				blueTeamPlayers--;
			} else if (player.team == "teamRed") {
				redTeamPlayers--;
			}
			// remove the player obj from our list of players.
			var removedPlayer = players.splice(players.indexOf(player),1);
			// remove the player body from matter.js physics world.
			World.remove(engine.world,removedPlayer[0].body);
			console.log("Client " + socket.id + " has disconnected");
		});
	} else {
		socket.on('disconnect', function() {
			console.log("Client " + socket.id + " has disconnected");
		});	
	}
});
