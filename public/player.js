function renderPlayers(index) {
	this.team = players[index].team;
	if (this.team == "teamBlue") {
		this.col = {
			red: 0,
			green: 0,
		  blue: 255
		}
	} else if (this.team == "teamRed") {
		this.col = {
			red: 255,
			green: 0,
		  blue: 0
		}
	} else {
		this.col = {
			red: 127,
			green: 127,
		  blue: 127
		}
	}
	push();
	fill(this.col.red,this.col.green,this.col.blue);
	beginShape();
	for (var i=0;i<players[index].points.length;i++) {
		vertex(players[index].points[i][0], players[index].points[i][1]);
	}
	endShape()
	pop();
}