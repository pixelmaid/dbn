/*Stroke.js*/
'use strict';

define(['paper', 'app/Path'], function(paper, Path) {
	function Stroke() {
		Path.call(this);
		this.pressureData = [];

	}

	Stroke.prototype = new Path();

	Stroke.prototype.constructor = Stroke;

	Stroke.prototype.addDataPoint = function(pressure, point) {

		Path.prototype.addDataPoint.call(this, point);
		this.addPressurePoint(pressure);
	};

	Stroke.prototype.addPressurePoint = function(pressure) {
		if (!this.stroke) {
			this.stroke = new paper.Path();
			this.stroke.fillColor = 'black';
		}
		var length = this.spine.length;
		var normal = this.spine.getNormalAt(length);
		if(!normal){
			normal = new Point(0,0);
		}
		var top = this.spine.lastSegment.point.add(normal.multiply(pressure*20));
		var bottom = this.spine.lastSegment.point.add(normal.multiply(pressure*-20));
		this.stroke.add(top);
		this.stroke.insert(0, bottom);
		this.stroke.smooth();
		this.pressureData.push({
			x: length,
			y: pressure
		});
		

		
	};

	Path.prototype.clear = function() {
		Path.prototype.clear.call(this);
		this.pressureData.length = 0;
		this.stroke.removeSegments();
	};


	Stroke.prototype.simplify = function() {
		Path.prototype.simplify.call(this);
		if (this.stroke) {
			this.stroke.simplify();
		}
	};

	return Stroke;
});