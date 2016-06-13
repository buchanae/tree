var THREE = require('three');
var common = require('./common');
var X_AXIS = common.X_AXIS;
var Y_AXIS = common.Y_AXIS;
var Z_AXIS = common.Z_AXIS;
var Vec = common.Vec;
var Vec2 = common.Vec2;
var randomRange = common.randomRange;
var randomSmallRotation = common.randomSmallRotation;
var randomRotation = common.randomRotation;

module.exports = function Version1() {
  var geometry = new THREE.Geometry();

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



  // TODO need a way to organize all the various parameters available
  // - when and where to branch
  // - radius of slice
  // - shape of slice
  // - length of branch
  // - position of slice
  // - direction of slice



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

  function makeShape(radius) {
    var shape = new THREE.Shape();
    shape.absarc( 0, 0, radius, 0, Math.PI * 2, false );
    var divisions = 5;
    return shape.extractPoints(divisions).shape;
  }


  function makeBranch(geometry, startRadius, divisions, curve) {

    var slices = [];

    for (var i = 0; i < divisions; i++) {
      var t = i / divisions;
      var normal = curve.getTangent(t);
      var position = curve.getPoint(t);
      var radius = (1 - t) * startRadius;
      var shape = makeShape(radius);
      var slice = makeSlice(position, normal, shape);
      slices.push(slice);
    }

    addSlices(geometry, slices);
  }

  function generateTrunkCurve() {
    var numberOfSlices = 10;
    var points = [new Vec(0, 0, 0), new Vec(0, 1, 0)];

    for (var i = 2; i < numberOfSlices; i++) {
      points.push(new Vec(
        Math.random(),
        i,
        Math.random()
      ));
    }

    return new THREE.CatmullRomCurve3(points);
  }


  function generateBranchCurve(start, length) {
    var numberOfSlices = 5;
    var sliceLength = length / numberOfSlices;
    var points = [start.clone()];

    var overallDirection = X_AXIS.clone();
    // Tilt the branch slightly upward
    overallDirection.applyAxisAngle(Z_AXIS, Math.abs(randomSmallRotation()));
    // Point the branch in a random direction about the Y axis
    overallDirection.applyAxisAngle(Y_AXIS, randomRotation());

    var last = start.clone();

    for (var i = 0; i < numberOfSlices; i++) {
      var pointDirection = overallDirection.clone();

      pointDirection.applyAxisAngle(X_AXIS, randomSmallRotation());
      pointDirection.applyAxisAngle(Y_AXIS, randomSmallRotation());
      pointDirection.applyAxisAngle(Z_AXIS, randomSmallRotation());

      var point = pointDirection.clone().setLength(sliceLength).add(last);
      points.push(point);
      last = point;
    }

    return new THREE.CatmullRomCurve3(points);
  }





  var trunkCurve = generateTrunkCurve();
  makeBranch(geometry, 1, 10, trunkCurve);

  var branchMaxLength = 5;
  var branchMaxRadius = 0.5;
  var numberOfBranches = 20;

  for (var i = 0; i < numberOfBranches; i++) {

    // Offset from the base of trunk
    // No branches within first 20% or last 10% of trunk.
    var trunkOffset = randomRange(.2, .9);

    // Age factor is related to trunkOffset
    // It is between 0 and 1
    // It is higher when the trunkOffset is lower.
    var ageFactor = 1 - trunkOffset;

    var branchLength = ageFactor * branchMaxLength;
    var branchStart = trunkCurve.getPoint(trunkOffset);
    var branchCurve = generateBranchCurve(branchStart, branchLength);
    var branchStartRadius = ageFactor * branchMaxRadius;
    makeBranch(geometry, branchStartRadius, 10, branchCurve);
  }


  console.log("Vertex count", geometry.vertices.length);
  geometry.computeBoundingBox();


  var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
  var tree = new THREE.Mesh( geometry, material );

  var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  wireframeMaterial.wireframe = true;
  var wireframe = new THREE.Mesh(geometry, wireframeMaterial);

  var group = new THREE.Group();
  group.add(tree);
  group.add(wireframe);

  return group;
}
