'use strict';
define(function(require) {
	var paper = require('paper');
	var grapher = require('app/grapher');
	console.log('grapher=', grapher);

	paper.install(window);

	var scaffolds = [];

	paper.setup('myCanvas');
	// Create a simple drawing tool:
	var tool = new paper.Tool();

	tool.minDistance = 2;
	tool.maxDistance = 45;
	var stroke, mouseDown;
	// Define a mousedown and mousedrag handler
	tool.onMouseDown = function() {
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



	tool.onMouseUp = function() {
		if (paper.Key.isDown('a')) {
			scaffolds.push(stroke);
			//console.log('setting scaffold stroke',stroke);

		} else {
			//console.log('setting pressure stroke',stroke);
			stroke.parameterize(grapher);
		}

		mouseDown = false;
	};


	function getWacomPlugin() {
		return document.getElementById('wtPlugin');
	}



	var LowPassFilter = function(filterFactor, gain, n_dimensions) {
		this.filterFactor = filterFactor;
		this.gain = gain;
		this.n_dimensions = n_dimensions;
		this.processedData = [];
		this.yy = [];
		this.yy.length = n_dimensions;
		for (var i = 0; i < this.yy.length; i++) {
			this.yy[i] = 0;
		}
	};

	LowPassFilter.prototype.filter = function(x) {
		var y = this._filter([x]);
		if (y.length === 0) {
			return 0;
		}
		return y[0];
	};

	LowPassFilter.prototype._filter = function(x) {
		if (x.length != this.n_dimensions) {
			console.log('the number of input dimensions does not match the input');
			return;
		}

		for (var n = 0; n < this.n_dimensions; n++) {

			this.processedData[n] = ((this.yy[n] * this.filterFactor) + (1.0 - this.filterFactor) * x[n]) * this.gain;
			this.yy[n] = this.processedData[n];
		}
		return this.processedData;
	};


	function calculateInflectionPoints(dataset) {
		var der = [];
		var inflections = [];
		inflections.push(dataset[0]);
		var count = 0;
		for (var i = 1; i < dataset.length; i++) {

			var x_t = dataset[i].y;
			var x_t_1 = dataset[i - 1].y;
			var delta_t = dataset[i].x - dataset[i - 1].x;
			var y_t = (x_t - x_t_1) / delta_t;
			der.push(y_t);
			if (i > 1) {
				var y_t_1 = der[i - 2];
				//console.log(y_t, y_t_1);
				if (y_t == 0) {

				} else {
					if (y_t < 0 && y_t_1 >= 0) {
						inflections.push(dataset[i]);
						count = 0;

					} else if (y_t > 0 && y_t_1 <= 0) {
						inflections.push(dataset[i]);
						count = 0;

					} else if (Math.abs(y_t) > 0.1) {
						console.log('derivative exceeds', Math.abs(y_t));
						inflections.push(dataset[i]);
						count = 0;

					}

				}

				/*if(count>(dataset.length/10)){
					inflections.push(dataset[i]);
					count =0;

				}*/
				count++;
			}
		}
		//console.log('derivative length', der.length, "dataset length", dataset.length);
		//console.log('inflections', inflections);
		inflections.push(dataset[dataset.length - 1]);
		return inflections;
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


	Stroke.prototype.parameterize = function(grapher) {
		console.log('grapher=', grapher);
		this.strokeLength = this.spine.length;
		this.path.simplify();
		var pressure = this.getVals(this.pressure, null, 1);
		//console.log('pressure length', pressure.length, this.pressure.length);


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
			data.push({
				x: pressure[i].x,
				y: sma5(n)
			});
			if (i % 10 == 0 || i == 0 || i == p_y.length - 1) {
				datapoints.push({
					x: pressure[i].x,
					y: data[i]
				});
			}
		}
		var lp_data = [];
		var lpf = new LowPassFilter(0.90, 1.00, 1);
		for (var j in pressure) {
			var x = pressure[j].y;
			var x_f = lpf.filter(x);
			lp_data.push({
				x: pressure[j].x,
				y: x_f
			});
		}



		var inflections = calculateInflectionPoints(data);
		//console.log('data', datapoints);

		var polynomials = lagrange(inflections);
		var expression = polynomials[0];
		for (var k = 1; k < polynomials.length; k++) {
			expression = polynomials[k] + '*Math.pow(x,' + k + ')+' + expression;
		}
		this.expression = expression;
		this.averaged_data = data;
		this.lowpass_data = lp_data;


		for (var i = 0; i < p_y.length; i++) {
			var x = pressure[i].x;
			var y = eval(expression);
			//console.log(x, ',', y);
			lagrange_data.push({
				x: x,
				y: y
			});
		}
		grapher.graphData([pressure, data, lp_data], this.spine.length);
		for (var i = 0; i < scaffolds.length; i++) {
			scaffolds[i].mapPressure(this);
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
			//console.log(step, step2, top, bottom);
			this.path.add(top.add(p));
			this.path.insert(0, bottom.add(p));
			this.path.smooth();

		}
		this.path.simplify();
	};

	Stroke.prototype.mapPressure = function(target) {
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
			var pressure = mapToSignal(p, spine_a, length_a, length_b, target.lowpass_data);
			var step = p.subtract(spine_a.segments[i - 1].point);
			var step2 = step.clone().normalize();
			step2.angle += 90;
			step2 = step2.multiply(pressure * 10);
			//console.log('x',x,'pressure',pressure,'step2',step2,'step',step,spine_b.expression);

			var top = step.add(step2);

			var bottom = step.subtract(step2);
			//console.log(step, step2, top, bottom);
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
});