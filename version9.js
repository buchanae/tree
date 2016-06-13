var seedrandom = require('seedrandom');
var THREE = require('three');
var common = require('./common');
var X_AXIS = common.X_AXIS;
var Y_AXIS = common.Y_AXIS;
var Z_AXIS = common.Z_AXIS;
var Vec = common.Vec;


module.exports = function Version9() {
  console.log("Tree version 9");


// Builds faces between two slices.
// A and B are arrays of numbers pointing to entries in an array of vertices,
// because THREE.Face3 expect indexes of vertices.
//
// Currently, A and B are expected to be the same length.
function connectSlices(geometry, A, B) {
  var Face3 = THREE.Face3;

  for (var i = 0; i < A.length; i++) {
    var A_index = A[i];
    var B_index = B[i];

    // Connect layers into faces
    // The last vertex is a special case because it must connect back to the first vertex.
    if (i == A.length - 1) {
      var A_first_index = A[0];
      var B_first_index = B[0];
      geometry.faces.push(new Face3(B_index, A_index, A_first_index));
      geometry.faces.push(new Face3(B_index, A_first_index, B_first_index));
    } else {
      var A_next_index = A[i + 1];
      var B_next_index = B[i + 1];
      geometry.faces.push(new Face3(B_index, A_index, A_next_index));
      geometry.faces.push(new Face3(B_index, A_next_index, B_next_index));
    }
  }
}



function extrude(divisions, paths) {
  var geometry = new THREE.Geometry();
  var previousIndexes;

  for (var i = 0; i < divisions; i++) {
    // Offset along the extrude paths
    var offset = i / (divisions - 1);
    // Will hold the indexes of the new vertices (because three.js tracks faces by vertex indexes)
    var indexes = [];

    // Get a point at the current offset for each extrude path
    for (var j = 0; j < paths.length; j++) {
      // Get the point
      var point = paths[j].getPoint(offset);
      // Store it in the geometry. Make note of its index.
      var index = geometry.vertices.length;
      geometry.vertices.push(point);
      // Store the index so faces can be built later
      indexes.push(index);
    }

    // Connect the new vertices to the last slice
    if (previousIndexes) {
      connectSlices(geometry, previousIndexes, indexes);
    }
    previousIndexes = indexes;
  }

  return geometry;
}

function circle(radius) {
  var shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return shape.getPoints(5);
}


// Get a direction perpendicular to the base branch (parent node)
function perpendicularToBranchDirection(node) {
  var crossWith = Y_AXIS;
  if (node.direction.equals(Y_AXIS)) {
    crossWith = X_AXIS;
  }
  return node.direction.clone().cross(crossWith).normalize();
}

function iterateBranch(start, cb) {
  var node = start;
  var next = node.next;
  cb(node);

  while (next) {
    node = next;
    next = node.next;
    cb(node);
  }
}

function randomVector() {
  return new Vec(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1);
}


/****************************************************************************/
var seed = seedrandom();
console.log("Seed", btoa(seed));

// TODO I have mixed feelings about this style. Writing it all out makes the flow clearer
//      and reduces the overhead of all the little functions existing, but it's not composable.
//      I guess I'm shooting for something in between: composable yet concise and clear.
//      In the meantime, having one big function is easier to comprehend and organize.
function iterateNode(n) {
    n.age += 1;

    // Extend tip
    if (n.isTip) {
      n.isTip = false;

      var newNode = Node({
        index: n.index + 1,
        depth: n.depth,
        direction: n.direction.clone(),
      });

      // Trend upwards
      if (newNode.depth < 2) {
        newNode.direction.y += 0.005;
      } else {
        newNode.direction.y += 0.025;
      }

      var numberOfLeaves = 5;
      var leafDistance = 2;
      for (var i = 0; i < numberOfLeaves; i++) {
        newNode.leaves.push(randomVector().setLength(leafDistance));
      }

      // Jitter direction
      if (newNode.index > 2) {
        jitterDirection(newNode.direction, 0.05, 0, 0.05);
      }

      // Jitter shape
      jitterShape(newNode.shape);

      // Link new node
      n.next = newNode;
      newNode.previous = n;
    }

    // Diminish the leaves with age
    if (n.leaves.length > 0) {
      if (n.age > 7) {
        n.leaves.length = 0;
      } else if (n.age > 3) {
        n.leaves.length -= Math.floor(Math.random() * 0.3 * n.leaves.length);
      }
    }

    // Scale shape
    if (n.age > 10) {
      n.scale += 0.7;
    } else {
      n.scale += 0.1;
    }

    // Increment length
    if (n.depth == 0) {
      n.length += 0.01;
    } else {
      n.length += 0.001;
    }

    // Attempt to create a branch
    var maxBranchDepth = 10;
    var minBranchIndex = 2;
    var minBranchAge = 1;
    var maxBranchAge = 5;
    var branchChance = 0.1;

    if (n.branches.length == 0
      && n.depth < maxBranchDepth
      && n.index > minBranchIndex
      && n.age > minBranchAge
      && n.age < maxBranchAge
      && Math.random() < branchChance
    ) {
      var direction = n.direction.clone();

      // Jitter direction
      var maxAngle = 1 / 5;
      jitterDirection(direction, maxAngle, maxAngle, maxAngle);

      // Rotate around the trunk
      // direction.applyAxisAngle(n.direction, randomAngle());

      var newNode = Node({
        direction: direction,
        depth: n.depth + 1,
      });

      n.branches.push(newNode);
    }

    // Iterate the node's branches
    for (var j = 0; j < n.branches.length; j++) {
      iterateBranch(n.branches[j], iterateNode);
    }
}

function randomAngle() {
  return Math.random() * Math.PI * 2;
}

function jitterDirection(direction, x, y, z) {
    var xRange = Math.PI * 2 * x;
    var yRange = Math.PI * 2 * y;
    var zRange = Math.PI * 2 * z;
    direction.applyAxisAngle(X_AXIS, Math.random() * xRange - xRange / 2);
    direction.applyAxisAngle(Y_AXIS, Math.random() * yRange - yRange / 2);
    direction.applyAxisAngle(Z_AXIS, Math.random() * zRange - zRange / 2);
}

function jitterShape(shape) {
  for (var i = 0; i < shape.length; i++) {
    shape[i].multiplyScalar(Math.random() + 0.8);
  }
}

// TODO need a way to organize all the various parameters available
function Node(initial) {
  return Object.assign({
    index: 0,
    depth: 0,
    isTip: true,
    age: 1,
    length: 0.5,
    scale: 1,
    direction: Y_AXIS.clone(),
    branches: [],
    leaves: [],
    branchRotation: 0,
    shape: circle(0.01),
    next: null,
    previous: null
  }, initial);
}


// Modifies a shape's vertices to be positions and oriented to the node's position and direction.
function getShape(node) {
  var vertices = [];
  var q = new THREE.Quaternion();
  q.setFromUnitVectors(Y_AXIS, node.direction);

  for (var i = 0; i < node.shape.length; i++) {
    var point = node.shape[i];
    var vec = new Vec(point.x, 0, point.y);
    vec.multiplyScalar(node.scale);
    vec.applyQuaternion(q);
    vertices.push(vec);
  }
  return new THREE.CatmullRomCurve3(vertices);
}



function systemToGeometry(startNode, startPosition) {

  var shapeDivisions = 5;
  var branches = new THREE.Geometry();
  var leaves = new THREE.Geometry();
  var nextPosition = startPosition.clone();
  // Keep a path for every point on a node's shape.
  // Each shape has "shapeDivisions" points.
  var paths = [];

  for (var i = 0; i < shapeDivisions + 1; i++) {
    paths.push(new THREE.CatmullRomCurve3());
  }

  iterateBranch(startNode, function(node) {;
    var shape = getShape(node).getPoints(shapeDivisions);

    for (var i = 0; i < shape.length; i++) {
      var vertex = shape[i].clone().add(nextPosition);
      paths[i].points.push(vertex);
    }

    nextPosition.add(node.direction.clone().setLength(node.length));

    // TODO this makes a big assumption that leaves are a point cloud, which they won't always be.
    for (var i = 0; i < node.leaves.length; i++) {
      var vertex = node.leaves[i].clone().add(nextPosition);
      leaves.vertices.push(vertex);
    }

    // Build node's branches geometries
    for (var j = 0; j < node.branches.length; j++) {
      var branchGeometries = systemToGeometry(node.branches[j], nextPosition);
      branches.merge(branchGeometries.branches);
      leaves.merge(branchGeometries.leaves);
    }
  });

  var trunkGeometry = extrude(10, paths);

  branches.merge(trunkGeometry);

  return {
    branches: branches,
    leaves: leaves,
  };
}


var trunk = Node();

// TODO an interesting idea is to have a fixed amount of energy which can be distributed
//      throughout the system on each iteration. This might have the effect of modulating
//      trunk/branch growth as the tree gets bigger.

for (var i = 0; i < 35; i++) {
  iterateBranch(trunk, iterateNode);
}

var startPosition = new Vec(0, 0, 0);
var geometries = systemToGeometry(trunk, startPosition);

console.log("Branches vertex count", geometries.branches.vertices.length);
console.log("Leaves vertex count", geometries.leaves.vertices.length);

geometries.branches.computeBoundingSphere();
// Face normals are needed when rendering Lambert/Phong or other materials affected by light
geometries.branches.computeFaceNormals();
// Vertex normals are used to render a smoothed mesh
// geometries.branches.computeVertexNormals();


var material = new THREE.MeshLambertMaterial({ color: 0x7D541F });
var tree = new THREE.Mesh( geometries.branches, material );

var leavesMaterial = new THREE.PointsMaterial({
  color: 0x00ff00,
  size: 0.5,
  vertexColors: THREE.VertexColors,
});

// TODO things like leaf color and variation belong in the model
// Add some color variation
var colors = [];
for (var i = 0; i < geometries.leaves.vertices.length; i++) {
  colors[i] = new THREE.Color();
  colors[i].setHSL(110, Math.random(), Math.random() + 0.5);
}
geometries.leaves.colors = colors;
var leaves = new THREE.Points(geometries.leaves, leavesMaterial);


var wireframeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00
});
wireframeMaterial.wireframe = true;
var wireframe = new THREE.Mesh(geometries.branches, wireframeMaterial);

var group = new THREE.Group();
group.add(tree);
group.add(leaves);
// group.add(wireframe);

return group;


}
