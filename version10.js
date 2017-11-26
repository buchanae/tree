/*
Ideas / Wants / TODOs

per-leaf size

have a fixed amount of energy which can be distributed
throughout the system on each iteration. This might have the effect of modulating
trunk/branch growth as the tree gets bigger.

****************************************************************************/


//var THREE = require('three');
var common = require('./common');
var Vec = common.Vec;
var main = require('./main');

module.exports = function Version10(container) {
  console.log("Tree version 10");

  var gui = new dat.GUI();
  var root = new THREE.Group();
  var info = {
    msg: "",
  };
  var opts = {
    years: 25,
    seed: 11,
    shapeDivisions: 10,
    render: true,
    rotate: true,
    wireframe: false,
    color: "#874242",
    leafColor: "#00ff00",
    wireframeColor: "#00ff00",
    levels: [],
    drawLeaves: false,
  }

  var levelOpts = {
    jitterShape: 0,
    jitterDirection: 0.01,
    thickness: 0,
    growth: 0,
    upness: 0.01,

    leafDistance: 5,
    numberOfLeaves: 5,

    minJitterIndex: 3,
    maxBranchDepth: 2,
    minBranchIndex: 10,
    minBranchAge: 1,
    maxBranchAge: 100,
    branchChance: 0.1,
  };
                
  var modifer = new THREE.SimplifyModifier();
  var rand = new Random(opts.seed);
  var ctrl = {
    refresh: function() {
      rand = new Random(opts.seed);
      // Everything starts here.
      // The result and return value is a THREE.js geometry, which is rendered by the calling code.
      var trunk = [Node()];

      // Grow tree.
      // Time is measured in "years".
      for (var year = 0; year < opts.years; year++) {
        GrowBranch(trunk, year, opts)
      }

      // Convert tree model to geometry which can be rendered.
      var geometries = buildTreeGeometry(trunk, opts);
      //geometries.branches = modifer.modify(geometries.branches, geometries.branches.vertices.length * 0.5 | 0);
      var geo = trunkToGeometry(geometries, opts);
      info.msg = geometries.branches.vertices.length + " " +
                 geometries.leaves.vertices.length + " " +
                 trunk.length;

      // Reset group
      root.remove.apply(root, root.children)
      root.add(geo);
      showcase.fit();
    },
  };

  var showcase = main.Showcase(root, opts, container);
  gui.add(ctrl, "refresh");
  gui.add(showcase, "fit");
  gui.add(info, "msg").listen();
  gui.add(opts, "rotate");
  gui.add(opts, "render");
  gui.add(root.rotation, "y", 0, Math.PI * 2);
  gui.add(opts, "wireframe").onChange(ctrl.refresh);

  var ctrlGui = gui.addFolder("Control")
  ctrlGui.add(opts, "years", 1, 100).onChange(ctrl.refresh);
  ctrlGui.add(opts, "seed", 0, 1000).onFinishChange(ctrl.refresh);
  ctrlGui.add(opts, "shapeDivisions", 3, 20).step(1).onChange(ctrl.refresh);
  ctrlGui.addColor(opts, "color").onChange(ctrl.refresh);
  ctrlGui.addColor(opts, "leafColor").onChange(ctrl.refresh);
  ctrlGui.add(opts, "drawLeaves").onChange(ctrl.refresh);

  function addLevel(name) {
    var g = gui.addFolder(name)
    var o = Object.assign({}, levelOpts);
    opts.levels.push(o)
    g.add(o, "thickness", 0, 10).onChange(ctrl.refresh);
    g.add(o, "growth", 0, 0.1).onChange(ctrl.refresh);
    g.add(o, "upness", -1, 1).step(0.01).onChange(ctrl.refresh);
    g.add(o, "jitterShape", 0, 2).step(0.03).onChange(ctrl.refresh);
    g.add(o, "jitterDirection", 0, 0.1).step(0.01).onChange(ctrl.refresh);
    g.add(o, "minJitterIndex", 0, 50).step(1).onChange(ctrl.refresh);
    g.add(o, "maxBranchDepth", 1, 20).step(1).onChange(ctrl.refresh);
    g.add(o, "minBranchIndex", 1, 20).step(1).onChange(ctrl.refresh);
    g.add(o, "maxBranchAge", 1, 20).step(1).onChange(ctrl.refresh);
    g.add(o, "minBranchAge", 1, 50).step(1).onChange(ctrl.refresh);
    g.add(o, "branchChance", 0, 1).onChange(ctrl.refresh);
    g.add(o, "leafDistance", 1, 20).onChange(ctrl.refresh);
    g.add(o, "numberOfLeaves", 0, 20).onChange(ctrl.refresh);
  }
  addLevel("Trunk")
  addLevel("First")
  addLevel("Second")
  addLevel("Third")
  //ctrl.refresh();

  //gui.remember(opts);


  ctrl.refresh();
  showcase.fit();

function Node(initial) {
  return Object.assign({
    index: 0,
    depth: 0,
    age: 1,
    length: 0.05,
    scale: 1,
    direction: common.UP.clone(),
    // Each node may have a list of branches starting at this node.
    branches: [],
    // Each node may have a list of leaves attached to this node.
    leaves: [],
    branchRotation: 0,
    shape: circle(0.01, opts),
  }, initial);
}


// This is the main controller of the model.
function GrowBranch(branch, year, opts) {

  var tipIndex = branch.length - 1;
  var tip = branch[tipIndex];
  var lopts = opts.levels[tip.depth];
  var newNode = Node({
    index: branch.length,
    depth: tip.depth,
    direction: tip.direction.clone(),
  });

  // Trend upwards
  if (newNode.depth > 0 && newNode.depth < 3) {
    newNode.direction.y += lopts.upness;
  }

  if (newNode.index > lopts.minJitterIndex) {
    jitterDirection(newNode.direction, lopts.jitterDirection, 0.001, lopts.jitterDirection);
  }

  jitterShape(newNode.shape, lopts.jitterShape);

  branch.push(newNode);

  // Generate leaves
  for (var i = 0; i < lopts.numberOfLeaves; i++) {
    // TODO interesting that this affects tree shape,
    //      because it's consuming random numbers that would otherwise
    //      be used to shape the branches/nodes.
    var color = new THREE.Color();
    color.setHSL(0, rand.nextFloat(), rand.nextFloat() + 0.2);
    newNode.leaves.push({
      vertex: randomVector().setLength(lopts.leafDistance),
      //color: color,
    })
  }


  for (var i = 0; i < branch.length; i++) {
    GrowNode(branch[i], year, opts)
    for (var j = 0; j < branch[i].branches.length; j++) {
      GrowBranch(branch[i].branches[j], year, opts)
    }
  }
}

function GrowNode(n, year, opts) {
  var lopts = opts.levels[n.depth];
  n.age += 1;
  n.scale += lopts.thickness;
  n.length += lopts.growth;

/*
  // Diminish the leaves with age
  if (n.leaves.length > 0) {
    if (n.age > 7) {
      n.leaves.length = 0;
    } else if (n.age > 3) {
      n.leaves.length -= Math.floor(rand.nextFloat() * 0.3 * n.leaves.length);
    }
  }

  // Scale shape
  if (n.age > 10) {
    n.scale += opts.thickness;
  } else {
    n.scale += 1;
  }
*/


  if (
    n.branches.length == 0
    && n.depth < lopts.maxBranchDepth
    && n.index > lopts.minBranchIndex
    && n.age > lopts.minBranchAge
    && n.age < lopts.maxBranchAge
    && rand.nextFloat() < lopts.branchChance
  ) {
    var bopts = opts.levels[n.depth + 1];
    var direction = perpendicularToBranchDirection(n);
    direction.y += bopts.upness;

    // Jitter direction
    jitterDirection(direction, bopts.jitterDirection, 0.0, bopts.jitterDirection)

    // Rotate around the trunk
    direction.applyAxisAngle(n.direction, randomAngle());

    var newNode = Node({
      direction: direction,
      depth: n.depth + 1,
    });

    n.branches.push([newNode]);
  }
}




// Utilities
/****************************************************************************/


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
      //geometry.faces.push(new Face3(B_index, A_index, A_first_index));
      //geometry.faces.push(new Face3(B_index, A_first_index, B_first_index));
    } else {
      var A_next_index = A[i + 1];
      var B_next_index = B[i + 1];
      geometry.faces.push(new Face3(A_index, B_index, B_next_index));
      geometry.faces.push(new Face3(A_index, B_next_index, A_next_index));
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

function circle(radius, opts) {
  var shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return shape.getPoints(opts.shapeDivisions);
}


// Get a direction perpendicular to the base branch (parent node)
function perpendicularToBranchDirection(node) {
  var crossWith = common.Y_AXIS;
  if (node.direction.equals(common.Y_AXIS)) {
    crossWith = common.X_AXIS;
  }
  return node.direction.clone().cross(crossWith).normalize();
}

function randomVector() {
  return new Vec(
    rand.nextFloat() * 2 - 1,
    rand.nextFloat() * 2 - 1,
    rand.nextFloat() * 2 - 1);
}

function randomAngle() {
  return rand.nextFloat() * Math.PI * 2;
}

function jitterDirection(direction, x, y, z) {
    var xRange = Math.PI * 2 * x;
    var yRange = Math.PI * 2 * y;
    var zRange = Math.PI * 2 * z;
    direction.applyAxisAngle(common.X_AXIS, rand.nextFloat() * xRange - xRange / 2);
    direction.applyAxisAngle(common.Y_AXIS, rand.nextFloat() * yRange - yRange / 2);
    direction.applyAxisAngle(common.Z_AXIS, rand.nextFloat() * zRange - zRange / 2);
}

function jitterShape(shape, amt) {
  // TODO would be interesting to explore a method for jitter that is not
  //      per-point, such as superimposing jitter path over the shape,
  //      so that jitter is applied more smoothly.
  // TODO add ability to twist

  // TODO currently skipping first and last points to avoid breaking of seam
  for (var i = 1; i < shape.length - 1; i++) {
    shape[i].multiplyScalar(1 + (rand.nextFloat() * amt));
  }
}


// Modifies a shape's vertices to be positions,
// transformed to the node's position, direction, and scale.
function orientNodeShape(node) {
  var vertices = [];
  var q = new THREE.Quaternion();
  q.setFromUnitVectors(common.Y_AXIS, node.direction);

  for (var i = 0; i < node.shape.length; i++) {
    var point = node.shape[i];
    var vec = new Vec(point.x, 0, point.y);
    vec.multiplyScalar(node.scale);
    vec.applyQuaternion(q);
    vertices.push(vec);
  }
  return new THREE.CatmullRomCurve3(vertices);
}


// Converts a tree of Nodes to a THREE.js geometry for rendering.
function buildTreeGeometry(branch, opts, startPosition) {
  if (startPosition == undefined) {
    startPosition = new Vec(0, 0, 0);
  }

  var branches = new THREE.Geometry();
  var leaves = new THREE.Geometry();
  var nextPosition = startPosition.clone();
  // Keep a path for every point on a node's shape.
  // Each shape has "shapeDivisions" points.
  var paths = [];

  for (var i = 0; i < opts.shapeDivisions + 1; i++) {
    paths.push(new THREE.CatmullRomCurve3());
  }

  for (var z = 0; z < branch.length; z++) {
    var node = branch[z];
    var prevPosition = nextPosition.clone();
    var shape = orientNodeShape(node).getPoints(opts.shapeDivisions);

    // copy the node shape into the list of paths.
    for (var i = 0; i < shape.length; i++) {
      var vertex = shape[i].clone().add(nextPosition);
      paths[i].points.push(vertex);
    }

    // increment the position based on the node's length.
    nextPosition.add(node.direction.clone().setLength(node.length));

    /*
    if (opts.drawLeaves) {
      // create leaf vertices based on node's current position.
      for (var i = 0; i < node.leaves.length; i++) {
        var leaf = node.leaves[i];
        // Transform the leaf vertex to be relative to the node's current position.
        var vertex = leaf.vertex.clone().add(nextPosition);
        leaves.vertices.push(vertex);
        //leaves.colors.push(leaf.color);
      }
    }
    */

    // Build node's branches geometries
    for (var j = 0; j < node.branches.length; j++) {
      var branchGeometries = buildTreeGeometry(node.branches[j], opts, prevPosition);
      branches.merge(branchGeometries.branches);
      //leaves.merge(branchGeometries.leaves);
    }
  }

  var trunkGeometry = extrude(5, paths);
  branches.merge(trunkGeometry);

  branches.computeBoundingBox();
  // Face normals are needed when rendering Lambert/Phong or other materials affected by light
  branches.computeFaceNormals();
  // Vertex normals are used to render a smoothed mesh
  branches.computeVertexNormals();

  return {
    branches: branches,
    leaves: leaves,
  };
}

function trunkToGeometry(geometries, opts) {

  var group = new THREE.Group();


  if (opts.drawLeaves) {
    var leavesMaterial = new THREE.PointsMaterial({
      size: 0.5,
      color: opts.leafColor,
      //vertexColors: THREE.VertexColors,
    });
    var leaves = new THREE.Points(geometries.leaves, leavesMaterial);
    group.add(leaves);
  }

  if (opts.wireframe) {
    var wireframeMaterial = new THREE.MeshBasicMaterial({
      color: opts.wireframeColor,
    });
    wireframeMaterial.wireframe = true;
    var wireframe = new THREE.Mesh(geometries.branches, wireframeMaterial);
    group.add(wireframe);
  }

    var material = new THREE.MeshLambertMaterial({
      color: opts.color,
      //vertexColors: THREE.VertexColors,
    });
    var tree = new THREE.Mesh(geometries.branches, material);
    group.add(tree);

  return group;
}

// End  module
}



/**
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
function Random(seed) {
  this._seed = seed % 2147483647;
  if (this._seed <= 0) this._seed += 2147483646;
}

/**
 * Returns a pseudo-random value between 1 and 2^32 - 2.
 */
Random.prototype.next = function () {
  return this._seed = this._seed * 16807 % 2147483647;
};


/**
 * Returns a pseudo-random floating point number in range [0, 1).
 */
Random.prototype.nextFloat = function (opt_minOrMax, opt_max) {
  // We know that result of next() will be 1 to 2147483646 (inclusive).
  return (this.next() - 1) / 2147483646;
};
