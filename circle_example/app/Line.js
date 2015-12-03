/*Line.js*/
'use strict';

define(['paper', 'app/Path'], function(paper, Path) {
	function Line() {
		Path.call(this);
	}

	Line.prototype = new Path();

	Line.prototype.constructor = Line;

	Line.prototype.setEndPoint = function(pressure, point) {
		if(this.spine.segments.length>1){
			this.spine.lastSegment.point = point;
			this.addPressurePoint(pressure);
		}
		else{
			this.addDataPoint(pressure,point);
		}
	};

	return Line;
});