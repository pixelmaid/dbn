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

			//var s2 = sstroke.distort(currentPath.spine);
			var pathStroke = new SStroke(currentPath.spine);
			var guides = generateGuides(pathStroke.inflectionPoints);
			var group = new paper.Group();
			group.addChild(pathStroke.proto.clone());
			for (var i = 0; i < 30; i++) {
				pathStroke = jitterPath(guides, pathStroke, pathStroke.proto);
				group.insertChild(0,pathStroke.proto.clone());
			}
			pathStroke.proto.strokeColor = {
				hue: 150,
				saturation: 0.72,
				brightness: 1
			};

			group.scale(1, -1);
			group.translate(0, group.bounds.height / 2);

			currentPath = null;

			/*if (lines.length > 1 && mode === 'line') {
				mode = 'constrain';
			}*/

		}
		//first = false;

	};

	function generateGuides(inflectionPoints) {
		var guides = [];
		for (var i = 0; i < inflectionPoints.length; i++) {
			var p = new paper.Point(inflectionPoints[i].x, inflectionPoints[i].y);
			var guide = new paper.Path.Line(p, new paper.Point(p.x, p.y + 602));
			guide.translate(0, -p.y);
			/*guide.strokeColor = {
				hue: 206,
				saturation: 0.72,
				brightness: 1
			};*/
			guide.strokeWidth = 2;
			var rotation = guide.clone();

			rotation.rotate(10, p);
			var dist = rotation.firstSegment.point.y;
			console.log('dist', dist);
			//rotation.strokeColor = 'red';
			var rV = rotation.firstSegment.point.subtract(rotation.lastSegment.point);
			//rV.normalize();
			console.log('rV', rV, rV.angle, rV.length);
			guide.data.dir = inflectionPoints[i].dir;
			guides.push({
				guide: guide,
				rot: rotation
			});
		}
		return guides;
	}

	function jitterPath(guides, stroke, path) {
		//path.selected = true;
		var utils = new Utils();
		//var addInflection = Math.random() * 1;
		//	var removeInflection = Math.random() * 1;

		//var alteredPoints = [];
		var path2 = new paper.Path();
		//path.fillColor = 'white';

		var pathClone = path.clone();
		pathClone.sendToBack();
		pathClone.strokeColor = 'black';
		pathClone.opacity = path.opacity - 0.04;
		if (pathClone.opacity < 0) {
			pathClone.opacity = 0;
		}

		for (var i = 0; i < guides.length; i++) {

			var guide = guides[i].guide;
			var rot = guides[i].rot;
			//console.log(i,shift1,shift2);
			//var s = stroke.inflectionPoints[i];
			var dir = guide.data.dir;
			var intersections = guide.getIntersections(path);
			if (intersections.length > 0) {
				var i_point = intersections[0].point;
				var y1 = rot.firstSegment.point.y;
				var y0 = rot.lastSegment.point.y;
				var x1 = rot.firstSegment.point.x;
				var x0 = rot.lastSegment.point.x;
				var r_point = (i_point.y - y0) / ((y1 - y0) / (x1 - x0)) + x0;
				var r_dist = r_point - i_point.x;
				//console.log('i_point', i_point, 's',r_dist);
				var i_dist = path.getOffsetOf(i_point);
				var p = new paper.Path.Circle(i_point, 3);
				var p2 = new paper.Path.Circle(new paper.Point(r_point, i_point.y), 3);
				//p2.fillColor = 'orange';
				if (dir == 1) {

					//p.fillColor = 'red';

				} else {
					//p.fillColor = 'green';


				}

				for (var j = 0; j < path.segments.length; j++) {
					var dist = path.segments[j].location.offset;
					var dist_points = Math.abs(i_dist - dist);

					var dist_to_inflect = utils.map_range(dist_points, 0, path.length, 1, 0);
					var ydecay = Math.pow(Math.E, (25 * (dist_to_inflect - 1)));
					var xdecay = Math.pow(Math.E, (10 * (dist_to_inflect - 1)));
					var s2 = pathClone.segments[j];
					var shift;
					if (dir == 1) {
						shift = -10 * ydecay;

					} else {
						shift = 10 * ydecay;

					}
					console.log("inflection=",i, "segment=",j,"dist=",dist_to_inflect, "decay=",xdecay,"shift=",r_dist*xdecay);
					s2.point.y += shift;
					s2.point.x += r_dist* xdecay;
				}


				path2.add(i_point);
			}


		}
		pathClone.translate(0, -5);
		pathClone.smooth();
		return new SStroke(pathClone);
		


	}



	function getWacomPlugin() {
		return document.getElementById('wtPlugin');
	}


});