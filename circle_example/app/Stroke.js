/*Stroke.js*/
'use strict';

define(['paper', 'app/Path', 'app/LowPassFilter', 'app/SignalProcessUtils'], function(paper, Path, LowPassFilter, SignalUtils) {
	function Stroke() {
		Path.call(this);
		this.pressureData = [];

	}

	Stroke.prototype = new Path();

	Stroke.prototype.constructor = Stroke;

	Stroke.prototype.addDataPoint = function(pressure, point) {

		Path.prototype.addDataPoint.call(this, point);
		if (pressure) {
			this.addPressurePoint(pressure);
		}
		if(this.spine.visible){
			this.spine.visible = false;
		}
	};

	Stroke.prototype.addPressurePoint = function(pressure) {
		if (!this.stroke) {
			this.stroke = new paper.Path();
			this.stroke.fillColor = 'black';
		}
		var length = this.spine.length;
		var normal = this.spine.getNormalAt(length);
		if (!normal) {
			normal = new paper.Point(0, 0);
		}
		var top = this.spine.lastSegment.point.add(normal.multiply(pressure * 10));
		var bottom = this.spine.lastSegment.point.add(normal.multiply(pressure * -10));
		this.stroke.add(top);
		this.stroke.insert(0, bottom);

		this.pressureData.push({
			x: length,
			y: pressure
		});



	};

	Stroke.prototype.parameterize = function() {
		this.strokeLength = this.spine.length;
		var pressure = this.pressureData;

		var lp_data = [];
		var lpf = new LowPassFilter(0.90, 1.00, 1);
		for (var j = 0; j < pressure.length; j++) {
			var x = pressure[j].y;
			var x_f = lpf.filter(x);
			lp_data.push({
				x: pressure[j].x,
				y: x_f
			});
		}
		this.lowpass_data = lp_data;
	};

	Stroke.prototype.mapPressure = function(target) {
		if (this.stroke) {
			this.stroke.remove();
		}
		this.stroke = new paper.Path();
		this.stroke.fillColor = 'black';
		this.stroke.sendToBack();


		var spine_a = this.spine;
		var spine_b = target.spine;
		var length_a = spine_a.length;
		var length_b = spine_b.length;
		var res = 100;
		var increment = spine_a.length/res;
		//var point_num_b = spine_b.segments.length;
		for (var i = 1; i < res; i++) {
			var p = spine_a.getPointAt(increment*i);
			var pressure = new SignalUtils().mapToSignal(p, spine_a, length_a, length_b, target.lowpass_data);
			var normal = this.spine.getNormalAt(this.spine.getOffsetOf(p));
			if (!normal) {
				normal = new paper.Point(0, 0);
			}
			var top = p.add(normal.multiply(pressure * 10));
			var bottom = p.add(normal.multiply(pressure * -10));
			this.stroke.add(top);
			this.stroke.insert(0, bottom);
			console.log('pressure=',pressure,'top',top,'bottom',bottom);

		}
		this.stroke.smooth();
		this.stroke.simplify();
	};



	Stroke.prototype.clear = function() {
		Path.prototype.clear.call(this);
		this.pressureData.length = 0;
		this.stroke.removeSegments();
	};


	Stroke.prototype.simplify = function() {
		Path.prototype.simplify.call(this);
		if (this.stroke) {
			this.stroke.smooth();

			this.stroke.simplify();
		}
	};

	return Stroke;
});