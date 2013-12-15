Blind.scene_title = (function(){

	var eye, title;
	var script;

	var lid = (function() {
		var value, target;
		var factor = 0.05;

		function reset() {
			close();
			value = target;
		}

		function update() {
			value += (target-value)*factor;
		}

		function open() {
			target = -Blind.canvas.height;
		}
		function close() {
			target = 0;
		}

		function draw(ctx) {
			ctx.fillStyle = "#222";
			ctx.fillRect(0,value,Blind.canvas.width, Blind.canvas.height);
		}

		return {
			reset: reset,
			open: open,
			close: close,
			update: update,
			draw: draw,
		};
	})();
	
	function init() {
		lid.reset();
		lid.open();
		eye = Blind.assets.images["eye"];
		title = Blind.assets.images["title"];
		script = new Blind.TimedScript([
			{
				time: 2,
				action: function() {
					lid.close();
				},
			},
			{
				dt: 1.5,
				action: function() {
					Blind.setScene(Blind.scene_menu);
				},
			},
		]);
	}

	function update(dt) {
		lid.update();
		script.update(dt);
	}

	function draw(ctx) {
		var w = Blind.canvas.width;
		var h = Blind.canvas.height;
		ctx.fillStyle = "#222";
		ctx.fillRect(0,0,w,h);

		ctx.drawImage(eye,w/2-eye.width/2,h/2-eye.height/2);
		ctx.drawImage(title,w/2-title.width/2,h/2-title.height/2);

		lid.draw(ctx);
	}

	return {
		init: init,
		update: update,
		draw: draw,
	};
})();
