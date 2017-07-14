function renderBall() {
	this.ballColBlue = map(ballpos.x,courtwidth/2,3*courtwidth/4,0,255);
	this.ballColRed = map(ballpos.x,courtwidth/4,courtwidth/2,255,0);
  fill(this.ballColRed,0,this.ballColBlue);
	ellipse(ballpos.x,ballpos.y,ballsize*2);
}