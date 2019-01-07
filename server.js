let gameobjs = require('./gameobjs');
let Player = gameobjs.Player;
let Ball = gameobjs.Ball;
let Border = gameobjs.Border;

let express = require('express');
let cookieParser = require('cookie-parser');
let Matter = require('matter-js');
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
		Body = Matter.Body,
		Vector = Matter.Vector;
let app = express();
app.set('port', (process.env.PORT || 5000));
let server = app.listen(app.get('port'),listen);
// This call back just tells us that the server has started
function listen() {
	console.log("The amazing KadooRegel server");
	console.log('Node app is running on port', app.get('port'));
}
// need cookieParser middleware before we can do anything with cookies
app.use(cookieParser());
app.use(function (req, res, next) {
	res.cookie('Kport',app.get('port'), { maxAge: 900000, httpOnly: true });
	next(); // <-- important!
});
app.use(express.static('public'));
//
let socket = require('socket.io'); 
let io = socket(server);
//
function cleanName(name) {
	if (name.length < 1) {
		name = 'Player';
	} else {
		name = (name.length > 19) ? name.substring(0, 19) : name;
	}
	// this is the list of the curse words.
	let words = ['fuck','retard','shit','whore','ass','asshole','idiot','dumb','fucker',
	'bitch','stupid','pusy','pussy','cock','dick','gay','fag','faggot','fagot','nigga',
	'nigger','damn','darn','piss','douche','slut','bastard','crap','cunt'];
	// This function gets a string and replaces all the curses with '*'.
	for (let i = 0; i < words.length; i++) {
				let curse = words[i];
				let reg = new RegExp(curse, 'gi');
				name = name.replace(reg,'*'.repeat(curse.length));
	}
	return name;
}
//
function pushBorders(TheWorld) {
	let bordersWidth = 140,
		  bordersHeight = 350;
	
	borders.push(
		// the left & right borders.
		new Border(0          , height/10           , bordersWidth, bordersHeight, -1),
		new Border(0          , height - height/10  , bordersWidth, bordersHeight, -1),
		new Border(width      , height/10           , bordersWidth, bordersHeight,  1),
		new Border(width      , height - height/10  , bordersWidth, bordersHeight,  1),
		// the upper & lower borders.
		new Border(width/2    , 0      - 50         , width + bordersWidth, bordersWidth, 0),
		new Border(width/2    , height + 50         , width + bordersWidth, bordersWidth, 0),
		// the left & right long borders.
		new Border(0     - bordersWidth, height/2 , bordersWidth, height + bordersWidth + 100, -1),
		new Border(width + bordersWidth, height/2 , bordersWidth, height + bordersWidth + 100,  1)
	);
	
	for (let i = 0; i < borders.length; i++) {
		World.add(TheWorld, borders[i].Body);
	}
}
// resets the Players and the Ball to their original location.
function resetObj(xOffSet, yOffSet, angle, mass) {
	// Ball Reset
	let ballPosVector = Vector.create(width/2, height/2);
	let ballVelVector = Vector.create(0, 0);
	Body.setPosition(ball.body, ballPosVector);
	Body.setVelocity(ball.body, ballVelVector);
	// Players Reset
	let BluePlayersPosVector = Vector.create(width/2 - xOffSet, height/2 - yOffSet);
	let RedPlayersPosVector = Vector.create(width/2 + xOffSet, height/2 - yOffSet);
	let BluePlayersAngle = angle;
	let RedPlayersAngle = -angle;
	for (let i=0; i < players.length; i++) {
		if (players[i].body != undefined) {
			Body.setStatic(players[i].body, true);
			if (players[i].team == 'teamBlue') {
				Body.setPosition(players[i].body, BluePlayersPosVector);
				Body.setAngle(players[i].body, BluePlayersAngle);
			} else {
				Body.setPosition(players[i].body, RedPlayersPosVector);
				Body.setAngle(players[i].body, RedPlayersAngle);
			}
		}
	}
}
// restarts the game.
function restart() {
	console.log("Restart Game");
	needRestart = false;
	goalStopWatch = 0;
	goalMode = false;
	resetObj(width/3, 0, Math.PI/2, Player.PlayerMass);
	countdown = 0;
	sendCount = 3;
	countdownMode = true;
	blueTeamScore = 0;
    redTeamScore = 0;
	onesecstopper = 0;
	clock = 300;
	stopCountdownSent = false;
	io.sockets.emit('start', worldMap());
	gameLoop();
}
// Map message
function worldMap() {
	let score = [blueTeamScore, redTeamScore];
	let states = [];
	for (let i=0; i < borders.length; i++) {
		states.push(borders[i].border);
	}
	states.push(ball.r);
	states.push(score);
	return states;
}
// update status message
function worldStatus() {
	let players_state = [];
	for (let i = 0; i < players.length; i++) {
		if (players[i].body != undefined) {
			let vertices = [];
			for (let j = 0;j < players[i].body.vertices.length; j++) {	
				vertices.push([players[i].body.vertices[j].x, players[i].body.vertices[j].y]);
			}

			let player_state = {points: vertices,
								PosX: players[i].body.position.x,
								PosY: players[i].body.position.y,
								team: players[i].team,
								name: players[i].nickname};
			players_state.push(player_state);
		}
	}
	
	let state = {ballposx: ball.body.position.x,
				 ballposy: ball.body.position.y,
				 players: players_state,
				 clock: clock};
	
	return state;
}
// check who scored
function whoScored() {
	let posx = ball.body.position.x;
	let rad = ball.r;
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
	for(let i = 0; i < players.length; i++) {
		if (players[i].Id == Id) {
			return players[i];
		}
	}
	
	return null;
}
//
function numReadyPlayers() {
	let readyPlayers = 0;
		for (let i = 0; i < players.length; i++) {
			if (players[i].body != undefined) {
				readyPlayers++;
			}
		}
		return readyPlayers;
}
//
function removePlayer(ID){
	let player = getPlayer(ID);
	if (player != null) {
		if (player.team == "teamBlue") {
			blueTeamPlayers--;
		} else if (player.team == "teamRed") {
			redTeamPlayers--;
		} 
		// remove the player obj from our list of players.
		let removedPlayer = players.splice(players.indexOf(player),1);
		// remove the player body from matter.js physics world.
		if (removedPlayer[0].body != undefined) {
		   World.remove(engine.world, removedPlayer[0].body);
		}
	}
}
// ----- Variables -----
// 40 tick server a brodacast update 40 times a second
let fps = 40;
// The maximum player capacity
// The remaining players will be spectators
let playerCap = 6; 
let blueTeamScore = 0,
    redTeamScore = 0;
let blueTeamPlayers = 0,
    redTeamPlayers = 0;
let space = 0,
	up = 1,
	shift = 2,
	rightKey = 3,
	leftKey = 4;
let rightDir = 1,
    leftDir = -1;
let countdown = 0;
// this is the message that we send to our clients.
let sendCount = 3;
let countdownTime = fps * 3;
// asks whether we told our clients that the countdown is over.
let stopCountdownSent = false;
let countdownMode = true;
let goalMode = false;
let goalStopWatch = 0;
let goalStopWatchTime = fps * 5;
let startLoop = true;
let gameLoopRunning = false;
let needRestart = false;
// a stop watch for one sec.
let onesecstopper = 0;
let clock = 300;
let readyCount = 0;
let IntervalId;
let players = [];
let width = 1600,
	height = 900;
let engine;
// Creates the Engine.
engine = Engine.create();
engine.world.gravity.x = 0;
engine.world.gravity.y = 0;
engine.world.bounds = { min: { x: -width - 100, y: -height - 100}, max: { x: width + 100, y: height + 100} };
// Borders.
let borders = [];
pushBorders(engine.world);
// Ball.
let ball = new Ball(width/2, height/2, 50, engine);
World.add(engine.world, ball.Body);
// the game loop.
function gameLoop() {
	gameLoopRunning = true;
	IntervalId = setInterval(
		function() {
			onesecstopper++;
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
						let winner;
						if (blueTeamScore == redTeamScore) {
							winner = 'Tie';
						} else {
							winner = (blueTeamScore > redTeamScore)? 'Blue Team Wins': 'Red Team Wins';
						}
						io.sockets.emit('endMatch',winner);
						needRestart = true;
					} else {
						clock--;
					}
				}
			}

			for (let i = 0; i < players.length; i++) {
				players[i].turn();
				players[i].move();
			}
			
			if (goalMode) {
				goalStopWatch++;
				if (goalStopWatch >= goalStopWatchTime) {
					goalStopWatch = 0;
					goalMode = false;
					resetObj(width/3, 0, Math.PI/2, Player.PlayerMass);
					io.sockets.emit('goalStop');
					countdown = 0;
					countdownMode = true;
				}
			} 
			else {
				let whoScore = whoScored();	
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
					for (let i = 0; i < players.length; i++) {
						if (players[i].body != undefined) {
							Body.setStatic(players[i].body, false);
							Body.setMass(players[i].body, Player.PlayerMass);
						}
					}
					sendCount = 'Go!';
					io.sockets.emit('countdownStart', sendCount);
					stopCountdownSent = false;
					sendCount = 3;
					countdown = 0;
					countdownMode = false;
				}
			}
			Engine.update(engine, 1000/fps);
			io.sockets.emit('update', worldStatus());
		},1000/fps);
}
//
io.sockets.on('connection',
// We are given a websocket object in our function
function(socket) {
	console.log('We have a new client: ' + socket.id);
	players.push(new Player(socket.id, countdownMode, width, height));
	
	io.sockets.emit('connected', players.length);
	socket.on('isReady', function(name) {
		let totalPlayers = redTeamPlayers + blueTeamPlayers;
		if (totalPlayers < playerCap) {
			let team = 'teamBlue';
			if (redTeamPlayers < blueTeamPlayers) {
				team = 'teamRed';
				redTeamPlayers++;
			} else {
				blueTeamPlayers++;
			}
			// Give the player his nickname and his team
			// And Set his physical body.
			let player = getPlayer(socket.id);
			player.setTeam(team, cleanName(name));
			World.add(engine.world, player.Body);
			socket.emit('start', worldMap());
			// check if we have enough players to start the game loop.
			if (numReadyPlayers() >= 2) {
				if (needRestart) {
					restart();
				} else if (!gameLoopRunning) {
					gameLoop();
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
							if (player.rightKeyPressed) {
								player.setRot(rightDir);
							} else if(player.leftKeyPressed) {
								player.setRot(leftDir);
							}
							break;
						case rightKey:
							player.setRot(rightDir);	
							player.rightKeyPressed = true;
							player.lastKeyPressed = rightDir;
							break;
						case leftKey:	
							player.setRot(leftDir);
							player.leftKeyPressed = true;	
							player.lastKeyPressed = leftDir;
							break;
					} 
				}
			});
			socket.on('ReleasedEvents', function(key) {
				player = getPlayer(socket.id);
				if (player != null) {
					switch (key) {	
						case space:
							player.isBoosting = false;
							break;
						case up:	
							player.isMoving = false;
							break;
						case shift:
							player.isDrifting = false;
							if (player.rightKeyPressed) {
								player.setRot(rightDir);
							} else if (player.leftKeyPressed) {
								player.setRot(leftDir);
							} else {
								if (!player.lastKeyPressed == 0) {
									player.setLastRot(player.lastKeyPressed)
								} else {
									player.setRot(0)
								}
							}
							break;
						case rightKey:	
							if (player.leftKeyPressed) {
								player.setRot(leftDir);
							} else {
								player.setLastRot(rightDir);
							}
							player.rightKeyPressed = false;	
							if (player.leftKeyPressed) {
								player.lastKeyPressed = leftDir;
							}
							break;
						case leftKey:	
							if (player.rightKeyPressed) {
								player.setRot(rightDir);
							} else {
								player.setLastRot(leftDir);
							}
							player.leftKeyPressed = false;	
							if (player.rightKeyPressed) {
								player.lastKeyPressed = rightDir;
							}
							break;
					} 
				}
			});
		} 
		else {
			socket.emit('start', worldMap());
		}
	});
	
	socket.on('disconnect', function() {
		removePlayer(socket.id);
		console.log("Client " + socket.id + " has disconnected");
	});	
});
