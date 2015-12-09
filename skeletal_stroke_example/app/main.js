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

			jitterPath(pathStroke, sstroke, 10);


			currentPath = null;

			/*if (lines.length > 1 && mode === 'line') {
				mode = 'constrain';
			}*/

		}
		//first = false;

	};

	function jitterPath(stroke, distort_target, count) {
		var ribs = stroke.createRibs(stroke.spine, stroke.proto, stroke.reference_thickness, stroke.res);



		var datapoints = ribs.map(function(r) {
			return {
				x: r.is[0].point.x,
				y: r.is[0].point.y
			};
		});

		var inflectionPoints = utils.calculateInflectionPoints(datapoints);
		var clone_spine = new paper.Path();
		ui_layer.addChild(clone_spine);
		clone_spine.strokeColor = 'red';
		clone_spine.bringToFront();
		var underLine = [];
		var overLine = [];
		for (var i = 0; i < inflectionPoints.length; i++) {
			var s = inflectionPoints[i];

			var p = new paper.Path.Circle(new paper.Point(s.x, s.y), 3);
			p.fillColor = 'green';
			var l = new paper.Path.Line(new paper.Point(s.x, s.y - 1000), new paper.Point(s.x, s.y + 1000));
			l.strokeColor = 'green';
			var intersect = l.getIntersections(stroke.spine)[0].point;
			console.log(i,'s.y',s.y,'i.y',intersect.y);
			if (s.y > intersect.y) {
				underLine.push(i);
				console.log("under");
			} else {
				overLine.push(i);
				console.log("over");
			}
			var p2_2 = new paper.Path.Circle(intersect, 3);
			p2_2.fillColor = 'orange';

			clone_spine.add(intersect);


		}
		for (var j = 1; j < count-1; j++) {
			var dup = clone_spine.clone();
		ui_layer.addChild(dup);

			for (var k = 0; k < dup.segments.length; k++) {
				if (overLine.indexOf(k)!=-1) {
					console.log('over found',k);
					if (k !== 0 && k != dup.segments.length - 1) {
						dup.segments[k].point.y -= 50 * j;
						
					}
				}
				else{
					if (k !== 0 && k != dup.segments.length - 1) {
						dup.segments[k].point.y += 25 * j;
						
					}
				}
			}

			dup.smooth();
			var d1 = distort_target.distort(dup);
			d1.proto.translate(0, -50 * j);
			d1.spine.translate(0, -50 * j);

			var dup2 = clone_spine.clone();
					ui_layer.addChild(dup2);

			for (var m = 0; m < dup2.segments.length; m++) {
				if (underLine.indexOf(m)!=-1) {
										console.log('under found',m);

					if (m !== 0 && m != dup2.segments.length - 1) {
						
							dup2.segments[m].point.y += 50 * j;
						
					}
				}
				else{
					if (m !== 0 && m != dup2.segments.length - 1) {
						
							//dup2.segments[m].point.y += 50 * j;
						
					}
				}
			}

			dup2.smooth();
			var d2 = distort_target.distort(dup2);
			d2.proto.fillColor='blue';
			d2.proto.translate(0, 50 * j);
			d2.spine.translate(0, 50 * j);
		}

	}



	function getWacomPlugin() {
		return document.getElementById('wtPlugin');
	}


});