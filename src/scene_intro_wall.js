
Blind.scene_intro_wall = (function(){
	var script;
	var map;

	function init() {
		Blind.lid.reset();
		Blind.lid.open();

		map = new Blind.Map(Blind.assets.json["map_intro_wall"]);

		Blind.camera.init(map);
		Blind.camera.enableViewKeys();
		Blind.camera.enableMoveKeys();
		Blind.camera.enableProjKeys();

		Blind.camera.setPosition(344.83477923125224, 139.8360962546366);
		Blind.camera.setAngle(1.574607078670866);
		Blind.camera.updateProjection();

		script = new Blind.TimedScript([
			{
				time: 1,
				action: function() {
					Blind.caption.show('msg_wall00', 2);
				},
			},
		]);

		Blind.camera.addCollideAction('wall', function() {
			Blind.caption.show('msg_wall01',2);
		});

		Blind.camera.addCollideAction('me', function() {
			Blind.caption.show('msg_wall02',2);
			script = new Blind.TimedScript([
				{
					time: 4,
					action: function() {
						Blind.setScene(Blind.scene_intro_hall);
					},
				},
			]);
		});
	}

	function cleanup() {
		Blind.camera.disableViewKeys();
		Blind.camera.disableMoveKeys();
		Blind.camera.disableProjKeys();
	}

	function draw(ctx) {
		ctx.fillStyle = "#222";
		ctx.fillRect(0,0,Blind.canvas.width, Blind.canvas.height);

		Blind.camera.draw(ctx);
		Blind.caption.draw(ctx);

		Blind.lid.draw(ctx);
	}

	function update(dt) {
		Blind.camera.update(dt);
		Blind.lid.update(dt);
		Blind.caption.update(dt);
		script.update(dt);
	}

	return {
		init: init,
		draw: draw,
		update: update,
	};
})();
