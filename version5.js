
function Version5() {


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
      slice.direction.applyAxisAngle(X_AXIS, 0);
      slice.direction.applyAxisAngle(Y_AXIS, 0);
      slice.direction.applyAxisAngle(Z_AXIS, 0);
    }
  }

  function trunkRandomRadiusAtOffset(startRadius, offset) {
    return (1 - offset) * (startRadius + (Math.random() * 0.25 - 0.5));
  }


  var trunk = {
    branches: [],
    numberOfSlices: 10,
    height: 10,
    startRadius: 1,
  };
  trunk.path = new THREE.LineCurve3(new Vec(0, 0, 0), new Vec(0, trunk.height, 0));

  var radiusCurvePoints = [new Vec2(0, 1)];

  // Taper and randomize radii
  for (var i = 0; i < 10; i++) {
    var offset = i / 10;
    radiusCurvePoints.push(new Vec2(
      offset,
      trunkRandomRadiusAtOffset(trunk.startRadius, offset)
    ));
  }
  radiusCurvePoints.push(new Vec2(1, 0.05));
  trunk.radiusCurve = new THREE.SplineCurve(radiusCurvePoints);

  trunk.geometry = extrude(trunk.numberOfSlices, trunk.path, function(offset) {
    var radius = trunk.radiusCurve.getPoint(offset).y;
    return circle(radius);
  });

  var geometry = new THREE.Geometry();
  geometry.merge(trunk.geometry);


  function makeBranch(offset, rotation, trunk) {

    var length = (1 - offset) * trunk.height * 0.9;

    var direction = X_AXIS.clone();
    direction.applyAxisAngle(Y_AXIS, rotation);
    // Tilt the branch slighly upward
    direction.add(new Vec(0, 0.5, 0));

    // Figure out the starting radius from the radius of the trunk at the start position
    var startRadius = trunk.radiusCurve.getPoint(offset).y * 0.8;

    var startPosition = trunk.path.getPoint(offset);
    var endPosition = startPosition.clone().add(direction.setLength(length));

    var path = new THREE.CatmullRomCurve3([ startPosition, endPosition ]);

    // Add a slight bend
    var midPoint = path.getPoint(0.5);
    midPoint.add(new Vec(0, 0.5, 0));
    path.points.splice(1, 0, midPoint);

    var radiusCurve = new THREE.LineCurve(new Vec2(0, startRadius), new Vec2(1, 0));

    var geometry = extrude(5, path, function(offset) {
      var radius = radiusCurve.getPoint(offset).y;
      return circle(radius);
    });

    return {
      path: path,
      length: length,
      geometry: geometry,
      radiusCurve: radiusCurve,
    };
  }

  function makeSubBranch(offset, rotation, parent) {
    var length = (1 - offset) * parent.length * 0.7;
    // var startRadius = parent.radiusCurve.getPoint(offset).y * 0.3;
    var startRadius = 0.02;

    var startPosition = parent.path.getPoint(offset);

    var direction = parent.path.getPoint(offset + 0.1)
      .sub(startPosition)
      .normalize();

    var perpendicular = direction
      .clone()
      .cross(UP)
      .normalize();

    var endPosition = perpendicular
      .clone()
      .setLength(length)
      .applyAxisAngle(direction, rotation)
      .add(startPosition);

    var path = new THREE.CatmullRomCurve3([ startPosition, endPosition ]);
    var geometry = extrude(5, path, function(offset) {
      return circle(startRadius);
    });
    return {
      geometry: geometry
    };
  }

  var offset = 0.3;
  var rotation = 0;

  for (var i = 0; i < 30; i++) {
    var branch = makeBranch(offset, rotation, trunk);
    geometry.merge(branch.geometry);

    var suboffset = 0.5;

    for (var j = 0; j < 10; j++) {
      var subbranch = makeSubBranch(suboffset, Math.PI * 0.25, branch);
      geometry.merge(subbranch.geometry);

      var subbranch = makeSubBranch(suboffset, Math.PI * 0.75, branch);
      geometry.merge(subbranch.geometry);

      suboffset += 0.03;
    }

    offset += 0.02;
    rotation += 1.1;
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
