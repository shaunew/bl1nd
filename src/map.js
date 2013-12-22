Blind.Box = function(dict) {
	this.x = dict.x;
	this.y = dict.y;
	this.color = dict.color;
	this.name = dict.name || "";
	this.w = dict.w;
	this.h = dict.h;
};

Blind.Box.prototype = {
	draw: function(ctx) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.w, this.h);
	},
};

Blind.Map = function(dict) {
	dict = dict || {};

	this.w = (dict.w != null) ? dict.w : Blind.canvas.width;
	this.h = (dict.h != null) ? dict.h : Blind.canvas.height;

	this.boxes = [];
	var boxStates = dict.boxes;
	if (boxStates) {
		var i,len=boxStates.length;
		for (i=0; i<len; i++) {
			this.boxes.push(new Blind.Box(boxStates[i]));
		}
	}

	this.player = dict.player || { x: 20, y: 20, angle: 0 };
};

Blind.Map.prototype = {
	draw: function(ctx) {
		var i,len=this.boxes.length;
		for (i=0; i<len; i++) {
			this.boxes[i].draw(ctx);
		}
	},
	getState: function() {
		var i,len=this.boxes.length;
		var b;
		var state = {
			player: this.player,
			boxes: [],
		};
		for (i=0; i<len; i++) {
			b = this.boxes[i];
			state.boxes.push({
				x: b.x,
				y: b.y,
				w: b.w,
				h: b.h,
				color: b.color,
				name: b.name,
			});
		}
		return state;
	},
};
