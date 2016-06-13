var THREE = require('three');
var common = require('./common');
var X_AXIS = common.X_AXIS;
var Y_AXIS = common.Y_AXIS;
var Z_AXIS = common.Z_AXIS;
var Vec = common.Vec;


module.exports = function Version5() {


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


  function makeSlice(position, normal, shape) {
    var vertices = [];
    var q = new THREE.Quaternion();
    q.setFromUnitVectors(Y_AXIS, normal);

    for (var i = 0; i < shape.length; i++) {
      var point = shape[i];
      var vec = new Vec(point.x, 0, point.y);

      vec.applyQuaternion(q);
      vec.add(position);
      vertices.push(vec);
    }
    return vertices;
  }

  function extrude(divisions, curve, shapeFunc) {
    var geometry = new THREE.Geometry();
    var slices = [];

    for (var i = 0; i < divisions; i++) {
      var offset = i / divisions;
      var normal = curve.getTangent(offset);
      var position = curve.getPoint(offset);
      var shape = shapeFunc(offset);
      var slice = makeSlice(position, normal, shape);
      slices.push(slice);
    }

    addSlices(geometry, slices);
    return geometry;
  }


  // TODO need a way to organize all the various parameters available
  // - when and where to branch
  // - radius of slice
  // - shape of slice
  // - length of branch
  // - position of slice
  // - direction of slice

  function circle(radius, divisions) {
    var shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    return shape.extractPoints(divisions).shape;
  }

  // TODO is this system of multiple passes too inefficient?
  function jitterSlices(slices) {
    for (var i = 0; i < slices.length; i) {
      var slice = slices[i];

    }
  }

  function trunkRandomRadiusAtOffset(startRadius, offset) {
    return (1 - offset) * (startRadius + (Math.random() * 0.25 - 0.5));
  }

function jitterDirection(direction) {
  direction.applyAxisAngle(X_AXIS, common.randomSmallRotation() * 0.25);
  direction.applyAxisAngle(Y_AXIS, common.randomSmallRotation() * 0.25);
  direction.applyAxisAngle(Z_AXIS, common.randomSmallRotation() * 0.25);
}


function iterate(system) {
  // TODO shallow copy is not ideal. Need to think about better data structures
  // var copy = [];
  // Array.prototype.push.apply(copy, system);
  // TODO ensure this is robust enough and then rename copy
  var copy = system;

  var lastBranchIndex = -1;

  for (var i = 0, ii = system.length; i < ii; i++) {
    var node = system[i];
    node.age += 1;
    var isTip = i == ii - 1;

    if (isTip) {

      var direction = node.direction.clone();

      // Don't jitter nodes that are at the base of a trunk/branch because it renders weird
      // TODO put this in more natural language, such as "tropism more likely as farther away
      //      from base because less stability"
      //      OR, maybe just make jitter at base very minimal
      if (i > 2) {
        jitterDirection(direction);
      }

      // Trend upwards
      direction.add(new Vec(0, 0.5, 0));

      // TODO why splice?
      // copy.splice(i + 1, 0, Node({
      copy.push(Node({
        radius: node.radius,
        direction: direction,
        growthRate: node.growthRate,
        branchRotation: node.branchRotation + Math.PI * 2 / 3,
      }));
    }

    // TODO should radius be absolute or relative?
    node.radius += node.growthRate;
    // node.length += node.growthRate;

    // TODO would be interesting if the branch did actually rotate because the trunk was rotating
    // TODO need better branch distribution. Rotation is not related to distance from last node.
    //      or existing branch
    // if (!node.hasBranch) {
    //   node.branchRotation += 0.2;
    // }

    // TODO Do you see newer branches below older branches? Does a node's ability to branch
    //      ever expire?
    // TODO relate branch point to age and distance to tip to simulate auxin and keep branches
    //      for forming at the base of the trunk.
    if (
      !node.hasBranch
      && node.canBranch
      && node.age > 5
      && i > 2
      // && i - lastBranchIndex > 3
      && Math.random() < node.branchChance
    ) {

        node.hasBranch = true;
        node.canBranch = false;

        // Get a direction perpendicular to the base branch (parent node)
        var perpendicular = node.direction.clone().cross(Y_AXIS).normalize();

        var branchDirection = perpendicular
          .clone()
          // Tilt slightly upwards
          .add(new Vec(0, 0.7, 0))
          // Rotate around the trunk
          .applyAxisAngle(node.direction, node.branchRotation);

        node.branch = [
          Node({
            direction: branchDirection,
            growthRate: node.growthRate * 0.5,
          })
        ];
    }

    if (node.hasBranch) {
      // TODO allow multiple branches
      node.branch = iterate(node.branch);
      lastBranchIndex = i;
    }
  }
  return copy;
}


function Node(initial) {
  return Object.assign({
    age: 0,
    radius: 0,
    length: 0.5,
    direction: Y_AXIS.clone(),
    offset: new Vec(0, 0, 0),
    canBranch: true,
    hasBranch: false,
    branchChance: 0.3,
    branchRotation: 0,
    growthRate: 0.02,
  }, initial);
}


function systemToGeometry(system, startPosition) {

  // TODO shapes need to move into nodes, but that conflicts with being able to interpolate
  //      along a path? Could drop interpolation and use the closest shape, and then consider
  //      implementing shape interpolation in the future.
  var branches = new THREE.Geometry();
  var leaves = new THREE.Geometry();
  var path = new THREE.CatmullRomCurve3([startPosition]);
  var radiusCurve = new THREE.SplineCurve();

  for (var i = 0; i < system.length; i++) {
    var node = system[i];
    var offset = i / (system.length - 1);
    radiusCurve.points.push(new common.Vec2(offset, node.radius));

    var lastPoint = path.points[path.points.length - 1];
    var nextPoint = node.direction
      .clone()
      .setLength(node.length)
      .add(lastPoint);
    path.points.push(nextPoint);

    if (i == system.length - 1) {
      leaves.vertices.push(lastPoint);
    }

    // TODO allow multiple branches from one node?
    if (node.hasBranch) {
      var branchGeometries = systemToGeometry(node.branch, nextPoint);
      branches.merge(branchGeometries.branches);
      leaves.merge(branchGeometries.leaves);
    }
  }

  var trunkGeometry = extrude(5, path, function(offset) {
    var radius = radiusCurve.getPoint(offset).y;
    return circle(radius, 5);
  });

  // TODO strangely, the branches don't render without the trunk
  branches.merge(trunkGeometry);

  return {
    branches: branches,
    leaves: leaves,
  };
}


var system = [Node()];

// TODO an interesting idea is to have a fixed amount of energy which can be distributed
//      throughout the system on each iteration. This might have the effect of modulating
//      trunk/branch growth as the tree gets bigger.

for (var i = 0; i < 30; i++) {
  system = iterate(system);
}

var startPosition = new Vec(0, 0, 0);
var geometries = systemToGeometry(system, startPosition);

console.log("Branches vertex count", geometries.branches.vertices.length);
console.log("Leaves vertex count", geometries.leaves.vertices.length);

geometries.branches.computeBoundingSphere();
// Face normals are needed when rendering Lambert/Phong or other materials affected by light
geometries.branches.computeFaceNormals();
// Vertex normals are used to render a smoothed mesh
geometries.branches.computeVertexNormals();


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

// var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// wireframeMaterial.wireframe = true;
// var wireframe = new THREE.Mesh(geometry, wireframeMaterial);

var group = new THREE.Group();
group.add(tree);
group.add(leaves);
// group.add(wireframe);

return group;


}
