/*
    TODO
    Roadmap to full release:
        :DEV
            - Test
                - mobile custom color
                - mobile filing options
                - mobile performance

            -test results
                - menu selection breaks when moving from objects to branches
        :PREP
            -sitemap
            -structured data
            DISTRIBUTION
            - look into dist package on npm
            - post to bluehost
            - make advertisement video
        :RELEASE
            MARKET
            - post to facebook
            - post to reddit
                - post to 
            - post to twitter
            - imgur
            - tumblr
            - youtube (video?)
            - pinterest
            - instagram
            - tumblr
            - flickr
            - Digg

        
    - make testing suite
        - test on Chrome/Edge/firefox/opera (safari?);
        - test on different computers.
            - firefox menu boxes *increase* in size, causing misplacement
        - *new* button still doesn't work
    -test on mobile devices
        -scrolling issues
        -highlighting issues
    -SEO
    -include structured data
    -do sitemap 
    -add google adsense
    -read up on marketing (google search)
    -market product (reddit, facebook, twitter)
    -depth first to a depth of 4-5 ? Makes it easier to draw.

    MOBILE ISSUES
    -custom color doesn't work on mobile
    -scrolling / input on menu should be seperate.
    -    
    EXPANSION
    - grab / zoom tools.
    - snap to angle
    - tool for more general transformation (particularly reflections, (non linear?))
    KNOWN BUGS  
    - lags when adding too many normal objects. Maybe try adding canvases as batches
    - when outside elements are highlighted, user input is wonky 
        - unfixable with current knowledge (how do I know when elements are highlighted?)
    - when a branch element is the first to be added, fade is not applied to it 
        X Couldn't replicate

    ANALYSIS
    had my mom take the program through a test drive. I got a lot of good information out of it, I'll relate the most relevant information here:
        - For the first minute, she had no idea what to do or what the program does. [Start with fractal displayed to motivate learning?]
        - Wanted curves in addition to straight lines
        - gasp once branches had been used (yay!)
        - confusion at real time draw limiting. [It might be necessary to change draw ordering? I want it to be a 'first on top' sort of thing, which it isn't for the fractals.]
        - disatisfied with color limits [controlling fractal color approach after creation?]
        - non replicatable [advanced menu with greater control?]
        - thinks fill means autofill
        - wants autofill
        - Wants more images than what is provided (wants to put name in). 
        - More clear icons for 'save' and 'new'. 
        - save prompt box when clicking 'new' image.
        - Wants oblong shapes
        - started mindlessly drawing after 15 minutes (I can only grab people's attention for 15 minutes max)
        - defaults to spirals. I should make translations / scales easier to do (snap to?);
        
        She seemed to think it was really cool, but it didn't really GRAB her attention.
        It will be a good sign if she wants to look at it again without my prompting.

        Proposed changes, sorted by difficulty:
        X - done
        O - not doing
        L - later versions (perhaps paid version)
        easy:
            X cool fractal at program start (motivation)
            L curves / oblongs
            L tweaking color limiting
                O 'clear' color (perserves color)
                X colo fade slider on menu bar
            X changing 'fill' to 'solid'
            O labelling new / save icons
            X alert to save when clicking 'new'
            L snapping to specific angles.
            - on top layer
        hard:
            - 'first on top' wrt new branches (urg)
            - allowing multiple fractals
            - allowing images / text, in addition to basic shapes / colors.
            - advanced menu for repeatability, greater control
        irrelevant? 
            - screen translation / zoom / rotation (non linear transformations too?)
            - moving objects wrt time

    Had josh use the program
        -change the draw order so that new input is added immediately. He assumed there was lag, which is not what I want.
        -He didn't immediately realize how to clear the initial fractal
            -update 'new' button to totally undo, instead of refresh?
            - 
*/
let isMobile = window.matchMedia("only screen and (max-width: 916px)").matches; // I can't figure out how to deduce performance, so I'm just estimating based on screen size.
// Container function for initializing interactive buttons in the web page.
function initializeMenu() {
  var styleMap = {
    line: Line,
    circle: Circle,
    triangle: Triangle,
    rectangle: Rectangle,
    hexagon: Hexagon,
    octagon: Octagon,
    fourstar: FourStar,
    fivestar: FiveStar,
    branch: Branch,
    grab: "grab",
  };
  var numberMap = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  var last = {
    target: document.querySelector('#branch'),
    class: "branchContainer",
  };
  var thicknessInputMenu_isOpen = false;
  let menu = document.querySelector("#menu");
  let body = document.querySelector('body');
  let thicknessInputMenu = document.querySelector("#thicknessInputMenu"); //

  //create event handler
  function handler(e) {
    // find target of hit
    let target = e.target;
    // if thicknessSelectBoolean is true, then the thicknessOptionPanel is open, and needs to be closed.
    if (thicknessInputMenu_isOpen) {
      document.querySelector("#thicknessInputMenu").style.display = "none";
      document
        .querySelector("#thicknessDisplay")
        .setAttribute("class", "thicknessContainer");
      thicknessInputMenu_isOpen = false;
    }
    // control flow based on target
    let identifier = target.getAttribute("class");

    if (identifier === "menuImage") {
      target = target.parentNode;

      // special cases:
      if (target.id === "undo") {
        actionObject.ctrl.z();
        return;
      } else if (target.id === "redo") {
        actionObject.ctrl.y();
        return;
      } else if (target.id === "center") {
        resetCoordinates();
        return;
      } else if (target.id === "thicknessDisplay") {
        document
          .querySelector("#thicknessDisplay")
          .setAttribute("class", "thicknessContainer selected");

        // display thicknessInputMenu
        let thicknessInputMenu = document.querySelector("#thicknessInputMenu");
        thicknessInputMenu.style.display = "block";

        //set thicknessSelectBoolean to true
        thicknessInputMenu_isOpen = true;

        return;
      } else if (target.getAttribute("class") === "thicknessOption") {
        //set thickness
        meta.thickness = numberMap[target.id];
        return;
      } else if (target.id === "stroke") {
        meta.fillStyle = "stroke";

        document
          .querySelector("#stroke")
          .setAttribute("class", "menuItem selected");
        document.querySelector("#fill").setAttribute("class", "menuItem");
      } else if (target.id === "fill") {
        meta.fillStyle = "fill";

        document.querySelector("#stroke").setAttribute("class", "menuItem");
        document
          .querySelector("#fill")
          .setAttribute("class", "menuItem selected");
      } else if (target.id === "save") {
        save();
      } else if (target.id === "new") {
        //confirm
        let b = confirm("Do you want to save changes to this image?");
        if (b) {
          save();
        }
        setTimeout(() => window.location.replace(window.location.href), 1000);

      } else {
        // general cases:
        meta.style = styleMap[target.id];

        // add the selected target to the 'selected' class
        let c = target.getAttribute("class");
        target.setAttribute("class", c + " selected");

        //clear the last target
        if (last.target === undefined) {
          last.target = target;
          last.class = c;
        } else {
          last.target.setAttribute("class", last.class);
          if (last.target === target) {
            last.target = undefined;
            last.class = undefined;
            meta.style = Line;
          } else {
            last.target = target;
            last.class = c;
          }
        }
      }
    } else if (identifier === "colorBoxInterior") {
      let p = target.parentNode;

      // background color:
      if (p.id === "backgroundColor") {
        // change meta.drawStyle
        meta.colorStyle = "backgroundColor";

        //stop highlighting drawColor box
        document
          .querySelector("#drawColorContainer")
          .setAttribute("class", "colorStyle");

        //start highlighting backgroundColor
        document
          .querySelector("#backgroundColorContainer")
          .setAttribute("class", "colorStyle selected");
      } else if (p.id === "drawColor") {
        //change meta.drawStyle
        meta.colorStyle = "drawColor";

        //stop highlighting backgroundColor box;
        document
          .querySelector("#backgroundColorContainer")
          .setAttribute("class", "colorStyle");

        //start highlighting drawColor box
        document
          .querySelector("#drawColorContainer")
          .setAttribute("class", "colorStyle selected");
      } else {
        let color = p.id;

        // change the background of 'Chosen color'
        document.querySelector(
          `#${meta.colorStyle} .colorBoxInterior`
        ).style.backgroundColor = color;

        // change meta color information.
        if (meta.colorStyle === "backgroundColor") {
          meta.backgroundColor = colorMap[color];
          // change main background color.
          document.querySelector("main").style.backgroundColor = color;
        } else if (meta.colorStyle === "drawColor") {
          meta.drawColor = colorMap[color];
        }
      }
    } else {
      return;
    }
  }

  //attatch handler to menu.
  menu.addEventListener("click", handler);
  thicknessInputMenu.addEventListener("click", handler);

  // send touch events to document
  // touchstart = mousedown
  // touchmove  = mousemove
  // touchend   = mouseup
  // touchstart + low movement + touchend = click
  touchStart = {
      x: 0,
      y: 0
  }
  body.addEventListener('touchstart', e => {
      
      if (e.target == canvas){e.preventDefault();}
      let touch = e.changedTouches[0];

      touchStart.x = touch.clientX;
      touchStart.y = touch.clientY;

      let newEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        bubbles: true
      }) 
      touch.target.dispatchEvent(newEvent);
  }, {passive: false});
  body.addEventListener('touchmove', e =>{
    if (e.target == canvas){e.preventDefault();}
    let touch = e.changedTouches[0];

    let newEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      bubbles: true
    })
    touch.target.dispatchEvent(newEvent);    
  },{passive: false})
  body.addEventListener('touchend', e =>{
    if (e.target == canvas){e.preventDefault();}
    let touch = e.changedTouches[0];

    let newEvent = new MouseEvent('mouseup', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      bubbles: true
    })
    touch.target.dispatchEvent(newEvent);
    
    /*
    if (((touchStart.x - touch.clientX) ** 2 + (touchStart.y - touch.clientY) **2) ** (0.5) < 4){
        // click event has occured.
        newEvent = new MouseEvent('click', {
            clientX: touch.clientX,
            clientY: mouse.clientY,
            button: 0,
            bubbles: true
        })
        touch.target.dispatchEvent(newEvent)
    }*/
  },{passive: false})  

  // color form handler
  function setColor(e) {
    let color = e.target.value;
    if (meta.colorStyle === "backgroundColor") {
      meta.backgroundColor = new Color(
        color.slice(1, 3),
        color.slice(3, 5),
        color.slice(5, 7),
        (hex = true)
      );
      document.querySelector("main").style.backgroundColor = color;
    } else if (meta.colorStyle === "drawColor") {
      meta.drawColor = new Color(
        color.slice(1, 3),
        color.slice(3, 5),
        color.slice(5, 7),
        (hex = true)
      );
    }
    document.querySelector(
      `#${meta.colorStyle} .colorBoxInterior`
    ).style.backgroundColor = color;
  }
  let customColor = document.querySelector("#customColor");
  customColor.addEventListener("input", setColor);

  //fade value handler
  function setFade(e) {
      meta.fadeVal = e.target.value / 100;
  }
  let fadeRange = document.querySelector('#fading');
  fadeRange.addEventListener("input", setFade);

  //turbo mode handler
  function turboMode(e) {
      if (e.target.checked){
          meta.maxScale = 0.95;
      } else {
          meta.maxScale = metaCopy.maxScale;
      }
  }
  document.querySelector('#turbo-mode').addEventListener('change', turboMode);

  //canvas cursor handler.
  const canvas = document.querySelector("canvas");
  canvas.addEventListener("mouseenter", function () {
    if (meta.style === "grab") {
      document.querySelector("main").style.cursor = "grabbing";
    } else {
      document.querySelector("main").style.cursor = "crosshair";
    }
  });
  canvas.addEventListener("mouseleave", function () {
    document.querySelector("main").style.cursor = "auto";
  });
}
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw "";
}

var width = (canvas.width = window.innerWidth);
var height = (canvas.height = window.innerHeight - 36);
if (isMobile){
    //reduce processor burden
    meta.operationLimit = 1000;
}

ctx.setTransform(1, 0, 0, -1, width/2 + 71, height/2);

function resetCoordinates() {
  // reset base canvas.
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight - 36;
  ctx.setTransform(1, 0, 0, -1, width / 2 + 71, height / 2);

  boundaries.updateBoundaries();

  //resize and clear all canvases.
  for (let i = 0; i < fractal.contexts.length; i++) {
    c = fractal.contexts[i];
    can = c.canvas;
    //set width,height
    can.width = width;
    can.height = height;
    //set transform
    c.setTransform(1, 0, 0, -1, width / 2 + 71, height / 2);
    //clear
    clear(c);
  }

  //reset fractal
  fractal.resetState();
}
// updates dimensions of canvas on window resize.
window.addEventListener("resize", resetCoordinates);

// Real-time state variables
let x = 0;
let y = 0;
let mousedown = false;
let mouse = {
  x: 0,
  y: 0,
};
let renderInterrupt = false;

let boundaries = {
  //used when determining if a drawn object is out of frame
  top: height / 2,
  right: width / 2,
  bottom: -height / 2,
  left: -width / 2,
  updateBoundaries: function () {
    boundaries.top = height / 2;
    boundaries.right = width - width / 2;
    boundaries.bottom = -(height - height / 2);
    boundaries.left = -width / 2;
  },
};

function pushFractal(start, end, style, drawColor, thickness, fillStyle, fadeVal) {
  // convenience function. Basically the same as fractal.push, but also populates the actions.undoList

  //push object onto fractal
  fractal.push(start, end, style, drawColor, thickness, fillStyle, fadeVal);

  // update action list.
  function undo() {
    fractal.pop(style);
    function unundo() {
      fractal.push(start, end, style, drawColor, thickness, fillStyle, fadeVal);
      return undo;
    }
    return unundo;
  }
  actions.undoList.push(undo);

  // reset unundo list, since a new object has been added.
  actions.unundoList = [];
}
function mouseupHandler(e) {
  if (mousedown === false) {
    return;
  }
  // remove the 'moving' object from the fractal
  fractal.pop(meta.style);

  // create local copies of relevant variables (undo/redo actions rely on a functional programming paradigm, so I need copies saved to local function state.)
  let start = new Point(x, y);
  let end = new Point(mouse.x, mouse.y);

  // add to the fractal
  pushFractal(
    start,
    end,
    meta.style,
    meta.drawColor,
    meta.thickness,
    meta.fillStyle,
    meta.fadeVal
  );

  // update state
  mousedown = false;

  //remove branch indicators
  if (meta.style == Branch){
      objectRenderArray.pop();
      objectRenderArray.pop();
  }
}
function mousedownHandler(e) {
  if (e.button === 0) {
    // update program state
    recentlySaved = false;
    let start = windowToCanvas(e);
    x = start.x;
    y = start.y;
    mouse.x = x;
    mouse.y = y;
    mousedown = true;

    // add to fractal.
    fractal.push(start, start, meta.style, meta.drawColor, meta.thickness, meta.fillStyle, meta.fadeVal);

    // add scale/rotation indicators to base canvas
    if (meta.style == Branch){
        // add circle to canvas
        let c = new Circle(new Transformation(meta.unit*2*meta.maxScale, 0, 0, meta.unit*2*meta.maxScale, start.x, start.y - meta.maxScale * meta.unit), colorMap.orange, 1);
        objectRenderArray.push(c);

        // add new line to canvas
        objectRenderArray.push(new Line(Transformation.generateTransformation3(start, start)));
    }
  }
}

function updateMouseCoords(e) {
  let pt = windowToCanvas(e);
  mouse.x = pt.x;
  mouse.y = pt.y;
}
// handlers for touch screens - Basically just passes onto the mouse handles, since they already do all the work.

canvas.addEventListener("mousedown", mousedownHandler);
document.querySelector('body').addEventListener("mouseup", mouseupHandler);
document.querySelector('body').addEventListener("mousemove", updateMouseCoords);

// Coordinate transformation from current window to wider system
function windowToCanvas(e) {
  // inverse of canvas to window.
  return new Point(
    e.clientX - width / 2 - 71,
    -(e.clientY - height / 2)
  );
}

// keyboard handlers
function keydownHandler(e) {
  if (e.ctrlKey) {
    if (actionObject.ctrl[e.key] !== undefined) {
      actionObject.ctrl[e.key]();
    }
  } else {
    if (actionObject.noctrl[e.key] !== undefined) {
      actionObject.noctrl[e.key]();
    }
  }
}
window.addEventListener("keydown", keydownHandler);

//Draw a nice initial fractal.
pushFractal(
    new Point(0,0),
    new Point(0,100),
    Line,
    meta.drawColor,
    2,
    meta.fillStyle,
    meta.fadeVal
)
meta.style = Branch
meta.drawColor = colorMap.lawngreen;

//Object renderer
objectRenderArray.push(fractal);
objectRenderArray.push(
  new Circle(new Transformation(10, 0, 0, 10, 0, -5), "rgb(255,127,39)")
);

function render(timestamp) {
  if (!renderInterrupt) {
    //update state variables
    if (mousedown) {
      // remove the last fractal element
      fractal.pop(meta.style);

      // add a new element
      let start = new Point(x, y);
      let end = new Point(mouse.x, mouse.y);
      fractal.push(
        start,
        end,
        meta.style,
        meta.drawColor,
        meta.thickness,
        meta.fillStyle,
        meta.fadeVal
      );

      if (meta.style == Branch){
          objectRenderArray.pop();
          objectRenderArray.push(new Line(Transformation.generateTransformation3(start, end, meta.unit, colorMap.black, 0, meta.unit*meta.maxScale), colorMap.orange));
      }
    }

    //clear
    clear(ctx);

    //draw
    objectRenderArray.forEach((obj) => obj.draw(ctx));
  }
  //loop
  window.requestAnimationFrame(render);
}

// Final initialization.
initializeMenu();

if (startRender) {
  render();
}
if (test) {
  console.log(`Total time: ${fractalDrawBenchmark()}`);
}
