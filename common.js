var Vec = THREE.Vector3;
var UP = new Vec(0, 1, 0);
var RIGHT = new Vec(1, 0, 0);
var FORWARD = new Vec(0, 0, 1);
var X_AXIS = RIGHT;
var Y_AXIS = UP;
var Z_AXIS = FORWARD;

// TODO not exactly right since it excludes the end?
function randomRange(start, end) {
  return (Math.random() * (end - start)) + start;
}

function randomRotation() {
  return 2 * Math.PI * Math.random();
}

function randomSmallRotation() {
  return ((Math.PI / 8) * Math.random()) - (Math.PI / 16);
}
