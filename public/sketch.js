//--- Started in: 20/8/2017
//--- This version is: 1.2.3 , 7/1/19
//--- Written by Amir Kedem & Elad Shahar
//---

var socket;
var blackCol,
	redCol,
	blueCol;
var borders = [];
var restart = false;
var goalMode = false;
var countdownMode = false;
var space = 0,
	up = 1,
	shift = 2,
	right = 3,
	left = 4;
var blueTeamScore = 0,
	redTeamScore = 0;
var score = blueTeamScore + ' - ' + redTeamScore;
var winnerString = '';
var countdownString;
var clock;
var ballRad,
	ballPos;
// NEEED To link it by the world map function and set it correctly.
var wholeCourtXs = [],
	wholeCourtYs = [];
var courtWidth,
	courtHeight;
var translateX,
	translateY;		
var Xscale,
	Yscale;
// States Of Connection.
var connected = false;
var readyBol = false;

// Game Logic.
// checks if the player connected and there is 2 players or more.
// (being called by a button).
function toggleFullscreen() {
	let fs = fullscreen();
	fullscreen(!fs);
}

function OverlayOn() {
 	document.getElementById("OverlayDiv").style.display = "block";
	document.getElementById("helpBtnDiv").style.display = "none";
}

function OverlayOff() {
	document.getElementById("OverlayDiv").style.display = "none";
	document.getElementById("helpBtnDiv").style.display = "block";
}

function DisplayText(_wholeCourtXs, _wholeCourtYs) {
	push();
	// texts
	let wcXs = (_wholeCourtXs[0] + _wholeCourtXs[1]);
	let wcYs = (_wholeCourtYs[0] + _wholeCourtYs[1]);
	
	fill(255);
	textSize(70);
	textAlign(CENTER, TOP);
	text(clock, wcXs/2, _wholeCourtYs[1]);

	textAlign(CENTER, BOTTOM);
	text(score, wcXs/2, _wholeCourtYs[0]);
	
	fill(blueCol);
	text('Blue Team', wcXs * 1/4, _wholeCourtYs[0]);
	fill(redCol);
	text('Red Team' , wcXs * 3/4, _wholeCourtYs[0]);	
	
	fill(0);
	textAlign(CENTER, CENTER);
	if (winnerString.length > 1 || restart) {
		restart = false;
		textSize(150);
		text(winnerString    , wcXs/2, wcYs/4);
	} else if (countdownMode) {
		textSize(150);
		text(countdownString , wcXs/2, wcYs/4);
	} else if (goalMode) {
		textSize(90);
		text(goalString      , wcXs/2, wcYs/3, 1000, 500);
	}
	pop();
}

function ready() {
	let InputName = document.getElementById('nameInput').value.trim();
	if (InputName.length > 0 && InputName.length < 19) {
		if (!readyBol && connected) {
			readyBol = true;
			socket.emit('isReady',InputName);
			document.body.style.overflow = "hidden";
			document.getElementById('btnID').style.display = 'none';
		}	
	} else {
		alert("please enter a name with more than 1 characters and less than 18");
	}
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function preclock(time) {
	// transform seconds to digital clock digits.
	seconds = time % 60;
	minutes = (time - time % 60)/60;
	
	seconds = seconds < 10 ? '0' + seconds : seconds;
	minutes = minutes < 10 ? '0' + minutes : minutes;
	
	return (minutes + ':' + seconds);
}

function Proportions(_borders) {
	// Scaling The map to match all the screens (with keeping proportions).	
	
	// This function keeps the proportions of the server and display it for 
	// the client We scale the court by the minimum dimension and scale both 
	// dimensions by that ratio to keep the proportions of the server court.
	
	// courtXs the leftest x , rightsest x
	// courtYs the upper y , lower y
	wholeCourtXs = [_borders[4].x + _borders[4].w/2, _borders[5].x - _borders[5].w/2]
	wholeCourtYs = [_borders[4].y + _borders[4].h/2, _borders[5].y - _borders[5].h/2]
	
	courtWidth = (_borders[7].x) - (_borders[6].x);
	courtHeight = (_borders[5].y) - (_borders[4].y);
	
	Xscale = innerWidth / courtWidth;
	Yscale = innerHeight / courtHeight;
	
	// We check which dimension is smaller and scale both 
	// dimensions by that ratio to keep the proportions
	if (Xscale < Yscale) {
		// In order to keep proportions we must scale the X and the Y by the same value 
		Yscale = Xscale;
		
		// Since these borders are negative its important to translate them back to the screen
		translateX = -_borders[6].x * Yscale;
	  translateY = -_borders[4].y * Yscale;
		
		// -*translate the scaled court back to the middle of the screen*-
		// We take the middle of the court and the middle of the screen and 
		// traslate the middle of the court to the middle of the client's screen
		let middleCourtPointY = translateY + _borders[6].y * Yscale;
		let middleScreenPointY = innerHeight / 2;
		
		translateY += (middleScreenPointY - middleCourtPointY);
	} else {
		// In order to keep proportions we must scale the X and the Y by the same value 
		Xscale = Yscale;
		
		// Since these borders are negative its important to translate them back to the screen
		translateX = -_borders[6].x * Xscale;
		translateY = -_borders[4].y * Xscale;
		
		// -*translate the scaled court back to the middle of the screen*-
		// We take the middle of the court and the middle of the screen and 
		// traslate the middle of the court to the middle of the client's screen
		let middleCourtPointX = translateX + _borders[4].x * Xscale;
		let middleScreenPointX = innerWidth / 2;
		
		translateX += (middleScreenPointX - middleCourtPointX);
	}
}
// End of the functions.

// the P5.js initialization.
function setup() {
	// Server.
	var Kport = getCookie('Kport');
	// This for Deploy
	socket = io.connect('https://kadooregel.herokuapp.com:' + Kport);
	// This for Testing
	// socket = io.connect('http://localhost:5000');
    createCanvas(innerWidth, innerHeight);
	//
	blackCol = color(0,0,0);
	redCol = color(255,10,0);
	blueCol = color(0,75,255);
	textStyle(BOLD);
	noLoop();
	//
	socket.on('connected',
		function(totalPlayers){
			if (totalPlayers >= 2) {
				connected = true;
			}
		});
	socket.on('start',
		function(states) {
			// Take the starting div off
			document.getElementById('prematchScene').style.display = 'none';
			// make the make the settings buttons visible
		  	document.getElementById('fullscreenBtnDiv').style.display = 'block';
			document.getElementById('helpBtnDiv').style.display = 'block';
			//
			winnerString = '';
			restart = true;
			// gets the score state.
			blueTeamScore = states[states.length-1][0];
			redTeamScore = states[states.length-1][1];
			score = blueTeamScore + " - " + redTeamScore; 
			// gets the borders data.
			for (let i = 0; i < states.length; i++) {
				borders.push(states[i]);
			}
			
			Proportions(borders);
			ballRad = states[states.length - 2];
		});
	socket.on('goalStart',
		function (goalState) {
			goalMode = true;
			goalString = goalState;
			if (goalState.charAt(0) == 'B') {
				blueTeamScore++;
				//score = blueTeamScore + ' : ' + redTeamScore; 
				score = blueTeamScore + ' - ' + redTeamScore; 
			} else {
				redTeamScore++;
				//score = blueTeamScore + ' : ' + redTeamScore; 
				score = blueTeamScore + ' - ' + redTeamScore; 
			}
		});
	socket.on('goalStop',
		function () {
			goalMode = false;		
		});
	socket.on('countdownStart',
		function (countdownstr) {
			countdownMode = true;
			countdownString = countdownstr;	
		});
	socket.on('countdownStop',
		function () {
			countdownMode = false;
		});
	socket.on('endMatch',
		function (winner) {
			winnerString = winner;
		});
	socket.on('update',
		function (state) {
			if (readyBol) {
				clock = preclock(state.clock);
				ballPos = createVector(state.ballposx,state.ballposy);
				players = state.players;
				redraw();
			}
		});				
}

// the P5.js Loop.
function draw() {
	// p5.js background fn
	//background(backgroundImg);
	background(252,252,252);
	// If i have a map so i have what to render 
	// Or in other words the game has started.
	if (borders.length > 0) {
		// Scalling for all platforms and screens
		translate(translateX, translateY);
		scale(Xscale, Yscale);
		
		// ball 
		renderBall(ballPos, ballRad, (wholeCourtXs[0] + wholeCourtXs[1]));
		
		// borders
		for (let i = 0; i < borders.length; i++) {
			renderBorders(borders[i]);
		}

		// players
		for (let i = 0; i < players.length; i++) {
			renderPlayers(i);
		}
		
		// texts
		DisplayText(wholeCourtXs, wholeCourtYs);
	}
}
// INput
function whichButtonDown(event) {
	if (event.keyCode == 32) {
		socket.emit('PressedEvents',space);		  
    } else if (event.keyCode == 38) {
		socket.emit('PressedEvents',up);						 
	} else if (event.keyCode == 16) {
		socket.emit('PressedEvents',shift);					 
	} else if (event.keyCode == 37) {
		socket.emit('PressedEvents',left);		
	} else if (event.keyCode == 39) {
		socket.emit('PressedEvents',right);						 
	}
}

function whichButtonUp(event) {
	if (event.keyCode == 32) {
  		socket.emit('ReleasedEvents',space);	
  	} else if (event.keyCode == 38) {
		socket.emit('ReleasedEvents',up);
	} else if (event.keyCode == 16) {
		socket.emit('ReleasedEvents',shift);					 
	} else if (event.keyCode == 37) {
		socket.emit('ReleasedEvents',left);		
	} else if (event.keyCode == 39) {
		socket.emit('ReleasedEvents',right);						 
	}
}
// this function is being called every time the window is resized.
function windowResized() {
	resizeCanvas(innerWidth, innerHeight);
	Proportions(borders);
}
