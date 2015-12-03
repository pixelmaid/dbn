/*Path.js*/
'use strict';

define(['paper'], function(paper) {
	function Path() {
		this.pressureData = [];
		this.pathlength = 0;

	}

	Path.prototype.addDataPoint = function(pressure, point) {
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
		this.addPressurePoint(pressure);
		this.endPoint = point;
	};

	Path.prototype.addPressurePoint = function(pressure) {
		this.pressureData.push({
			x: this.spine.length,
			y: pressure,
		});
	};

	Path.prototype.clear = function() {
		this.pressureData.length = 0;
		this.spine.removeSegments();
	};

	Path.prototype.simplify = function() {
		if (this.spine) {
			this.spine.simplify();
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