/*main.js*/
'use strict';

define(['paper', 'app/SStroke', 'app/Line', 'app/Path', 'app/Stroke', 'app/SignalProcessUtils'], function(paper, SStroke, Line, Path, Stroke, Utils) {

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
	var first = true;
	var sstroke = new SStroke();

	var utils = new Utils();
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

			var s2 = sstroke.distort(currentPath.spine);
			var pathStroke = new SStroke(currentPath.spine);

			for (var i = 0; i < 5; i++) {
				var data = jitterPath(pathStroke, s2);
				pathStroke = data.ps;
				s2 = data.s2;
			}


			currentPath = null;

			/*if (lines.length > 1 && mode === 'line') {
				mode = 'constrain';
			}*/

		}
		//first = false;

	};

	function jitterPath(stroke, distort_target) {
		var ribs = stroke.createRibs(stroke.spine, stroke.proto, stroke.reference_thickness, stroke.res);



		var datapoints = ribs.map(function(r) {
			return {
				x: r.is[0].point.x,
				y: r.is[0].point.y
			};
		});

		var inflectionPoints = utils.calculateInflectionPoints(datapoints);
		var clone_spine = new paper.Path();
		clone_spine.strokeColor = 'red';
		clone_spine.bringToFront();
		for (var i = 0; i < inflectionPoints.length; i++) {
			var s = inflectionPoints[i];

			var p = new paper.Path.Circle(new paper.Point(s.x, s.y), 3);
			p.fillColor = 'green';
			var l = new paper.Path.Line(new paper.Point(s.x, s.y - 1000), new paper.Point(s.x, s.y + 1000));
			l.strokeColor = 'green';
			var intersect = l.getIntersections(stroke.spine)[0].point;

			var p2_2 = new paper.Path.Circle(intersect, 3);
			p2_2.fillColor = 'orange';
			if (i !== 0 && i != inflectionPoints.length - 1) {
				if (i % 2 === 0) {
					intersect.y += 50;
				} else {
					intersect.y -= 50;
				}
			}
			clone_spine.add(intersect);


		}
		clone_spine.smooth();
		var distort = distort_target.distort(clone_spine);
		return {
			ps: new SStroke(clone_spine),
			s2: distort
		};
	}



	function getWacomPlugin() {
		return document.getElementById('wtPlugin');
	}


});