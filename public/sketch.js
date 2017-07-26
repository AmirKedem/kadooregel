//--- 25/7/2017
//--- Written by Amir Kedem & Elad Shahar
//---
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
//
function preclock(time) {
	var timeconst = Math.floor(time/60)
	if (time - 60 * timeconst < 10) {
		clock = timeconst + ':0' + (time - 60 * timeconst);
	} else {
		clock = timeconst + ':' + (time - 60 * timeconst);
	}
}
//
var isTextClear = false;
var borders = [];
var goalMode = false;
var countdownMode = false;
var courtwidth;
var translateX;
var translateY;		
var space = 0;
var up = 1;
var shift = 2;
var right = 3;
var left = 4;
var blueTeamScore = 0;
var redTeamScore = 0;
var score = blueTeamScore + ' - ' + redTeamScore;
var winnerString = '';
var restart = false;
var countdownString;
var clock;
var ballsize; 
var ballpos;
var socket;
// Scaling The map to match all the screens (without keeping proportions).
var serverWidth = 1857;
var serverHeight = 990;	
// Scaling The map to match all the screens (without keeping proportions).
var Xscale = innerWidth/serverWidth; 
var Yscale = innerHeight/serverHeight;
//
function setup() {
	// Server.
	var Kport = getCookie('Kport');
	socket = io.connect('https://kadooregel.herokuapp.com:' + Kport);
	//socket = io.connect('http://localhost:5000');
	/*
	if (Kport == '5000') {
		socket = io.connect('http://localhost:5000');
	} else {
		socket = io.connect('https://kadooregel.herokuapp.com:' + Kport);
	}
	*/
	//
  createCanvas(innerWidth, innerHeight);
	textStyle(BOLD);
	noLoop();
	//
	socket.on('start',
		function(states) {
			winnerString = '';
			restart = true;
			// gets the score state.
			blueTeamScore = states[states.length-1][0];
			redTeamScore = states[states.length-1][1];
			score = blueTeamScore + " - " + redTeamScore; 
			// gets the borders data.
			for (var i=0; i<states.length;i++) {
				borders.push(states[i]);
			}
			courtwidth = Math.abs(borders[2].x) - Math.abs(borders[0].x);
			courtheight = Math.abs(borders[4].y) - Math.abs(borders[5].y);
			translateX = (serverWidth - courtwidth)/2;
			translateY = (serverHeight - courtheight)/2;
		});
	socket.on('goalStart',
		function(goalState) {
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
		function() {
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
		function(state) {
			if (!isTextClear) {
				document.getElementById('prematch').innerHTML = "";
				isTextClear = true;
			}
		  preclock(state.clock);
			ballpos = createVector(state.ballposx,state.ballposy);
			ballsize = state.ballsize;
			players = state.players;
			redraw();
		});				
}

function draw() {
  // p5.js background fn
  //background(backgroundImg);
  background(255,255,255);
	translate(translateX*Xscale,translateY*Yscale);
	scale(Xscale,Yscale);
	if (borders.length>0) {
		renderBall();
		for (var i=0;i<players.length;i++) {
			renderPlayers(i);
		}
		for(var i=0;i<borders.length;i++) {
			renderBorder(borders[i]);
		}
		textAlign(CENTER);
		textSize(90);
		fill(255);
		text(score,courtwidth/2,courtheight/20);
		text(clock,courtwidth/2,courtheight+courtheight/50);
		fill(0,0,255);
		text('Blue Team',courtwidth/4,courtheight/20);
		fill(255,0,0);
		text('Red Team',courtwidth*3/4,courtheight/20);
		if (winnerString.length > 1 || restart) {
			fill(0);
			textSize(150);
			textAlign(CENTER);
			text(winnerString,courtwidth/2,courtheight/4);
			restart = false;
		} else if (countdownMode) {
			fill(0);
			textSize(150);
			textAlign(CENTER);
			text(countdownString,courtwidth/2,courtheight/4);
		} else if (goalMode) {
			fill(0);
			textSize(90);
			rectMode(CENTER);
			textAlign(CENTER);
			text(goalString, courtwidth/2, courtheight/2,1000,500);
		}
	}
}

function windowResized() {
	Xscale = innerWidth/serverWidth; 
  Yscale = innerHeight/serverHeight;
  resizeCanvas(innerWidth, innerHeight);
}

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