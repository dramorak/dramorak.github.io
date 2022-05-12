/* ++++++++++++++++++++++++++++++++++++++++++++++++++++
 Object/Function definition page 
+++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

var startRender = true;
var test = false;

var sin = Math.sin;
var cos = Math.cos;
var objectRenderArray = [];

var meta = {
  // stores relevant information about the current drawstyle.
  style: Line,
  colorStyle: "drawColor",
  thickness: 2, // thickness of lines (only applies to stroke type objects)
  drawColor: new Color(0, 0, 0), // color of drawn objects
  backgroundColor: new Color(255, 255, 255), // background color
  fillStyle: "stroke", // outline vs fill
  clrscale: 16, //controls color fading. Higher value indicates slower fading.
  fadeVal: 0.4, // controls how quickly colors fade into the fractal.

  renderThreshold: 1, // limits drawing of objects to those whose sizes are larger than this value
  maxDepth: 100, // limits max depth. Sort of deprecated, switched to size limitation.
  maxScale: 0.73, // limits the max scale of a transformation. Must be less than one, otherwise it won't converge, and the program will run infinitely.
  maxSize: 10000, // deprecated
  operationLimit: 4000, // number of draw operations called in a single frame.
  unit: 200, // 1 unit is defined as 100 pixels.
};
const metaCopy = {...meta}; //copy original state, in case we need to restore later.

var fractal = {
  objects: [],
  branches: [],
  contexts: [],
  drawState: {
    opcount: 0, // counts the number of operations done this frame.
    i: 0, // context counter number
    stack: [], // stack
  },
  draw: function () {
    // draw top elements first

    while (fractal.drawState.i < fractal.objects.length) {
      // Trunk section
      //  push local state onto stack, if empty.
      if (fractal.drawState.stack.length == 0) {
        fractal.drawState.stack.push(fractal.objects[fractal.drawState.i]);
        fractal.drawState.stack.push(0);
      }
      //  Note: The 'local state' of the stack are 2 values: The node to be drawn, and a number representing the number of branches yet to be drawn.
      while (fractal.drawState.stack.length > 0) {
        node = fractal.drawState.stack[fractal.drawState.stack.length - 2];
        i = fractal.drawState.stack[fractal.drawState.stack.length - 1];

        if (node.size < meta.renderThreshold) {
          // if the node is too small.
          fractal.drawState.stack.pop();
          fractal.drawState.stack.pop();
          continue;
        }
        if (i == 0) {
          // if It's the first time encountering this node.
          node.draw(fractal.contexts[fractal.drawState.i]);
          fractal.drawState.opcount += node.drawTime; // number of lines in the image
        }
        if (i == fractal.branches.length) {
          // If all children of this node have been drawn
          // pop last two element off, and continue.
          fractal.drawState.stack.pop();
          fractal.drawState.stack.pop();
          continue;
        } else {
          //otherwise

          //update current node drawn number
          fractal.drawState.stack[fractal.drawState.stack.length - 1] += 1;

          //push new node onto the stack
          let trans = fractal.branches[i].transformation;
          fractal.drawState.stack.push(trans.apply(node)); // push new node on
          fractal.drawState.stack.push(0); // push todo variable.
        }
        //If oplimit has been reached, stop drawing.
        if (fractal.drawState.opcount >= meta.operationLimit) {
          fractal.drawState.opcount = 0;
          return;
        }
      }

      // set opcount to 0 for the next draw
      fractal.drawState.opcount = 0;
      // increment fractal.drawState.i
      fractal.drawState.i += 1;
    }
  },

  resetState: function () {
    fractal.drawState.opcount = 0;
    fractal.drawState.i = 0;
    fractal.drawState.stack = [];
  },

  push: function (
    start,
    end,
    type = "unspecified",
    drawColor = black,
    thickness = 1,
    fillStyle = "stroke",
    fade = 0
  ) {
    if (type == "unspecified") {
      type = meta.style;
    }

    if (type == Branch) {
      //NOTE Introducing a new branch is a violent process. I'll probably have to clear all of the contexts.

      //Clear all canvases (necessary?)
      fractal.contexts.forEach((ctx) => clear(ctx));

      //reset the fractal.drawState
      fractal.resetState();

      //Add a transformation to fractal.branches
      fractal.branches.push(
        new Branch(
          Transformation.generateTransformation1(
            start,
            end,
            meta.unit,
            drawColor,
            fade
          )
        )
      );
    } else {
      // drawobject
      //create a canvas
      const ctx = createCanvas();

      //modify it's transform
      ctx.setTransform(
        1,
        0,
        0,
        -1,
        width/2 + 71,
        height/2
      );

      //add context to the list of contexts.
      fractal.contexts.push(ctx);

      //push an object onto fractal.objects
      let trans = Transformation.generateTransformation3(start, end);
      let new_obj = new type(trans, drawColor, thickness, fillStyle, fade)
      fractal.objects.push(new_obj);

      //draw the depth 0 object immediately
      new_obj.draw(ctx);
    }
  },

  pop: function (type = "unspecified") {
    if (type == "unspecified") {
      type = meta.style;
    }
    // take the current draw style (branch, trunk) and pop.
    if (type === Branch && fractal.branches.length > 0) {
      if (fractal.branches.length == 0) {
        return;
      }
      // remove branch from branch list
      fractal.branches.pop();
      // reset the fractalState
      fractal.resetState();
      // clear all canvases.
      fractal.contexts.forEach((ctx) => clear(ctx));
    } else { // if object
      if (fractal.objects.length == 0) {
        return;
      }
      if (fractal.drawState.i == fractal.objects.length) {
        // if the object is already drawn
        fractal.drawState.i -= 1;
      } else if (fractal.drawState.i == fractal.objects.length - 1) {
        // if the object being popped is also the object being drawn
        // stop drawing the current object
        fractal.drawState.stack = [];
      }
      //remove object
      fractal.objects.pop();
      //remove the context from array, then delete it.
      let ctx = fractal.contexts.pop();
      //ctx.canvas.parentElement.removeChild(ctx.canvas);
      ctx.canvas.remove();
    }
  },
};

let actionObject = {
  // undo/redo methods
  ctrl: {
    z: function () {
      //Undo action

      if (actions.undoList.length != 0) {
        // get last action
        let lastAction = actions.undoList.pop();

        // undo the last action, save the unundo
        let unundo = lastAction();

        //push the unundo onto unundo list
        actions.unundoList.push(unundo);
      }
    },
    y: function () {
      //un-undo action.

      if (actions.unundoList.length != 0) {
        //get last action
        let lastAction = actions.unundoList.pop();

        // undo the last action, save the undo
        let undo = lastAction();

        //push the undo onto the list
        actions.undoList.push(undo);
      }
    },
  },
  noctrl: {},
};

var actions = {
  // holds a history of the objects added to fractal.
  undoList: [],
  unundoList: [],
};

/* 
Class definitions
*/
colorMap = {
  black: new Color(0, 0, 0),
  grey: new Color(128, 128, 128),
  darkred: new Color("8B", "00", "00", (hex = true)),
  red: new Color("FF", "00", "00", (hex = true)),
  orange: new Color("FF", "45", "00", (hex = true)),
  yellow: new Color("FF", "FF", "00", (hex = true)),
  lawngreen: new Color("7C", "FC", "00", (hex = true)),
  green: new Color("00", "80", "00", (hex = true)),
  cadetblue: new Color("5F", "9E", "A0", (hex = true)),
  blue: new Color("00", "00", "FF", (hex = true)),
  violet: new Color("EE", "82", "EE", (hex = true)),
  purple: new Color("80", "00", "80", (hex = true)),
  cyan: new Color("00", "FF", "FF", (hex = true)),
  lightsalmon: new Color("FF", "A0", "7A", (hex = true)),
  lightyellow: new Color("FF", "FF", "E0", (hex = true)),
  lime: new Color("00", "FF", "00", (hex = true)),
  mistyrose: new Color("FF", "E4", "E1", (hex = true)),
  slateblue: new Color("6A", "5A", "CD", (hex = true)),
  tomato: new Color("FF", "63", "47", (hex = true)),
  white: new Color("FF", "FF", "FF", (hex = true)),
};

black = colorMap.black;
white = colorMap.white;

function Color(r, g, b, hex = false) {
  if (hex) {
    this.r = hexToDecimal(r);
    this.g = hexToDecimal(g);
    this.b = hexToDecimal(b);
  } else {
    this.r = r;
    this.b = b;
    this.g = g;
  }
}
Color.prototype.toString = function (hex = false) {
  if (hex) {
    return `#${zeroFill(decimalToHex(this.r), 2)}${zeroFill(
      decimalToHex(this.g),
      2
    )}${zeroFill(decimalToHex(this.b), 2)}`;
  } else {
    return `rgb(${this.r},${this.g},${this.b})`;
  }
};
function Branch(transformation) {
  this.transformation = transformation;
}

function Point(x, y) {
  this.x = x;
  this.y = y;
}

function Shape(
  points = [],
  size = undefined,
  color = black,
  thickness = 1,
  style = "stroke",
  fade  = 0
) {
  this.points = points;
  this.color = color;
  this.thickness = thickness;
  this.style = style;
  this.fade = fade;
  if (size === undefined) {
    this.size = radius(points);
  } else {
    this.size = size;
  }

  this.build = function (ctx) {
    let last = this.points.length - 1;
    ctx.moveTo(this.points[last].x, this.points[last].y);
    this.points.forEach((el) => ctx.lineTo(el.x, el.y));
  };

  this.draw = function (ctx) {
    // Check to see if the shape is in frame, and if it isn't, don't draw
    let x = this.points[0].x;
    let y = this.points[0].y;

    if (
      x + this.size <= boundaries.left ||
      x - this.size >= boundaries.right ||
      y + this.size <= boundaries.bottom ||
      y - this.size >= boundaries.top
    ) {
      return;
    } else if (this.size < 2){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.points[0].x, this.points[0].y, this.size, this.size);
    }else {
      if (this.style === "stroke" || this.points.length === 2) {
        ctx.lineWidth = this.thickness;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        this.build(ctx);
        ctx.stroke();
      } else if (this.style === "fill") {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        this.build(ctx);
        ctx.fill();
      } else {
      }
    }
  };
}
function Line(transformation, color = black, thickness = 1, style = "stroke", fade = 0) {
  this.template = [new Point(0, 0), new Point(0, 1)];
  this.drawTime = 1.2;
  Shape.call(
    this,
    map(this.template, (el) => transformation.apply(el)),
    transformation.size,
    color,
    thickness,
    style,
    fade
  );

  this.build = function (ctx) {
    // unique draw function for performance reasons.
    ctx.moveTo(this.points[0].x, this.points[0].y);
    ctx.lineTo(this.points[1].x, this.points[1].y);
  };
}
function Triangle(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke",
  fade = 0
) {
  this.template = [new Point(-0.5, 0), new Point(0.5, 0), new Point(0, 1)];
  this.drawTime = 3;
  Shape.call(
    this,
    map(this.template, (el) => transformation.apply(el)),
    transformation.size,
    color,
    thickness,
    style,
    fade
  );
}
function Curve(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke",
  fade = 0
) {}
function Oval(transformation, color = black, thickness = 1, style = "stroke", fade = 0) {}
function Circle(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke",
  fade = 0
) {
  this.template = [new Point(0, 0.5)];
  this.drawTime = 4;
  Shape.call(
    this,
    map(this.template, (el) => transformation.apply(el)),
    transformation.size,
    color,
    thickness,
    style,
    fade
  );
  this.build = function (ctx) {
    //special draw function.
    ctx.moveTo(this.points[0].x + this.size / 2, this.points[0].y);
    ctx.arc(this.points[0].x, this.points[0].y, this.size / 2, 0, 2 * Math.PI);
  };
}
function RightTriangle(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}
function Rectangle(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke",
  fade = 0
) {
  this.template = [
    new Point(-0.5, 0),
    new Point(0.5, 0),
    new Point(0.5, 1),
    new Point(-0.5, 1),
  ];
  this.drawTime = 4;
  Shape.call(
    this,
    map(this.template, (el) => transformation.apply(el)),
    transformation.size,
    color,
    thickness,
    style,
    fade
  );
}
function Pentagon(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}
function Hexagon(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke",
  fade = 0
) {
  // x = 0.2257
  // 1-x = 0.7743
  this.template = [
    new Point(0, 1),
    new Point(0.433, 0.75),
    new Point(0.433, 0.25),
    new Point(0, 0),
    new Point(-0.433, 0.25),
    new Point(-0.433, 0.75),
  ];
  this.drawTime = 6;
  Shape.call(
    this,
    map(this.template, (el) => transformation.apply(el)),
    transformation.size,
    color,
    thickness,
    style,
    fade
  );
}
function Septagon(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}
function Octagon(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke",
  fade = 0
) {
  //x = 0.292893
  // x-0.5 = -0.2071
  // 0.5 -x = 0.2071
  // 1-x = 0.7071
  this.template = [
    new Point(-0.2071, 0),
    new Point(0.2071, 0),
    new Point(0.5, 0.292893),
    new Point(0.5, 0.7071),
    new Point(0.2071, 1),
    new Point(-0.2071, 1),
    new Point(-0.5, 0.7071),
    new Point(-0.5, 0.292893),
  ];
  this.drawTime = 8;
  Shape.call(
    this,
    map(this.template, (el) => transformation.apply(el)),
    transformation.size,
    color,
    thickness,
    style,
    fade
  );
}
function RoundedRectangle(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}
function Polygon(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}
function RightArrow(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}
function LeftArrow(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}
function UpArrow(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}
function DownArrow(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}
function FourStar(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke",
  fade = 0
) {
  this.template = [
    new Point(0, 0),
    new Point(0.125, 0.375),
    new Point(0.5, 0.5),
    new Point(0.125, 0.625),
    new Point(0, 1),
    new Point(-0.125, 0.625),
    new Point(-0.5, 0.5),
    new Point(-0.125, 0.375),
  ];
  this.drawTime = 8;
  Shape.call(
    this,
    map(this.template, (el) => transformation.apply(el)),
    transformation.size,
    color,
    thickness,
    style,
    fade
  );
}
function FiveStar(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke",
  fade = 0
) {
  this.template = [
    new Point(-0.306, 0),
    new Point(0.002, 0.218),
    new Point(0.312, 0),
    new Point(0.204, 0.378),
    new Point(0.5, 0.608),
    new Point(0.122, 0.618),
    new Point(0, 1),
    new Point(-0.12, 0.627),
    new Point(-0.5, 0.604),
    new Point(-0.198, 0.378),
  ];
  this.drawTime = 10;
  Shape.call(
    this,
    map(this.template, (el) => transformation.apply(el)),
    transformation.size,
    color,
    thickness,
    style,
    fade
  );
}
function SixPointStar(
  transformation,
  color = black,
  thickness = 1,
  style = "stroke"
) {}

function Transformation(a, b, c, d, e, f, color = black, fade = 0) {
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

  this.xscale = (a ** 2 + b ** 2) ** 0.5;
  this.yscale = (c ** 2 + d ** 2) ** 0.5;

  this.size = Math.max(this.xscale, this.yscale);

  //color attributes
  this.r = color.r;
  this.g = color.g;
  this.bl = color.b;
  this.fade = fade;
}
Transformation.prototype.apply = function (operand) {
  // Transformation application function. Accepts points, shapes, and other transformations.
  // Input MUST be point, shape, or transformation.

  clrScale = (operand.fade * this.fade) ** 2;

  if (operand instanceof Point) {
    let x = operand.x;
    let y = operand.y;

    return new Point(
      this.a * x + this.c * y + this.e,
      this.d * y + this.b * x + this.f
    );
  } else if (operand instanceof Transformation) {
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

    return new Transformation(a, b, c, d, e, f, clr, this.fade);
  } else if (operand instanceof Circle) {
    let r = operand.color.r + (this.r - operand.color.r) * clrScale;
    let g = operand.color.g + (this.g - operand.color.g) * clrScale;
    let b = operand.color.b + (this.bl - operand.color.b) * clrScale;

    let newPts = map(operand.points, (el) => this.apply(el));
    let newSize = operand.size * this.size;
    let newClr = new Color(r, g, b);

    let c = new Circle(id, newClr, operand.thickness, operand.style, operand.fade);
    c.points = newPts;
    c.size = newSize;

    return c;
  } else {
    let r = operand.color.r + (this.r - operand.color.r) * clrScale;
    let g = operand.color.g + (this.g - operand.color.g) * clrScale;
    let b = operand.color.b + (this.bl - operand.color.b) * clrScale;

    let newPts = map(operand.points, (el) => this.apply(el));
    let newSize = operand.size * this.size;
    let newClr = new Color(r, g, b);

    let newShp = new Shape(newPts, newSize, newClr, operand.thickness, operand.style, operand.fade);
    newShp.drawTime = operand.drawTime;
    return newShp;
  }
};

Transformation.generateTransformation1 = function (
  start,
  end,
  unit = 1,
  color = black,
  fade = 0
) {
  //relative rotation
  var vec = {
    x: end.x - start.x,
    y: end.y - start.y,
  };
  var h = (vec.x ** 2 + vec.y ** 2) ** 0.5; //hypotenuse

  var theta_1 = Math.atan2(start.y, start.x);
  var theta_2 = Math.atan2(vec.y, vec.x);

  var dt = theta_2 - theta_1;
  let adj = cos(dt);
  let opp = sin(dt);

  let scale = Math.min(h / unit, meta.maxScale);

  var a = scale * adj;
  var b = scale * opp;
  var c = -scale * opp;
  var d = scale * adj;
  var e = start.x;
  var f = start.y;

  return new Transformation(a, b, c, d, e, f, color, fade);
};

Transformation.generateTransformation2 = function (
  angle,
  size,
  dx,
  dy,
  unit = 1,
  color = black,
  fade = 0
) {
  // simple method to generate a transformation.
  let opp = sin(angle) * size;
  let adj = cos(angle) * size;

  return new Transformation(adj, opp, -opp, adj, dx, dy, color, fade);
};

Transformation.generateTransformation3 = function (
  start,
  end,
  unit = 1,
  color = black,
  fade = 0,
  maxSize = meta.maxSize
) {
  //absolute rotation.
  let dx = end.x - start.x;
  let dy = end.y - start.y;

  let angle = Math.atan2(dy, dx) - Math.PI / 2;
  let h = Math.min((dx ** 2 + dy ** 2) ** 0.5, maxSize);

  var a = h * cos(angle);
  var b = h * sin(angle);
  var c = -h * sin(angle);
  var d = h * cos(angle);
  var e = start.x;
  var f = start.y;

  return new Transformation(a, b, c, d, e, f, color, fade);
};

// a few transformations that are useful
let id = new Transformation(1, 0, 0, 1, 0, 0);
// ++++++++++++++++++++++++++++++ Auxilliary helper functions ++++++++++++++++++++++++++++++++++++++++++++++
function clear(ctx) {
  // clears the given context
  let c = ctx.canvas;
  let width = c.width;
  let height = c.height;
  // NOTE in general, I would need to find the inverse of this transformation,
  // Apply it to (0,0, width, height)
  // then call clearRect on that transformed value.
  // but since I know what kind of transformation storedTransform is, I can shortcut it, without having to calculate the inverse.
  ctx.clearRect(-width / 2 - 71, -height / 2, width, height);
}

function createCanvas() {
  // creates a new canvas. Returns a reference to that canvas's context.
  let newCanvas = document.createElement("canvas");
  newCanvas.width = width;
  newCanvas.height = height;
  document.querySelector("#canvasHolder").appendChild(newCanvas);

  let ctx = newCanvas.getContext("2d");

  return ctx;
}
function zeroFill(number, width) {
  let s = number.toString();

  while (s.length < width) {
    s = "0" + s;
  }
  return s;
}
function filter(arr, fn) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i])) {
      result.push(arr[i]);
    }
  }
  return result;
}

function map(arr, fn) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    result[i] = fn(arr[i]);
  }
  return result;
}

function radius(arr) {
  m = 0;
  let distance = (p1, p2) =>
    Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

  for (var i = 0; i < arr.length; i++) {
    for (var j = i; j < arr.length; j++) {
      m = Math.max(m, distance(arr[i], arr[j]));
    }
  }
  return m;
}

function ceiling(n) {
  return -Math.floor(-n);
}

function cache(f) {
  var dict = {};
  function helper() {
    let s = JSON.stringify(arguments);
    if (dict[s] === undefined) {
      let r = f.apply(null, arguments);
      dict[s] = r;
      return r;
    } else {
      return dict[s];
    }
  }
  return helper;
}

function hexToDecimal(n) {
  // takes a hex string and returns a decimal number;
  let map = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15,
  };
  let result = 0;
  let power = 0;
  while (n.length !== 0) {
    result += 16 ** power * map[n[n.length - 1]];
    power += 1;
    n = n.slice(0, n.length - 1);
  }
  return result;
}

function decimalToHex(n) {
  let map = {
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "A",
    11: "B",
    12: "C",
    13: "D",
    14: "E",
    15: "F",
  };

  let result = "";
  while (n !== 0) {
    result = map[n % 16] + result;
    n = Math.floor(n / 16);
  }
  return result;
}
function max(arr, f = (x) => x) {
  if (arr.length == 0) {
    return [0, -1];
  }

  let m = f(arr[0]);
  let idx = 0;
  for (let i = 1; i < arr.length; i++) {
    if (f(arr[i]) > m) {
      m = f(arr[i]);
      idx = i;
    }
  }
  return [m, idx];
}
function average(arr, f = (x) => x) {
  if (arr.length == 0) {
    return 0;
  }

  let cum = 0;
  for (let i = 0; i < arr.length; i++) {
    cum += f(arr[i]);
  }

  return cum / arr.length;
}

// node counting
function knapsack(A, r) {
  var sum = 1;
  if (r <= 0) {
    return 0;
  }
  for (var i = 0; i < A.length; i++) {
    sum += knapsack(A, r - A[i]);
  }

  return sum;
}
knapsack = cache(knapsack);

function countNodes(branches, objects, renderThreshold) {
  // returns the number of nodes in a tree comprised of branches of radius radii, of max root size maxSize, and of render size limit renderThreshold.
  // assumptions:
  //	 0 < radii[i] <= 0.9 all i
  //   renderThreshold > 0;

  //base case
  if (branches.length === 0) {
    if (maxSize === 0) {
      return 0;
    } else {
      return 1;
    }
  }

  // for counting depth, the most relevant is the max sized object.
  maxSize = max(objects, (x) => x.size);

  // Calculating
  let ratio = renderThreshold / maxSize;
  let depths = [];
  let maxDepth = 0;
  for (var i = 0; i < branches.length; i++) {
    let d = Math.min(
      100,
      Math.round(Math.log(ratio) / Math.log(branches[i].transformation.size))
    );
    depths.push(d);
    maxDepth = Math.max(maxDepth, d);
  }

  for (var i = 0; i < branches.length; i++) {
    depths[i] = Math.floor(maxDepth / depths[i]);
  }

  let nodes = knapsack(depths, maxDepth);

  return nodes;
}

function calculateDrawTime() {
  // *ROUGH* calculation on how long it'll take to draw the fractal.

  // time = time per frame * number of frames
  //      = (1/fps) * (number of operations / 5000)
  let time =
    (1 / 60) *
    (fractal.objects.length *
      countNodes(fractal.branches, fractal.objects, meta.renderThreshold));

  //output
  return time;
}

function save() {
  // 'to blob' paramater function. Specified what's to be done with the blob once it is created.
  function saveContext(blob) {
    // create a url of the blob
    var blobURL = URL.createObjectURL(blob);
    // open it in a new tab
    window.open(blobURL);
  }
  // stop drawing while this takes place
  renderInterrupt = true;
  // create a new canvas
  const destCtx = createCanvas();
  // fill in the background for the new canvas
  destCtx.fillStyle = meta.backgroundColor.toString();
  destCtx.fillRect(0, 0, width, height);
  // copy all other canvases onto this new canvas
  for (let i = 0; i < fractal.objects.length; i++) {
    srcImage = fractal.contexts[i].canvas;
    destCtx.drawImage(srcImage, 0, 0);
  }
  // save the canvas
  destCtx.canvas.toBlob(saveContext, (type = "image/png"));
  // delete the canvas
  destCtx.canvas.remove();
  // start drawing again
  renderInterrupt = false;
  // return
  return;
}
