function renderBall() {
	var ballColBlue = map(ballpos.x,courtwidth/2,3*courtwidth/4,0,255);
	var ballColRed = map(ballpos.x,courtwidth/4,courtwidth/2,255,0);
  	fill(ballColRed,0,ballColBlue);
	ellipse(ballpos.x,ballpos.y,ballsize*2);
}
