// Container function for initializing interactive buttons in the web page.
function initializeMenu(){
	var styleMap = {
		"line":Line, 
		"circle":Circle,
		"triangle":Triangle, 
		"rectangle":Rectangle, 
		"hexagon":Hexagon, 
		"octagon":Octagon, 
		"fourstar":FourStar, 
		"fivestar": FiveStar,
		"branch":Branch,
		"grab": "grab"
	};
	var numberMap = {
		one:1,
		two:2,
		three:3,
		four:4,
		five:5,
		six:6,
		seven:7,
		eight:8,
		nine:9,
		ten:10
	}
	var last = {
		target: undefined,
		class: undefined
	}
	var thicknessInputMenu_isOpen = false;
	let menu = document.querySelector('#menu');
	let thicknessInputMenu = document.querySelector('#thicknessInputMenu'); // 

	//create event handler
	function handler(e){
		// find target of hit
		let target = e.target;
		// if thicknessSelectBoolean is true, then the thicknessOptionPanel is open, and needs to be closed.
		if(thicknessInputMenu_isOpen){
			document.querySelector('#thicknessInputMenu').style.display = 'none';
			document.querySelector('#thicknessDisplay').setAttribute('class', 'thicknessContainer');
			thicknessInputMenu_isOpen = false;
		}
		// control flow based on target
		let identifier = target.getAttribute('class');

		if(identifier === 'menuImage'){
			target = target.parentNode;

			// special cases:
			if (target.id === 'undo'){
				actionObject.ctrl.z();
				return;
			} else if (target.id === 'redo'){
				actionObject.ctrl.y();
				return;
			} else if(target.id === 'center'){
				resetCoordinates();
				return;
			}else if(target.id === 'thicknessDisplay'){
				document.querySelector('#thicknessDisplay').setAttribute('class', 'thicknessContainer selected');

				// display thicknessInputMenu
				let thicknessInputMenu = document.querySelector('#thicknessInputMenu');
				thicknessInputMenu.style.display = 'block';

				//set thicknessSelectBoolean to true
				thicknessInputMenu_isOpen = true;

				return;
			} else if(target.getAttribute('class') === 'thicknessOption'){
				//set thickness
				meta.thickness = numberMap[target.id];
				return;
			} else if(target.id === 'stroke'){
				meta.fillStyle = 'stroke';

				document.querySelector('#stroke').setAttribute('class', 'menuItem selected');
				document.querySelector('#fill').setAttribute('class', 'menuItem');

			} else if(target.id === 'fill'){
				meta.fillStyle = 'fill';

				document.querySelector('#stroke').setAttribute('class', 'menuItem');
				document.querySelector('#fill').setAttribute('class', 'menuItem selected');
			} else if(target.id === 'save') {
				function saveContext(blob){
					var blobURL = URL.createObjectURL(blob);
					window.open(blobURL);
				}
				clear();
				ctx.fillStyle = meta.backgroundColor.toString();
				ctx.fillRect(inv*(-canvasCenter.x), inv*(canvasCenter.y - height), inv*width, inv*height);
				fractal.draw();
				canvas.toBlob(saveContext, type='image/png');
				return;
			} else if(target.id === 'new'){
				window.location.replace(window.location.href);
				return;
			} else {
				// general cases:
				meta.style = styleMap[target.id];

				// add the selected target to the 'selected' class
				let c = target.getAttribute('class');
				target.setAttribute('class', c + ' selected');

				//clear the last target
				if(last.target === undefined){
					last.target = target;
					last.class = c;
				} else {
						last.target.setAttribute('class', last.class);
						if(last.target === target){
							last.target = undefined;
							last.class = undefined;
							meta.style = Line;
						} else {
							last.target = target;
							last.class = c;
						}
				}
			}
		} else if (identifier === 'colorBoxInterior'){
			let p = target.parentNode;

			// background color:
			if(p.id === 'backgroundColor'){
				// change meta.drawStyle
				meta.colorStyle = 'backgroundColor';

				//stop highlighting drawColor box
				document.querySelector('#drawColorContainer').setAttribute('class', 'colorStyle');

				//start highlighting backgroundColor
				document.querySelector('#backgroundColorContainer').setAttribute('class', 'colorStyle selected');


			} else if(p.id === 'drawColor'){
				//change meta.drawStyle
				meta.colorStyle = 'drawColor';

				//stop highlighting backgroundColor box;
				document.querySelector('#backgroundColorContainer').setAttribute('class', 'colorStyle');

				//start highlighting drawColor box
				document.querySelector('#drawColorContainer').setAttribute('class', 'colorStyle selected');


			} else {
				let color = p.id;

				// change the background of 'Chosen color'
				document.querySelector(`#${meta.colorStyle} .colorBoxInterior`).style.backgroundColor = color;

				// change meta color information.
				if(meta.colorStyle === 'backgroundColor'){
					meta.backgroundColor = colorMap[color];
					// change main background color.
					document.querySelector('main').style.backgroundColor = color;
				}else if(meta.colorStyle ==='drawColor'){
					meta.drawColor = colorMap[color]; 
				}
			}
		} else {
			return;
		}
	}

	//attatch handler to menu.
	menu.addEventListener('click', handler);
	thicknessInputMenu.addEventListener('click', handler);

	// color form handler
	function setColor(e){
		let color = e.target.value;
		if(meta.colorStyle === 'backgroundColor'){
			meta.backgroundColor = new Color(color.slice(1,3), color.slice(3,5), color.slice(5,7), hex=true);
			document.querySelector('main').style.backgroundColor = color;
		} else if(meta.colorStyle === 'drawColor'){
			meta.drawColor = new Color(color.slice(1,3), color.slice(3,5), color.slice(5,7), hex=true);
		}
		document.querySelector(`#${meta.colorStyle} .colorBoxInterior`).style.backgroundColor = color;
	}
	let customColor = document.querySelector('#customColor');
	customColor.addEventListener('input', setColor);

	//canvas cursor handler.
	const canvas = document.querySelector('canvas');
	canvas.addEventListener('mouseenter', function(){
		if(meta.style === 'grab'){
			document.querySelector('main').style.cursor = 'grabbing';
		} else {
			document.querySelector('main').style.cursor = 'crosshair';		
		}

	});
	canvas.addEventListener('mouseleave', function(){
		document.querySelector('main').style.cursor = 'auto'
	});
}

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

if(!ctx){throw '';}

var width = canvas.width = window.innerWidth;
var height = canvas.height = window.innerHeight - 36;

ctx.fillStyle = 'rgb(0,0,0)';
ctx.setTransform(1,0,0,-1,Math.floor(width/2), Math.floor(height/2));

function resetCoordinates(){
	width = canvas.width = window.innerWidth;
	height = canvas.height = window.innerHeight - 36;
	canvasCenter.x = width/2;
	canvasCenter.y = height/2;
	scale = 1;
	inv = 1;
	boundaries.updateBoundaries();
	ctx.setTransform(1, 0, 0, -1, width/2, height/2);
}
// updates dimensions of canvas on window resize.
window.addEventListener('resize', resetCoordinates);

// Mouse handling.
let canvasCenter = new Point(Math.floor(width/2), Math.floor(height/2));
let scale = 1;
let inv = 1 / scale;
let x = 0;
let y = 0;
let mousedown = false;
let mouse = {
	x:0,
	y:0
}
let boundaries = {
	top: height/2,
	right: width/2,
	bottom: -height/2,
	left: -width/2,
	updateBoundaries: function() {
		boundaries.top = inv*canvasCenter.y;
		boundaries.right = inv*(width - canvasCenter.x);
		boundaries.bottom = -inv*(height - canvasCenter.y);
		boundaries.left = -inv*canvasCenter.x;
	}
}

function mousemoveHandler(e){
	if (mousedown === false){ return;}
	if(meta.style === 'grab'){
		let dx = e.clientX - x;
		let dy = e.clientY - y;

		x = e.clientX;
		y = e.clientY;

		canvasCenter.x += dx;                          
		canvasCenter.y += dy;

		ctx.setTransform(scale, 0, 0, -scale, canvasCenter.x, canvasCenter.y);
		boundaries.updateBoundaries();
	}
}

function mouseupHandler(e){
	if (mousedown === false){
		return;
	}

	if (meta.style === "grab"){
	}else{
		fractal.pop();
		fractal.pushNewObject(new Point(x,y), windowToCanvas(e));
	}

	x = 0;
	y = 0;
	mousedown = false;
}
function mousedownHandler(e){
	if(e.button === 0){
		if (meta.style === 'grab'){
			x = e.clientX;
			y = e.clientY;
		} else {
			let start = windowToCanvas(e);
			x = start.x;
			y = start.y;
			fractal.pushGhostObject(start);
		}
		mousedown = true;
	}
}

function wheelHandler(e){
	e.preventDefault();

	// moves in units of 125
	// negative means the wheel has been scrolled up
	// positive means the wheel has been scrolled down.
	newScale = Math.min(Math.max(scale*(1-e.deltaY/125 * 0.25), 0.125), 5);
	newInv = 1/newScale;

	// update canvasCenter 
	canvasCenter.x = mouse.x*(1-newScale/scale) + newScale/scale*canvasCenter.x;
	canvasCenter.y = mouse.y*(1-newScale/scale) + newScale/scale*canvasCenter.y;

	// update Scale,Inv
	scale = newScale;
	inv = newInv;

	//update boundaries
	boundaries.updateBoundaries();

	// change render limit
	meta.renderThreshold = Math.max(Math.floor(inv) + 2,4);

	// update ctx transform attribute
	ctx.setTransform(scale, 0, 0, -scale, canvasCenter.x, canvasCenter.y)
}

function updateMouseCoords(e){
	mouse.x = e.clientX;
	mouse.y = e.clientY;
}

canvas.addEventListener('wheel', wheelHandler);
canvas.addEventListener('mousedown', mousedownHandler);
window.addEventListener('mouseup', mouseupHandler);
canvas.addEventListener('mousemove', mousemoveHandler);
window.addEventListener('mousemove', updateMouseCoords);

// Coordinate transformation from window to canvas.
function windowToCanvas(e){
	// inverse of canvas to window.
	return new Point(inv*(e.clientX - canvasCenter.x), -inv*(e.clientY - canvasCenter.y));
}
// clear canvas function
function clear(){
	ctx.clearRect(inv*(-canvasCenter.x), inv*(canvasCenter.y - height), inv*width, inv*height);
}

// keyboard handlers
function keydownHandler(e){
	if (e.ctrlKey){
		if (actionObject.ctrl[e.key] !== undefined){
			actionObject.ctrl[e.key]();
		}
	} else {
		if (actionObject.noctrl[e.key] !== undefined){
			actionObject.noctrl[e.key]();
		}
	}
}
window.addEventListener('keydown', keydownHandler);


//Object renderer
objectRenderArray.push(fractal);
objectRenderArray.push(new Circle(new Transformation(10,0,0,10,0,-5), 'rgb(255,127,39)'))

function render(timestamp){
	//clear
	clear();

	//draw
	objectRenderArray.forEach((obj) => obj.draw());

	//loop
	window.requestAnimationFrame(render);
}

// Final initialization.
initializeMenu();

if (startRender){ 
	render(); 
} 
if (test){
	console.log(`Total time: ${fractalDrawBenchmark()}`);
}