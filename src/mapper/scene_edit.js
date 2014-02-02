
Blind.Mapper.scene_edit = (function(){

	var keyHandler = {
		'press': {
			'0': function() {
				Blind.Mapper.setMode('play');
			},
		},
	};
	
	function init() {
		Blind.Mapper.model.init();
		Blind.input.addKeyHandler(keyHandler);
	}

	function cleanup() {
		Blind.Mapper.model.cleanup();
		Blind.input.removeKeyHandler(keyHandler);
	}

	function update(dt) {
		Blind.Mapper.model.update(dt);
	}

	function draw(ctx) {
		ctx.fillStyle = "#222";
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 4;
		ctx.fillRect(0,0,Blind.canvas.width, Blind.canvas.height);
		ctx.strokeRect(0,0,Blind.canvas.width, Blind.canvas.height);
		Blind.Mapper.model.draw(ctx);
	}

	return {
		init: init,
		cleanup: cleanup,
		update: update,
		draw: draw,
	};
})();
