function renderBorder(border) {
	this.side = blackCol;
	if (border.side == -1) {
		this.side = blueCol;
	} else if(border.side == 1) {
		this.side = redCol;
	}
	noStroke();
	fill(this.side)
	rectMode(CENTER);
	rect(border.x,border.y,border.w,border.h);
}