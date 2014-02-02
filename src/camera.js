Blind.camera = (function(){

	// ========================== CAMERA STATE  =============================

	// position
	var x=0,y=0;

	// orientation
	var angle=-Math.PI/2;

	function print() {
		console.log(x,y,angle);
	}

	// speed (per second)
	var moveSpeed = 50;
    var flySpeed = moveSpeed * 10;
	var angleSpeed = Math.PI;

	var collideFlash = (function(){

		var alphaDriver = new Blind.InterpDriver(
			Blind.makeInterp('linear', [1,0], [0,0.25]),
			{
				freezeAtEnd: true,
			});

		function init() {
			alphaDriver.skipToEnd();
		}

		function trigger() {
			alphaDriver.reset();
		}

		function update(dt) {
			alphaDriver.step(dt);
		}

		function getValue() {
			return alphaDriver.val;
		}

		return {
			init: init,
			trigger: trigger,
			update: update,
			getValue: getValue,
		};
	})();

	var push = (function(){
		var x,y;
		var tx, ty;
		var offset = 5;
		var factor = 0.2;

		function reset() {
			tx = x = 0;
			ty = y = 0;
		}

		function setDir(_tx, _ty) {
			tx = _tx;
			ty = _ty;
		}

		function update(dt) {
			x += (tx-x)*factor;
			y += (ty-y)*factor;
		}

		function get() {
			return {x:x*offset, y:y*offset};
		}

		return {
			reset: reset,
			setDir: setDir,
			update: update,
			get: get,
		};
	})();

	var tilt = (function(){
		var value=0, target=0;
		var offset = Math.PI/16;
		var factor = 0.2;

		function tiltLeft() {
			target = -offset;
		}
		function tiltRight() {
			target = offset;
		}
		function reset() {
			target = 0;
		}

		function update(dt) {
			value += (target-value)*factor;
		}

		function getValue() {
			return value;
		}

		return {
			tiltLeft: tiltLeft,
			reset: reset,
			tiltRight: tiltRight,
			update: update,
			getValue: getValue,
		};
	})();

	function setPosition(_x,_y) {
		x = _x;
		y = _y;
	}

	function setAngle(_angle) {
		angle = _angle;
	}

	var projFade=0;
	var projFadeTarget=0;
	var projFadeSpeed = 4;
	function fadeTo1D() {
		projFadeTarget = 0;
	}
	function fadeTo2D() {
		projFadeTarget = 0.75;
	}

	// ========================== MAP & PROJECTION  =============================

	var map;
	var projection;

	function init(_map) {
		map = _map;
		setPosition(map.player.x, map.player.y);
		setAngle(map.player.angle);
		push.reset();
		collideFlash.init();
		collideAction.reset();
		updateProjection();
	}

	function updateProjection() {
		projection = Blind.getProjection({
			x: x,
			y: y,
			boxes: map.boxes,
		});
	}

    // ========================== HOOK FUNCTIONS ===============================

    var hook = (function(){

        var aiming;
        var aimRay;
        var flying;
        var flyAngle;
        var landingPoint;

        function reset() {
            aiming = false;
            flying = false;
            aimRay = null;
        }

        function refreshAimRay() {
            aimRay = projection.castRayAtAngle(angle);
        }

        function startAiming() {
            aiming = true;
            refreshAimRay();
        }

        function cancelAiming() {
            aiming = false;
            aimRay = null;
        }

        function stopShooting() {
            flying = false;
        }

        function shoot() {
            if (aimRay) {
                flyAngle = angle;
                flying = true;
                landingPoint = {
                    x: x + Math.cos(angle) * aimRay.dist,
                    y: y + Math.sin(angle) * aimRay.dist,
                };
                collideAction.add("any", stopShooting);
            }
            cancelAiming();
        }

        function update(dt) {
            if (aiming) {
                refreshAimRay();
            }
        }

        return {
            reset: reset,
            startAiming: startAiming,
            cancelAiming: cancelAiming,
            shoot: shoot,
            stopShooting: stopShooting,
            update: update,
            getAimRay: function() { return aimRay; },
            isAiming: function() { return aiming; },
            isFlying: function() { return flying; },
            getFlyAngle: function() { return flyAngle; },
            getLandingPoint: function() { return landingPoint; },
        };
    })();

	// ========================== CONTROLLER FUNCTIONS =============================
	
	var controls = {
		"turnLeft": false,
		"turnRight": false,
		"moveUp": false,
		"moveDown": false,
	};
	function clearControls() {
		var name;
		for (name in controls) {
			controls[name] = false;
		}
	};
	var viewKeyHandler = {
		'press': {
			'left': function() {
				controls["turnLeft"] = true;
				tilt.tiltLeft();
			},
			'right': function() {
				controls["turnRight"] = true;
				tilt.tiltRight();
			},
		},
		'release': {
			'left': function() {
				controls["turnLeft"] = false;
				tilt.reset();
			},
			'right': function() {
				controls["turnRight"] = false;
				tilt.reset();
			},
		}
	};
	var moveKeyHandler = {
		'press': {
			'w': function() {
				controls["moveUp"] = true;
			},
			's': function() {
				controls["moveDown"] = true;
			},
			'a': function() {
				controls["moveLeft"] = true;
			},
			'd': function() {
				controls["moveRight"] = true;
			},
		},
		'release': {
			'w': function() {
				controls["moveUp"] = false;
			},
			's': function() {
				controls["moveDown"] = false;
			},
			'a': function() {
				controls["moveLeft"] = false;
			},
			'd': function() {
				controls["moveRight"] = false;
			},
		}
	};
	var projKeyHandler = {
		'press': {
			'shift': function() {
				fadeTo2D();
			},
		},
		'release': {
			'shift': function() {
				fadeTo1D();
			},
		},
	};
    var hookKeyHandler = {
        'press': {
            'space': function() {
                hook.startAiming();
            },
        },
        'release': {
            'space': function() {
                hook.shoot();
            },
        },
    };
    var mouseLookHandler = {
        'start': function() {
            hook.startAiming();
        },
        'end': function() {
            hook.shoot();
        },
        'lockmove': function(dx,dy) {
            var radiansPerPixels = 1/100;
            angle += dx * radiansPerPixels;
        },
    };
	function enableViewKeys()  { Blind.input.addKeyHandler(    viewKeyHandler); }
	function disableViewKeys() { Blind.input.removeKeyHandler( viewKeyHandler); }
	function enableMoveKeys()  { Blind.input.addKeyHandler(    moveKeyHandler); }
	function disableMoveKeys() { Blind.input.removeKeyHandler( moveKeyHandler); }
	function enableProjKeys()  { Blind.input.addKeyHandler(    projKeyHandler); }
	function disableProjKeys() {
		Blind.input.removeKeyHandler( projKeyHandler);
		fadeTo1D();
	}
    function enableHookKeys() {
        Blind.input.addKeyHandler(hookKeyHandler);
    }
    function disableHookKeys() {
        Blind.input.removeKeyHandler(hookKeyHandler);
        hook.reset();
    }
    function enableMouseLook() {
        Blind.input.addMouseHandler(mouseLookHandler);
        Blind.input.enableMouseLock(); // requires user to click canvas to complete mouse lock
    }
    function disableMouseLook() {
        Blind.input.removeMouseHandler(mouseLookHandler);
        Blind.input.disableMouseLock();
    }

	// ========================== COLLISION FUNCTIONS  =============================

	var collideAction = (function(){
		var triggers = {};

		function reset() {
			triggers = {};
		}

		function clear(name) {
			triggers[name] = [];
		}
		
		function add(name, action) {
			var t = triggers[name];
			if (t) {
				t.push(action);
			}
			else {
				triggers[name] = [action];
			}
		}

		function remove(name, action) {
			var t = triggers[name];
			if (t) {
				var i = 0;
				while (i < t.length) {
					if (t[i] == action) {
						t.splice(i,1);
					}
					else {
						i++;
					}
				}
			}
		}

		function exec(name) {
			var t = triggers[name];
			if (t) {
				var i,len=t.length;
				for (i=0; i<len; i++) {
					t[i]();
				}
				clear(name);
			}
		}
		
		return {
			reset: reset,
			add: add,
			remove: remove,
			exec: exec,
		};
	})();

	function addCollideAction(name, action) {
		collideAction.add(name, action);
	}
	function onCollide(box) {
		collideFlash.trigger();
		collideAction.exec(box.name);
        collideAction.exec("any");
	}

	var collidePad = 0.01;
	function collideX(dx) {
		if (dx == 0) {
			return x;
		}
		var boxes = map.boxes;
		var i,len = boxes.length;
		var b;
		var boundX;
		if (dx < 0) {
			for (i=0; i<len; i++) {
				b = boxes[i];
				boundX = b.x+b.w;
				if (b.y <= y && y <= b.y+b.h &&
					boundX <= x && x+dx <= boundX) {
					onCollide(b);
					return boundX + collidePad;
				}
			}
		}
		else {
			for (i=0; i<len; i++) {
				b = boxes[i];
				boundX = b.x;
				if (b.y <= y && y <= b.y+b.h &&
					x <= boundX && boundX <= x+dx) {
					onCollide(b);
					return boundX - collidePad;
				}
			}
		}
		return x+dx;
	}

	function collideY(dy) {
		if (dy == 0) {
			return y;
		}
		var boxes = map.boxes;
		var i,len = boxes.length;
		var b;
		var boundY;
		if (dy < 0) {
			for (i=0; i<len; i++) {
				b = boxes[i];
				boundY = b.y+b.h;
				if (b.x <= x && x <= b.x+b.w &&
					boundY <= y && y+dy <= boundY) {
					onCollide(b);
					return boundY + collidePad;
				}
			}
		}
		else {
			for (i=0; i<len; i++) {
				b = boxes[i];
				boundY = b.y;
				if (b.x <= x && x <= b.x+b.w &&
					y <= boundY && boundY <= y+dy) {
					onCollide(b);
					return boundY - collidePad;
				}
			}
		}
		return y+dy;
	}

	// ========================== MAIN FUNCTIONS  =============================

	function update(dt) {
		if (controls["turnLeft"]) {
			angle -= angleSpeed*dt;
		}
		if (controls["turnRight"]) {
			angle += angleSpeed*dt;
		}

        hook.update(dt);

        var dx=0,dy=0;
        var speed;
        if (hook.isFlying()) {
            var a = hook.getFlyAngle();
            dx = Math.cos(a);
            dy = Math.sin(a);
            speed = flySpeed;
        }
        else {
            var mx = Math.cos(angle);
            var my = Math.sin(angle);
            if (controls["moveUp"]) {
                dx += mx;
                dy += my;
            }
            if (controls["moveDown"]) {
                dx += -mx;
                dy += -my;
            }
            if (controls["moveLeft"]) {
                dx += my;
                dy += -mx;
            }
            if (controls["moveRight"]) {
                dx += -my;
                dy += mx;
            }
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 0) {
                dx /= dist;
                dy /= dist;
            }
            speed = moveSpeed;
        }
        x = collideX(dx*speed*dt);
        y = collideY(dy*speed*dt);
        if (dx != 0 || dy != 0) {
            updateProjection();
        }
        push.setDir(dx,dy);
        push.update(dt);

		if (projFade < projFadeTarget) {
			projFade = Math.min(projFadeTarget, projFade + projFadeSpeed*dt);
		}
		else if (projFade > projFadeTarget) {
			projFade = Math.max(projFadeTarget, projFade - projFadeSpeed*dt);
		}

		tilt.update(dt);
		collideFlash.update(dt);
	}

	function draw(ctx) {
		ctx.save();
		ctx.translate(Blind.canvas.width/2, Blind.canvas.height/2);
		ctx.rotate(-Math.PI/2-angle);
		ctx.translate(-x,-y);

		var p = push.get();
		ctx.translate(p.x,p.y);

		function draw1D() {
			ctx.save();
			ctx.setTransform(1,0,0,1,0,0);
			var img = Blind.assets.images["eye"];
			ctx.drawImage(img,Blind.canvas.width/2 - img.width/2, Blind.canvas.height/2 - img.height/2);
			ctx.restore();

            var radius = 100;
            var lineWidth = 30;

			Blind.drawArcs(ctx, {
				x: x,
				y: y,
				radius: radius,
				lineWidth: lineWidth,
				projection: projection,
			});

            var ray = hook.getAimRay();
            if (ray) {
                (function(){
                    var r = radius + lineWidth/2+ 2;
                    var r2 = r + lineWidth/2;
                    var da = Math.PI/16;
                    ctx.beginPath();
                    ctx.moveTo(x+r2*Math.cos(angle), y+r2*Math.sin(angle));
                    ctx.arc(x,y,r, angle-da, angle+da);
                    ctx.closePath();
                    ctx.fillStyle = ray.color;
                    ctx.fill();
                })();
            }

            if (hook.isFlying()) {
                var a = hook.getFlyAngle();
                var da = Math.random()*Math.PI/64;
                ctx.beginPath();
                ctx.arc(x,y,radius,a-da,a+da);
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = "#FFF";
                ctx.stroke();
            }

			var collideAlpha = collideFlash.getValue();
			if (collideAlpha) {
				ctx.fillStyle = "rgba(200,200,200," + collideAlpha +")";
				ctx.beginPath();
				ctx.arc(x,y,radius-lineWidth/2,0,Math.PI*2);
				ctx.fill();
			}

			ctx.strokeStyle = "rgba(0,0,0,0.5)";
			ctx.beginPath();
			var arange = Math.PI/2;
			var a=angle+tilt.getValue()+arange/2;
			ctx.lineWidth = lineWidth+1;
			ctx.arc(x,y, radius, a, a + (2*Math.PI - arange));
			ctx.stroke();
		}

		function draw2D() {
			map.draw(ctx);

			var alpha = ctx.globalAlpha;

			ctx.globalAlpha = ctx.globalAlpha * 0.3;
			Blind.drawCones(ctx, {
				x: x,
				y: y,
				projection: projection,
			});
			ctx.globalAlpha = alpha;

			ctx.beginPath();
			ctx.arc(x,y,3,0,Math.PI*2);
			ctx.fillStyle = "#FFF";
			ctx.fill();

            if (hook.isFlying()) {
                ctx.strokeStyle = "#FFF";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x,y);
                var p = hook.getLandingPoint();
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
		}

		if (projFade == 0) {
			draw1D();
		}
		else if (projFade == 1) {
			draw2D();
		}
		else {
			ctx.globalAlpha = 1-projFade;
			draw1D();
			ctx.globalAlpha = projFade;
			draw2D();
			ctx.globalAlpha = 1;
		}

		ctx.restore();
	}

	return {
		init: init,
		updateProjection: updateProjection,
		enableViewKeys: enableViewKeys,
		disableViewKeys: disableViewKeys,
		enableMoveKeys: enableMoveKeys,
		disableMoveKeys: disableMoveKeys,
		enableProjKeys: enableProjKeys,
		disableProjKeys: disableProjKeys,
		enableHookKeys: enableHookKeys,
		disableHookKeys: disableHookKeys,
        enableMouseLook: enableMouseLook,
        disableMouseLook: disableMouseLook,
		setPosition: setPosition,
		setAngle: setAngle,
		update: update,
		draw: draw,
		addCollideAction: addCollideAction,
		print: print,
	};
})();
