Blind.Segment = function(dict) {
	this.box = dict.box;
	this.type = dict.type;
	this.x0 = dict.x0;
	this.y0 = dict.y0;
	this.x1 = dict.x1;
	this.y1 = dict.y1;
	this.isCorner0 = dict.isCorner0;
	this.isCorner1 = dict.isCorner1;
	this.color = dict.color;

	this.recalc();
};

Blind.Segment.prototype = {
	recalc: function() {
		this.distSq0 = this.x0*this.x0 + this.y0*this.y0;
		this.distSq1 = this.x1*this.x1 + this.y1*this.y1;
		this.angle0 = Math.atan2(this.y0, this.x0);
		this.angle1 = Math.atan2(this.y1, this.x1);

		// Tricky corner case:
		// Force angles of vertical segment endpoints from traveling over the atan2
		// portal at PI.
		if (this.type == 'v' && this.y1 == 0 && this.x0 < 0) {
			this.angle1 = -this.angle1;
		}
	},
	getDistAtAngle: function(angle) {
		if (this.type == 'v') {
			return this.x0 / Math.cos(angle);
		}
		else {
			return this.y0 / Math.sin(angle);
		}
	},
};

Blind.getProjection = function(dict) {
	var cx = dict.x;
	var cy = dict.y;
	var boxes = dict.boxes;
	if (!boxes || boxes.length == 0) {
		return {
			segments: [],
			refpoints: [],
			visibleSegments: [],
			corners: [],
			arcs: [],
			cones: [],
		};
	}

	function getSegments() {
		var segments = [];
		var vsegs = [];
		function processVSeg(box,x,y0,y1, isCorner0, isCorner1) {
			if (isCorner0 == null) {
				isCorner0 = true;
			}
			if (isCorner1 == null) {
				isCorner1 = true;
			}
			if (x<0 && y0 < 0 && y1 > 0) {
				processVSeg(box, x,y0,0, true, false);
				processVSeg(box, x,0,y1, false, true);
			}
			else {
				var seg = new Blind.Segment({
					box: box,
					color: Blind.colors[box.color].dark,
					x0: x, y0: y0,
					x1: x, y1: y1,
					isCorner0: isCorner0,
					isCorner1: isCorner1,
					type: 'v',
				});
				segments.push(seg);
				vsegs.push(seg);
			}
		}
		function horizontalCut(y,x0,x1) {
			var x_cuts = [];
			var i,len=vsegs.length;
			var s,s2;
			for (i=0; i<len; i++) {
				s = vsegs[i];
				if (x0 < s.x0 && s.x0 < x1 &&
					s.y0 < y && y < s.y1) {

					// add new vseg to reflect bottom half
					s2 = new Blind.Segment(s);
					s2.y0 = y;
					s2.recalc();

					// update vseg to reflect top half only
					s.y1 = y;
					s.recalc();

					segments.push(s2);
					vsegs.push(s2);

					// add new x_cut at x
					x_cuts.push(s.x0);
				}
			}
			x_cuts.sort();
			return x_cuts;
		}
		function processHSeg(box,y,x0,x1) {
			var cuts = horizontalCut(y,x0,x1);
			if (cuts.length == 0) {
				segments.push(new Blind.Segment({
					box: box,
					color: Blind.colors[box.color].medium,
					x0: x0, y0: y,
					x1: x1, y1: y,
					isCorner0: true,
					isCorner1: true,
					type: 'h',
				}));
			}
			else {
				cuts.unshift(x0);
				cuts.push(x1);
				var i,len=cuts.length;
				for (i=0; i<len-1; i++) {
					segments.push(new Blind.Segment({
						box: box,
					color: Blind.colors[box.color].medium,
						x0: cuts[i], y0: y,
						x1: cuts[i+1], y1: y,
						isCorner0: true,
						isCorner1: true,
						type: 'h',
					}));
				}
			}
		}
		function processBoxHSegs(box) {
			if (box.hide) {
				return;
			}

			var x = box.x-cx;
			var y = box.y-cy;
			var w = box.w;
			var h = box.h;

			// top
			if (y > 0) {
				processHSeg(box, y, x, x+w);
			}

			// bottom
			if (y+h < 0) {
				processHSeg(box, y+h, x, x+w);
			}
		}
		function processBoxVSegs(box) {
			if (box.hide) {
				return;
			}

			var x = box.x-cx;
			var y = box.y-cy;
			var w = box.w;
			var h = box.h;

			// left
			if (x > 0) {
				processVSeg(box, x, y, y+h);
			}

			// right
			if (x+w < 0) {
				processVSeg(box, x+w, y, y+h);
			}
		}

		var i,len=boxes.length;
		for (i=0; i<len; i++) {
			processBoxVSegs(boxes[i]);
		}
		for (i=0; i<len; i++) {
			processBoxHSegs(boxes[i]);
		}
		return segments;
	}
	var segments = getSegments();

	var refpoints = [];
	var i,len=segments.length;
	var a0,a1;
	var seg;
	for (i=0; i<len; i++) {
		seg = segments[i];
		(function(seg){
			a0 = seg.angle0;
			a1 = seg.angle1;
			var ref0 = { angle: a0, order:0, seg: seg };
			var ref1 = { angle: a1, order:1, seg: seg };
			if (a0 > a1) {
				ref0.order = 1;
				ref1.order = 0;
			}
			refpoints.push(ref0);
			refpoints.push(ref1);
		})(seg);
	}
	refpoints.sort(function(a,b) { return a.angle - b.angle });

	function getVisibleSegments(refpoints) {
		var visibleSegments = [];

		var numRefPoints = refpoints.length;

		var arcSegments = [];
		var refIndex = 0;
		var currAngle, prevAngle;

		function firstArc() {
			currAngle = refpoints[0].angle;
			var i,r;
			for (i=0; i<numRefPoints; i++) {
				r = refpoints[i];
				if (r.angle == currAngle) {
					if (r.order == 0) {
						arcSegments.push(r.seg);
						r.seg.currDist = r.seg.getDistAtAngle(currAngle);
					}
					else {
						console.error('we should not have closed a segment at the start of the first arc');
					}
				}
				else {
					break;
				}
			}
			refIndex = i;
		}

		function sweepNextArc() {
			if (refIndex >= numRefPoints) {
				return false;
			}
			prevAngle = currAngle;
			currAngle = refpoints[refIndex].angle;

			var i,seg,len=arcSegments.length;
			var dist, closestSeg, closestDist = Infinity;
			for (i=0; i<len; i++) {
				seg = arcSegments[i];
				seg.prevDist = seg.currDist;
				seg.currDist = seg.getDistAtAngle(currAngle);
				dist = Math.min(seg.prevDist, seg.currDist);
				if (dist < closestDist) {
					closestDist = dist;
					closestSeg = seg;
				}
			}

			if (closestSeg) {
				visibleSegments.push({
					a0: prevAngle,
					a1: currAngle,
					d0: closestSeg.prevDist,
					d1: closestSeg.currDist,
					seg: closestSeg,
				});
			}

			var r;
			for (i=refIndex; i<numRefPoints; i++) {
				r = refpoints[i];
				if (r.angle == currAngle) {
					if (r.order == 0) {
						arcSegments.push(r.seg);
						r.seg.currDist = r.seg.getDistAtAngle(currAngle);
					}
					else {
						arcSegments.splice(arcSegments.indexOf(r.seg), 1);
					}
				}
				else {
					break;
				}
			}
			refIndex = i;
			return true;
		};

		firstArc();
		while (sweepNextArc()) {
		}

		return visibleSegments;
	}

	var visibleSegments = getVisibleSegments(refpoints);

	function getCorners() {
		var corners = [];
		var segs = visibleSegments;
		var i,len=segs.length;
		var s;
		for (i=0; i<len; i++) {
			s = segs[i];
			if (s.seg.isCorner0 && s.a0 <= s.seg.angle0 && s.seg.angle0 <= s.a1) {
				corners.push({
					angle: s.seg.angle0,
					dist: s.seg.getDistAtAngle(s.seg.angle0),
				});
			}
			if (s.seg.isCorner1 && s.a0 <= s.seg.angle1 && s.seg.angle1 <= s.a1) {
				corners.push({
					angle: s.seg.angle1,
					dist: s.seg.getDistAtAngle(s.seg.angle1),
				});
			}
		}
		return corners;
	}

	var corners = getCorners();

	function getArcs() {
		var segs = visibleSegments;
		var i=0,len=segs.length;

		function getNextColorArc() {
			var s = segs[i];
			var color = s.seg.color;
			var a0 = s.a0;
			var a1 = s.a1;
			for (i=i+1; i<len; i++) {
				s = segs[i];
				if (s.a0 == a1 && s.seg.color == color) {
					a1 = s.a1;
				}
				else {
					break;
				}
			}
			return {
				color: color,
				a0: a0,
				a1: a1,
			};
		}

		var arcs = [];
		while (i < len) {
			arcs.push(getNextColorArc());
		}

		var numArcs = arcs.length;
		var firstArc, lastArc;
		if (numArcs > 0) {
			firstArc = arcs[0];
			lastArc = arcs[numArcs-1];
			if (firstArc.color == lastArc.color &&
				firstArc.a0 == -Math.PI && lastArc.a1 == Math.PI) {
				if (firstArc == lastArc) {
					firstArc.a0 = 0;
					firstArc.a1 = Math.PI*2;
				}
				else {
					firstArc.a0 = lastArc.a0 - Math.PI*2;
					arcs.pop();
				}
			}
		}

		return arcs;
	}

	var arcs = getArcs();

	function getCones() {
		var cones = [];

		var segs = visibleSegments;
		var i=0,len=segs.length;

		function getNextCone() {
			var s = segs[i];
			var color = s.seg.color;
			var points = [];
			function addPoint(angle, dist) {
				points.push({angle:angle, dist:dist});
			}
			addPoint(s.a0, s.d0);
			addPoint(s.a1, s.d1);
			var box = s.seg.box;
			var a0 = s.a0;
			var a1 = s.a1;
			for (i=i+1; i<len; i++) {
				s = segs[i];
				if (s.a0 == a1 && s.seg.box == box && s.seg.color == color) {
					addPoint(s.a0, s.d0);
					addPoint(s.a1, s.d1);
					a1 = s.a1;
				}
				else {
					break;
				}
			}
			return {
				color: color,
				points: points,
			};
		}

		while (i < len) {
			cones.push(getNextCone());
		}

		return cones;
	}

	var cones = getCones();

    function normalizeAngle(a) {
        return Math.atan2(Math.sin(a), Math.cos(a));
    }

    function castRayAtAngle(angle) {
        angle = normalizeAngle(angle);
        var i,len=visibleSegments.length;
        if (len == 0) {
            return null;
        }
        var visSeg, seg;
        for (i=0; i<len; i++) {
            visSeg = visibleSegments[i];
            seg = visSeg.seg;
            if (visSeg.a0 <= angle && angle <= visSeg.a1) {
                return {
                    seg: seg,
                    dist: seg.getDistAtAngle(angle),
                    color: seg.color,
                };
            }
        }
        return null;
    }
	
	return {
		segments: segments,
		refpoints: refpoints,
		visibleSegments: visibleSegments,
		corners: corners,
		arcs: arcs,
		cones: cones,
        castRayAtAngle: castRayAtAngle,
	};
};

Blind.drawArcs = function(ctx, dict) {
	var x = dict.x;
	var y = dict.y;
	var radius = dict.radius;
	var lineWidth = dict.lineWidth;
	var proj = dict.projection;

	ctx.lineWidth = lineWidth;

	var arcs = proj.arcs;
	var i,len=arcs.length;
	var arc;
	for (i=0; i<len; i++) {
		arc = arcs[i];
		ctx.strokeStyle = arc.color;
		ctx.beginPath();
		ctx.arc(x,y,radius,arc.a0, arc.a1, false);
		ctx.stroke();
	}
};

Blind.drawCones = function(ctx, dict) {
	var x = dict.x;
	var y = dict.y;
	var proj = dict.projection;

	function lineTo(point) {
		ctx.lineTo(
			x + Math.cos(point.angle) * point.dist,
			y + Math.sin(point.angle) * point.dist
		);
	}

	var cones = proj.cones;
	var i,len=cones.length;
	var cone, points;
	for (i=0; i<len; i++) {
		cone = cones[i];
		points = cone.points;
		ctx.fillStyle = cone.color;
		ctx.beginPath();
		ctx.moveTo(x,y);
		var j,numPts = points.length;
		for (j=0; j<numPts; j++) {
			lineTo(points[j]);
		}
		ctx.closePath();
		ctx.fill();
	}
};
