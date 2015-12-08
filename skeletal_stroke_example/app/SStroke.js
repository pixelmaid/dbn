/*SStroke.js
 * simple skeletal 
 * stroke implementation
 *
 */


'use strict';

define(['paper'], function(paper) {
	function SStroke() {
		//var prototype = new paper.Path.Ellipse(new paper.Point(0,0), new paper.Point(200,100));
		var center = new paper.Point(40, 40);
		var points = 5;
		var radius1 =10;
		var radius2 = 40;
		var prototype = new paper.Path.Star(center, points, radius1, radius2);
		prototype.strokeColor = 'black';
		prototype.fillColor = 'gray';
		prototype.fullySelected = true;
		this.reference_thickness = prototype.bounds.height;
		var spine = new paper.Path();
		spine.add(new paper.Point(prototype.bounds.leftCenter));
		spine.add(new paper.Point(prototype.bounds.rightCenter));
		spine.strokeColor = {
			hue: 206,
			saturation: 0.72,
			brightness: 1
		};
		spine.strokeWeight = 2;
		this.res = 1;
		var num_ribs = Math.round(spine.length / this.res) + 1;
		console.log('num_ribs', num_ribs);
		this.ribs = [];
		for (var i = 0; i < num_ribs; i++) {
			var point = spine.getPointAt(i * this.res);
			var normal = spine.getNormalAt(i * this.res);
			var rib = new paper.Path(normal.multiply(this.reference_thickness / 2), normal.multiply(-this.reference_thickness / 2));
			rib.translate(point);
			//rib.strokeColor = 'red';
			var intersections = rib.getIntersections(prototype);


			for (var j = 0; j < intersections.length; j++) {
				intersections[j].point.offset = prototype.getOffsetOf(intersections[j].point);
								console.log('intersections',intersections[j].point,intersections[j].point.offset,j);

				var is = new paper.Path.Circle(intersections[j].point, 2);
				is.fillColor = 'green';
			}
			this.ribs.push({
				r: rib,
				is: intersections,
				n: normal,
				p: point
			});

		}
		this.spine = spine;
	}

	SStroke.prototype.distort = function(path) {
		var num_ribs = Math.round(this.spine.length / this.res) + 1;
		var path_ribs = [];
		var distortion = new paper.Path();
		distortion.fillColor = 'black';
		distortion.fullySelected= true;
		for (var i = 0; i < num_ribs; i++) {
			var point = path.getPointAt(i * (path.length / (num_ribs - 1)));
			var normal = path.getNormalAt(i * (path.length / (num_ribs - 1)));
			var rib = new paper.Path(normal.multiply(this.reference_thickness / 2), normal.multiply(-this.reference_thickness / 2));
			rib.translate(point);
			//rib.strokeColor = 'red';
			path_ribs.push({
				r: rib,
				n: normal,
				p: point
			});

		}
		var distorted_points = [];
		for (var j = 0; j < this.ribs.length; j++) {
			var is = this.ribs[j].is;
			var normal = this.ribs[j].n;
			for (var k = 0; k < is.length; k++) {
				var ip = is[k].point;
				var dist = this.ribs[j].p.y - ip.y;
				var p_normal = normal.project(path_ribs[j].n).multiply(dist);
				var p_point = p_normal.add(path_ribs[j].p);

				//var p = new paper.Path.Circle(p_point, 2);
				//p.fillColor = 'orange';
				p_point.offset = ip.offset;
				distorted_points.push(p_point);

			}

			//for(var k=0;l)
		}

		distorted_points.sort(function(a, b) {
			if (a.offset > b.offset) {
				return -1;
			} else {
				return 1;
			}
		});

		for (var m = 0; m < distorted_points.length; m++) {
			distortion.add(distorted_points[m]);
			console.log('distorted_points', m, distorted_points.offset);
		}
		distortion.simplify();
		distortion.sendToBack();



	};

	return SStroke;

});