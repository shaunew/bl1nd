Blind.camera = (function(){

    // ========================== CAMERA STATE  =============================
    var state = {
        x: 0,
        y: 0,
        angle: -Math.PI/2,
    };

    function setPosition(x,y) {
        state.x = x;
        state.y = y;
    }

    function setAngle(angle) {
        state.angle = angle;
    }

    function addAngle(da) {
        if (!spider.isAttached()) {
            state.angle += da;
        }
    }

    function print() {
        console.log(state.x,state.y,state.angle);
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
            if (spider.isAttached()) {
                alphaDriver.reset();
            }
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

    var replay = (function(){
        return {
        };
    })();

    var spindle = (function(){
        var angle;

        // Thanks to Trey Wilson!
        function getShortestAngleDist(a0,a1) {
            var max = 2*Math.PI;

            // get normalized distance between angles
            var da = (a1-a0) % max;

            /*
            Choose the shorter distance:
            If |da| > 180º, then we want to turn around and go the shorter distance:
            For example:
                If da = 270º, then we want da = -90º instead
                If da = -270º, then we want da = 90º instead
            */

            // (Trey's neat formula that produces the shorter distance.
            //  It works regardless of how "%" outputs sign, so it is portable.)
            return (2*da % max) - da;
        }

        function sync() {
            angle = state.angle;
        }

        function update(dt) {
            angle += getShortestAngleDist(angle, state.angle)*0.2;
        }

        return {
            sync: sync,
            update: update,
            getAngle: function() { return angle; },
        };
    })();

    var spider = (function(){
        
        var grabbing;
        var attached;
        var box;
        var side;

        var pauseTime;

        function reset() {
            grabbing = false;
            attached = false;
            box = side = null;
            rotateDriver = null;
            pauseTime = 0;
        }

        function grab() {
            grabbing = true;
        }

        function setSide(_side) {
            side = _side;
            var normAngle;
            if (side == "-y") {
                normAngle = -Math.PI/2;
            }
            else if (side == "+y") {
                normAngle = Math.PI/2;
            }
            else if (side == "-x") {
                normAngle = Math.PI;
            }
            else if (side == "+x") {
                normAngle = 0;
            }
            state.angle = normAngle;
            pauseTime = 0.5;
        }

        function attach(_box,_side) {
            attached = true;
            box = _box;
            setSide(_side);
        }

        function detach() {
            attached = false;
            box = side = null;
        }

        function move(dx,dy) {
            // for pausing at the corner
            if (pauseTime > 0) {
                return true;
            }

            var minx = box.x-collidePad;
            var maxx = box.x+box.w+collidePad;
            var miny = box.y-collidePad;
            var maxy = box.y+box.h+collidePad;

            if (side == "+x" || side == "-x") {
                if (state.y + dy <= miny) {
                    state.y = miny;
                    setSide("-y");
                    return true;
                }
                else if (state.y + dy >= maxy) {
                    state.y = maxy;
                    setSide("+y");
                    return true;
                }
            }
            else if (side == "+y" || side == "-y") {
                if (state.x + dx <= minx) {
                    state.x = minx;
                    setSide("-x");
                    return true;
                }
                else if (state.x + dx >= maxx) {
                    state.x = maxx;
                    setSide("+x");
                    return true;
                }
            }

            // no collision
            return false;
        }

        function release() {
            reset();
        }

        function update(dt) {
            pauseTime = Math.max(0, pauseTime-dt);
        }

        return {
            reset: reset,
            grab: grab,
            release: release,
            attach: attach,
            detach: detach,
            move: move,
            update: update,
            isGrabbing: function() { return grabbing; },
            isAttached: function() { return attached; },
            getSide: function() { return side; },
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

        function setDir(_tx, _ty, _offset) {
            tx = _tx;
            ty = _ty;
            offset = _offset || 5;
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

    var projector = (function(){
        var val, target, speed;

        function reset() {
            val = 0;
            target = 0;
            speed = 4;
        }

        function update(dt) {
            if (val < target) {
                val = Math.min(target, val + speed*dt);
            }
            else if (val > target) {
                val = Math.max(target, val - speed*dt);
            }
        }

        function fadeTo1D() {
            target = 0;
        }

        function fadeTo2D() {
            target = 0.75;
        }

        function draw1D(ctx) {
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            var img = Blind.assets.images["eye"];
            ctx.drawImage(img,Blind.canvas.width/2 - img.width/2, Blind.canvas.height/2 - img.height/2);
            ctx.restore();

            var radius = 100;
            var lineWidth = 30;

            Blind.drawArcs(ctx, {
                x: state.x,
                y: state.y,
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
                    ctx.moveTo(
                        state.x+r2*Math.cos(state.angle),
                        state.y+r2*Math.sin(state.angle));
                    ctx.arc(
                        state.x,
                        state.y,
                        r,
                        state.angle-da,
                        state.angle+da);
                    ctx.closePath();
                    ctx.fillStyle = ray.color;
                    ctx.fill();
                })();
            }

            if (hook.isFlying()) {
                var a = hook.getFlyAngle();
                var da = Math.random()*Math.PI/64;
                ctx.beginPath();
                ctx.arc(state.x,state.y,radius,a-da,a+da);
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = "#FFF";
                ctx.stroke();
            }

            var collideAlpha = collideFlash.getValue();
            if (collideAlpha) {
                ctx.fillStyle = "rgba(200,200,200," + collideAlpha +")";
                ctx.beginPath();
                ctx.arc(state.x,state.y,radius-lineWidth/2,0,Math.PI*2);
                ctx.fill();
            }

            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.beginPath();
            var arange = Math.PI/2;
            var a=state.angle+tilt.getValue()+arange/2;
            ctx.lineWidth = lineWidth+1;
            ctx.arc(state.x,state.y, radius, a, a + (2*Math.PI - arange));
            ctx.stroke();
        }

        function draw2D(ctx) {
            map.draw(ctx);

            var alpha = ctx.globalAlpha;

            ctx.globalAlpha = ctx.globalAlpha * 0.3;
            Blind.drawCones(ctx, {
                x: state.x,
                y: state.y,
                projection: projection,
            });
            ctx.globalAlpha = alpha;

            ctx.beginPath();
            ctx.arc(state.x,state.y,3,0,Math.PI*2);
            ctx.fillStyle = "#FFF";
            ctx.fill();

            if (hook.isFlying()) {
                ctx.strokeStyle = "#FFF";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(state.x,state.y);
                var p = hook.getLandingPoint();
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
        }

        function draw(ctx) {
            if (val == 0) {
                draw1D(ctx);
            }
            else if (val == 1) {
                draw2D(ctx);
            }
            else {
                ctx.globalAlpha = 1-val;
                draw1D(ctx);
                ctx.globalAlpha = val;
                draw2D(ctx);
                ctx.globalAlpha = 1;
            }
        }

        return {
            update: update,
            draw: draw,
            fadeTo1D: fadeTo1D,
            fadeTo2D: fadeTo2D,
            reset: reset,
        };
    })();

    // ========================== MAP & PROJECTION  =============================

    var map;
    var projection;

    function init(_map) {
        map = _map;
        setPosition(map.player.x, map.player.y);
        setAngle(map.player.angle);
        spindle.sync();
        push.reset();
        spider.reset();
        collideFlash.init();
        collideAction.reset();
        projector.reset();
        updateProjection();
    }

    function updateProjection() {
        projection = Blind.getProjection({
            x: state.x,
            y: state.y,
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
            aimRay = projection.castRayAtAngle(state.angle);
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
                spider.detach();
                flyAngle = state.angle;
                flying = true;
                landingPoint = {
                    x: state.x + Math.cos(state.angle) * aimRay.dist,
                    y: state.y + Math.sin(state.angle) * aimRay.dist,
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
    var spiderKeyHandler = {
        'press': {
            'shift': function() {
                spider.grab();
            },
        },
        'release': {
            'shift': function() {
                spider.release();
            },
        },
    };
    var projKeyHandler = {
        'press': {
            '1': function() {
                projector.fadeTo1D();
            },
            '2': function() {
                projector.fadeTo2D();
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
            if (Blind.input.isMouseLock()) {
                hook.startAiming();
            }
        },
        'end': function() {
            if (Blind.input.isMouseLock()) {
                hook.shoot();
            }
        },
        'lockmove': function(dx,dy) {
            var radiansPerPixels = 1/100;
            addAngle(dx * radiansPerPixels);
        },
    };
    function enableViewKeys()  { Blind.input.addKeyHandler(    viewKeyHandler); }
    function disableViewKeys() { Blind.input.removeKeyHandler( viewKeyHandler); }
    function enableMoveKeys()  { Blind.input.addKeyHandler(    moveKeyHandler); }
    function disableMoveKeys() { Blind.input.removeKeyHandler( moveKeyHandler); }
    function enableProjKeys()  { Blind.input.addKeyHandler(    projKeyHandler); }
    function disableProjKeys() {
        Blind.input.removeKeyHandler( projKeyHandler);
        projector.fadeTo1D();
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
    function enableSpiderKeys() {
        Blind.input.addKeyHandler(spiderKeyHandler);
    }
    function disableSpiderKeys() {
        Blind.input.removeKeyHandler(spiderKeyHandler);
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
    function onCollide(box,side) {
        collideFlash.trigger();
        collideAction.exec(box.name);
        collideAction.exec("any");

        if (spider.isGrabbing()) {
            spider.attach(box,side);
        }
    }

    var collidePad = 0.01;
    function move(dx,dy) {

        if (dx == 0 && dy == 0) {
            return;
        }

        // will need to fix this
        // (currently assuming that there can be no collision with another
        //  block before we reach the corner of the block.  only true for
        //  small dx,dy)
        if (spider.isAttached()) {
            if (spider.move(dx,dy)) {
                return;
            }
        }

        function collideX(x,y,dx) {
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
                        onCollide(b,"+x");
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
                        onCollide(b,"-x");
                        return boundX - collidePad;
                    }
                }
            }
            return x+dx;
        }

        function collideY(x,y,dy) {
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
                        onCollide(b,"+y");
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
                        onCollide(b,"-y");
                        return boundY - collidePad;
                    }
                }
            }
            return y+dy;
        }

        state.x = collideX(state.x,state.y,dx);
        state.y = collideY(state.x,state.y,dy);
    }

    // ========================== MAIN FUNCTIONS  =============================

    function update(dt) {
        var da = 0;
        if (controls["turnLeft"]) {
            da -= angleSpeed*dt;
            tilt.tiltLeft();
        }
        if (controls["turnRight"]) {
            da += angleSpeed*dt;
            tilt.tiltRight();
        }
        if (da == 0) {
            tilt.reset();
        }
        addAngle(da);

        hook.update(dt);
        spider.update(dt);

        var dx=0,dy=0;
        var speed;
        if (hook.isFlying()) {
            var a = hook.getFlyAngle();
            dx = Math.cos(a);
            dy = Math.sin(a);
            speed = flySpeed;
            push.setDir(dx,dy,20);
        }
        else if (spider.isAttached()) {
            var side = spider.getSide();
            if (side == "+x") {
                if (controls["moveLeft"]) {
                    dy -= 1;
                }
                if (controls["moveRight"]) {
                    dy += 1;
                }
            }
            else if (side == "-x") {
                if (controls["moveLeft"]) {
                    dy += 1;
                }
                if (controls["moveRight"]) {
                    dy -= 1;
                }
            }
            else if (side == "+y") {
                if (controls["moveLeft"]) {
                    dx += 1;
                }
                if (controls["moveRight"]) {
                    dx -= 1;
                }
            }
            else if (side == "-y") {
                if (controls["moveLeft"]) {
                    dx -= 1;
                }
                if (controls["moveRight"]) {
                    dx += 1;
                }
            }
            speed = moveSpeed;
            push.setDir(dx,dy,5);
        }
        else {
            var mx = Math.cos(state.angle);
            var my = Math.sin(state.angle);
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
            push.setDir(dx,dy,5);
        }
        move(dx*speed*dt, dy*speed*dt);
        if (dx != 0 || dy != 0) {
            updateProjection();
        }
        push.update(dt);
        projector.update(dt);
        tilt.update(dt);
        collideFlash.update(dt);
        spindle.update(dt);
    }

    function draw(ctx) {
        ctx.save();
        ctx.translate(Blind.canvas.width/2, Blind.canvas.height/2);
        if (spider.isAttached()) {
            ctx.rotate(-Math.PI/2-spindle.getAngle());
        }
        else {
            ctx.rotate(-Math.PI/2-state.angle);
        }
        ctx.translate(-state.x,-state.y);

        var p = push.get();
        ctx.translate(p.x,p.y);
        projector.draw(ctx);
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
        enableSpiderKeys: enableSpiderKeys,
        disableSpiderKeys: disableSpiderKeys,
        setPosition: setPosition,
        setAngle: setAngle,
        update: update,
        draw: draw,
        addCollideAction: addCollideAction,
        print: print,
    };
})();
