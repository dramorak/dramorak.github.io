// Testing, benchmarks.

if(test){
	var trans1 = new Transformation(200,0,0,200,0,0);
	var trans2 = new Transformation(0,100,-100,0,0,0);
	var trans3 = new Transformation(100,0,0,100,10,10);

	var trans4 = new Transformation(100,100,100,100, 100, 100);
	var trans5 = new Transformation(1,12,20,10,10,100);
	var trans6 = new Transformation(-10, -10, 100, 20, -100,-100);

	var l1 = new Line(trans1, black, 1);
	var l2 = new Line(trans2);
	var l3 = new Line(trans3);

	var l4 = new Line(trans4);
	var l5 = new Line(trans5);
	var l6 = new Line(trans6);

	var color = new Color(255,0,0);
	var colorTrans = new Transformation(100,0,0,100,0,0,color);
	var ex = colorTrans.apply(l1);
}
function deepEquals(actual, expected){

	function helper(actual, expected){
		if (typeof actual != typeof expected){
			return false;
		}

		if(typeof actual === 'object'){
			let t = true;
			for(var x in actual){
				t = t && helper(actual[x], expected[x]);
			}
			for(var x in expected){
				t = t && helper(actual[x], expected[x]);
			}

			if(t === false){
			}
			return t;

		} else if (typeof actual === 'number'){ // must use fuzzy equals for float case.
			return Math.abs(actual - expected) < 0.00001;
		} else {
			return (actual === expected);
		}
	}

	let t = helper(actual, expected);
	return t;
}

function assertEquals(actual, expected, message){
	if(deepEquals(actual,expected)){
		console.log(`Test successful.`);
		return;
	}
	console.log(`Test[${message}] failed.`)
}

function transformationUnitTest(){
	let p1 = new Point(0,0);
	let p2 = new Point(1,0);
	let p3 = new Point(0,1);
	let p4 = new Point(1,1);

	console.log("Beginning transformation test:");
	console.log("Beginning primitive transformation tests:");
	// id test.
	console.log('Testing transformation(id):');
	let trans1 = id;
	let msg1 = 'Trivial identity test.'
	assertEquals(trans1.apply(p1),p1,msg1);
	assertEquals(trans1.apply(p2),p2,msg1);
	assertEquals(trans1.apply(p3),p3,msg1);
	assertEquals(trans1.apply(p4),p4,msg1);
	console.log('\n');

	//scale test
	console.log('Testing transformation(double):');
	let trans2 = new Transformation(2,0,0,2,0,0);
	let msg2 = "Doubling length.";
	assertEquals(trans2.apply(p1),new Point(0,0),msg2);
	assertEquals(trans2.apply(p2),new Point(2,0),msg2);
	assertEquals(trans2.apply(p3),new Point(0,2),msg2);
	assertEquals(trans2.apply(p4),new Point(2,2),msg2);
	console.log('\n');

	//rotate test
	console.log('Testing transformation(rot-pi/2):');
	let trans3 = new Transformation(0,1,-1,0,0,0);
	let msg3 = "Rotate Pi/2 radians counter-clockwise.";
	assertEquals(trans3.apply(p1),new Point(0,0),msg3);
	assertEquals(trans3.apply(p2),new Point(0,1),msg3);
	assertEquals(trans3.apply(p3),new Point(-1,0),msg3);
	assertEquals(trans3.apply(p4),new Point(-1,1),msg3);
	console.log('\n');

	//Translate test.
	console.log('Testing transformation(trans-1,1):');
	let trans4 = new Transformation(1,0,0,1,1,1);
	let msg4 = "Translate 1 up 1 right.";
	assertEquals(trans4.apply(p1),new Point(1,1),msg4);
	assertEquals(trans4.apply(p2),new Point(2,1),msg4);
	assertEquals(trans4.apply(p3),new Point(1,2),msg4);
	assertEquals(trans4.apply(p4),new Point(2,2),msg4);
	console.log('\n');

	console.log('\n\n');
	//Transformation apply to transformation testing
	console.log("Beginning test for transformation-transformation operations.");

	assertEquals(zero.apply(new Transformation(1,1,1,1,1,1)), zero, "Zero matrix times anything is zero.");
	assertEquals(id.apply(new Transformation(1,1,1,1,1,1)), new Transformation(1,1,1,1,1,1), "Identity times x is x.");
	assertEquals((new Transformation(1,1,1,1,1,1)).apply(id), new Transformation(1,1,1,1,1,1), "x times identity is x.")
	assertEquals(trans2.apply(trans4), new Transformation(2,0,0,2,2,2), "Trans, then double.");
	assertEquals(trans4.apply(trans2), new Transformation(2,0,0,2,1,1), "Double, then trans.");
	assertEquals(trans3.apply(trans2), new Transformation(0,2,-2,0,0,0), "Rotate, double.");

	console.log('\n\n\n')
	//Transformation generation testing.
	console.log("Beginning test for transformation generation functions.");
	console.log("Two-point generation, relative:");
	assertEquals(Transformation.generateTransformation1(new Point(0,0), new Point(1,0)), new Transformation(1,0,0,1,0,0), "Identity.");
	assertEquals(Transformation.generateTransformation1(new Point(0,0), new Point(-1,0)), new Transformation(-1,0,0,-1,0,0), "Rotate (pi)");
	assertEquals(Transformation.generateTransformation1(new Point(0,0), new Point(0,-1)), new Transformation(0,-1,1,0,0,0), "Rotate (3pi/2)");
	assertEquals(Transformation.generateTransformation1(new Point(1,0), new Point(1,1)), new Transformation(0,1,-1,0,1,0), "Rotate(pi/2), trans:1,0");
	assertEquals(Transformation.generateTransformation1(new Point(1,0), new Point(2,0)), new Transformation(1,0,0,1,1,0), 'trans:1,0');
	assertEquals(Transformation.generateTransformation1(new Point(0,-1), new Point(0,0)), new Transformation(-1,0,0,-1,0,-1), 'Rot(pi), Trans:0,-1');
	console.log("Size-angle-trans generation:");
	assertEquals(Transformation.generateTransformation2(0, 1, 0, 0), id, "Identity.");
	assertEquals(Transformation.generateTransformation2(0,2,0,0), new Transformation(2,0,0,2,0,0), "Double.");
	assertEquals(Transformation.generateTransformation2(Math.PI/2, 1, 0,0), new Transformation(0, 1, -1, 0,0,0), "Rotate(pi/2)");
	assertEquals(Transformation.generateTransformation2(0,1,1,1), new Transformation(1,0,0,1,1,1), "Trans:1,1");
	console.log("Two-point generation, absolute.");
	assertEquals(Transformation.generateTransformation3(new Point(0,0), new Point(0,1)), new Transformation(1,0,0,1,0,0), "Identity.");
	assertEquals(Transformation.generateTransformation3(new Point(0,0), new Point(-1,0)), new Transformation(0,1,-1,0,0,0), "Rotate (pi/2)");
	assertEquals(Transformation.generateTransformation3(new Point(0,0), new Point(0,-1)), new Transformation(-1,0,0,-1,0,0), "Rotate (pi)");
	assertEquals(Transformation.generateTransformation3(new Point(1,0), new Point(1,1)), new Transformation(1,0,0,1,1,0), "Trans: 1,0");
	assertEquals(Transformation.generateTransformation3(new Point(1,0), new Point(2,0)), new Transformation(0,-1,1,0,1,0), 'Rot:-pi/2, trans:1,0');
	assertEquals(Transformation.generateTransformation3(new Point(0,-1), new Point(0,0)), new Transformation(1,0,0,1,0,-1), 'Trans:0,-1');

	//Color Transformation testing
}

function fractalDrawBenchmark(){
	let l1 = new Line(new Transformation(100,0,0,100,0,0));
	let b1 = new Branch(Transformation.generateTransformation2(Math.PI/6, 0.82, 0, 100));
	let b2 = new Branch(Transformation.generateTransformation2(-Math.PI/6, 0.82, 0, 100));

	fractal.trunk.push(l1);
	fractal.children.push(b1);
	fractal.children.push(b2);	

	meta.renderThreshold = 2;

	let start = Date.now();
	fractal.draw();
	let duration = Date.now() - start;

	return duration + 'ms';

	// notes: I did some experiments. 
	// 		- vector Calculation time: 227 ms
	//      - shape drawing time: 800ms
	//
	//		Approximately 4/5 of the computation time is spent drawing; There must be a better way...
	//test results:
	//v1 = 1350 ms
	//v2 = 803 ms  (YES!)
	//v3 = 780 - save 2% time but removes the ability to scroll/grab, so scrapped.
	//v4 = 780 ms - stop calculating point size, not needed.
	//v5 = 760 ms - slight change to map function.

	// new game:

	// I had to roll back some of the previous changes, including the most significant one, since it disabled the ability to color the fractal =(.
	// I'll be starting a new performance tracking log.

	//v1: 1769 ms
	//    Feb 21 2021
	//    notes: dynamically alters renderThreshold in response to scaling. (since the user won't be able to see the small stuff anyway.
	
	//v2: 986 ms
	//    Feb 21 2021
	//    Disabled drawing of objects that are off screen.

	

}

// What is the proprtion of time spent drawing, vs calculating vectors?
var timeDrawing = 0;
var timeCalculating = 0;
