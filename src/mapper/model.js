Blind.Mapper.model = (function(){

	var map;
	var projection;

	// references to map player and boxes properties
	var player, boxes;

	// INDEX SELECTION

	var playerSelected;
	function selectPlayer() {
		playerSelected = true;
		selectedIndex = null;
		refreshNameDisplay();
		updateProjection();
	}

	var selectedIndex;
	function selectIndex(i) {
		playerSelected = false;
		selectedIndex = i;
		refreshNameDisplay();
	}

	// DISPLAY BINDING

	function refreshNameDisplay() {
		var name = "";
		if (boxes) {
			var box = boxes[selectedIndex];
			if (box && box.name) {
				name = box.name;
			}
		}
		$('#objectName').html(name);
	}

	// STATE SET & GET

	function updateProjection() {
		projection = Blind.getProjection({
			x: player.x,
			y: player.y,
			boxes: boxes,
		});
	}

	function setMapState(state) {
		selectIndex(null);
		map = new Blind.Map(state);
		player = map.player;
		boxes = map.boxes;
		updateProjection();
	}

	function getMapState() {
		return map.getState();
	}

	function getMap() {
		return map;
	}

	// INTERFACE FUNCTIONS

	function addBox() {
		boxes.push(new Blind.Box({x:0, y:0, w:50, h:50, color:"#00F"}));
		selectIndex(boxes.length-1);
		Blind.Mapper.loader.backup();
	}

	function removeBox() {
		if (selectedIndex != null) {
			boxes.splice(selectedIndex, 1);
			selectIndex(null);
			Blind.Mapper.loader.backup();
		}
	}

	function duplicateBox() {
		if (selectedIndex != null) {
			var b = boxes[selectedIndex];
			var b2 = new Blind.Box(b);
			b2.x = 0;
			b2.y = 0;
			b2.name = "";
			boxes.push(b2);
			selectIndex(boxes.length-1);
			Blind.Mapper.loader.backup();
		}
	}

	function renameBox() {
		if (selectedIndex != null) {
			var box = boxes[selectedIndex];
			bootbox.prompt("Rename box:", "Cancel", "OK", function(result) {
				if (result != null) {
					box.name = result;
					refreshNameDisplay();
					Blind.Mapper.loader.backup();
				}
			}, box.name || "");
		}
	}

	function colorBox() {
		if (selectedIndex != null) {
			var box = boxes[selectedIndex];
			bootbox.prompt("Change box color:", "Cancel", "OK", function(result) {
				if (result != null) {
					box.color = result;
					Blind.Mapper.loader.backup();
				}
			}, box.color || "");
		}
	}

	// MOUSE FUNCTIONS

	var mouseHandler = (function(){

		var moveFunc;

		function getResizeFunc(box,x,y) {
			var dx = x - (box.x + box.w);
			var dy = y - (box.y + box.h);
			var distSq = dx*dx + dy*dy;
			if (distSq < 100) {
				return function(x,y) {
					box.w = Math.max(10, x-dx - box.x);
					box.h = Math.max(10, y-dy - box.y);
				};
			}
		}

		function getMoveFunc(box,x,y) {
			var dx = x - box.x;
			var dy = y - box.y;
			if (0 <= dx && dx <= box.w &&
				0 <= dy && dy <= box.h) {
				return function(x,y) {
					box.x = x - dx;
					box.y = y - dy;
				};
			}
		}

		function getMovePlayerFunc(x,y) {
			var dx = x - player.x;
			var dy = y - player.y;
			var distSq = dx*dx + dy*dy;
			var radius = 10;
			if (distSq <= radius*radius) {
				return function(x,y) {
					player.x = x - dx;
					player.y = y - dy;
					updateProjection();
				};
			}
		}

		return {
			start: function(x,y) {

				moveFunc = null;
				var i,len=boxes.length;
				var f,box;

				moveFunc = getMovePlayerFunc(x,y);
				if (moveFunc) {
					selectPlayer();
				}
				else if (selectedIndex != null) {
					// if an object is already selected
					box = boxes[selectedIndex];
					moveFunc = getResizeFunc(box,x,y) || getMoveFunc(box,x,y);
				}

				// if no move function has been created
				if (!moveFunc) {

					// deselect
					selectIndex(null);

					// find the first object under the cursor
					for (i=0; i<len; i++) {
						box = boxes[i];
						f = getMoveFunc(box,x,y);
						if (f) {
							moveFunc = f;
							selectIndex(i);
							break;
						}
					}
				}
			},
			move: function(x,y) {
				moveFunc && moveFunc(x,y);
			},
			end: function(x,y) {
				moveFunc = null;
				Blind.Mapper.loader.backup();
			},
			cancel: function(x,y) {
				this.end(x,y);
				Blind.Mapper.loader.backup();
			},
		};
	})();

	function enableMouse() {
		Blind.input.addMouseHandler(mouseHandler);
	}

	function disableMouse() {
		Blind.input.removeMouseHandler(mouseHandler);
	}

	// KEY FUNCTIONS

	var angleSpeed = Math.PI;
	var controls = {
		"turnLeft": false,
		"turnRight": false,
	};
	function clearControls() {
		var name;
		for (name in controls) {
			controls[name] = false;
		}
	};
	var keyHandler = {
		'press': {
			'left': function() {
				controls["turnLeft"] = true;
			},
			'right': function() {
				controls["turnRight"] = true;
			},
		},
		'release': {
			'left': function() {
				controls["turnLeft"] = false;
			},
			'right': function() {
				controls["turnRight"] = false;
			},
		}
	};

	function enableKeys() {
		Blind.input.addKeyHandler(keyHandler);
	}

	function disableKeys() {
		Blind.input.removeKeyHandler(keyHandler);
	}

	// MAIN FUNCTIONS

	function init() {
		clearControls();
		enableMouse();
		enableKeys();
	}

	function cleanup() {
		disableMouse();
		disableKeys();
	}

	function update(dt) {
		if (controls["turnLeft"]) {
			player.angle -= angleSpeed*dt;
		}
		if (controls["turnRight"]) {
			player.angle += angleSpeed*dt;
		}
	}

	function draw(ctx) {
		var i,len = boxes.length;
		var b;
		if (playerSelected) {
			ctx.globalAlpha = 0.6;
		}
		for (i=0; i<len; i++) {
			b = boxes[i];
			if (i == selectedIndex) {
				ctx.strokeStyle = "#FFF";
				ctx.lineWidth = 4;
				ctx.strokeRect(b.x, b.y, b.w, b.h);
			}
			b.draw(ctx);
		}
		ctx.globalAlpha = 1;

		ctx.beginPath();
		ctx.arc(player.x, player.y, 3, 0, 2*Math.PI);
		ctx.fillStyle = "#FFF";
		ctx.fill();

		if (playerSelected) {
			ctx.globalAlpha = 0.2;
			Blind.drawCones(ctx, {
				x: player.x,
				y: player.y,
				projection: projection,
			});
			ctx.globalAlpha = 1;
			Blind.drawArcs(ctx, {
				x: player.x,
				y: player.y,
				radius: 30,
				lineWidth: 9,
				projection: projection,
			});
			ctx.beginPath();
			var startAngle = player.angle + Math.PI/4;
			var endAngle = startAngle + 2*Math.PI/4*3;
			ctx.arc(player.x, player.y, 30, startAngle, endAngle);
			ctx.lineWidth = 10;
			ctx.strokeStyle = "rgba(0,0,0,0.5)";
			ctx.stroke();
		}
	}

	return {
		init: init,
		cleanup: cleanup,
		draw: draw,
		update: update,
		addBox: addBox,
		removeBox: removeBox,
		duplicateBox: duplicateBox,
		renameBox: renameBox,
		colorBox: colorBox,
		setMapState: setMapState,
		getMapState: getMapState,
		getMap: getMap,
	};
})();
