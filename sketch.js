// === Snooker App ===
// Phase 3: Ball Mechanics — Balls, Modes, Physics, Correct Colors

// --- Matter.js Modules ---
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;

let engine;
let world;

// --- Table Variables ---
let tableLength, tableWidth;
let pocketRadius;
let ballRadius;

// --- Pockets ---
let pockets = [];

// --- Lines & Zones ---
let baulkLineX;
let dRadius;

// --- Colored Ball Spots ---
let spots = {};

// --- Balls ---
let redBalls = [];
let colouredBalls = [];

// --- Cushions ---
let cushions = [];

// --- Setup ---
function setup() {
  createCanvas(1200, 600);

  // Init physics
  engine = Engine.create();
  world = engine.world;
  engine.world.gravity.y = 0; // Disable gravity

  // Snooker dimensions — true ratio
  tableLength = width * 0.9;
  tableWidth = tableLength / 2;

  // Ball & pocket
  ballRadius = tableWidth / 72;
  pocketRadius = ballRadius * 1.5;

  // Baulk Line
  baulkLineX = width / 2 - tableLength / 2 + tableLength * 0.2;

  // D radius
  dRadius = tableWidth / 4;

  definePockets();
  defineSpots();
  defineCushions();
}

// --- Draw ---
function draw() {
  background(30, 110, 30);

  drawTable();
  drawPockets();
  drawLinesAndZones();

  Engine.update(engine);

  // Draw balls
  drawBalls();
}

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

  let options = { isStatic: true, restitution: 0.8 };

  cushions.push(Bodies.rectangle(left - thickness / 2, height / 2, thickness, tableWidth + thickness, options));
  cushions.push(Bodies.rectangle(right + thickness / 2, height / 2, thickness, tableWidth + thickness, options));
  cushions.push(Bodies.rectangle(width / 2, top - thickness / 2, tableLength + thickness, thickness, options));
  cushions.push(Bodies.rectangle(width / 2, bottom + thickness / 2, tableLength + thickness, thickness, options));

  World.add(world, cushions);
}

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
  line(baulkLineX, top, baulkLineX, bottom);

  noFill();
  arc(baulkLineX, height / 2, dRadius * 2, dRadius * 2, -HALF_PI, HALF_PI);

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


// --- Ball Modes ---
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
}

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
  // Shuffle the colors array
  let shuffledColors = shuffle(colors);

  for (let i = 0; i < shuffledColors.length; i++) {
    colouredBalls.push(randomBall(shuffledColors[i]));
  }
}


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
}

// --- Helpers ---
function clearBalls() {
  for (let b of redBalls) World.remove(world, b);
  for (let b of colouredBalls) World.remove(world, b);
  redBalls = [];
  colouredBalls = [];
}

function createBall(x, y, col) {
  let options = { restitution: 0.9, friction: 0.02, frictionAir: 0.01 };
  let b = Bodies.circle(x, y, ballRadius, options);
  b.snookerColor = col;
  World.add(world, b);
  return b;
}

function randomBall(col) {
  let left = width / 2 - tableLength / 2 + pocketRadius * 2;
  let right = width / 2 + tableLength / 2 - pocketRadius * 2;
  let top = height / 2 - tableWidth / 2 + pocketRadius * 2;
  let bottom = height / 2 + tableWidth / 2 - pocketRadius * 2;

  let x = random(left, right);
  let y = random(top, bottom);
  return createBall(x, y, col);
}

// --- Draw Balls ---
function drawBalls() {
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

// --- Key Controls ---
function keyPressed() {
  if (key === '1') setupMode1();
  else if (key === '2') setupMode2();
  else if (key === '3') setupMode3();
}
