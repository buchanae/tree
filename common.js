var THREE = require('three');

module.exports = {
  Vec: THREE.Vector3,
  Vec2: THREE.Vector2,

  UP: new THREE.Vector3(0, 1, 0),
  RIGHT: new THREE.Vector3(1, 0, 0),
  FORWARD: new THREE.Vector3(0, 0, 1),

  X_AXIS: new THREE.Vector3(1, 0, 0),
  Y_AXIS: new THREE.Vector3(0, 1, 0),
  Z_AXIS: new THREE.Vector3(0, 0, 1),

  // TODO not exactly right since it excludes the end?
  randomRange: function randomRange(start, end) {
    return (Math.random() * (end - start)) + start;
  },

  randomRotation: function randomRotation() {
    return 2 * Math.PI * Math.random();
  },

  randomSmallRotation: function randomSmallRotation() {
    return ((Math.PI / 8) * Math.random()) - (Math.PI / 16);
  },
};
