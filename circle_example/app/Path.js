/*path.js*/
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
		}
		this.spine.add(point);
		this.pressureData.push({
			x: this.spine.length,
			y: pressure,
		});
	};

	Path.prototype.clear = function(){
		this.pressureData.length =0;
		this.spine.removeSegments();
	};

	Path.prototype.simplify = function() {
		if(this.spine){
			this.spine.simplify();
		}
	};



	return Path;
});