Blind.Segment = function(dict) {
	this.box = dict.box;
	this.type = dict.type;
	this.x0 = dict.x0;
	this.y0 = dict.y0;
	this.x1 = dict.x1;
	this.y1 = dict.y1;
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
};

Blind.Segment.prototype = {
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

	function getSegments() {
		var segments = [];
		function processVSeg(box,x,y0,y1) {
			if (y1 <= 0 || y0 >= 0) {
				segments.push(new Blind.Segment({
					box: box,
					x0: x, y0: y0,
					x1: x, y1: y1,
					type: 'v',
				}));
			}
			else {
				processVSeg(box, x,y0,0);
				processVSeg(box, x,0,y1);
			}
		}
		function processHSeg(box,y,x0,x1) {
			if (x1 <= 0 || x0 >= 0) {
				segments.push(new Blind.Segment({
					box: box,
					x0: x0, y0: y,
					x1: x1, y1: y,
					type: 'h',
				}));
			}
			else {
				processHSeg(box, y,x0,0);
				processHSeg(box, y,0,x1);
			}
		}
		function processBox(box) {
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

			// top
			if (y > 0) {
				processHSeg(box, y, x, x+w);
			}

			// bottom
			if (y+h < 0) {
				processHSeg(box, y+h, x, x+w);
			}
		}

		var i,len=boxes.length;
		for (i=0; i<len; i++) {
			processBox(boxes[i]);
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

	function getArcs() {
		var segs = visibleSegments;
		var i=0,len=segs.length;

		function getNextColorArc() {
			var s = segs[i];
			var color = s.seg.box.color;
			var a0 = s.a0;
			var a1 = s.a1;
			for (i=i+1; i<len; i++) {
				s = segs[i];
				if (s.a0 == a1 && s.seg.box.color == color) {
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
	}

	var cones = getCones();
	
	return {
		segments: segments,
		refpoints: refpoints,
		visibleSegments: visibleSegments,
		arcs: arcs,
		cones: cones,
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

	function lineTo(angle,dist) {
		ctx.lineTo(
			x + Math.cos(angle) * dist,
			y + Math.sin(angle) * dist
		);
	}

	var segs = proj.visibleSegments;
	var i,len=segs.length;
	var s;
	for (i=0; i<len; i++) {
		s = segs[i];
		ctx.fillStyle = s.seg.box.color;
		ctx.beginPath();
		ctx.moveTo(x,y);
		lineTo(s.a0, s.d0);
		lineTo(s.a1, s.d1);
		var box = s.seg.box;
		var a0 = s.a0;
		var a1 = s.a1;
		var j;
		for (j=i+1; j<len; j++) {
			s = segs[j];
			if (s.a0 == a1 && s.seg.box == box) {
				lineTo(s.a0, s.d0);
				lineTo(s.a1, s.d1);
				a1 = s.a1;
			}
			else {
				break;
			}
		}
		i = j-1;
		ctx.closePath();
		ctx.fill();
	}
};
