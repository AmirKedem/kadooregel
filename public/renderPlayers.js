function renderPlayers(index) {
	this.team = players[index].team;
	this.name = players[index].name;
	this.textPosX = players[index].PosX;
	this.textPosY = players[index].PosY;	
	
	if (this.team == "teamBlue") {
		this.col = blueCol;
	} else if (this.team == "teamRed") {
		this.col = redCol;
	}
	
	push();
	fill(this.col);
	beginShape();
	for (let i = 0; i < players[index].points.length; i++) {
		vertex(players[index].points[i][0], players[index].points[i][1]);
	}
	endShape()
	// Display the player's name.
	fill(0);
	textSize(18);
	textAlign(CENTER, CENTER);
	text(this.name, this.textPosX, this.textPosY);
	pop();
}