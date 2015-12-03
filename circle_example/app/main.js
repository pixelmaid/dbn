/*main.js*/
'use strict';

define(['paper', 'app/Path', 'app/Line'], function(paper, Path, Line) {

	paper.install(window);
	paper.setup('myCanvas');
	// Create a simple drawing tool:
	var tool = new paper.Tool();
	tool.minDistance = 2;
	tool.maxDistance = 45;
	var mouseDown, currentPath;

	var mode = 'line';
	// Define a mousedown and mousedrag handler
	tool.onMouseDown = function(event) {
		mouseDown = true;
		var pressure = getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;

		switch (mode) {
			case 'line':
				currentPath = new Line();
				currentPath.addDataPoint(pressure, event.point);
				break;
			case 'path':
				currentPath = new Path();
				currentPath.addDataPoint(pressure, event.point);
				break;

		}
	};

	tool.onMouseDrag = function(event) {
		var pressure = getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;
		if (currentPath) {
			switch (mode) {
				case 'line':
					currentPath.setEndPoint(pressure, event.middlePoint);
					break;
				case 'path':

					currentPath.addDataPoint(pressure, event.middlePoint);
					break;
			}
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