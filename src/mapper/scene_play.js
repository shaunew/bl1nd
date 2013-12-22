Blind.Mapper.scene_play = (function(){

	var keyHandler = {
		'press': {
			'space': function() {
				Blind.Mapper.setMode('edit');
			},
		},
	};

	function init() {
		Blind.camera.init(Blind.Mapper.model.getMap());
		Blind.camera.enableViewKeys();
		Blind.camera.enableMoveKeys();
		Blind.camera.enableProjKeys();
		Blind.input.addKeyHandler(keyHandler);
	}

	function cleanup() {
		Blind.camera.disableViewKeys();
		Blind.camera.disableMoveKeys();
		Blind.camera.disableProjKeys();
		Blind.input.removeKeyHandler(keyHandler);
	}

	function draw(ctx) {
		ctx.fillStyle = "#222";
		ctx.fillRect(0,0,Blind.canvas.width, Blind.canvas.height);

		Blind.camera.draw(ctx);
	}

	function update(dt) {
		Blind.camera.update(dt);
	}
	
	return {
		init: init,
		cleanup: cleanup,
		draw: draw,
		update: update,
	};
})();
