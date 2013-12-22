
Blind.Mapper.scene_edit = (function(){
	
	function init() {
		Blind.Mapper.model.init();
	}

	function cleanup() {
		Blind.Mapper.model.cleanup();
	}

	function update(dt) {
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
