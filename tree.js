var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );




var Vec = THREE.Vector3;
var UP = new Vec(0, 1, 0);
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
  q.setFromUnitVectors(UP, normal);

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
  var divisions = 10;
  return shape.extractPoints(divisions).shape;
}


function makeBranch(geometry) {
  var spline = new THREE.SplineCurve3([
    new Vec(0, 0, 0),
    new Vec(0, 1, 0),
    new Vec(1, 1, 0),
    new Vec(1, 4, 0),
    new Vec(3, 4, 0),
    new Vec(3, 4, 1),
    new Vec(3, 4, 4),
    new Vec(3, 5, 4),
  ]);

  var iterations = 50;
  var start_radius = 1;
  var slices = [];

  for (var i = 0; i < iterations; i++) {
    var t = i / iterations;
    var normal = spline.getTangent(t);
    var position = spline.getPoint(t);
    var radius = (1 - t) * start_radius;
    var shape = makeShape(radius);
    var slice = makeSlice(position, normal, shape);
    slices.push(slice);
  }

  addSlices(geometry, slices);
}

makeBranch(geometry);

// TrunkData.branches.push(generatePath({
//   position: new Vec(0, 3, 0),
//   normal: new Vec(1, 1, 0),
//   radius: 0.5
// }));
// makeBranch(geometry, TrunkData.branches[0]);



geometry.computeBoundingSphere();


var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
var tree = new THREE.Mesh( geometry, material );
scene.add( tree );

var wireframe = new THREE.WireframeHelper(tree, 0x00ff00 );
scene.add(wireframe);
scene.add( new THREE.AmbientLight( 0x111111 ) );

var directionalLight = new THREE.DirectionalLight( /*Math.random() * */ 0xffffff);

directionalLight.position.x = 25;
directionalLight.position.y = 25;
directionalLight.position.z = 25;
// directionalLight.position.normalize();
scene.add( directionalLight );

camera.position.y = 2;
camera.position.z = 10;
// camera.lookAt(new Vec(0, 0, 0));

// tree.rotation.y += Math.PI / 2;
setInterval(function() {
  tree.rotation.y += 0.05;
}, 50);


function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();
