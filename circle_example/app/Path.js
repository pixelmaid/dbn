/*Path.js*/
'use strict';

define(['paper'], function(paper) {
	function Path() {
		this.pathlength = 0;

	}

	Path.prototype.addDataPoint = function(point) {
		if (!this.spine) {
			this.spine = new paper.Path();
			this.spine.strokeColor = {
				hue: 206,
				saturation: 0.72,
				brightness: 1
			};
			this.spine.strokeWidth = 2;
			this.startPoint = point;
		}
		this.spine.add(point);
		this.endPoint = point;
	};


	Path.prototype.clear = function() {
		this.spine.removeSegments();
	};

	Path.prototype.simplify = function() {
		if (this.spine) {
			this.spine.simplify();
		}
	};

	Path.prototype.drawNormals = function() {
		var segments = this.spine.segments;

		for (var i = 0; i < segments.length; i++) {
			//var offset = i / segments.length * length;
			var point = segments[i].point;
			var offset = this.spine.getOffsetOf(point);

			// Find the normal vector on the path at the given offset
			// and give it a length of 30:
			var normal = this.spine.getNormalAt(offset).multiply(30);

			var line = new paper.Path({
				segments: [point, point.add(normal)],
				strokeColor: 'red'
			});
		}
	};

	Path.prototype.snapTo = function(target, segment_index) {
		var targetSegment;
		if (segment_index == 'first') {
			targetSegment = this.spine.firstSegment;
		} else if (segment_index == 'last') {
			targetSegment = this.spine.lastSegment;

		} else {
			targetSegment = this.spine.segments[segment_index];
		}
		var np = target.spine.getNearestPoint(targetSegment.point);
		if (np) {
			targetSegment.point = np;
		}
	};



	return Path;
});