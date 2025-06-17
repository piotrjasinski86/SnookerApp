
// p5 setup function
function setup() {
  createCanvas(800, 400);
  console.log('p5.js is working!');

  // Matter.js test
  let engine = Matter.Engine.create();
  console.log('Matter.js is working!', engine);
}

function draw() {
  background(0, 100, 0); // green table test
}
