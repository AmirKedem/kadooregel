function preclock(time) {
	var timeconst = Math.floor(time/60)
	if (time - 60 * timeconst < 10) {
		clock = timeconst + ':0' + (time - 60 * timeconst);
	} else {
		clock = timeconst + ':' + (time - 60 * timeconst);
	}
}
//
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
var countdownString;
var clock;
var ballsize; 
var ballpos;
var socket;
// background image setup.
/*var backgroundImg;
function preload() {
	backgroundImg = loadImage("football.jpg");
}*/
//var dimension = [document.documentElement.clientWidth, document.documentElement.clientHeight];
function setup() {
	socket = io.connect('https://salty-escarpment-49001.herokuapp.com');
  //createCanvas(dimension[0], dimension[1]);
  createCanvas(innerWidth, innerHeight);
	noLoop();
	textStyle(BOLD);
	socket.on('start',
		function(states) {
			// gets the score state.
			blueTeamScore = states[states.length-1][0];
			redTeamScore = states[states.length-1][1];
			//score = blueTeamScore + " : " + redTeamScore; 
			score = blueTeamScore + " - " + redTeamScore; 
			// gets the borders data.
			for (var i=0; i<states.length;i++) {
				borders.push(states[i]);
			}
			courtwidth = Math.abs(borders[2].x) - Math.abs(borders[0].x);
			courtheight = Math.abs(borders[4].y) - Math.abs(borders[5].y);
			translateX = (width - courtwidth)/2;
			translateY = (height - courtheight)/2;
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
	
	socket.on('update',
		function(state) {
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
	translate(translateX,translateY);
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
		if (goalMode) {
			fill(0);
			textSize(90);
			rectMode(CENTER);
			textAlign(CENTER);
			text(goalString, courtwidth/2, courtheight/2,1000,500);
		}	
		if (countdownMode) {
			fill(0);
			textSize(150);
			textAlign(CENTER);
			text(countdownString,courtwidth/2,courtheight/4);
		}
	}
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