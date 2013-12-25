
Blind.scene_wreath = (function(){
	var script;
	var map;

	var card = (function() {

		var back={ x:0, y:336, w:56, h:67};
		var next={ x:668, y:339, w:52, h:66};
		
		var shouldBlinkArrow = true;
		var arrowBlink = new Blind.InterpDriver(
			Blind.makeInterp('linear', [0,1,0], [0, 0.25, 0.25]),
			{
				loop: true,
			}
		);

		var mouseHandler = {
			'end': function(x,y) {
				if (back.x <= x && x <= back.x + back.w &&
					back.y <= y && y <= back.y + back.h) {
					advance(-1);
				}
				else if (
					next.x <= x && x <= next.x + next.w &&
					next.y <= y && y <= next.y + next.h) {
					advance(1);
					shouldBlinkArrow = false;
				}
			},
		};

		var currentIndex;
		var messages = [
			'xmas00',
			'xmas01',
			'xmas02',
			'xmas03',
			'xmas04',
			'xmas05',
			'xmas06',
		];

		function addSecret() {
			messages.push('xmas07');
			advance(1);
		}

		function advance(d) {
			var nextIndex = currentIndex + d;
			if (0 <= nextIndex && nextIndex < messages.length) {
				currentIndex = nextIndex;
				alphaDriver.reset();
			}
		}

		var alphaDriver = new Blind.InterpDriver(
			Blind.makeInterp('linear', [0,1], [0,0.5]),
			{
				freezeAtEnd: true,
			}
		);

		function init() {
			back.img = Blind.assets.images['xmas_back'];
			next.img = Blind.assets.images['xmas_next'];
			currentIndex = 0;
			alphaDriver.reset();
			Blind.input.addMouseHandler(mouseHandler);
		}

		function update(dt) {
			alphaDriver.step(dt);
			arrowBlink.step(dt);
		}

		function draw(ctx) {
			if (0 < currentIndex && currentIndex < messages.length) {
				ctx.drawImage(back.img, back.x, back.y);
			}
			if (0 <= currentIndex && currentIndex < messages.length-1) {
				if (shouldBlinkArrow) {
					ctx.globalAlpha = arrowBlink.val;
				}
				ctx.drawImage(next.img, next.x, next.y);
			}
			ctx.globalAlpha = alphaDriver.val;
			ctx.drawImage(Blind.assets.images[messages[currentIndex]],0,0);
			ctx.globalAlpha = 1;
		}
		
		return {
			init: init,
			draw: draw,
			update: update,
			addSecret: addSecret,
		};
	})();

	var blue_lights = (function(){
		var a,b;
		function init() {
			a = [];
			b = [];
			var i,len=map.boxes.length;
			var box;
			for (i=0; i<len; i++) {
				box = map.boxes[i];
				if (box.name == 'light1') {
					a.push(box);
				}
				else if (box.name == 'light3') {
					b.push(box);
				}
			}
		}

		function setColor(list, color) {
			var i,len=list.length;
			for (i=0; i<len; i++) {
				list[i].color = color;
			}
		}

		var time = 0;
		function update(dt) {
			time += dt;
			var t = time * 3;
			if (Math.floor(t%2) == 0) {
				setColor(a,'green');
				setColor(b,'blue');
			}
			else {
				setColor(a,'blue');
				setColor(b,'green');
			}
		}
		
		return {
			init: init,
			update: update,
			draw: draw,
		};
	})();

	var yellow_lights = (function(){
		var a;
		function init() {
			a = [];
			var i,len=map.boxes.length;
			var box;
			for (i=0; i<len; i++) {
				box = map.boxes[i];
				if (box.name == 'light2') {
					a.push(box);
				}
			}
		}

		var time = 0;
		function update(dt) {
			time += dt;
			var t = time * 20;
			var i,len=a.length;
			var j = Math.floor(t%len);
			for (i=0; i<len; i++) {
				if (i == j) {
					a[i].color = 'yellow';
				}
				else if (Math.abs(i-j) == 1) {
					a[i].color = 'white';
				}
				else {
					a[i].color = 'green';
				}
			}
		}
		
		return {
			init: init,
			update: update,
			draw: draw,
		};
	})();

	var snow = (function(){

		var points = [];
		var count = 200;

		function start() {
			var i;
			for (i=0; i<count; i++) {
				points.push({
					x0: Math.random()*720,
					x: 0,
					y: -Math.random()*Blind.canvas.height,
					yv: Math.random()*60+60,
					width: Math.random()*100,
					timeWidth: Math.random()*10+3,
					radius: Math.random()*2+2,
				});
			}
		}

		var time=0;
		function update(dt) {
			time += dt;
			var i,len=points.length;
			var p;
			for (i=0; i<len; i++) {
				p = points[i];
				p.x = (p.x0 + Math.sin(time/p.timeWidth*Math.PI)*p.width) % Blind.canvas.width;
				if (p.x < 0) {
					p.x += Blind.canvas.width;
				}
				else if (p.x > Blind.canvas.width) {
					p.x -= Blind.canvas.width;
				}
				
				p.y += p.yv * dt;
				if (p.y > Blind.canvas.height) {
					p.y -= Blind.canvas.height;
				}
			}
		}

		function draw(ctx) {
			var i,len=points.length;
			var p;
			ctx.fillStyle = "#FFF";
			for (i=0; i<len; i++) {
				p = points[i];
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
				ctx.fill();
			}
		}

		return {
			start: start,
			update: update,
			draw: draw,
		};
	})();

	var caption = (function(){
		var alphaDriver;
		var x=0,y=0;
		var image;

		function show(imageName, time) {
			image = Blind.assets.images[imageName];
			alphaDriver = new Blind.InterpDriver(
				Blind.makeInterp('linear', [0, 1, 1, 0], [0, 1, time, 1]),
				{
					freezeAtEnd: true,
				});
		}

		function update(dt) {
			if (alphaDriver) {
				alphaDriver.step(dt);
			}
		}

		function draw(ctx) {
			if (alphaDriver) {
				var alpha = alphaDriver.val;
				if (alpha) {
					ctx.globalAlpha = alpha;
					ctx.drawImage(image, x,y);
					ctx.globalAlpha = 1;
				}
			}
		}

		return {
			show: show,
			update: update,
			draw: draw,
		};
	})();

	function init() {
		Blind.lid.reset();
		Blind.lid.open();

		map = new Blind.Map(Blind.assets.json["map_wreath"]);

		Blind.camera.init(map);
		Blind.camera.enableViewKeys();
		Blind.camera.enableMoveKeys();
		Blind.camera.enableProjKeys();

		blue_lights.init();
		yellow_lights.init();
		card.init();

		Blind.camera.addCollideAction('me', function() {
			card.addSecret();
			snow.start();
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

		Blind.camera.updateProjection();
		Blind.camera.draw(ctx);
		caption.draw(ctx);

		Blind.lid.draw(ctx);
		snow.draw(ctx);
		card.draw(ctx);
	}

	function update(dt) {
		Blind.camera.update(dt);
		Blind.lid.update(dt);
		caption.update(dt);
		blue_lights.update(dt);
		yellow_lights.update(dt);
		snow.update(dt);
		card.update(dt);
	}

	return {
		init: init,
		draw: draw,
		update: update,
	};
})();
