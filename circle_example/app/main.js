/*main.js*/
'use strict';

define(['paper', 'app/Stroke', 'app/Line'], function(paper, Stroke, Line) {

	paper.install(window);
	paper.setup('myCanvas');
	// Create a simple drawing tool:
	var tool = new paper.Tool();
	tool.minDistance = 2;
	tool.maxDistance = 45;
	var mouseDown, currentPath;
	var lines = [];
	var paths = [];
	var mode = 'line';
	// Define a mousedown and mousedrag handler
	tool.onMouseDown = function(event) {
		mouseDown = true;
		var pressure = 0.1; //getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;

		switch (mode) {
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
		var pressure = 0.5; //getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;
		if (currentPath) {
			switch (mode) {
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
				calculateAngles(lines[0], lines[1], currentPath, 10);
			}

			currentPath = null;

			if (lines.length > 1 && mode === 'line') {
				mode = 'constrain';
			}

		}

	};

	function calculateAngles(line1, line2, curve, lineCount) {

		var p1_1 = curve.spine.firstSegment.point;
		var p1_2 = line1.spine.firstSegment.point
		var p2_1 = curve.spine.lastSegment.point;
		var p2_2 = line2.spine.firstSegment.point

		var target_length=line1.spine.length-p1_2.getDistance(p1_1)<line2.spine.length-p2_2.getDistance(p2_1) ? line1.spine.length-p1_2.getDistance(p1_1): line2.spine.length-p2_2.getDistance(p2_1);
		var spacing = target_length/lineCount;


		var v1 = p2_1.subtract(p1_1).normalize();
		var v2 = p2_2.subtract(p1_2).normalize();
		var v3 = p2_2.subtract(p2_1).normalize();
		var v4 = p2_1.subtract(p2_2).normalize();
		var a1 = Math.acos(v1.dot(v3));
		var a2 = Math.acos(v2.dot(v4));
		console.log('a1', a1 * (180 / Math.PI), 'a2', a2 * (180 / Math.PI));
		var diff = a1 - a2;
		var cdist = p1_1.getDistance(p2_1);
		var c_l = new paper.Path.Line({
			from: p1_1,
			to: p2_1,
			strokeColor: 'black',
			strokeWidth: 2


		});
		var curve_segments = [];
		curve_segments.length = lineCount;
		for (var j = 0; j < lineCount; j++) {		
				if (!curve_segments[j]) {
					curve_segments[j] = [];
				}
			var d1 = line1.spine.getPointAt(spacing * j+p1_2.getDistance(p1_1));
			var d2 = line2.spine.getPointAt(spacing * j+p2_2.getDistance(p2_1));
			new paper.Path.Circle({
					center: d1,
					radius: 3,
					fillColor: 'orange'
				});

			new paper.Path.Circle({
					center: d2,
					radius: 3,
					fillColor: 'orange'
				});
		curve_segments[j].push(d1);
		curve_segments[j].push(d2);

		}

		for (var i = 1; i < curve.spine.segments.length - 1; i++) {
			var seg = curve.spine.segments[i];
			var c = new paper.Path.Circle({
				center: seg.point,
				radius: 3,
				fillColor: 'red'
			});
			var nl = c_l.getNearestLocation(seg.point);
			var nc = new paper.Path.Circle({
				center: nl.point,
				radius: 3,
				fillColor: 'blue'
			});
			var n_d = nl.offset;
			var average_angle = n_d / cdist * a2 + (cdist - n_d) / cdist * a1;
			console.log('i', average_angle * (180 / Math.PI), a1 * (180 / Math.PI), a2 * (180 / Math.PI));
			var v_i = seg.point.clone();
			v_i.angleInRadians = average_angle;
			v_i.normalize();
			//v_i = v_i.multiply(-1);
			v_i = v_i.normalize(line1.spine.length);

			var line = new paper.Path({
				segments: [seg.point, seg.point.add(v_i)],
				strokeColor: 'blue'
			});

			for (var j = 0; j < lineCount; j++) {
				var pg = line.getPointAt(spacing * j);
				
				curve_segments[j].splice(curve_segments[j].length-1,0,pg);
				var pc = new paper.Path.Circle({
					center: p,
					radius: 3,
					fillColor: 'gray'
				});
			}

		}

		for(var k=0;k<curve_segments.length;k++){
			var p = new Stroke();
			for(var l=0;l<curve_segments[k].length;l++){
				
				p.addDataPoint(0.5, curve_segments[k][l]);
			}
		}


		new paper.Path.Circle({
			center: p1_1,
			radius: 3,
			fillColor: 'green'
		});

		new paper.Path.Circle({
			center: p2_1,
			radius: 3,
			fillColor: 'gray'
		});
		new paper.Path.Circle({
			center: p1_2,
			radius: 3,
			fillColor: 'purple'
		});

		new paper.Path.Circle({
			center: p2_2,
			radius: 3,
			fillColor: 'purple'
		});

	}


	function getWacomPlugin() {
		return document.getElementById('wtPlugin');
	}


});