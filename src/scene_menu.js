Blind.scene_menu = (function(){
	
	var script;

	var demo = (function() {
		var points = [
			{dt: 0, x:370, y:217 },
			{dt: 5, x:380, y:48 },
			{dt: 5, x:472, y:112 },
			{dt: 5, x:597, y:129 },
			{dt: 4, x:526, y:160 },
			{dt: 4, x:543, y:253 },
			{dt: 5, x:675, y:311 },
			{dt: 2, x:624, y:367 },
			{dt: 10, x:264, y:372 },
			{dt: 4, x:254, y:258 },
			{dt: 4, x:145, y:251 },
			{dt: 3, x:147, y:204 },
			{dt: 4, x:275, y:188 },
			{dt: 2, x:255, y:120 },
			{dt: 2, x:182, y:94 },
			{dt: 3, x:43, y:101 },
			{dt: 5, x:179, y:35 },
			{dt: 4, x:305, y:72 },
			{dt: 6, x:345, y:186 },
			{dt: 3, x:370, y:217 },
		];
		var delta_times = [];

		var i, len=points.length;
		var p,q;
		for (i=0; i<len; i++) {
			p = points[i];
			q = (i == len-1) ? points[1] : points[i+1];
			delta_times.push(p.dt);
			p.angle = Math.atan2(q.y-p.y, q.x-p.x);
		}

		var path = new Blind.Path(
			Blind.makeHermiteInterpForObjs(points, ['x', 'y', 'angle'], delta_times),
			{
				loop: true,
			});

		function init() {
			path.reset();
		}

		function update(dt) {
			path.step(dt);
			Blind.camera.setPosition(path.pos.x, path.pos.y);
			Blind.camera.setAngle(path.pos.angle);
			Blind.camera.updateProjection();
		}

		return {
			init: init,
			update: update,
		};
	})();

	var shiftCaption = (function() {
		var img;
		var enabled;
		var x=245,y=17;

		var keyHandler = {
			'press': {
				'shift': function() {
					disable();
				},
			},
		};

		var alphaDriver = new Blind.InterpDriver(
			Blind.makeInterp('linear', [0, 1, 0], [0, 0.5, 0.5]),
			{
				loop: true,
			});

		function init() {
			img = Blind.assets.images["shift"];
			disable();
		}

		function enable() {
			Blind.input.addKeyHandler(keyHandler);
			enabled = true;
		}
		
		function disable() {
			Blind.input.removeKeyHandler(keyHandler);
			enabled = false;
		}

		function update(dt) {
			if (enabled) {
				alphaDriver.step(dt);
			}
		}

		function draw(ctx) {
			var alpha = alphaDriver.val;
			
			if (enabled && alpha) {
				ctx.globalAlpha = alpha;
				ctx.drawImage(img, x,y);
				ctx.globalAlpha = 1;
			}
		}

		return {
			init: init,
			enable: enable,
			disable: disable,
			update: update,
			draw: draw,
		};
	})();

	var buttons = (function() {
		var imgTutorial, imgPlay, imgFreeRun;
		var x=12,y0=160,y1=200,y2=240;
		var enabled;

		function isInsideTutorialBtn(mx,my) {
			return (x  <= mx && mx <= x  + imgTutorial.width &&
				y0 <= my && my <= y0 + imgTutorial.height);
		}

		function isInsidePlayBtn(mx, my) {
			return (x  <= mx && mx <= x  + imgPlay.width &&
				y1 <= my && my <= y1 + imgPlay.height);
		}

		function isInsideFreeRunBtn(mx, my) {
			return (x  <= mx && mx <= x  + imgFreeRun.width &&
				y2 <= my && my <= y2 + imgFreeRun.height);
		}

		var startedInsideTutorial, startedInsidePlay, startedInsideFreeRun;
		var mouseHandler = {
			'start': function (mx,my) {
				startedInsideTutorial = isInsideTutorialBtn(mx,my);
				startedInsidePlay = isInsidePlayBtn(mx,my);
				startedInsideFreeRun = isInsideFreeRunBtn(mx,my);
			},
			'end': function (mx,my) {
				if (startedInsideTutorial && isInsideTutorialBtn(mx,my)) {
					Blind.setScene(Blind.scene_intro);
				}
				else if (startedInsidePlay && isInsidePlayBtn(mx,my)) {
				}
				else if (startedInsideFreeRun && isInsideFreeRunBtn(mx,my)) {
					Blind.setScene(Blind.scene_freerun);
				}
			},
		};

		var alphaDriver = new Blind.InterpDriver(
			Blind.makeInterp('linear', [0, 0.6], [0, 1]),
			{
				loop: false,
				freezeAtEnd: true,
			});

		function enable() {
			Blind.input.addMouseHandler(mouseHandler);
			enabled = true;
		}
		function disable() {
			Blind.input.removeMouseHandler(mouseHandler);
			enabled = false;
		}

		function init() {
			disable();
			alphaDriver.reset();
			imgTutorial = Blind.assets.images["menu_tutorial"];
			imgPlay = Blind.assets.images["menu_play"];
			imgFreeRun = Blind.assets.images["menu_freerun"];
		}
		
		function draw(ctx) {
			var alpha = alphaDriver.val;
			
			if (enabled && alpha) {
				ctx.globalAlpha = alpha;
				ctx.drawImage(imgTutorial, x, y0);
				ctx.drawImage(imgPlay, x, y1);
				ctx.drawImage(imgFreeRun, x, y2);
				ctx.globalAlpha = 1;
			}
		}

		function update(dt) {
			if (enabled) {
				alphaDriver.step(dt);
			}
		}

		return {
			enable: enable,
			disable: disable,
			init: init,
			draw: draw,
			update: update,
		};
	})();

	function init() {
		Blind.lid.reset();
		Blind.lid.open();

		map = new Blind.Map(Blind.assets.json["map_title"]);
		Blind.camera.init(map);
		Blind.camera.disableViewKeys();
		Blind.camera.disableMoveKeys();
		Blind.camera.enableProjKeys();

		buttons.init();
		shiftCaption.init();
		demo.init();

		script = new Blind.TimedScript([
			{
				time: 2,
				action: function() {
					shiftCaption.enable();
					buttons.enable();
				},
			},
		]);
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

		buttons.draw(ctx);
		shiftCaption.draw(ctx);
		Blind.lid.draw(ctx);
	}

	function update(dt) {
		demo.update(dt);
		Blind.camera.update(dt);
		Blind.lid.update(dt);
		script.update(dt);
		buttons.update(dt);
		shiftCaption.update(dt);
	}
	
	return {
		init: init,
		cleanup: cleanup,
		draw: draw,
		update: update,
	};
})();
