function renderBorder(border) {
	this.side = {
		red: 0,
		blue: 0
	}
	
	if (border.side == -1) {
		this.side = {
			red: 0,
			blue: 255
		}
	} else if(border.side == 1) {
		this.side = {
			red: 255,
			blue: 0
		}
	}
	noStroke();
	fill(this.side.red,0,this.side.blue)
	rectMode(CENTER);
	rect(border.x,border.y,border.w,border.h);
	rectMode(CORNER);
}