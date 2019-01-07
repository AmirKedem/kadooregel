function renderBall(BallPos, BallRad, CourtWidth) {
	let ballColBlue = map(BallPos.x, CourtWidth/2, CourtWidth * 3/4, 0, 255);
	let ballColRed = map(BallPos.x, CourtWidth/4, CourtWidth * 1/2, 255, 0);
	fill(ballColRed, 0, ballColBlue);
	ellipse(BallPos.x, BallPos.y, BallRad * 2);
}
