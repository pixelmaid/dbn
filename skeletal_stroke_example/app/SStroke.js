/*SStroke.js
 * simple skeletal 
 * stroke implementation
 *
 */


'use strict';

define(['paper', 'app/SignalProcessUtils', 'app/Path'], function(paper, Utils, Path) {
	var targetLayer;

	function SStroke(prototype, spine) {
		Path.call(this);
		targetLayer = paper.project.layers.filter(function(layer) {
			return layer.name === 'ui_layer';
		})[0];
		if (!prototype) {

			prototype = new paper.Path.Ellipse(new paper.Point(0, 0), new paper.Point(200, 100));

			var center = new paper.Point(200, 50);
			var points = 5;
			var radius1 = 50;
			var radius2 = 200;
			//var prototype = new paper.Path.Star(center, points, radius1, radius2);
			//prototype.scale(1,0.2);
			prototype.strokeColor = 'black';
			prototype.fillColor = 'black';
			prototype.fullySelected = true;
		}
		this.reference_thickness = prototype.bounds.height;

		if (!spine) {
			spine = new paper.Path();
			spine.add(new paper.Point(prototype.bounds.leftCenter));
			spine.add(new paper.Point(prototype.bounds.rightCenter));
		}
		spine.strokeColor = {
			hue: 206,
			saturation: 0.72,
			brightness: 1
		};
		spine.strokeWeight = 2;
		this.res = 10;

		this.ribs = this.createRibs(spine, prototype, this.reference_thickness, this.res);

		targetLayer.addChild(spine);


		this.spine = spine;
	}

   SStroke.prototype = new Path();
   	SStroke.prototype.constructor = SStroke;

	SStroke.prototype.distort = function(path) {
		var utils = new Utils();
		var num_ribs = Math.floor(this.spine.length / this.res) + 1;
		var path_ribs = [];
		var distortion = new paper.Path();
		distortion.fillColor = 'black';

		for (var i = 0; i < num_ribs; i++) {
			var point = path.getPointAt(i * (path.length / (num_ribs - 1)));
			var normal = path.getNormalAt(i * (path.length / (num_ribs - 1)));
			var rib = new paper.Path(normal.multiply(this.reference_thickness / 2), normal.multiply(-this.reference_thickness / 2));
			rib.translate(point);
			rib.strokeColor = 'red';
			targetLayer.addChild(rib);

			var s = new paper.Path.Circle(rib.firstSegment.point, 2);
			s.fillColor = 'green';
			var e = new paper.Path.Circle(rib.lastSegment.point, 2);
			e.fillColor = 'red';
			targetLayer.addChild(s);
			targetLayer.addChild(e);
			path_ribs.push({
				r: rib,
				n: normal,
				p: point
			});
			this.ribs[i].r.remove();

		}
		var distorted_points = [];
		for (var j = 0; j < this.ribs.length; j++) {
			var is = this.ribs[j].is;
			var proto_normal = this.ribs[j].n;
			//var signal = Math.sin(j / 10) + 2;

			for (var k = 0; k < is.length; k++) {
				var ip = is[k].point;

				var dist = this.ribs[j].p.y - ip.y;
				var p_normal = proto_normal.project(path_ribs[j].n);
				var p_angle = utils.cartToPolar({
					x: 0,
					y: 0
				}, p_normal);
				//var q = p_angle.type;

				//if (k === 0) {
				//console.log(j, k, 'p_angle=', p_angle.theta * 180 / Math.PI, p_angle.type, p_normal.angle, p_normal);

				//console.log(j,'dist:',dist,'p_normal:',p_normal,'angle',p_normal.angle,'||',p_angle,'proto_normal:',proto_normal,'path_normal:',path_ribs[j].n);
				//}
				var s_normal = p_normal.normalize();

				s_normal = s_normal.multiply(dist);
				var p_point = s_normal.add(path_ribs[j].p);

				var p = new paper.Path.Circle(p_point, 2);
				targetLayer.addChild(p);
				if (k === 0) {
					p.fillColor = 'orange';
				} else {
					p.fillColor = 'blue';
				}
				p_point.offset = ip.offset;
				distorted_points.push(p_point);

			}

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
			//	console.log('distorted_points', m, distorted_points.offset);
		}
		distortion.simplify();
		distortion.sendToBack();
		distortion.opacity = 0.5;
		return new SStroke(distortion);


	};

	return SStroke;

});