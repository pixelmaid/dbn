/*main.js*/
'use strict';

define(['paper', 'app/SStroke', 'app/Line', 'app/Path', 'app/Stroke'], function(paper, SStroke, Line, Path, Stroke) {

	paper.install(window);
	paper.setup('myCanvas');
	var geometry_layer = new paper.Layer();
	geometry_layer.name = 'geometry_layer';
	var ui_layer = new paper.Layer();
	ui_layer.name = 'ui_layer';
	geometry_layer.activate();
	ui_layer.visible = false;
	// Create a simple drawing tool:
	var tool = new paper.Tool();
	tool.minDistance = 4;
	tool.maxDistance = 45;
	var mouseDown, currentPath;
	var lines = [];
	var paths = [];
	var mode = 'path';

	var sstroke = new SStroke();


	// Define a mousedown and mousedrag handler
	tool.onMouseDown = function(event) {
		mouseDown = true;
		var pressure = 0; //getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;

		switch (mode) {
			case 'path':
				currentPath = new Path();
				currentPath.addDataPoint(event.point);
				paths.push(currentPath);
				break;
			case 'line':
				currentPath = new Line();
				currentPath.addDataPoint(event.point);
				lines.push(currentPath);
				break;
			case 'stroke':
				currentPath = new Stroke();
				paths.push(currentPath);
				currentPath.addDataPoint(pressure, event.point);
				break;

			case 'constrain':
				currentPath = new Stroke();
				paths.push(currentPath);
				currentPath.addDataPoint(pressure, event.point);

				break;


		}
	};

	tool.onMouseDrag = function(event) {
		var pressure = 0; //getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;
		if (currentPath) {
			switch (mode) {
				case 'path':
					currentPath.addDataPoint(event.middlePoint);
					break;
				case 'line':
					currentPath.setEndPoint(event.middlePoint);
					break;
				case 'path':
				case 'constrain':

					currentPath.addDataPoint(pressure, event.middlePoint);
					break;
			}
		}
	};


	tool.onMouseUp = function() {
		mouseDown = false;

		if (currentPath) {
			currentPath.simplify();

			if (mode === 'constrain') {
				currentPath.snapTo(lines[0], 'first');
				currentPath.snapTo(lines[1], 'last');
				//currentPath.drawNormals();
			}
						sstroke.distort(currentPath.spine);


			currentPath = null;

			/*if (lines.length > 1 && mode === 'line') {
				mode = 'constrain';
			}*/

		}

	};



	function getWacomPlugin() {
		return document.getElementById('wtPlugin');
	}


});