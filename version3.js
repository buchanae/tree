
function Version3() {


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


  function Trunk() {
    this.numberOfSlices = 10;
    this.startRadius = 1;
    this.shapeDivisions = 5;
    this.curve = this.calcCurve();
    this.geometry = this.calcGeometry();
  }

  Trunk.prototype.calcRadiusAt = function(offset) {
    return (1 - offset) * this.startRadius;
  };

  Trunk.prototype.calcShape = function(radius) {
    var shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    return shape.extractPoints(this.shapeDivisions).shape;
  };

  Trunk.prototype.calcShapeAtOffset = function(offset) {
    var radius = (1 - offset) * this.startRadius;
    return this.calcShape(radius);
  };

  Trunk.prototype.calcGeometry = function() {
    return extrude(this.numberOfSlices, this.curve, this.calcShapeAtOffset.bind(this));
  };

  Trunk.prototype.calcCurve = function() {
    var points = [
      new Vec(0, 0, 0),
      new Vec(0, 1, 0)
    ];

    for (var i = 2; i < this.numberOfSlices; i++) {
      points.push(new Vec(
        Math.random(),
        i,
        Math.random()
      ));
    }

    return new THREE.CatmullRomCurve3(points);
  };


  function Branch(trunk) {
    this.trunk = trunk;
    this.shapeDivisions = 5;
    this.trunkOffset = this.calcTrunkOffset();
    this.maxLength = this.calcMaxLength();
    this.maxRadius = this.calcMaxRadius();
    this.numberOfSlices = this.calcNumberOfSlices();
    this.startVector = this.calcStartVector();
    this.startRadius = this.calcStartRadius();
    this.length = this.calcLength();
    this.overallDirection = this.calcOverallDirection();
    this.curve = this.calcCurve();
    this.geometry = this.calcGeometry();
  }

  Branch.prototype.calcMaxLength = function() {
    return 7;
  };

  Branch.prototype.calcMaxRadius = function() {
    return this.trunk.calcRadiusAt(this.trunkOffset);
  };

  Branch.prototype.calcRadiusAt = function(offset) {
    return (1 - offset) * this.startRadius;
  };

  Branch.prototype.calcNumberOfSlices = function() {
    return 5;
  };

  Branch.prototype.calcTrunkOffset = function() {
    // Offset from the base of trunk
    // No branches within first 30% or last 10% of trunk.
    return randomRange(.3, .9);
  };

  Branch.prototype.calcStartVector = function() {
    return this.trunk.curve.getPoint(this.trunkOffset);
  };

  Branch.prototype.calcStartRadius = function() {
    return this.maxRadius * (1 - this.trunkOffset);
  };

  Branch.prototype.calcLength = function() {
    return this.maxLength * (1 - this.trunkOffset);
  };

  Branch.prototype.calcSliceXAxisRotation = function() {
    return randomSmallRotation() * 4;
  };

  Branch.prototype.calcSliceYAxisRotation = function() {
    return randomSmallRotation() * 4;
  };

  Branch.prototype.calcSliceZAxisRotation = function() {
    return randomSmallRotation() * 4;
  };

  Branch.prototype.calcOverallDirection = function() {
    var overallDirection = X_AXIS.clone();
    // Tilt the branch slightly upward
    overallDirection.applyAxisAngle(Z_AXIS, Math.abs(randomSmallRotation() * 4));
    // Point the branch in a random direction about the Y axis
    overallDirection.applyAxisAngle(Y_AXIS, randomRotation());
    return overallDirection;
  };

  Branch.prototype.calcSliceLength = function() {
    return this.length / this.numberOfSlices;
  };

  Branch.prototype.calcCurve = function() {
    var start = this.startVector.clone();
    var points = [start];
    var last = start;

    for (var i = 0; i < this.numberOfSlices; i++) {
      var pointDirection = this.overallDirection.clone();

      pointDirection.applyAxisAngle(X_AXIS, this.calcSliceXAxisRotation());
      pointDirection.applyAxisAngle(Y_AXIS, this.calcSliceYAxisRotation());
      pointDirection.applyAxisAngle(Z_AXIS, this.calcSliceZAxisRotation());

      var sliceLength = this.calcSliceLength();
      var point = pointDirection.setLength(sliceLength).add(last);
      points.push(point);
      last = point;
    }

    return new THREE.CatmullRomCurve3(points);
  };

  Branch.prototype.calcShape = function(radius) {
    var shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    return shape.extractPoints(this.shapeDivisions).shape;
  };

  Branch.prototype.calcShapeAtOffset = function(offset) {
    var radius = this.calcRadiusAt(offset);
    return this.calcShape(radius);
  };

  Branch.prototype.calcGeometry = function() {
    return extrude(this.numberOfSlices, this.curve, this.calcShapeAtOffset.bind(this));
  };


  var geometry = new THREE.Geometry();
  var trunk = new Trunk();
  geometry.merge(trunk.geometry);

  for (var i = 0; i < 10; i++) {
    var branch = new Branch(trunk);
    geometry.merge(branch.geometry);

    for (var j = 0; j < 10; j++) {
      var subbranch = new Branch(branch);
      geometry.merge(subbranch.geometry);
    }
  }


  console.log("Vertex count", geometry.vertices.length);
  geometry.computeBoundingSphere();


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
