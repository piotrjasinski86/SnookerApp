// === Snooker App ===
// Phase 3: Ball Mechanics — Balls, Modes, Physics, Correct Colors

// --- Matter.js Modules ---
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;

let engine;
let world;

let cueBall = null; // Will be a Matter.js body like the other balls

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

let isPlacingCueBall = true;      // At start, place cue ball
let isDraggingCueBall = false;    // Is user dragging cue ball?
let shotPower = 0.5;         // Power of current shot (0-1), default at 0.5 for easier testing
let minShotPower = 0.05;     // Minimum power
let maxShotPower = 1.0;      // Maximum power
let shotInProgress = false;
let powerBarMax = 120;       // Power bar pixel length

let allStoppedTimestamp = null;    // When did all balls stop
let cueLagMs = 3100;                // Milliseconds lag before cue shows

//no balls in the pocket 
let lastPocketedType = null;

let foulMessage = "";
let foulTimestamp = 0; // when the foul was triggered
let foulDuration = 2000; // show for 2 seconds


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

  // --- CHANGED ---
  // Always create cue ball at start (white ball)
  if (cueBall) World.remove(world, cueBall); // Remove previous if any
  cueBall = createBall(baulkLineX - dRadius / 2, height / 2, color(255));

  isPlacingCueBall = true;
  isDraggingCueBall = false;
  setCueBallPosition(baulkLineX - dRadius, height / 2);

  // --- NEW: Cue ball collision detection ---
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

// --- Draw ---
function draw() {
  background(30, 110, 30);

  drawTable();
  drawPockets();
  drawLinesAndZones();

  Engine.update(engine);

  drawBalls();

  checkPocketing();

  // -- Detect transitions for shotInProgress --
  let ballsMoving = isAnyBallMoving();

  if (ballsMoving) {
    shotInProgress = true;
    allStoppedTimestamp = null;
  } else {
    if (shotInProgress) {
      // Just stopped this frame
      allStoppedTimestamp = millis();
      shotInProgress = false;
    }
  }

  // Now only show cue after cueLagMs has passed since all balls stopped
  let canShowCue = !isPlacingCueBall &&
                   !shotInProgress &&
                   allStoppedTimestamp &&
                   (millis() - allStoppedTimestamp > cueLagMs);

  if (canShowCue) {
    drawAimLine();    // ✅ NEW: prediction line
    drawCueStick();
    drawPowerBar();
  }

  // --- Draw foul message if any ---
  if (millis() - foulTimestamp < foulDuration && foulMessage !== "") {
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(255, 0, 0);
    text(foulMessage, width / 2, 50);
  }
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

  let options = { isStatic: true, restitution: 0.85 };

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
// --- CHANGED --- Always draws cue ball first!
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

  // --- CHANGED ---
  // Remove and recreate cue ball at brown spot
  if (cueBall) World.remove(world, cueBall);
  cueBall = createBall(baulkLineX - dRadius / 2, height / 2, color(255));

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
  let shuffledColors = shuffle(colors);
  for (let i = 0; i < shuffledColors.length; i++) {
    colouredBalls.push(randomBall(shuffledColors[i]));
  }

  // --- CHANGED ---
  // Remove and recreate cue ball at brown spot
  if (cueBall) World.remove(world, cueBall);
  cueBall = createBall(baulkLineX - dRadius / 2, height / 2, color(255));
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

  // --- CHANGED ---
  // Remove and recreate cue ball at brown spot
  if (cueBall) World.remove(world, cueBall);1
  cueBall = createBall(baulkLineX - dRadius / 2, height / 2, color(255));

}

// --- Helpers ---
// --- CHANGED ---
// cueBall is NOT touched here!
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

// --- Key Controls ---
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
    // else: nothing — no aim start on mouse click
  }
}

function mouseDragged() {
  if (isPlacingCueBall && isDraggingCueBall) {
    // Constrain the position to the D zone
    let pos = constrainToDZone(mouseX, mouseY);
    setCueBallPosition(pos.x, pos.y);
  }
}

function mouseReleased() {
  if (isPlacingCueBall && isDraggingCueBall) {
    isDraggingCueBall = false;
    isPlacingCueBall = false;
    allStoppedTimestamp = millis();   // <--- ADD THIS LINE!
  }
}




function pointInDZone(x, y) {
  // D zone is a semicircle to the left of the baulk line
  // Center: (baulkLineX, height/2), radius: dRadius
  // Also must be to the left of baulkLineX
  let dx = x - baulkLineX;
  let dy = y - height / 2;
  let distFromCenter = sqrt(dx*dx + dy*dy);
  return (distFromCenter < dRadius && x <= baulkLineX);
}

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

function setCueBallPosition(x, y) {
  Matter.Body.setPosition(cueBall, { x, y });
  Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
}

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

function mouseWheel(event) {
  if (!isPlacingCueBall && !shotInProgress) {
    // event.deltaY: positive when scrolling down
    let delta = -event.deltaY * 0.0015; // Adjust sensitivity if needed
    shotPower += delta;
    shotPower = constrain(shotPower, minShotPower, maxShotPower);
    return false; // Prevent page scroll
  }
}

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

function handlePocketedBall(b) {
  if (b === cueBall) {
    isPlacingCueBall = true;
    setCueBallPosition(baulkLineX - dRadius, height / 2);
    Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
    lastPocketedType = null; // reset
    console.log("Cue ball pocketed → reposition inside D");
  } else if (redBalls.includes(b)) {
    World.remove(world, b);
    redBalls = redBalls.filter(rb => rb !== b);
    lastPocketedType = "red";
    console.log("Red ball pocketed → removed");
  } else if (colouredBalls.includes(b)) {
    // ✅ Extra: prevent jitter by removing residual force too:
    Matter.Body.setAngularVelocity(b, 0);
    let key = getColorKey(b.snookerColor);
    let spot = spots[key];
    Matter.Body.setPosition(b, { x: spot.x, y: spot.y });
    Matter.Body.setVelocity(b, { x: 0, y: 0 });
    if (lastPocketedType === "coloured") {
      console.log("ERROR: Two colored balls pocketed consecutively!");
    }
    lastPocketedType = "coloured";
    console.log("Colored ball pocketed → re-spotted");
  }
}

function getColorKey(col) {
  if (col.toString() === color(255, 255, 0).toString()) return "yellow";
  if (col.toString() === color(0, 128, 0).toString()) return "green";
  if (col.toString() === color(139, 69, 19).toString()) return "brown";
  if (col.toString() === color(0, 0, 255).toString()) return "blue";
  if (col.toString() === color(255, 20, 147).toString()) return "pink";
  if (col.toString() === color(0, 0, 0).toString()) return "black";
  return "";
}

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

function reflect(v, n) {
  let dot = v.dot(n);
  return p5.Vector.sub(v, p5.Vector.mult(n, 2 * dot));
}

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