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
			generateGuides(pathStroke.inflectionPoints);
			var group = new paper.Group();
			group.addChild(pathStroke.proto.clone());
			/*for(var i=0;i<30;i++){
				pathStroke = jitterPath(pathStroke, pathStroke.proto);
				group.insertChild(0,pathStroke.proto.clone());
			}*/
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
		for (var i = 0; i < inflectionPoints.length; i++) {
			var p = new paper.Point(inflectionPoints[i].x, inflectionPoints[i].y);
			var guide = new paper.Path.Line(p, new paper.Point(p.x, p.y + 602));
			guide.translate(0, -p.y);
			guide.strokeColor = {
				hue: 206,
				saturation: 0.72,
				brightness: 1
			};
guide.strokeWidth =2;
		}
		
	}

	function jitterPath(stroke, path) {
		//path.selected = true;
		var utils = new Utils();
		var addInflection = Math.random() * 1;
		var removeInflection = Math.random() * 1;
		if (addInflection < 0.5) {
			//var r_offset = Math.random()*stroke.spine.length;
			//var p = stroke.spine.getPointAt(r_offset);
			//console.log("added inflection point",p);
			//stroke.inflectionPoints.push(p);
		}


		if (removeInflection < 0.25) {
			//var toRemove =Math.round(Math.random()*stroke.inflectionPoints.length-1);
			//inflectionPoints.splice(toRemove,1);
			//console.log('removed at ',toRemove);
		}

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

		for (var i = 0; i < stroke.inflectionPoints.length; i++) {


			//console.log(i,shift1,shift2);
			var s = stroke.inflectionPoints[i];
			var i_point = new paper.Point(s.x, s.y);
			var i_dist = path.getOffsetOf(i_point);
			for (var j = 0; j < path.segments.length; j++) {
				var dist = path.segments[j].location.offset;
				var dist_points = Math.abs(i_dist - dist);

				var dist_to_inflect = utils.map_range(dist_points, 0, path.length, 1, 0);
				var decay = Math.pow(Math.E, (25 * (dist_to_inflect - 1)));
				var s2 = pathClone.segments[j];
				var shift;
				var p = new paper.Path.Circle(i_point, 3);
				if (s.dir == 1) {
					shift = -(Math.random() * (100) - 50) * decay;
					p.fillColor = 'red';

				} else {
					shift = (Math.random() * (100) - 50) * decay;
					p.fillColor = 'green';


				}
				//console.log("inflection=",i, "segment=",j,"dist=",dist_to_inflect, "decay=",decay,"shift=",shift);
				s2.point.y += shift;
				//s2.point.x = s2.point.x + shift1;
			}


			path2.add(i_point);



		}
		pathClone.translate(0, -5);
		return new SStroke(pathClone);
		//path2.smooth();


	}



	function getWacomPlugin() {
		return document.getElementById('wtPlugin');
	}


});