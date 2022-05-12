"use strict";
exports.__esModule = true;
/*    Copyright (C) 2022 Dramorak

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

*/ /*

    I need to have a serious think about acceleration and collission. In my mind, the program should be able to support, say, about
    1000 physicalObjects moving simultaneously. If my previous project is any indication, the program can only handle about 5000 (transform, draw)
    operations in any given frame, putting the max number of physicalObjects at about 65 or so.
    
    It would be best if I could find an algorithm / approximation that would allow me to do acceleration/collision in n*log(n), or even
    linear time. Alternatively (or perhaps coinciding) I can do a deferred calculation
    -no you can't. It worked for the fractals because the GameState of the program is *mostly* constant, except for when the user inputs
    information. For a sequentially updated game, I need to update and draw the whole universe every frame ;_;
    -Maybe deffered calculation won't work, but perhaps prioritized computation will. updating nearby physicalObjects perfectly, and treating
    the rest using linear time approximiations?
    Go from T = n**2 to T = (n/10)**2 + n*0.9 ~ 1/100 the time (depending on n)
             
            
    TODO
        -understand throwing (why that constant?)
        -detonation depends on kinetic energy as well as mass ?
        -moving screen around ?
        -increase holding mass the longer mousedown is in effect?
        The program is interesting, but it's not really a game yet. What goal can I inspire? What challenges can I place in the user's way?
*/
// physical constants
var dt = 1 / 180; //In game time between updates
var G = 5000000; //Gravitational constant
var pi = Math.PI; // PI
var mass_threshold = 30; // mass required for explosion to hddddappen
var detonationEnergy = 1000; // (roughly) how quickly physicalObjects move away from a detonation event.
var density = 0.003;
var explosionRadius = 50; //Math.sqrt(Math.min((mass_threshold + 1), 10)/(Math.PI * density))
var detonationAmount = mass_threshold;
var Vector = /** @class */ (function () {
    function Vector(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.x = x;
        this.y = y;
        this.magnitude = Math.pow((Math.pow(x, 2) + Math.pow(y, 2)), (1 / 2));
    }
    Vector.prototype.dotProduct = function (vec2) {
        return this.x * vec2.x + this.y * vec2.y;
    };
    Vector.prototype.mul = function (constant) {
        return new Vector(this.x * constant, this.y * constant);
    };
    Vector.prototype.add = function (vec2) {
        return new Vector(this.x + vec2.x, this.y + vec2.y);
    };
    Vector.prototype.sub = function (vec2) {
        return new Vector(vec2.x - this.x, vec2.y - this.y);
    };
    Vector.prototype.equals = function (vec2) {
        return fuzzy_equals(this.x, vec2.x) && fuzzy_equals(this.y, vec2.y);
    };
    Vector.prototype.random = function (a, b) {
        //creates a random vector with length in [a,b].
        var l = Math.random() * (b - a) + a;
        var theta = Math.random() * 2 * Math.PI;
        var x = l * Math.cos(theta);
        var y = l * Math.sin(theta);
        return new Vector(x, y);
    };
    return Vector;
}());
// some useful constants
var zeroVector = new Vector(0, 0);
var Entity = /** @class */ (function () {
    function Entity(mass, acceleration, velocity, position) {
        if (mass === void 0) { mass = 0; }
        if (acceleration === void 0) { acceleration = zeroVector; }
        if (velocity === void 0) { velocity = zeroVector; }
        if (position === void 0) { position = zeroVector; }
        this.mass = mass;
        this.radius = Math.sqrt(mass / (density * Math.PI));
        this.acceleration = acceleration;
        this.velocity = velocity;
        this.position = position;
    }
    Entity.prototype.displayState = function () {
        // writes object state to log
        console.log("\tMass:".concat(this.mass, "\n\tAcc:").concat(JSON.stringify(this.acceleration), "\n\tVel:").concat(JSON.stringify(this.velocity), "\n\tPos:").concat(JSON.stringify(this.position)));
    };
    Entity.prototype.gravityForce = function (entity) {
        //Gives the force vector of <Entity> on <this> 
        // <this> ---F---> <Entity> 
        var dr = this.position.sub(entity.position);
        if (Math.abs(dr.magnitude) < 0.0001) {
            return zeroVector;
        }
        return dr.mul(G * entity.mass * this.mass / Math.pow(dr.magnitude, 3));
    };
    Entity.prototype.collide = function (entity) {
        //returns true if <this> has collided with <Entity>
        var dr = this.position.sub(entity.position);
        var distance = dr.magnitude;
        return dr.magnitude <= this.radius + entity.radius;
    };
    return Entity;
}());
var GameState = /** @class */ (function () {
    function GameState() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // The 'GameState' is all relevant information about the GameState of the game. By convention, the game GameState always has at least one object,
        // implicitly defined, a 'User'.
        this.time = 0;
        this.user = { mousedown: false, onmouseup: false, mouse: zeroVector, positionHistory: [] };
        this.physicalObjects = [new Entity()];
        this.nonphysicalObjects = [];
        this.eventQueue = [];
        // populate physicalObjects list with constructor arguments
        for (var i = 0; i < args.length; i++) {
            this.physicalObjects.push(args[i]);
        }
    }
    GameState.prototype.displayState = function () {
        console.log("[t = ".concat(this.time, "] - ").concat(this.physicalObjects.length - 1, " entities"));
        for (var i = 1; i < this.physicalObjects.length; i++) {
            console.log("State of object ".concat(i, ":"));
            this.physicalObjects[i].displayState();
        }
        console.log();
    };
    GameState.prototype.update = function () {
        // In keeping with the view that a 'game' is a sequence of game GameStates, the 'GameState' comes equipped with an update function.
        // effect of user input:
        if (this.user.onmouseup) {
            // if the mouseup event has *just* happened.
            // move object from nonphysical to physical
            //remove from nonphysical list
            var e = this.nonphysicalObjects.pop();
            // calculate position, 
            var vec1 = this.user.positionHistory[0];
            var vec2 = this.user.mouse;
            var pos = vec2;
            var vel = vec1.sub(vec2).mul(this.user.positionHistory.length * (1 / 60) / dt);
            this.physicalObjects.push(new Entity(e.mass, zeroVector, vel, pos));
            this.user.positionHistory = [];
        }
        if (this.user.mousedown) {
            if (this.nonphysicalObjects.length == 0) {
                this.nonphysicalObjects.push(new Entity(1, zeroVector, zeroVector, this.user.mouse));
            }
            else {
                var e = this.nonphysicalObjects.pop();
                this.nonphysicalObjects.push(new Entity(e.mass + 4 / 60, zeroVector, zeroVector, this.user.mouse));
            }
            if (this.user.positionHistory.length < 6) {
                this.user.positionHistory.push(this.user.mouse);
            }
            else {
                this.user.positionHistory.splice(0, 1);
                this.user.positionHistory.push(this.user.mouse);
            }
        }
        // detonate large physicalObjects
        for (var i = 1; i < this.physicalObjects.length; i++) {
            var e = this.physicalObjects[i];
            if (e.mass > mass_threshold) {
                // delete from list
                this.physicalObjects.splice(i, 1);
                // generate 10 new physicalObjects with variable speeds
                var vec = void 0;
                for (var i_1 = 0; i_1 < e.mass - 1; i_1++) {
                    vec = zeroVector.random(1, 2);
                    this.physicalObjects.push(new Entity(1, zeroVector, e.velocity.add(vec.mul(detonationEnergy)), e.position.add(vec.mul(explosionRadius / vec.magnitude))));
                    // I'll leave this as is for now, but I really should be adding 'non physical' tags to physicalObjects.
                    // NOTE event queue for manual, but delayed, changes to GameState? Might be a good idea.
                }
            }
        }
        //determine accelerations and collisions
        // factor in collisions
        //collide with walls
        for (var i = 1; i < this.physicalObjects.length; i++) {
            var e = this.physicalObjects[i];
            if (e.position.x + e.radius > width) {
                e.velocity.x *= -1;
                e.position.x = width - e.radius - 1;
            }
            else if (e.position.x - e.radius < 0) {
                e.velocity.x *= -1;
                e.position.x = e.radius + 1;
            }
            if (e.position.y + e.radius > height) {
                e.velocity.y *= -1;
                e.position.y = height - e.radius - 1;
            }
            else if (e.position.y - e.radius < 0) {
                e.velocity.y *= -1;
                e.position.y = e.radius + 1;
            }
        }
        for (var i = 1; i < this.physicalObjects.length; i++) {
            for (var j = i + 1; j < this.physicalObjects.length; j++) {
                var e1 = this.physicalObjects[i];
                var e2 = this.physicalObjects[j];
                if (e1.collide(e2)) { // collision
                    if (e1.mass == 0 || e2.mass == 0) {
                        continue;
                    }
                    // add a new object to the list who's mass and momentum is the sum of the two component entities.
                    var new_mass = e1.mass + e2.mass;
                    var new_vel = (e1.velocity.mul(e1.mass).add(e2.velocity.mul(e2.mass))).mul(1 / (e1.mass + e2.mass));
                    var new_pos = (e1.position.mul(e1.mass).add(e2.position.mul(e2.mass))).mul(1 / (e1.mass + e2.mass));
                    var new_ent = new Entity(new_mass, zeroVector, new_vel, new_pos);
                    // delete e1, e2, and replace with the new object.
                    this.physicalObjects.splice(j, 1);
                    this.physicalObjects.splice(i, 1, new_ent);
                    //NOTE This is actually a really interesting case study.
                    //  Let's take the following situation. I have to iterate through a list. Everytime I encounter an element
                    //  that satisfies a certain property, I must replace it with a different element.
                    //  Where do I place the replacement element?
                    //  Obviously (or, perhaps, aesthetically), I place it in the slot as the old element.
                    //  It's more difficult, conceptually, to imagine placing it at the end.
                    // 
                    //  In this particular case, placing the object at the end creates 2 seperate cases for decrementing j.
                    //  but placing it in the i-slot reduces it to 1.
                    // update i,j to reflect that elements have been removed from the list.
                    i -= 1;
                    j -= 1;
                }
            }
        }
        // set accelerations to zero
        for (var i = 1; i < this.physicalObjects.length; i++) {
            this.physicalObjects[i].acceleration = zeroVector;
        }
        for (var i = 1; i < this.physicalObjects.length; i++) {
            for (var j = i + 1; j < this.physicalObjects.length; j++) {
                var e1 = this.physicalObjects[i];
                var e2 = this.physicalObjects[j];
                var force = e1.gravityForce(e2);
                e1.acceleration = e1.acceleration.add(force.mul(1 / e1.mass));
                e2.acceleration = e2.acceleration.add(force.mul(-1 / e2.mass));
            }
        }
        // determine velocities, positions, angles, etc.
        for (var i = 0; i < this.physicalObjects.length; i++) {
            var e1 = this.physicalObjects[i];
            // update velocity
            e1.velocity = e1.velocity.add(e1.acceleration.mul(dt));
            // update position
            e1.position = e1.position.add(e1.velocity.mul(dt));
        }
        //update time
        this.time += dt;
        //onmouseup is a 1 frame event
        this.user.onmouseup = false;
    };
    return GameState;
}());
var Canvas = /** @class */ (function () {
    function Canvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx.fillStyle = 'rgb(0,0,0)';
    }
    Canvas.prototype.clear = function () {
        this.ctx.clearRect(0, 0, this.width, this.height);
    };
    Canvas.prototype.circle = function (pos, radius) {
        //draws a circle on the canvas
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();
    };
    return Canvas;
}());
var Game = /** @class */ (function () {
    function Game(canvas, state) {
        if (state === void 0) { state = new GameState(); }
        var _this = this;
        this.state = state;
        this.canvas = new Canvas(canvas);
        // initializes state variables
        // add event listeners to canvas.
        var can = this.canvas.canvas;
        can.addEventListener('mousemove', function (e) {
            _this.state.user.mouse = new Vector(e.offsetX, e.offsetY);
        });
        can.addEventListener('mousedown', function (e) {
            _this.state.user.mousedown = true;
        });
        can.addEventListener('mouseup', function (e) {
            _this.state.user.mousedown = false;
            _this.state.user.onmouseup = true;
        });
    }
    Game.prototype.draw = function () {
        var e;
        //draw physical objects
        for (var i = 1; i < this.state.physicalObjects.length; i++) {
            e = this.state.physicalObjects[i];
            this.canvas.circle(e.position, e.radius);
        }
        //draw unphysical objects
        for (var i = 0; i < this.state.nonphysicalObjects.length; i++) {
            e = this.state.nonphysicalObjects[i];
            this.canvas.circle(e.position, e.radius);
        }
    };
    Game.prototype.update = function () {
        //update gamestate
        this.state.update();
    };
    Game.prototype.clear = function () {
        this.canvas.clear();
    };
    Game.prototype.run = function () {
        //save local copy of game
        var g = this;
        function render(timestamp) {
            //clear
            g.clear();
            //draw
            g.draw();
            //update
            g.update();
            //pass to browser
            window.requestAnimationFrame(render);
        }
        //Start drawing
        window.requestAnimationFrame(render);
    };
    return Game;
}());
// auxiliary
function fuzzy_equals(x, y) {
    // god damn floating point precision
    return Math.abs(x - y) < 0.000001;
}
// testing
function unitTests() {
    function assert(actual, expected, msg) {
        var equals = function (x, y) { return x == y; };
        if (typeof actual != typeof expected) {
            throw "[TYPE ERROR]: ".concat(msg);
        }
        if (actual instanceof Vector) {
            equals = function (x, y) { return x.equals(y); };
        }
        else if (typeof actual == 'number') {
            equals = fuzzy_equals;
        }
        if (!equals(actual, expected)) {
            throw "[TEST FAILED]: ".concat(msg, ".\nActual:").concat(JSON.stringify(actual), "\nExpected:").concat(JSON.stringify(expected));
        }
    }
    // Vector physicalObjects
    var vec1 = new Vector(0, 0); //zero vector
    var vec2 = new Vector(1, 0); //only x
    var vec3 = new Vector(0, 1); //only y
    var vec4 = new Vector(1, 1); //both x and y
    var vec5 = new Vector(-1, 1); //negative in x dimension, positive in y.
    // Entity physicalObjects
    var ent1 = new Entity(); //no mass, no movement, no displacement
    var ent2 = new Entity(1); //mass, no movement, no displacement
    var ent3 = new Entity(1, zeroVector, zeroVector, new Vector(1, 0)); // mass, no movement, located 1 unit right
    var ent3b = new Entity(1, zeroVector, zeroVector, new Vector(1 / Math.sqrt(2), 1 / Math.sqrt(2))); // mass, no movement, located 1/root(2) up and to the right
    var ent3c = new Entity(1, zeroVector, zeroVector, new Vector(-1, -1)); // mass, no movement, located down and to the left
    // to collide.
    var ent4 = new Entity(1, zeroVector, new Vector(1, 1), zeroVector); //mass, moving up and to the right, 0 displacement
    var ent5 = new Entity(1, zeroVector, new Vector(-1, -1), new Vector(1, 1)); // mass, moving down and to theleft, 1,1 displacement
    // never collides
    var ent6 = new Entity(1, zeroVector, new Vector(0, 1), new Vector(1, 0));
    var ent7 = new Entity(1, zeroVector, new Vector(0, -1), new Vector(-1, 0));
    //explodes
    var ent8 = new Entity(mass_threshold + 1);
    var ent9 = new Entity(0, zeroVector, new Vector(1, 1), zeroVector);
    // single object games
    var game1 = new GameState(new Entity(1, zeroVector, new Vector(1, 1), zeroVector)); // standard mass/size, moving up and to the right
    var game2 = new GameState(new Entity(0, zeroVector, zeroVector, zeroVector)); // no mass no size, not moving, not accelerating
    var game3 = new GameState(new Entity(10, zeroVector, new Vector(1, 1), zeroVector)); // just under mass threshold
    var game4 = new GameState(new Entity(11, zeroVector, new Vector(1, 1), zeroVector)); // just at mass threshold
    //multiple object games
    var mo_game1 = new GameState(new Entity(1, zeroVector, zeroVector, new Vector(-1, 0)), new Entity(1, zeroVector, zeroVector, new Vector(1, 0))); // normal 
    var mo_game2 = new GameState(new Entity(1, zeroVector, new Vector(1, 1), new Vector(-1, -1)), new Entity(1, zeroVector, new Vector(-1, -1), new Vector(1, 1))); // 2 entities start separate
    // unit tests
    function vectorTests() {
        // dot product
        assert(vec1.dotProduct(vec2), 0, 'dot product with zero vector');
        assert(vec2.dotProduct(vec2), 1, 'dot product with nonzero vector');
        assert(vec5.dotProduct(vec2), -1, 'dot product with negative components');
        assert(vec3.dotProduct(vec3), vec3.magnitude, 'dot product with self is equal to size');
        // addition tests
        assert(vec1.add(vec2), vec2, 'addition with zero-vector');
        assert(vec2.add(vec2), new Vector(2, 0), 'addition with same vector');
        assert(vec2.add(vec5), new Vector(0, 1), 'addition with 2 different vectors');
        //multiply tests
        assert(vec1.mul(5), zeroVector, 'scalar multiplication with zero vector');
        assert(vec2.mul(0), zeroVector, 'scalar multiplication with 0');
        assert(vec4.mul(-1), new Vector(-1, -1), 'scalar multiplication with negative scalar');
        assert(vec5.mul(-1), new Vector(1, -1), 'scalar multiplication with negative values');
        // subtract tests
        assert(vec1.sub(vec2), vec2, 'subtraction with 0 vector');
        assert(vec1.sub(vec4), vec4, 'subtraction with zero vector (test 2)');
        assert(vec2.sub(vec4), vec3, 'subtraction with 2 nonzero vectors');
    }
    function entityTests() {
        // gravity force
        assert(ent1.gravityForce(ent2), zeroVector, 'gravity force with 0 mass object');
        assert(ent2.gravityForce(ent2), zeroVector, 'gravity force of two physicalObjects *very* close together');
        assert(ent2.gravityForce(ent3), new Vector(G * ent2.mass * ent3.mass / Math.pow((ent2.position.sub(ent3.position)).magnitude, 2), 0), 'gravity force of two physicalObjects aligned along x axis');
        assert(ent2.gravityForce(ent3b), new Vector(G / Math.sqrt(2), G / Math.sqrt(2)), 'gravity force of two physicalObjects not aligned along a single axis');
        //collision
        assert(ent2.collide(ent2), true, 'collision with same object');
        assert(ent2.collide(ent3), true, 'collision with overlapping nearby object');
        assert(ent3b.collide(ent3c), false, 'non-collision between far away physicalObjects.');
    }
    function gameStateTests() {
        function updateTest(game, time) {
            if (time === void 0) { time = dt; }
            game.displayState();
            for (var i = 0; i < time / dt; i++) {
                game.update();
            }
            game.displayState();
        }
        updateTest(game4, 2);
    }
    // call tests as needed
    vectorTests();
    entityTests();
    gameStateTests();
}
// grab canvas
var canvas = document.querySelector('canvas');
// set dimensions
var width = (canvas.width = window.innerWidth);
var height = (canvas.height = window.innerHeight);
//create game
var state = new GameState(new Entity(1, zeroVector, new Vector(80, 0), new Vector(width / 2, height / 2 - 200)), new Entity(1, zeroVector, new Vector(-80, 0), new Vector(width / 2, height / 2 + 200)));
var game = new Game(canvas, state);
//run
game.run();
