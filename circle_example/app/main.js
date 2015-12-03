/*main.js*/
'use strict';

define(['paper', 'app/Path'], function(paper, Path) {

	paper.install(window);
	paper.setup('myCanvas');
	// Create a simple drawing tool:
	var tool = new paper.Tool();
	tool.minDistance = 2;
	tool.maxDistance = 45;
	var mouseDown, currentPath;
	// Define a mousedown and mousedrag handler
	tool.onMouseDown = function() {
		mouseDown = true;
		currentPath = new Path();
	};

	tool.onMouseDrag = function(event) {
		if (currentPath) {
			var pressure = getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;
			currentPath.addDataPoint(pressure, event.middlePoint);
		}
		//var delta = event.delta;
		//var pressure = getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;
	};


	tool.onMouseUp = function() {
		mouseDown = false;
		if (currentPath) {
			currentPath.simplify();
			currentPath = null;
		}

	};

	function getWacomPlugin() {
		return document.getElementById('wtPlugin');
	}


});