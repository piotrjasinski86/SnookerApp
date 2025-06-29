/*
=== Snooker App Commentary ===

App Design & Implementation (500 words)
------------------------------------
This snooker application combines intuitive controls with realistic physics to create an engaging gaming experience. The control scheme utilizes both mouse and keyboard/mouse-wheel interaction to provide precise shot control while maintaining ease of use.

Control Implementation:
- Mouse movement: Controls cue direction for intuitive aiming and cue ball placement in D zone
- Mouse drag: Allows fine adjustment of cue ball position within D zone
- Mouse wheel: Adjusts shot power (0.05 to 1.0 range)
- Spacebar: Executes the shot with current power and direction
This hybrid approach was chosen over keyboard-only controls as it mirrors the natural motion of real snooker, where players adjust their position around the table for the optimal angle.

Key Technical Features:
1. Physics Engine Integration
   - Matter.js handles realistic ball collisions and momentum
   - Custom restitution values for cushions (0.85) and balls
   - Friction implementation for authentic ball deceleration
   - Gravity disabled for authentic table physics
   - Collision detection system for accurate ball interactions

2. Game Mechanics
   - Three distinct table setup modes (1,2,3 keys)
   - Mode 1: Standard snooker triangle formation
   - Mode 2: Random positions for all balls
   - Mode 3: Random reds with fixed color positions
   - D-zone constraint system using mathematical arc calculations
   - Automatic ball respotting with original position memory
   - Sophisticated foul detection for illegal shots and ball sequence

3. Table Design
   - Professional ratio maintained (2:1 length to width)
   - Accurate ball sizing (1/36 of table width)
   - Precise pocket placement with 1.5x ball diameter
   - Cushion physics tuned for realistic rebounds
   - Proper D-zone arc and baulk line positioning

Unique Extensions:
1. Advanced Shot Prediction System
   This innovative feature implements ray-tracing algorithms to calculate and display potential ball trajectories before shots are taken. Unlike simple straight-line predictions in typical pool games, our system:
   - Calculates complex reflection angles
   - Predicts multiple collision points
   - Provides real-time visual feedback
   The technical challenge involved implementing precise mathematical calculations for ray-circle and ray-line intersections while maintaining performance.

2. Real-time Ball Counter
   A subtle yet effective addition that enhances gameplay by:
   - Tracking red and colored balls separately
   - Providing immediate feedback on game progress
   - Integrating seamlessly with the UI
   While seemingly simple, this feature required careful state management and enhanced the game's accessibility.

*/

//------------------------------------------------------------------------------
// PHYSICS ENGINE SETUP
//------------------------------------------------------------------------------
// Matter.js module aliases for cleaner code
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;

// Core physics objects
let engine;  // Main physics engine instance
let world;  // Physics world where all bodies exist

//------------------------------------------------------------------------------
// TABLE DIMENSIONS & MEASUREMENTS
//------------------------------------------------------------------------------


// Table Variables
let tableLength;    // Total length of the snooker table (0.9 * canvas width)
let tableWidth;     // Total width of the snooker table (0.5 * canvas width)
let pocketRadius;   // Radius of each pocket (1.5 times ball radius)
let ballRadius;     // Radius of balls (1/36 of table width)
let baulkLineX;
let dRadius;

//------------------------------------------------------------------------------
// GAME OBJECTS
//------------------------------------------------------------------------------

// Balls
let cueBall = null;  // White ball - separate for special handling
let redBalls = [];   // Array of red balls (15 in standard game)
let colouredBalls = [];   // Array of colored balls (yellow through black)

// Static Elements
let pockets = [];   // Array of pocket positions (6 total)
let cushions = [];   // Array of table cushions (physics bodies)
let spots = {};   // Positions for colored balls (key = color)

//------------------------------------------------------------------------------
// GAME STATE
//------------------------------------------------------------------------------

// Cue Ball State
let isPlacingCueBall = true;      // True when player needs to place cue ball
let isDraggingCueBall = false;    // True while dragging cue ball in D zone

// Shot Control
let shotPower = 0.5;         // Current shot power (0.0 to 1.0)
let minShotPower = 0.05;     // Minimum allowed shot power
let maxShotPower = 1.0;      // Maximum allowed shot power
let shotInProgress = false;  // True while balls are in motion
let powerBarMax = 120;       // Power bar pixel length

let allStoppedTimestamp = null;    // When did all balls stop
let cueLagMs = 3100;                // Milliseconds lag before cue shows

let currentBallType = 'red'; // "red" or "colored"
let coloredSequence = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'];
let sequenceIndex = 0;
let redBallsPocketed = 0;
let coloredBallsPocketed = 0;

//no balls in the pocket 
let lastPocketedType = null;

let foulMessage = "";
let foulTimestamp = 0; // when the foul was triggered
let foulDuration = 2000; // show for 2 seconds


//------------------------------------------------------------------------------
// SETUP - Initializes game environment, physics, and table elements
//------------------------------------------------------------------------------
function setup() {
  //----------------------------------------
  // Canvas Setup
  //----------------------------------------
  createCanvas(1200, 600);   // Standard size for good table visibility

  //----------------------------------------
  // Physics Engine Initialization
  //----------------------------------------
  engine = Engine.create();   // Create new Matter.js engine
  world = engine.world;   // Get reference to physics world
  engine.world.gravity.y = 0;    // Disable gravity for top-down view

  //----------------------------------------
  // Table Measurements
  //----------------------------------------
  // Snooker dimensions — true ratio
  // Calculate table dimensions maintaining professional 2:1 ratio
  tableLength = width * 0.9;         // Table takes 90% of canvas width
  tableWidth = tableLength / 2;      // Height is half the length

// Calculate ball and pocket sizes based on table dimensions
  ballRadius = tableWidth / 72;      // Standard ball size ratio
  pocketRadius = ballRadius * 1.5;   // Pockets are 1.5x ball size

  // Calculate positions for table markings
  baulkLineX = width / 2 - tableLength / 2 + tableLength * 0.2;  // Baulk line at 20% from left
  dRadius = tableWidth / 4;          // D zone radius is 1/4 table width

  //----------------------------------------
  // Table Elements Setup
  //----------------------------------------
  definePockets();    // Create the six pockets
  defineSpots();      // Set positions for colored balls
  defineCushions();   // Create table cushions with physics

  //----------------------------------------
  // Initial Game State
  //----------------------------------------
  // Initialize cue ball
  if (cueBall) World.remove(world, cueBall);  // Clean up any existing cue ball
  cueBall = createBall(baulkLineX - dRadius / 2, height / 2, color(255));

  isPlacingCueBall = true;
  isDraggingCueBall = false;
  setCueBallPosition(baulkLineX - dRadius, height / 2);

  // Cue ball collision detection
  setupCollisionHandlers();
}

function draw() {
  //----------------------------------------
  // Table Rendering
  //----------------------------------------
  background(30, 110, 30);         // Set table felt color
  drawTable();                     // Draw table frame
  drawPockets();                   // Draw table pockets
  drawLinesAndZones();             // Draw baulk line and D zone

  //----------------------------------------
  // Physics and Ball Updates
  //----------------------------------------
  Engine.update(engine);           // Update physics simulation
  drawBalls();                     // Render all balls
  checkPocketing();                // Check for pocketed balls
  
  //----------------------------------------
  // Game State Management
  //----------------------------------------
  // Track ball movement state
  let ballsMoving = isAnyBallMoving();

  if (ballsMoving) {
    shotInProgress = true;
    allStoppedTimestamp = null;
  } else if (shotInProgress) {     // Balls just stopped this frame
    allStoppedTimestamp = millis();
    shotInProgress = false;
  }

  //----------------------------------------
  // Cue Control and Shot Setup
  //----------------------------------------
  // Only show cue when appropriate (after delay, balls stopped)
  let canShowCue = !isPlacingCueBall &&
                   !shotInProgress &&
                   allStoppedTimestamp &&
                   (millis() - allStoppedTimestamp > cueLagMs);

  if (canShowCue) {
    drawAimLine();                 // Show shot prediction
    drawCueStick();                // Draw the cue stick
    drawPowerBar();                // Show power indicator
  }

  //----------------------------------------
  // UI and Feedback
  //----------------------------------------
  // Display foul message if active
  if (millis() - foulTimestamp < foulDuration && foulMessage !== "") {
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(255, 0, 0);
    text(foulMessage, width / 2, 50);
  }

  // Update score display
  drawPocketedCounters() // Show potted ball counts

}

//----------------------------------------
// Game Setup Functions
//----------------------------------------
// --- Pockets ---
function definePockets() {
  let left = width / 2 - tableLength / 2;
  let right = width / 2 + tableLength / 2;
  let top = height / 2 - tableWidth / 2;
  let bottom = height / 2 + tableWidth / 2;

  pockets = [
    createVector(left, top),
    createVector(right, top),
    createVector(left, bottom),
    createVector(right, bottom),
    createVector((left + right) / 2, top),
    createVector((left + right) / 2, bottom)
  ];
}

// --- Correct spots ---
function defineSpots() {
  let centerY = height / 2;
  let left = width / 2 - tableLength / 2;
  let right = width / 2 + tableLength / 2;

  spots.blue = createVector(width / 2, centerY);
  spots.black = createVector(right - tableLength * 0.05, centerY); // about 5% in from top cushion

  // Pink midway between blue and black
  let pinkX = width / 2 + tableLength / 4;
  spots.pink = createVector(pinkX, centerY);

  spots.brown = createVector(baulkLineX, centerY);
  spots.yellow = createVector(baulkLineX, centerY - dRadius);
  spots.green = createVector(baulkLineX, centerY + dRadius);
}

// --- Cushions ---
function defineCushions() {
  let left = width / 2 - tableLength / 2;
  let right = width / 2 + tableLength / 2;
  let top = height / 2 - tableWidth / 2;
  let bottom = height / 2 + tableWidth / 2;
  let thickness = 20;

  let options = { isStatic: true, restitution: 0.85 };

  cushions.push(Bodies.rectangle(left - thickness / 2, height / 2, thickness, tableWidth + thickness, options));
  cushions.push(Bodies.rectangle(right + thickness / 2, height / 2, thickness, tableWidth + thickness, options));
  cushions.push(Bodies.rectangle(width / 2, top - thickness / 2, tableLength + thickness, thickness, options));
  cushions.push(Bodies.rectangle(width / 2, bottom + thickness / 2, tableLength + thickness, thickness, options));

  World.add(world, cushions);
}

// Sets up collision detection for balls
function setupCollisionHandlers() {
  Matter.Events.on(engine, 'collisionStart', function(event) {
    for (let pair of event.pairs) {
      let a = pair.bodyA;
      let b = pair.bodyB;

  if (a === cueBall || b === cueBall) {
    let other = (a === cueBall) ? b : a;

    if (redBalls.includes(other)) {
      console.log("Collision: cue–red");
    } else if (colouredBalls.includes(other)) {
      console.log("Collision: cue–color");
      // ✅ Foul if any reds remain!
      if (redBalls.length > 0) {
        foulMessage = "FOUL: Hit color first while reds remain!";
        foulTimestamp = millis();
        console.log("Foul triggered.");
      }
    } else if (cushions.includes(other)) {
      console.log("Collision: cue–cushion");
    } else {
      console.log("Collision: cue–unknown");
    }
  }
}
});
}

//----------------------------------------
// Drawing Functions
//----------------------------------------
// --- Draw Table ---
function drawTable() {
  fill(80, 42, 42);
  rectMode(CENTER);
  rect(width / 2, height / 2, tableLength + 40, tableWidth + 40);

  fill(30, 110, 30);
  rect(width / 2, height / 2, tableLength, tableWidth);
}

// --- Draw Pockets ---
function drawPockets() {
  fill(0);
  noStroke();
  for (let p of pockets) {
    ellipse(p.x, p.y, pocketRadius * 2);
  }
}

// --- Draw Lines & Zones ---
function drawLinesAndZones() {
  stroke(255);
  strokeWeight(2);

  let top = height / 2 - tableWidth / 2;
  let bottom = height / 2 + tableWidth / 2;

  // Baulk line (same as before)
  line(baulkLineX, top, baulkLineX, bottom);

  // --- CHANGED: Arc for D zone now goes from HALF_PI to 3*HALF_PI ---
  // The D zone should be on the LEFT (baulk) side of the line
  noFill();
  arc(
    baulkLineX,              // x center
    height / 2,              // y center
    dRadius * 2,             // width
    dRadius * 2,             // height
    HALF_PI,                 // start angle
    3 * HALF_PI              // end angle
  );

  // Subtle spots ONLY for colored balls (no red triangle tip!)
  fill(40, 30, 20); // dark brown, or you can use (30) for dark gray
  noStroke();

  // Only show for these colored balls:
  let coloredKeys = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'];
  for (let key of coloredKeys) {
    let s = spots[key];
    ellipse(s.x, s.y, 5); // tiny and subtle
  }
}

// --- Draw Balls ---
function drawBalls() {
  // Draw cue ball first if present
  if (cueBall) {
    if (isPlacingCueBall) {
      fill(255, 180); // semi-transparent white for placement
      stroke(0, 60);
      strokeWeight(2);
    } else {
      fill(255);
      noStroke();
    }
    ellipse(cueBall.position.x, cueBall.position.y, ballRadius * 2);
  }
  noStroke();
  for (let b of redBalls) {
    fill(b.snookerColor);
    ellipse(b.position.x, b.position.y, ballRadius * 2);
  }
  for (let b of colouredBalls) {
    fill(b.snookerColor);
    ellipse(b.position.x, b.position.y, ballRadius * 2);
  }
}

// Render the cue stick
function drawCueStick() {
  if (!cueBall || isPlacingCueBall) return;

  // Cue only visible if mouse is inside the table
  let left = width / 2 - tableLength / 2;
  let right = width / 2 + tableLength / 2;
  let top = height / 2 - tableWidth / 2;
  let bottom = height / 2 + tableWidth / 2;

  if (mouseX < left || mouseX > right || mouseY < top || mouseY > bottom) return;

  // Calculate angle from cue ball center to mouse
  let cuePos = cueBall.position;
  let angle = atan2(mouseY - cuePos.y, mouseX - cuePos.x);

  // Set a small gap between cue and ball (try 2-3 pixels)
  let gap = 4;
  let tipLength = 18;

  // The cue starts at the OUTSIDE edge of the cue ball, plus a small gap
  let startX = cuePos.x - cos(angle) * (ballRadius + gap);
  let startY = cuePos.y - sin(angle) * (ballRadius + gap);

  // The cue stick's length (visual only)
  let cueLength = 200;

  // The far end of the cue stick (where the tip should be)
  let cueEndX = startX - cos(angle) * (cueLength - tipLength);
  let cueEndY = startY - sin(angle) * (cueLength - tipLength);

  // 1. Draw the stick (light wood), stopping before the tip
  stroke(210, 180, 140);
  strokeWeight(8);
  line(startX, startY, cueEndX, cueEndY);

  // 2. Draw the tip (darker color) at the far end, tip points away from ball
  stroke(70, 50, 30);
  strokeWeight(10);
  line(
    cueEndX, cueEndY,
    cueEndX - cos(angle) * tipLength,
    cueEndY - sin(angle) * tipLength
  );
}

// Show power indicator
function drawPowerBar() {
  // Only when cue is available
  if (isPlacingCueBall || shotInProgress) return;

  let barX = cueBall.position.x;
  let barY = cueBall.position.y + 40;
  let w = powerBarMax;
  let h = 16; // Slightly taller for clarity

  // --- Background capsule ---
  fill(255); // white rounded background
  noStroke();
  rect(barX - w/2, barY, w, h, h/2); // rounded corners

  // --- Fill (red) ---
  fill(255, 0, 0); 
  let fw = w * shotPower;
  rect(barX - w/2, barY, fw, h, h/2);

  // --- Outline (optional, subtle) ---
  stroke(0);
  strokeWeight(1);
  noFill();
  rect(barX - w/2, barY, w, h, h/2);

  // --- Percentage text ---
  noStroke();
  fill(0); // black text for contrast
  textAlign(CENTER, CENTER);
  text((shotPower * 100).toFixed(0) + '%', barX, barY + h/2);
}

// Shows potted ball countres
function drawPocketedCounters() {
  // Position from right side of screen
  let rightMargin = 20;
  let topMargin = 70;
  let x = width - rightMargin;
  let y = topMargin;
  let padding = 10;
  let boxWidth = 200;
  let boxHeight = 60;
  
  // Draw semi-transparent background
  fill(0, 0, 0, 150);
  noStroke();
  rectMode(CORNER);
  rect(x - boxWidth, y - padding, boxWidth, boxHeight, 8);
  
  // Draw text
  fill(255);
  textSize(16);
  textAlign(RIGHT, TOP);
  text(`Red Balls Potted: ${redBallsPocketed}`, x - padding, y);
  text(`Colored Balls Potted: ${coloredBallsPocketed}`, x - padding, y + 25);
}

// Shows shot prediction line
function drawAimLine() {
  if (!cueBall || isPlacingCueBall) return;

  let cuePos = cueBall.position;
  let angle = atan2(mouseY - cuePos.y, mouseX - cuePos.x);
  let dir = createVector(cos(angle), sin(angle));
  let currentPos = createVector(cuePos.x, cuePos.y);

  let maxBounces = 5; // Limit bounces to avoid infinite loops
  let currentDir = dir.copy();

  stroke(255);
  strokeWeight(2);
  drawingContext.setLineDash([5, 10]); // Dotted line style

  for (let bounce = 0; bounce < maxBounces; bounce++) {
    let hit = findClosestHit(currentPos, currentDir);

    if (hit) {
      line(currentPos.x, currentPos.y, hit.point.x, hit.point.y);

      if (hit.type === 'cushion') {
        currentDir = reflect(currentDir, hit.normal);
        currentPos = hit.point.copy();
      } else if (hit.type === 'ball') {
        // Mark hit point
        fill(255, 0, 0);
        noStroke();
        ellipse(hit.point.x, hit.point.y, 10);
        break;
      }
    } else {
      // No hit: extend far
      let farPoint = p5.Vector.add(currentPos, p5.Vector.mult(currentDir, 1000));
      line(currentPos.x, currentPos.y, farPoint.x, farPoint.y);
      break;
    }
  }

  drawingContext.setLineDash([]); // Reset dash
}

//----------------------------------------
// Game Mode Functions
//----------------------------------------
// Ball Mode 1
function setupMode1() {
  clearBalls();

  let rows = 5;
  let spacing = ballRadius * 2.1;

  // Tip of the triangle just to the RIGHT of the pink
  let tipX = spots.pink.x + ballRadius * 2 + 2;
  let startY = spots.pink.y;

  // Build triangle to the right from the tip
  for (let row = 0; row < rows; row++) {
    let x = tipX + row * spacing;
    for (let i = 0; i <= row; i++) {
      let y = startY + (i - row / 2) * spacing;
      redBalls.push(createBall(x, y, color(255, 0, 0)));
    }
  }

  // Place coloured balls
  colouredBalls.push(createBall(spots.yellow.x, spots.yellow.y, color(255, 255, 0))); // Yellow
  colouredBalls.push(createBall(spots.green.x, spots.green.y, color(0, 128, 0)));     // Green
  colouredBalls.push(createBall(spots.brown.x, spots.brown.y, color(139, 69, 19)));   // Brown
  colouredBalls.push(createBall(spots.blue.x, spots.blue.y, color(0, 0, 255)));       // Blue
  colouredBalls.push(createBall(spots.pink.x, spots.pink.y, color(255, 20, 147)));    // Pink
  colouredBalls.push(createBall(spots.black.x, spots.black.y, color(0, 0, 0)));       // Black

  // Remove and recreate cue ball at brown spot
  if (cueBall) World.remove(world, cueBall);
  cueBall = createBall(baulkLineX - dRadius / 2, height / 2, color(255));

}

// Ball Mode 2
function setupMode2() {
  clearBalls();
  // Random reds
  for (let i = 0; i < 15; i++) {
    redBalls.push(randomBall(color(255, 0, 0)));
  }
  // Colored balls: only one of each, shuffled positions
  let colors = [
    color(255, 255, 0), // Yellow
    color(0, 128, 0),   // Green
    color(139, 69, 19), // Brown
    color(0, 0, 255),   // Blue
    color(255, 20, 147),// Pink
    color(0, 0, 0)      // Black
  ];
  let shuffledColors = shuffle(colors);
  for (let i = 0; i < shuffledColors.length; i++) {
    colouredBalls.push(randomBall(shuffledColors[i]));
  }

  // --- CHANGED ---
  // Remove and recreate cue ball at brown spot
  if (cueBall) World.remove(world, cueBall);
  cueBall = createBall(baulkLineX - dRadius / 2, height / 2, color(255));
}

// Ball Mode 3
function setupMode3() {
  clearBalls();
  // Random reds
  for (let i = 0; i < 15; i++) {
    redBalls.push(randomBall(color(255, 0, 0)));
  }
  // Coloured balls at correct spots
  colouredBalls.push(createBall(spots.yellow.x, spots.yellow.y, color(255, 255, 0))); // Yellow
  colouredBalls.push(createBall(spots.green.x, spots.green.y, color(0, 128, 0)));     // Green
  colouredBalls.push(createBall(spots.brown.x, spots.brown.y, color(139, 69, 19)));   // Brown
  colouredBalls.push(createBall(spots.blue.x, spots.blue.y, color(0, 0, 255)));       // Blue
  colouredBalls.push(createBall(spots.pink.x, spots.pink.y, color(255, 20, 147)));    // Pink
  colouredBalls.push(createBall(spots.black.x, spots.black.y, color(0, 0, 0)));       // Black

  // --- CHANGED ---
  // Remove and recreate cue ball at brown spot
  if (cueBall) World.remove(world, cueBall);1
  cueBall = createBall(baulkLineX - dRadius / 2, height / 2, color(255));

}

// Removes all balls except cue ball
function clearBalls() {
  for (let b of redBalls) World.remove(world, b);
  for (let b of colouredBalls) World.remove(world, b);
  redBalls = [];
  colouredBalls = [];
}

//----------------------------------------
// Ball Management
//----------------------------------------
// Creates a new ball with standard snooker physics properties
function createBall(x, y, col) {
  let options = { restitution: 0.9, friction: 0.02, frictionAir: 0.01 };
  let b = Bodies.circle(x, y, ballRadius, options);
  b.snookerColor = col;
  World.add(world, b);
  return b;
}

// Creates a new ball with random position and specified color
function randomBall(col) {
  let left = width / 2 - tableLength / 2 + pocketRadius * 2;
  let right = width / 2 + tableLength / 2 - pocketRadius * 2;
  let top = height / 2 - tableWidth / 2 + pocketRadius * 2;
  let bottom = height / 2 + tableWidth / 2 - pocketRadius * 2;

  let x = random(left, right);
  let y = random(top, bottom);
  return createBall(x, y, col);
}

// Sets the position of the cue ball
function setCueBallPosition(x, y) {
  Matter.Body.setPosition(cueBall, { x, y });
  Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
}

// Checks if any ball is pocketed and handles the pocketing
function checkPocketing() {
  let allBalls = [cueBall].concat(redBalls, colouredBalls);

  for (let b of allBalls) {
    for (let p of pockets) {
      let d = dist(b.position.x, b.position.y, p.x, p.y);
      if (d < pocketRadius) {
        handlePocketedBall(b);
        break; // No need to check other pockets for this ball
      }
    }
  }
}

// Handles the pocketing of a ball
function handlePocketedBall(b) {
  if (b === cueBall) {
    isPlacingCueBall = true;
    setCueBallPosition(baulkLineX - dRadius, height / 2);
    Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
    foulMessage = "FOUL: Cue ball potted!";
    foulTimestamp = millis();
    console.log("Cue ball pocketed → reposition inside D");
    return;
  }

  if (redBalls.includes(b)) {
    if (currentBallType !== 'red') {
      foulMessage = "FOUL: Wrong ball potted, expected colored!";
      foulTimestamp = millis();
      console.log("FOUL: Red ball potted instead of colored");
    } else {
      console.log("Correct: Red ball pocketed");
      World.remove(world, b);
      redBalls = redBalls.filter(rb => rb !== b);
      currentBallType = 'colored';
      redBallsPocketed++;
    }
  } else if (colouredBalls.includes(b)) {
    let key = getColorKey(b.snookerColor);
    if (redBalls.length > 0) { // Reds still on the table
      if (currentBallType !== 'colored') {
        foulMessage = "FOUL: Wrong ball potted, expected red!";
        foulTimestamp = millis();
        console.log("FOUL: Colored ball potted instead of red");
      } else {
        console.log("Correct: Colored ball pocketed");
        respotColoredBall(b, key);
        currentBallType = 'red';
        coloredBallsPocketed++;
      }
    } else { // No reds remain
      let expectedColor = coloredSequence[sequenceIndex];
      if (key !== expectedColor) {
        foulMessage = `FOUL: Wrong ball! Expected ${expectedColor.toUpperCase()}!`;
        foulTimestamp = millis();
        console.log(`FOUL: Wrong colored ball potted. Expected ${expectedColor}`);
        respotColoredBall(b, key);
      } else {
        console.log(`Correct: ${key.toUpperCase()} ball pocketed`);
        World.remove(world, b);
        colouredBalls = colouredBalls.filter(cb => cb !== b);
        sequenceIndex++;
        coloredBallsPocketed++;
        if (sequenceIndex >= coloredSequence.length) {
          console.log("Game Completed! All colored balls potted in sequence.");
        }
      }
    }
  }
}

// Respots a colored ball to its original spot
function respotColoredBall(ball, key) {
  Matter.Body.setAngularVelocity(ball, 0);
  let spot = spots[key];
  Matter.Body.setPosition(ball, { x: spot.x, y: spot.y });
  Matter.Body.setVelocity(ball, { x: 0, y: 0 });
  console.log(`${key.toUpperCase()} ball re-spotted`);
}

// Returns the key for a given color
function getColorKey(col) {
  if (col.toString() === color(255, 255, 0).toString()) return "yellow";
  if (col.toString() === color(0, 128, 0).toString()) return "green";
  if (col.toString() === color(139, 69, 19).toString()) return "brown";
  if (col.toString() === color(0, 0, 255).toString()) return "blue";
  if (col.toString() === color(255, 20, 147).toString()) return "pink";
  if (col.toString() === color(0, 0, 0).toString()) return "black";
  return "";
}

//----------------------------------------
// Input Handling
//----------------------------------------
// Handles key presses for mode selection and shot execution
function keyPressed() {
  if (key === '1') setupMode1();
  else if (key === '2') setupMode2();
  else if (key === '3') setupMode3();
  else if (key === ' ' && !isPlacingCueBall && !shotInProgress) { // Space bar
    if (shotPower >= minShotPower) {
      shootCueBall();
    }
  }
}

// Handles mouse presses for cue ball placement and movement  
function mousePressed() {
  if (isPlacingCueBall) {
    // Cue ball positioning (same as before)
    let d = dist(mouseX, mouseY, cueBall.position.x, cueBall.position.y);
    if (d < ballRadius) {
      isDraggingCueBall = true;
    } else if (pointInDZone(mouseX, mouseY)) {
      setCueBallPosition(mouseX, mouseY);
      isDraggingCueBall = true;
    }
  } else if (!shotInProgress) {
    // Check if player wants to move cue ball again
    let d = dist(mouseX, mouseY, cueBall.position.x, cueBall.position.y);
    if (d < ballRadius) {
      isPlacingCueBall = true;
      isDraggingCueBall = true;
    }
  }
}

// Handles mouse dragging for cue ball placement
function mouseDragged() {
  if (isPlacingCueBall && isDraggingCueBall) {
    // Constrain the position to the D zone
    let pos = constrainToDZone(mouseX, mouseY);
    setCueBallPosition(pos.x, pos.y);
  }
}

// Handles mouse release for cue ball placement
function mouseReleased() {
  if (isPlacingCueBall && isDraggingCueBall) {
    isDraggingCueBall = false;
    isPlacingCueBall = false;
    allStoppedTimestamp = millis();   // <--- ADD THIS LINE!
  }
}

// Handles mouse wheel for shot power adjustment
function mouseWheel(event) {
  if (!isPlacingCueBall && !shotInProgress) {
    // event.deltaY: positive when scrolling down
    let delta = -event.deltaY * 0.0015; // Adjust sensitivity if needed
    shotPower += delta;
    shotPower = constrain(shotPower, minShotPower, maxShotPower);
    return false; // Prevent page scroll
  }
}

//----------------------------------------
// Physics & Gameplay
//----------------------------------------
// Applies force to cue ball based on angle and shot power
function shootCueBall() {
  if (isPlacingCueBall || shotInProgress) return;
  let cuePos = cueBall.position;
  let angle = atan2(mouseY - cuePos.y, mouseX - cuePos.x);

  // Adjust this factor for realism
  let forceMag = 0.02 * shotPower;
  let force = {
    x: cos(angle) * forceMag,
    y: sin(angle) * forceMag
  };

  Matter.Body.applyForce(cueBall, { x: cuePos.x, y: cuePos.y }, force);
  shotPower = 0.5; // Reset to default
}

// Checks if any ball is moving
function isAnyBallMoving() {
  // Returns true if cue ball or any red or colored ball is moving
  function isMoving(b) {
    return b && (abs(b.velocity.x) > 0.5 || abs(b.velocity.y) > 0.5);
  }
  if (isMoving(cueBall)) return true;
  for (let b of redBalls) if (isMoving(b)) return true;
  for (let b of colouredBalls) if (isMoving(b)) return true;
  return false;
}

//----------------------------------------
// Helper Functions
//----------------------------------------
// Checks if a point is within the D zone
function pointInDZone(x, y) {
  // D zone is a semicircle to the left of the baulk line
  let dx = x - baulkLineX;
  let dy = y - height / 2;
  let distFromCenter = sqrt(dx*dx + dy*dy);
  return (distFromCenter < dRadius && x <= baulkLineX);
}

// Constrains a point to the D zone
function constrainToDZone(x, y) {
  let dx = x - baulkLineX;
  let dy = y - height / 2;
  let distFromCenter = sqrt(dx*dx + dy*dy);
  if (x > baulkLineX) x = baulkLineX; // Don't allow to right of baulk line
  if (distFromCenter > dRadius) {
    // Snap to edge of D
    let angle = atan2(dy, dx);
    return {
      x: baulkLineX + cos(angle) * dRadius,
      y: height / 2 + sin(angle) * dRadius
    };
  }
  return { x, y };
}

// Calculates reflection vector 
function reflect(v, n) {
  let dot = v.dot(n);
  return p5.Vector.sub(v, p5.Vector.mult(n, 2 * dot));
}

// Finds the closest intersection between a ray and the table
function findClosestHit(origin, dir) {
  let minDist = Infinity;
  let closest = null;

  // Check cushions
  for (let c of cushions) {
    let hit = rayRectIntersection(origin, dir, c);
    if (hit && hit.dist < minDist) {
      minDist = hit.dist;
      closest = { type: 'cushion', point: hit.point, normal: hit.normal };
    }
  }

  // Check balls
  for (let b of redBalls.concat(colouredBalls)) {
    let hit = rayCircleIntersection(origin, dir, b.position, ballRadius);
    if (hit && hit.dist < minDist) {
      minDist = hit.dist;
      closest = { type: 'ball', point: hit.point };
    }
  }

  return closest;
}

// Checks for intersection between ray and circle
function rayCircleIntersection(origin, dir, center, radius) {
  let oc = p5.Vector.sub(origin, createVector(center.x, center.y));
  let a = dir.dot(dir);
  let b = 2 * oc.dot(dir);
  let c = oc.dot(oc) - radius * radius;
  let discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  let t = (-b - sqrt(discriminant)) / (2 * a);
  if (t > 0.001) {
    let point = p5.Vector.add(origin, p5.Vector.mult(dir, t));
    return { point: point, dist: t };
  }
  return null;
}

// Checks for intersection between ray and rectangle
function rayRectIntersection(origin, dir, rectBody) {
  let vertices = rectBody.vertices;
  let minDist = Infinity;
  let hitPoint = null;
  let normal = null;

  for (let i = 0; i < 4; i++) {
    let p1 = createVector(vertices[i].x, vertices[i].y);
    let p2 = createVector(vertices[(i + 1) % 4].x, vertices[(i + 1) % 4].y);
    let hit = rayLineIntersection(origin, dir, p1, p2);
    if (hit && hit.dist < minDist) {
      minDist = hit.dist;
      hitPoint = hit.point;
      let edgeDir = p5.Vector.sub(p2, p1).normalize();
      normal = createVector(-edgeDir.y, edgeDir.x); // Perpendicular
    }
  }

  if (hitPoint) return { point: hitPoint, dist: minDist, normal: normal };
  return null;
}

// Checks for intersection between ray and line segment
function rayLineIntersection(origin, dir, p1, p2) {
  let v1 = p5.Vector.sub(origin, p1);
  let v2 = p5.Vector.sub(p2, p1);
  let v3 = createVector(-dir.y, dir.x);

  let dot = v2.dot(v3);
  if (abs(dot) < 0.000001) return null;

  let t1 = v2.cross(v1) / dot;
  let t2 = v1.dot(v3) / dot;

  if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
    let point = p5.Vector.add(origin, p5.Vector.mult(dir, t1));
    return { point: point, dist: t1 };
  }
  return null;
}
