'use strict';

paper.install(window);

var scaffolds = [];
var pressure_stroke;
window.onload = function() {

	paper.setup('myCanvas');
	// Create a simple drawing tool:
	var tool = new paper.Tool();

	tool.minDistance = 2;
	tool.maxDistance = 45;
	var stroke, mouseDown;
	// Define a mousedown and mousedrag handler
	tool.onMouseDown = function(event) {
		stroke = new Stroke();
		mouseDown = true;
		
	};

	tool.onMouseDrag = function(event) {
		var delta = event.delta;
		var pressure = getWacomPlugin() ? getWacomPlugin().penAPI.pressure : 1.0;
		stroke.addDataPoint(pressure, delta, event.middlePoint);
		//console.log('pressure',pressure);
		stroke.addPressurePoint(pressure);

	};



	tool.onMouseUp = function(event) {
		if (paper.Key.isDown('a')) {
			scaffolds.push(stroke);
			console.log('setting scaffold stroke',stroke);

		}
		else{
			console.log('setting pressure stroke',stroke);
			stroke.parameterize();
		}
		
		mouseDown = false;
	};
};

function getWacomPlugin() {
	return document.getElementById('wtPlugin');
}

function map_range(value, low1, high1, low2, high2) {
	return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

var Stroke = function() {
	this.points = [];
	this.deltas = [];
	this.pressure = [];
	this.path = new paper.Path();
	this.spine = new paper.Path();
	this.path.fillColor = {
		hue: 0,
		saturation: 0,
		brightness: 0
	};

	this.spine.strokeColor = {
		hue: 206,
		saturation: 0.72,
		brightness: 1
	};
	this.spine.strokeWidth = 2;
};

Stroke.prototype.addDataPoint = function(pressure, delta, middlePoint) {

	var step = delta.clone();
	step = step.normalize();

	step.angle += 90;
		this.deltas.push(step);
	var step2 = step.clone().multiply(pressure * 10);
	var top = middlePoint.add(step2);

	var bottom = middlePoint.subtract(step2);
	if (!paper.Key.isDown('a')) {
		this.path.add(top);
		this.path.insert(0, bottom);
		this.path.smooth();
		

	} else {
		this.path.noPressure = true;


	}
	this.spine.add(middlePoint);

	//this.spine.smooth();

};

Stroke.prototype.addPressurePoint = function(pressure) {
	if (pressure > 0) {
		this.pressure.push({
			x: this.spine.length,
			y: pressure,
		});
	}
};


Stroke.prototype.parameterize = function() {
		this.strokeLength = this.spine.length;
		this.path.simplify();
		var pressure = this.getVals(this.pressure, null, 1);
		console.log('pressure length', pressure.length, this.pressure.length);
	

		var p_y = this.getVals(pressure, 'y');

		//console.log('stroke length', this.strokeLength, 'point_num', this.points.length); // this.pressure_exp);
		var datapoints = [];
		var data = [];
		var lagrange_data = [];
		/*for(var i=0;i<p_y.length;i++){
			var x=this.strokeLength/p_y.length*i;
			var y = eval(expression);
			console.log(x,',',y);
			datapoints.push(y);
		}*/

		var sma3 = simple_moving_averager(3);
		var sma5 = simple_moving_averager(10);
		for (var i in pressure) {
			var n = pressure[i].y;
			// using WSH
			//console.log('Next number = ' + n + ', SMA_3 = ' + sma3(n) + ', SMA_5 = ' + sma5(n));
			data.push(sma5(n));
			if (i % 10 == 0 || i == 0 || i == p_y.length - 1) {
				datapoints.push({
					x: pressure[i].x,
					y: data[i]
				});
			}
		}
		//console.log('data', datapoints);

		var polynomials = lagrange(datapoints);
		var expression = polynomials[0];
		for (var k = 1; k < polynomials.length; k++) {
			expression = polynomials[k] + '*Math.pow(x,' + k + ')+' + expression;
		}
		this.expression = expression;
		this.averaged_data = data;


		for (var i = 0; i < p_y.length; i++) {
			var x = pressure[i].x;
			var y = eval(expression);
			//console.log(x, ',', y);
			lagrange_data.push({x:x,y:y});
		}
		graphData([pressure, datapoints, lagrange_data], this.spine.length);
		for(var i=0;i<scaffolds.length;i++){
			scaffolds[i].applyPressure(this);
		}
	

};

Stroke.prototype.applyPressure = function(target) {
	this.path.remove();
	this.path = new paper.Path();
	this.path.sendToBack();
	this.path.fillColor = {
		hue: 0,
		saturation: 0,
		brightness: 0
	};

	var spine_a = this.spine;
	var spine_b = target.spine;
	var length_a = spine_a.length;
	var length_b = spine_b.length;
	var point_num_a = spine_a.segments.length;
	//var point_num_b = spine_b.segments.length;
	for (var i = 1; i < point_num_a; i++) {
		var p = spine_a.segments[i].point;
		var d = spine_a.getOffsetOf(p);
		var x = map_range(d, 0, length_a, 0, length_b);
		//console.log("point=",p,"distance=",d,"mapped distance=",x,length_a,length_b);
		var pressure = eval(target.expression);
		var step = p.subtract(spine_a.segments[i - 1].point);
		var step2 = step.clone().normalize();
		step2.angle += 90;
		step2 = step2.multiply(pressure * 10);
		//console.log('x',x,'pressure',pressure,'step2',step2,'step',step,spine_b.expression);

		var top = step.add(step2);

		var bottom = step.subtract(step2);
		console.log(step,step2,top,bottom);
		this.path.add(top.add(p));
		this.path.insert(0, bottom.add(p));
		this.path.smooth();

	}
	this.path.simplify();
};

Stroke.prototype.getVals = function(target, name, rate) {
	var vals = [];
	if (!rate) {
		rate = 1;
	}
	for (var i = 0; i < target.length; i += rate) {
		if (!name) {
			vals.push(target[i]);
		} else {
			vals.push(target[i][name]);
		}
	}
	return vals;
};


function simple_moving_averager(period) {
	var nums = [];
	return function(num) {
		nums.push(num);
		if (nums.length > period)
			nums.splice(0, 1); // remove the first element of the array
		var sum = 0;
		for (var i in nums)
			sum += nums[i];
		var n = period;
		if (nums.length < period)
			n = nums.length;
		return (sum / n);
	};
}
// calculate coefficients of polynomial
function lagrange(points) {
	var polynomial = zeros(points.length);
	var coefficients;
	for (var i = 0; i < points.length; ++i) {
		coefficients = interpolation_polynomial(i, points);
		for (var k = 0; k < points.length; ++k) {
			polynomial[k] += points[i].y * coefficients[k];
		}
	}
	return polynomial;
}


// calculate coefficients for Li polynomial
function interpolation_polynomial(i, points) {
	var coefficients = zeros(points.length);
	coefficients[0] = 1 / denominator(i, points);
	var new_coefficients;

	for (var k = 0; k < points.length; k++) {
		if (k == i) {
			continue;
		}
		new_coefficients = zeros(points.length);
		for (var j = (k < i) ? k + 1 : k; j--;) {
			new_coefficients[j + 1] += coefficients[j];
			new_coefficients[j] -= points[k].x * coefficients[j];
		}
		coefficients = new_coefficients;
	}
	return coefficients;
}

function zeros(n) {
	var array = new Array(n);
	for (var i = n; i--;) {
		array[i] = 0;
	}
	return array;
}

function denominator(i, points) {
	var result = 1;
	var x_i = points[i].x;
	for (var j = points.length; j--;) {
		if (i != j) {
			result *= x_i - points[j].x;
		}
	}
	return result;
}