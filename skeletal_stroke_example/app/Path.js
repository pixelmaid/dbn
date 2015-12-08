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

	Path.prototype.createRibs = function(spine,prototype,reference_thickness,res){
		var targetLayer	= paper.project.layers.filter(function(layer) {
			return layer.name === 'ui_layer';
		})[0];
		var ribs = [];
		var num_ribs = Math.floor(spine.length / res) + 1;
		for (var i = 0; i < num_ribs; i++) {

			var point = spine.getPointAt(i * res);
			var normal = spine.getNormalAt(i * res);
			var rib = new paper.Path(normal.multiply(reference_thickness / 2), normal.multiply(-reference_thickness / 2));
			rib.translate(point);
			var s = new paper.Path.Circle(rib.firstSegment.point, 2);
			s.fillColor = 'green';
			var e = new paper.Path.Circle(rib.lastSegment.point, 2);
			e.fillColor = 'blue';
			rib.strokeColor = 'red';
			targetLayer.addChild(s);
			targetLayer.addChild(e);
			targetLayer.addChild(rib);
			var intersections = rib.getIntersections(prototype);


			for (var j = 0; j < intersections.length; j++) {
				intersections[j].point.offset = prototype.getOffsetOf(intersections[j].point);
				//console.log('intersections', intersections[j].point, intersections[j].point.offset, j);

				var is = new paper.Path.Circle(intersections[j].point, 2);
				if (j === 0) {
					is.fillColor = 'orange';
				} else {
					is.fillColor = 'blue';
				}
			targetLayer.addChild(is);

			}
		ribs.push({
				r: rib,
				is: intersections,
				n: normal,
				p: point
			});

		}
		return ribs;
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