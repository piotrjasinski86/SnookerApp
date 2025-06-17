// === Snooker App ===
// Phase 2: Horizontal table with correct baulk & spots

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

// --- Setup ---
function setup() {
  createCanvas(1200, 600);

  // Init physics
  engine = Engine.create();
  world = engine.world;

  // Snooker dimensions — true ratio
  tableLength = width * 0.9;  // 90% of canvas width
  tableWidth = tableLength / 2; // standard 2:1 ratio

  // Ball & pocket
  ballRadius = tableWidth / 72; // diameter = /36
  pocketRadius = ballRadius * 1.5;

  // Baulk Line: ~1/5 length from left cushion
  baulkLineX = width / 2 - tableLength / 2 + tableLength * 0.2;

  // D radius: standard proportional
  dRadius = tableWidth / 4;

  definePockets();
  defineSpots();
}

// --- Draw ---
function draw() {
  background(30, 110, 30);

  drawTable();
  drawPockets();
  drawLinesAndZones();

  Engine.update(engine);
}

// --- Pockets for horizontal table ---
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
    createVector(left, (top + bottom) / 2),
    createVector(right, (top + bottom) / 2)
  ];
}

// --- Correct colored ball spots ---
function defineSpots() {
  let left = width / 2 - tableLength / 2;
  let right = width / 2 + tableLength / 2;
  let centerY = height / 2;

  // Black: near right cushion
  spots.black = createVector(right - tableLength * 0.05, centerY);
  // Pink: ~1/3 from right cushion
  spots.pink = createVector(right - tableLength * 0.2, centerY);
  // Blue: center of table
  spots.blue = createVector(width / 2, centerY);
  // Brown: on baulk line
  spots.brown = createVector(baulkLineX, centerY);
  // Yellow & Green: left & right of Brown along table width
  spots.yellow = createVector(baulkLineX, centerY - dRadius);
  spots.green = createVector(baulkLineX, centerY + dRadius);
}

// --- Draw Table & Border ---
function drawTable() {
  // Brown border
  fill(80, 42, 42);
  rectMode(CENTER);
  rect(width / 2, height / 2, tableLength + 40, tableWidth + 40);

  // Green cloth
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

// --- Draw Baulk Line & D Zone ---
function drawLinesAndZones() {
  stroke(255);
  strokeWeight(2);

  // Baulk Line (vertical)
  let top = height / 2 - tableWidth / 2;
  let bottom = height / 2 + tableWidth / 2;
  line(baulkLineX, top, baulkLineX, bottom);

  // D Zone (semi-circle to right)
  noFill();
  arc(baulkLineX, height / 2, dRadius * 2, dRadius * 2, -HALF_PI, HALF_PI);

  // Spots
  fill(255, 0, 0);
  noStroke();
  for (let key in spots) {
    let s = spots[key];
    ellipse(s.x, s.y, 8);
  }
}
