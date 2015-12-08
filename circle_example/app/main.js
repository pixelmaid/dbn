/*main.js*/
'use strict';

define(['paper', 'app/Stroke', 'app/Line'], function(paper, Stroke, Line) {

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
	var mode = 'line';
	// Define a mousedown and mousedrag handler
	tool.onMouseDown = function(event) {
		mouseDown = true;
		var pressure = getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;

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
		var pressure = getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;
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
				calculateAngles(lines[0], lines[1], currentPath, 15);
			}

			currentPath = null;

			if (lines.length > 1 && mode === 'line') {
				mode = 'constrain';
			}

		}

	};

	function calculateAngles(line1, line2, curve, lineCount) {
		curve.parameterize();
		var targetLayer = paper.project.layers.filter(function(layer) {
			return layer.name === 'ui_layer';
		})[0];

		var p1_1 = curve.spine.firstSegment.point;
		var p1_2 = line1.spine.firstSegment.point;
		var p2_1 = curve.spine.lastSegment.point;
		var p2_2 = line2.spine.firstSegment.point;

		var target_length = line1.spine.length - p1_2.getDistance(p1_1) < line2.spine.length - p2_2.getDistance(p2_1) ? line1.spine.length - p1_2.getDistance(p1_1) : line2.spine.length - p2_2.getDistance(p2_1);
		var spacing = target_length / lineCount;


		var v1 = p2_1.subtract(p1_1).normalize();
		var v2 = p2_2.subtract(p1_2).normalize();
		var v3 = p2_2.subtract(p2_1).normalize();
		var v4 = p2_1.subtract(p2_2).normalize();
		var a1 = Math.acos(v1.dot(v3));
		var a2 = Math.acos(v2.dot(v4));
		console.log('a1', a1 * (180 / Math.PI), 'a2', a2 * (180 / Math.PI));

		var cdist = p1_1.getDistance(p2_1);
		var c_l = new paper.Path.Line({
			from: p1_1,
			to: p2_1,
			strokeColor: 'black',
			strokeWidth: 2


		});
		targetLayer.addChild(c_l);
		var curve_segments = [];
		curve_segments.length = lineCount;
		for (var j = 0; j < lineCount; j++) {
			if (!curve_segments[j]) {
				curve_segments[j] = [];
			}
			var d1 = line1.spine.getPointAt(spacing * j + p1_2.getDistance(p1_1));
			var d2 = line2.spine.getPointAt(spacing * j + p2_2.getDistance(p2_1));
			var d1C = new paper.Path.Circle({
				center: d1,
				radius: 3,
				fillColor: 'orange'
			});

			var d2C = new paper.Path.Circle({
				center: d2,
				radius: 3,
				fillColor: 'orange'
			});
			targetLayer.addChild(d1C);
			targetLayer.addChild(d2C);
			curve_segments[j].push(d1);
			curve_segments[j].push(d2);

		}

		for (var i = 1; i < curve.spine.segments.length - 1; i++) {

			var seg = curve.spine.segments[i];
			for (var m = 0; m < 3; m++) {
				var segpoint;
				switch(m){
					case 0:
					segpoint= seg.point;
					break;
					case 1: 
					segpoint = seg.handleIn.add(seg.point);
					break;
					case 2:
					segpoint = seg.handleOut.add(seg.point);
					break;

				}

				


				var c = new paper.Path.Circle({
					center: segpoint,
					radius: 3,
					fillColor: 'red'
				});
				targetLayer.addChild(c);

				var nl = c_l.getNearestLocation(segpoint);
				var nc = new paper.Path.Circle({
					center: nl.point,
					radius: 3,
					fillColor: 'blue'
				});
				targetLayer.addChild(nc);

				var n_d = nl.offset;
				var average_angle = n_d / cdist * a2 + (cdist - n_d) / cdist * a1;
				console.log('i', average_angle * (180 / Math.PI), a1 * (180 / Math.PI), a2 * (180 / Math.PI));
				var v_i = segpoint.clone();
				v_i.angleInRadians = average_angle;
				v_i.normalize();
				//v_i = v_i.multiply(-1);
				v_i = v_i.normalize(line1.spine.length);

				var line = new paper.Path({
					segments: [segpoint, segpoint.add(v_i)],
					strokeColor: 'blue'
				});

				targetLayer.addChild(line);
				for (var j = 0; j < lineCount; j++) {
					var pg = line.getPointAt(spacing * j);

					curve_segments[j].splice(curve_segments[j].length - 1, 0, pg);
					var pc = new paper.Path.Circle({
						center: pg,
						radius: 3,
						fillColor: 'yellow'
					});
					targetLayer.addChild(pc);

				}
			}

		}
		for (var k = 1; k < curve_segments.length; k++) {
			var p = new Stroke();

			p.addDataPoint(null, curve_segments[k][0]);
			
			for (var l = 1; l < curve_segments[k].length-1; l+=3) {
				console.log(l,curve_segments[k].length);
				
					var s = new paper.Segment(curve_segments[k][l],curve_segments[k][l+1].subtract(curve_segments[k][l]),curve_segments[k][l+2].subtract(curve_segments[k][l]));
				p.addDataPoint(null, s);
				
			}
			p.addDataPoint(null, curve_segments[k][curve_segments[k].length-1]);

			p.mapPressure(curve);
		}


		targetLayer.addChildren([new paper.Path.Circle({
				center: p1_1,
				radius: 3,
				fillColor: 'green'
			}),

			new paper.Path.Circle({
				center: p2_1,
				radius: 3,
				fillColor: 'gray'
			}),
			new paper.Path.Circle({
				center: p1_2,
				radius: 3,
				fillColor: 'purple'
			}),

			new paper.Path.Circle({
				center: p2_2,
				radius: 3,
				fillColor: 'purple'
			})
		]);

	}


	function getWacomPlugin() {
		return document.getElementById('wtPlugin');
	}


});