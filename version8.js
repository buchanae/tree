
function Version8() {
  console.log("Tree version 8");


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

  // Helps build up vertices in a geometry adding and connecting faces for a given array of "slices"
  // which are essentially arrays of vertices (probably from extrusion of 2D shapes).
  //
  // Currently this expects each slice to have the same number of vertices.
  function addSlices(geometry, slices) {

    // Helper pushes a slice onto geometry.vertices and returns an array of vertex indexes.
    function pushSlice(slice) {
      var indexes = [];
      for (var i = 0; i < slice.length; i++) {
        var next_index = geometry.vertices.length;
        geometry.vertices.push(slice[i]);
        indexes.push(next_index);
      }
      return indexes;
    }

    var previousIndexes;

    for (var i = 0; i < slices.length; i++) {
      var slice = slices[i];
      var indexes = pushSlice(slice);

      if (previousIndexes) {
        connectSlices(geometry, previousIndexes, indexes);
      }
      previousIndexes = indexes;
    }
  }


  // Modifies a shape's vertices to be positions and oriented at the given position and direction.
  function makeSlice(position, direction, shape) {
    var vertices = [];
    var q = new THREE.Quaternion();
    q.setFromUnitVectors(Y_AXIS, direction);

    for (var i = 0; i < shape.length; i++) {
      var point = shape[i];
      var vec = new Vec(point.x, 0, point.y);

      vec.applyQuaternion(q);
      vec.add(position);
      vertices.push(vec);
    }
    return vertices;
  }

  function extrude(divisions, func) {
    var geometry = new THREE.Geometry();
    var slices = [];

    for (var i = 0; i < divisions; i++) {
      var offset = i / (divisions - 1);
      var info = func(offset);
      var slice = makeSlice(info.position, info.direction, info.shape);
      slices.push(slice);
    }

    addSlices(geometry, slices);
    return geometry;
  }

function circle(radius) {
  var shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return shape;
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

function iterateNode(node) {
    node.age += 1;
    extendTip(node);
    incrementRadius(node);
    incrementLength(node);
    attemptBranch(node);

    // Iterate node's branches
    for (var j = 0; j < node.branches.length; j++) {
      iterateBranch(node.branches[j], iterateNode);
    }
}



/****************************************************************************/


function trendUpwards(node) {
  if (node.depth < 2) {
    node.direction.add(new Vec(0, 0.025, 0));
  } else {
    node.direction.add(new Vec(0, 0.05, 0));
  }
}


function jitterDirection(node) {
  // Don't jitter nodes that are at the base of a trunk/branch because it renders weird
  // TODO put this in more natural language, such as "tropism more likely as farther away
  //      from base because less stability"
  //      OR, maybe just make jitter at base very minimal
  if (node.index > 2) {
    node.direction.applyAxisAngle(X_AXIS, randomSmallRotation());
    node.direction.applyAxisAngle(Y_AXIS, randomSmallRotation() * 0.25);
    node.direction.applyAxisAngle(Z_AXIS, randomSmallRotation() * 0.5);
  }
}

function initialTiltUpwards(node) {
  node.direction.add(new Vec(0, 0.5, 0));
}

function diminishGrowthRate(node) {
  node.growthRate *= 0.2;
}

// TODO relate branch point to age and distance to tip to simulate auxin and keep branches
//      for forming at the base of the trunk.
function attemptBranch(node) {
  if (shouldBranch(node)) {

      var direction = node.direction.clone();
      var rotation = Math.random() * (Math.PI * 2 );

      var maxAngle = Math.PI / 3;
      direction.applyAxisAngle(X_AXIS, Math.random() * maxAngle);
      direction.applyAxisAngle(Y_AXIS, Math.random() * maxAngle);
      direction.applyAxisAngle(Z_AXIS, Math.random() * maxAngle);

      // Rotate around the trunk
      direction.applyAxisAngle(node.direction, rotation);

      var newNode = Node({
        direction: direction,
        depth: node.depth + 1,
      });

      node.branches.push(newNode);
    }
}

function extendTip(node) {
  if (node.isTip) {
    node.isTip = false;

    // if (node.depth > 1 && node.index > 5) return;

    var newNode = Node({
      index: i + 1,
      depth: node.depth,
      direction: node.direction.clone(),
      growthRate: node.growthRate,
    });

    trendUpwards(newNode);
    jitterDirection(newNode);
    jitterShape(newNode);
    node.next = newNode;
    newNode.previous = node;
  }
}

function jitterShape(node) {
  for (var i = 0; i < node.shape.length; i++) {
    node.shape[i].multiplyScalar(Math.random() + 0.8);
  }
}

function shouldBranch(node) {
  return node.branches.length == 0
  && node.depth < 5
  && node.index > 2
  && node.age > 1
  && node.age < 10
  && Math.random() < 0.05;
}

function incrementRadius(node) {
  if (node.depth < 3) {
    var amount = 1.15;
  } else {
    var amount = 1.2;
  }

  // TODO it would be better to store the amount of scaling needed and apply it at the end
  //      but this might affect any intermediate processes that need the updated data, such as
  //      jitter. Although there's a clever way to store jitter values as well. But, if both
  //      systems move into shaders, then it's all efficient.
  //      In the meantime, it's efficient enough to do it the simple way
  for (var i = 0; i < node.shape.length; i++) {
    node.shape[i].multiplyScalar(amount);
  }
}

function incrementLength(node) {
  if (node.depth == 0) {
    node.length += 0.01;
  } else {
    node.length += 0.001;
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
    direction: UP.clone(),
    minBranchAge: 1,
    branches: [],
    branchChance: 0.5,
    branchRotation: 0,
    growthRate: 0.01,
    shape: circle(0.01).extractPoints(10).shape,
    next: null,
    previous: null
  }, initial);
}


function systemToGeometry(startNode, startPosition) {

  var branches = new THREE.Geometry();
  var leaves = new THREE.Geometry();
  var nodePoints = new THREE.Geometry();
  var path = new THREE.CatmullRomCurve3([startPosition]);
  var shapes = [];

  iterateBranch(startNode, function(node) {;

    // var shape = getShape(node).extractPoints(3).shape;
    // TODO this is making an assumption about the shape curve. How to move this out?
    var shape = new THREE.SplineCurve(node.shape);
    shapes.push(shape.getPoints(10));

    var lastPoint = path.points[path.points.length - 1];
    var nextPoint = node.direction
      .clone()
      .setLength(node.length)
      .add(lastPoint);
    path.points.push(nextPoint);

    // TODO move leaves out of this function?
    // TODO leaves is an interesting case because it wants to know the final state of the tree
    //      in order to tell if a node is near the end of a branch. There could be a couple ways
    //      to implement this:
    //      1. have a leaf likelihood that gets decremented on each iteration
    //      2. Use node.age as a likelihood measure
    //      3. Organize things so that it's easy and acceptable to query for nodes after the system
    //         has iterated.
    if (node.next === null) {
      leaves.vertices.push(nextPoint);
    }

    for (var j = 0; j < node.branches.length; j++) {
      var branchGeometries = systemToGeometry(node.branches[j], nextPoint);
      branches.merge(branchGeometries.branches);
      leaves.merge(branchGeometries.leaves);
      nodePoints.merge(branchGeometries.nodePoints);
    }
  });

  var trunkGeometry = extrude(20, function(offset) {
    // TODO this seems to be OK for now, but in the future I'd like to be able to interpolate
    //      between two shapes
    var index = Math.floor(offset * (shapes.length - 1));
    var shape = shapes[index];

    return {
      direction: path.getTangent(offset),
      position: path.getPoint(offset),
      shape: shape,
    };
  });

  Array.prototype.push.apply(nodePoints.vertices, path.getPoints(10));
  branches.merge(trunkGeometry);

  return {
    nodePoints: nodePoints,
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

// Add some color variation
var colors = [];
for (var i = 0; i < geometries.leaves.vertices.length; i++) {
  colors[i] = new THREE.Color();
  colors[i].setHSL(110, Math.random(), Math.random() + 0.5);
}
geometries.leaves.colors = colors;
var leaves = new THREE.Points(geometries.leaves, leavesMaterial);


var nodePointsMaterial = new THREE.PointsMaterial({
  color : 0xFFC60A,
  size: 0.25
});
var nodePoints = new THREE.Points(geometries.nodePoints, nodePointsMaterial);

var wireframeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00
});
wireframeMaterial.wireframe = true;
var wireframe = new THREE.Mesh(geometries.branches, wireframeMaterial);

var group = new THREE.Group();
group.add(nodePoints);
group.add(tree);
// group.add(leaves);
// group.add(wireframe);

return group;


}
