/* ++++++++++++++++++++++++++++++++++++++++++++++++++++
 Object/Function definition page 
+++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
var startRender = true;
var test = false;


var sin = Math.sin;
var cos = Math.cos;

var objectRenderArray = [];

var meta = { // stores relevant information about the current drawstyle.
	style : Line,
	colorStyle: 'drawColor',
	thickness : 2,
	drawColor: new Color(0,0,0),
	backgroundColor: new Color(255,255,255),
	fillStyle: 'stroke',

	renderThreshold: 4,
	maxDepth : 100,
	maxScale : 0.85,
	maxSize: 10000,
	operationLimit: 30000,
	unit: 100	// 1 unit is defined as 100 pixels.
}

var fractal = {
	trunk: [],
	children: [],
	draw: function(){
		function helper(depth, node){
			if(depth === meta.maxDepth || node.size < meta.renderThreshold){
				return;
			}

			node.draw();
			for(var i = 0; i < fractal.children.length; i++){
				let trans = fractal.children[i].transformation;
				helper(depth + 1, trans.apply(node));
			}
		}

		for(var i = 0; i < fractal.trunk.length; i++){
			helper(0, fractal.trunk[i]);
		}
	},
	pushNewObject : function(start, end){
		if(meta.style === Branch){
			fractal.children.push(new Branch(Transformation.generateTransformation1(start, end, inv*meta.unit, meta.drawColor, meta.fillStyle)));
			actions.undoList.push(() => fractal.children.pop());
		} else {
			let trans = Transformation.generateTransformation3(start, end);
			fractal.trunk.push(new meta.style(trans, meta.drawColor, meta.thickness, meta.fillStyle));
			actions.undoList.push(() => fractal.trunk.pop());
		}

		actions.unundoList = [];

		setDrawLimits();
	},
	pushGhostObject : function(start){
		//Adds an object who's end point is determined dynamically by mouse position.
		// 'start' is assumed to be a point object.

		if (meta.style === Branch){
			// adds three objects: A line, displaying the orientation, a circle, displaying the magnitude, and a child node.

			//var displayCircle = new Circle(new Transformation(unit, 0, 0, unit, start.x, start.y), new Color(255,127,39));
			//var displayLine = new Line(zero, new Color(255,127,39));
			var branch = new Branch(zero);

			fractal.updater = function(e){
				var end = windowToCanvas(e);

				var trans = Transformation.generateTransformation1(start, end, inv*meta.unit, meta.drawColor, meta.fillStyle);
				//var transAbs = Transformation.generateTransformation3(start, end);

 				branch.transformation = trans;
				//displayLine.points = map(displayLine.template, (el) => transAbs.apply(el));
			}
			window.addEventListener('mousemove', fractal.updater);

			fractal.children.push(branch);
			//objectRenderArray.push(displayLine);
			//objectRenderArray.push(displayCircle);

		} else {
			var obj = new meta.style(Transformation.generateTransformation3(start, new Point(start.x, start.y)), meta.drawColor, meta.thickness, meta.fillStyle);
			fractal.updater = function(e){
				var end = windowToCanvas(e);
				var trans = Transformation.generateTransformation3(start, end);
				obj.points = map(obj.template, (el) => trans.apply(el));
				obj.size = trans.size;
			}
			window.addEventListener('mousemove', fractal.updater);
			fractal.trunk.push(obj);
		}
	},
	pop : function(){
		window.removeEventListener('mousemove', fractal.updater);
		if (meta.style === Branch){
			fractal.children.pop(); 
			//objectRenderArray.pop(); 
			//objectRenderArray.pop();
		} else {
			fractal.trunk.pop();
		}

	},
	updater : function(){}
}

let actionObject = { // undo/redo methods
	ctrl:{
		z: function(){ //Undo action
			if (actions.undoList.length !== 0){
				let fractalPopObject = actions.undoList.pop();
				
				let lastObj = fractalPopObject();
				actions.unundoList.push(lastObj);
			}
			setDrawLimits();
		},
		y: function(){ //un-undo action.
			if(actions.unundoList.length !== 0){
				let recoveredObj = actions.unundoList.pop();
				if (recoveredObj instanceof Branch){
					fractal.children.push(recoveredObj);
					actions.undoList.push(() => fractal.children.pop());
				} else {
					fractal.trunk.push(recoveredObj);
					actions.undoList.push(() => fractal.trunk.pop());
				}
			}
			setDrawLimits();
		}
	},
	noctrl:{}
}

var actions = { // holds a history of the objects added to fractal.
	undoList : [],
	unundoList : []
}


/* 
Class definitions
*/
colorMap = {
	black: new Color(0,0,0),
	grey: new Color(128,128,128),
	darkred:new Color('8B','00','00',hex=true),
	red:new Color('FF','00','00',hex=true),
	orange:new Color('FF','45','00',hex=true),
	yellow:new Color('FF','FF','00',hex=true),
	lawngreen:new Color('7C','FC','00',hex=true),
	green:new Color('00','80','00',hex=true),
	cadetblue:new Color('5F','9E','A0',hex=true),
	blue:new Color('00','00','FF',hex=true),
	violet:new Color('EE','82','EE',hex=true),
	purple:new Color('80','00','80',hex=true),
	cyan:new Color('00','FF','FF',hex=true),
	lightsalmon:new Color('FF','A0','7A',hex=true),
	lightyellow:new Color('FF','FF','E0',hex=true),
	lime:new Color('00','FF','00',hex=true),
	mistyrose:new Color('FF','E4','E1',hex=true),
	slateblue:new Color('6A','5A','CD',hex=true),
	tomato:new Color('FF','63','47',hex=true),
	white:new Color('FF','FF','FF',hex=true)
}

black = colorMap.black;
white = colorMap.white;

function Color(r,g,b, hex=false){
	if(hex){
		this.r = hexToDecimal(r);
		this.g = hexToDecimal(g);
		this.b = hexToDecimal(b);
	} else {
		this.r = r;
		this.b = b;
		this.g = g;
	}
}
Color.prototype.toString = function(hex=false){
	if(hex){
		return `#${zeroFill(decimalToHex(this.r),2)}${zeroFill(decimalToHex(this.g),2)}${zeroFill(decimalToHex(this.b),2)}`;
	} else {
		return `rgb(${this.r},${this.g},${this.b})`;	
	}
}
function Branch(transformation){
	this.transformation = transformation;

}

function Point(x,y){
	this.x = x;
	this.y = y;
}

function Shape(points = [], size=undefined, color = black, thickness = 1, style='stroke'){
	this.points = points;
	this.color = color;
	this.thickness = thickness;
	this.style = style;
	if(size === undefined){
		this.size = radius(points);
	} else {
		this.size = size;
	}

	this.build = function(){
		let last = this.points.length - 1;
		ctx.moveTo(this.points[last].x, this.points[last].y);
		this.points.forEach((el) => ctx.lineTo(el.x, el.y));
	}

	this.draw = function(){
		// Check to see if the shape is in frame, and if it isn't, don't draw
		let x = this.points[0].x;
		let y = this.points[0].y;

		if(x + this.size <= boundaries.left || x - this.size >= boundaries.right || y + this.size <= boundaries.bottom || y - this.size >= boundaries.top){
			return;
		} else {
			if(this.style === 'stroke' || this.points.length === 2){
				ctx.lineWidth = this.thickness;
				ctx.strokeStyle = this.color;
				ctx.beginPath();
				this.build();
				ctx.stroke();
			}else if(this.style === 'fill'){
				ctx.fillStyle = this.color;
				ctx.beginPath();
				this.build();
				ctx.fill();
			} else {
			}
		}
	}
}
function Line(transformation, color=black, thickness = 1, style='stroke'){
	this.template = [new Point(0,0), new Point(0,1)];
	Shape.call(this, map(this.template, (el) => transformation.apply(el)), transformation.size, color, thickness, style);

	this.build = function(){ // unique draw function for performance reasons.
		ctx.moveTo(this.points[0].x, this.points[0].y);
		ctx.lineTo(this.points[1].x, this.points[1].y);
	}
}
function Triangle(transformation, color = black, thickness = 1, style='stroke'){
	this.template = [new Point(-0.5, 0), new Point(0.5, 0), new Point(0,1)];
	Shape.call(this, map(this.template, (el) => transformation.apply(el)), transformation.size, color, thickness, style);
}
function Curve(transformation, color=black, thickness = 1, style='stroke'){}
function Oval(transformation, color=black, thickness = 1, style='stroke'){}
function Circle(transformation, color=black, thickness = 1, style='stroke'){
	this.template = [new Point(0,0.5)];
	Shape.call(this, map(this.template, (el) => transformation.apply(el)), transformation.size, color, thickness, style);
	this.build = function(){ //special draw function.
		ctx.moveTo(this.points[0].x+this.size/2, this.points[0].y);
		ctx.arc(this.points[0].x, this.points[0].y, this.size/2, 0, 2*Math.PI);
	}
}
function RightTriangle(transformation, color=black, thickness = 1, style='stroke'){}
function Rectangle(transformation, color=black, thickness = 1, style='stroke'){
	this.template = [new Point(-0.5,0), new Point(0.5,0), new Point(0.5,1), new Point(-0.5,1)]
	Shape.call(this, map(this.template, (el) => transformation.apply(el)), transformation.size, color, thickness, style);
} 
function Pentagon(transformation, color=black, thickness = 1, style='stroke'){}
function Hexagon(transformation, color=black, thickness = 1, style='stroke'){
	// x = 0.2257
	// 1-x = 0.7743
	this.template = [new Point(0,0), new Point(0.5, 0.2257), new Point(0.5, 0.7743), new Point(0,1), new Point(-0.5,0.7743), new Point(-0.5,0.2257)];
	Shape.call(this, map(this.template, (el) => transformation.apply(el)), transformation.size, color, thickness, style);
}
function Septagon(transformation, color=black, thickness = 1, style='stroke'){}
function Octagon(transformation, color=black, thickness = 1, style='stroke'){
	//x = 0.292893
	// x-0.5 = -0.2071
	// 0.5 -x = 0.2071
	// 1-x = 0.7071
	this.template = [new Point(-0.2071,0), new Point(0.2071,0), new Point(0.5, 0.292893), new Point(0.5, 0.7071), new Point(0.2071,1), new Point(-0.2071,1), new Point(-0.5, 0.7071), new Point(-0.5, 0.292893)];
	Shape.call(this, map(this.template, (el) => transformation.apply(el)), transformation.size, color, thickness, style);	
}
function RoundedRectangle(transformation, color=black, thickness = 1, style='stroke'){}
function Polygon(transformation, color=black, thickness = 1, style='stroke'){}
function RightArrow(transformation, color=black, thickness = 1, style='stroke'){}
function LeftArrow(transformation, color=black, thickness = 1, style='stroke'){}
function UpArrow(transformation, color=black, thickness = 1, style='stroke'){}
function DownArrow(transformation, color=black, thickness = 1, style='stroke'){}
function FourStar(transformation, color=black, thickness = 1, style='stroke'){
	this.template = [new Point(0,0), new Point(0.125, 0.375), new Point(0.5, 0.5), new Point(0.125, 0.625), new Point(0,1), new Point(-0.125,0.625), new Point(-0.5,0.5), new Point(-0.125, 0.375)];
	Shape.call(this, map(this.template, (el) => transformation.apply(el)), transformation.size, color, thickness, style);		
}
function FiveStar(transformation, color=black, thickness = 1, style='stroke'){
	this.template = [new Point(-0.306, 0), new Point(0.002, 0.218), new Point(0.312, 0), new Point(0.204, 0.378), new Point(0.5, 0.608), new Point(0.122, 0.618), new Point(0, 1), new Point(-0.12, 0.627), new Point(-0.5, 0.604), new Point(-0.198, 0.378)];
	Shape.call(this, map(this.template, (el) => transformation.apply(el)), transformation.size, color, thickness, style);		
}
function SixPointStar(transformation, color=black, thickness = 1, style='stroke'){}

function Transformation(a,b,c,d,e,f,color=black){
	// matrix notation for a linear transformation
	// if a vector is expressed as (x,y,1), the Transformation is equivalent to the matrix:
	// ( a c e )
	// ( b d f )

	// interpretation:
	// a = horizontal scaling
	// b = vertical skewing
	// c = horizontal skewing
	// d = vertical scaling
	// e = horizontal translation
	// f = vertical translation

	this.a = a;
	this.b = b;
	this.c = c;
	this.d = d;
	this.e = e;
	this.f = f;

	this.xscale = (a**2 + b**2)**(0.5);
	this.yscale = (c**2 + d**2)**(0.5);

	this.size = Math.max(this.xscale, this.yscale);

	//color attributes
	this.r = color.r;
	this.g = color.g;
	this.bl = color.b;
}
Transformation.prototype.apply = function(operand){
	// Transformation application function. Accepts points, shapes, and other transformations.
	// Input MUST be point, shape, or transformation.
	if(operand instanceof Point){
		let x = operand.x;
		let y = operand.y;

		return new Point(this.a * x + this.c * y + this.e, this.d * y + this.b * x + this.f);

	} else if(operand instanceof Transformation){
		var a0 = operand.a;
		var b0 = operand.b;
		var c0 = operand.c;
		var d0 = operand.d;
		var e0 = operand.e;
		var f0 = operand.f;

		var a = this.a * a0 + this.c * b0;
		var b = this.b * a0 + this.d * b0;
		var c = this.a * c0 + this.c * d0;
		var d = this.b * c0 + this.d * d0;
		var e = this.a * e0 + this.c * f0 + this.e;
		var f = this.b * e0 + this.d * f0 + this.f;

		var clr = new Color(this.r, this.b, this.g);

		return new Transformation(a,b,c,d,e,f, clr);
	} else if (operand instanceof Circle){
		let r = operand.color.r + (this.r - operand.color.r)/8;
		let g = operand.color.g + (this.g - operand.color.g)/8;
		let b = operand.color.b + (this.bl - operand.color.b)/8;

		let newPts = map(operand.points, (el) => this.apply(el));
		let newSize = operand.size * this.size;
		let newClr = new Color(r,g,b);

		let c = new Circle(id, newClr, operand.thickness, operand.style);
		c.points = newPts;
		c.size = newSize;

		return c;
	}else {

		let r = operand.color.r + (this.r - operand.color.r)/8;
		let g = operand.color.g + (this.g - operand.color.g)/8;
		let b = operand.color.b + (this.bl - operand.color.b)/8;

		let newPts = map(operand.points, (el) => this.apply(el));
		let newSize = operand.size * this.size;
		let newClr = new Color(r,g,b);

		return new Shape(newPts, newSize, newClr, operand.thickness, operand.style);
	}
}

Transformation.generateTransformation1 = function(start, end, unit=1, color=black) {
	//relative rotation
	var vec = {
		x: (end.x - start.x), 
		y: (end.y - start.y)
	}; 
	var h = ((vec.x) ** 2 + (vec.y) ** 2) ** (0.5); //hypotenuse

	var theta_1 = Math.atan2(start.y, start.x)
	var theta_2 = Math.atan2(vec.y, vec.x);

	var dt = theta_2 - theta_1;
	let adj = cos(dt);
	let opp = sin(dt);

	let scale = Math.min(h/unit, meta.maxScale);

	var a = scale*adj;
	var b = scale*opp; 
	var c =	-scale*opp;
	var d = scale*adj;
	var e = start.x;
	var f = start.y;

	return new Transformation(a,b,c,d,e,f, color);
	
}

Transformation.generateTransformation2 = function(angle, size, dx, dy, unit = 1, color=black){
	// simple method to generate a transformation.
	let opp = sin(angle) * size;
	let adj = cos(angle) * size;

	return new Transformation(adj, opp, -opp, adj, dx, dy, color);
}

Transformation.generateTransformation3 = function(start, end, unit = 1, color=black){
	//absolute rotation.
	let dx = (end.x - start.x);
	let dy = (end.y - start.y);

	let angle = Math.atan2(dy,dx) - Math.PI/2;
	let h = Math.min((dx ** 2 + dy **2 ) ** (0.5), meta.maxSize);

	var a = h * cos(angle);
	var b = h * sin(angle);
	var c = -h * sin(angle);
	var d = h * cos(angle);
	var e = start.x;
	var f = start.y;

	return new Transformation(a,b,c,d,e,f, color);
}

let id = new Transformation(1,0,0,1,0,0); // identity transformation
let zero = new Transformation(0,0,0,0,0,0);


// ++++++++++++++++++++++++++++++ Auxilliary helper functions ++++++++++++++++++++++++++++++++++++++++++++++
function zeroFill(number, width){
	let s = number.toString();

	while(s.length < width){
		s = '0' + s;
	}
	return s;
}
function filter(arr, fn){
	var result = [];
	for(var i = 0; i < arr.length; i++){
		if(fn(arr[i])){
			result.push(arr[i]);
		}
	}
	return result;
}

function map(arr, fn){
	var result = [];
	for(var i = 0; i < arr.length; i++){
		result[i] = fn(arr[i]);
	}
	return result;
}

function radius(arr){
	m = 0;
	let distance = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

	for(var i = 0; i < arr.length; i++){
		for(var j = i; j < arr.length; j++){
			m = Math.max(m, distance(arr[i], arr[j]));
		}
	}
	return m;
}

function ceiling(n){
  return -Math.floor(-n);
}

function cache(f){
	var dict = {};
	function helper(){
    let s = JSON.stringify(arguments);
		if (dict[s] === undefined){
			let r = f.apply(null, arguments);
			dict[s] = r;
			return r;
		} else {
			return dict[s];
		}
	}
	return helper;
}

function hexToDecimal(n){
	// takes a hex string and returns a decimal number;
	let map = {
		'0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'A':10,'B':11,'C':12,'D':13,'E':14,'F':15,a:10,b:11,c:12,d:13,e:14,f:15
	}
	let result = 0;
	let power = 0;
	while(n.length !== 0){
		result += 16**power * map[n[n.length - 1]];
		power += 1;
		n = n.slice(0, n.length - 1);
	}
	return result;
}

function decimalToHex(n){
	let map = {0:'0', 1:'1', 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9', 10:'A', 11:'B', 12:'C', 13:'D', 14:'E', 15:'F'};

	let result = "";
	while(n !== 0){
		result = map[n%16] + result;
		n = Math.floor(n/16);
	}
	return result;
}

// draw limiting
function setDrawLimits(){
	function knapsack(A, r){
		var sum = 1;
		if (r <= 0){
			return 0;
		}
		for(var i = 0; i < A.length; i++){
			sum += knapsack(A, r-A[i]);
		}

	  return sum;
	}
	knapsack = cache(knapsack);

	function countNodes(radii, maxSize, renderThreshold){
		// returns the number of nodes in a tree comprised of branches of radius radii, of max root size maxSize, and of render size limit renderThreshold.
		// assumptions:
		//	 0 < radii[i] <= 0.9 all i
		//   renderThreshold > 0;
		if (radii.length === 0){
			if (maxSize === 0){
				return 0;
			} else {
				return 1;
			}
		}

		// can improve.
		let ratio = renderThreshold / maxSize;
		let depths = [];
		let maxDepth = 0;
		for(var i = 0; i < radii.length; i++){
			let d = Math.min(100, Math.round(Math.log(ratio)/Math.log(radii[i])));
			depths.push(d);
	    maxDepth = Math.max(maxDepth, d);
		}

	  for(var i = 0; i < radii.length; i++){
	    depths[i] = Math.floor(maxDepth / depths[i]);
	  }

		let nodes = knapsack(depths, maxDepth);

		return nodes;
	}

	function countOperations(radii, maxSize, renderThreshold, weight){
		return weight * countNodes(radii, maxSize, renderThreshold);
	}

	function findMaxScale(radii, maxSize, renderThreshold, weight, operationLimit){
		// Finds the maximum scale of a new branch such that it lays below the operation limit.

		let l = 0;
		let r = 0.9;
		let count = 0;
		let length = radii.length;
	  let m = 0;
		while(count < 12){
			m = (l + r) / 2
			radii[length] = m;

			let n = countOperations(radii, maxSize, renderThreshold, weight);

			if( n > operationLimit){
				r = m;
			} else if (n === operationLimit){
				return m;
			} else if (n < operationLimit){
				l = m;
			}

			count += 1 ;
		}

		radii.pop();
		return l;
	}


	function findMaxSize(radii, maxSize, renderThreshold, weight, operationLimit){
		// Finds the maximum size of a new trunk element

		let l = 0;
		let r = 10000;
		let count = 0;
	  	let m = 0;
		while(count < 12){
			m = (l + r) / 2

			let n = countOperations(radii, m, renderThreshold, weight);

			if( n > operationLimit){
				r = m;
			} else if (n === operationLimit){
				return m;
			} else if (n < operationLimit){
				l = m;
			}

			count += 1 ;
		}

		return l;
	}

	function cost(n){
		if (n === 2){
			return 1;
		} else {
			return Math.max(n/2,1);
		}
	}

	let radii = [];
	for(var i = 0; i < fractal.children.length; i++){
		radii.push(fractal.children[i].transformation.size);
	}

	let maxSize = 0;
	for(var i = 0; i < fractal.trunk.length; i++){
		maxSize = Math.max(maxSize, fractal.trunk[i].size);
	}

	let size = findMaxSize(radii, maxSize, 4, fractal.trunk.length, meta.operationLimit);
	let scale = findMaxScale(radii, maxSize, 4, fractal.trunk.length, meta.operationLimit);

	meta.maxScale = scale;
	meta.maxSize = size;
}
