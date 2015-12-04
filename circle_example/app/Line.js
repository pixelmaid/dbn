/*Line.js*/
'use strict';

define(['paper', 'app/Path'], function(paper, Path) {
	function Line() {
		Path.call(this);
	}

	Line.prototype = new Path();

	Line.prototype.constructor = Line;

	Line.prototype.setEndPoint = function(point) {
		if(this.spine.segments.length>1){
			this.spine.lastSegment.point = point;
		}
		else{
			this.addDataPoint(point);
		}
	};

	return Line;
});