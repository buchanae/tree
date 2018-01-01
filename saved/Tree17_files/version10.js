/*
Ideas / Wants / TODOs

per-leaf size

have a fixed amount of energy which can be distributed
throughout the system on each iteration. This might have the effect of modulating
trunk/branch growth as the tree gets bigger.

ability to branch only from the sides, or at least have them trend towards the sides
  for second level branches, to mimic evergreen trees

ability for a node to have a randomly placed cluster of shapes (box, sphere, etc)
  instead of just a single one

per-node control over vertex/material colors

"upness", but in world coordinates

more advanced trend, e.g. non-linear

shape jitter

reconcile level controls: make consistent. some params are in parent, e.g. chance and upness.

add line geometry type for thin branches

add particle geometry type for leaves? or node type?

separate random number generators for every parameter

GUI:
- control x/y/z with one slider, or optionally each individually
- color range, or color choices
- separate UI for main controls: play, rotate, etc.
- use THREE.js orbit controls for rotation (at least) and maybe zoom/fit

****************************************************************************/

var saveEl = document.getElementById("saved");
var container = document.getElementById("container");

function Version10() {
  console.log("Tree version 10");


  function trunkOpts(gui) {
    var opts = {
      thickness: 0.05,
      growth: 0.01,
      spacing: 5,
      trend: 0.0,
      jitterShape: 0,
      jitterDirection: 0.01,
      jitterFreq: 0,
      minJitterIndex: 3,
      material: "lambert",
      color: "#3d523c",
      geometry: "box",
      //geometry: "cylinder",
    };

    gui.add(opts, "thickness", 0.01, 50.0).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "growth", 0, 1).step(0.001).onChange(ctrl.refresh);
    gui.add(opts, "spacing", 0, 50).step(1).onChange(ctrl.refresh);
    gui.add(opts, "trend", -0.1, 0.1).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "jitterShape", 0, 2).step(0.03).onChange(ctrl.refresh);
    gui.add(opts, "jitterFreq", 0, 1).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "jitterDirection", 0, 0.5).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "minJitterIndex", 0, 50).step(1).onChange(ctrl.refresh);
    gui.addColor(opts, "color").onChange(ctrl.refresh);
    gui.add(opts, "geometry", {
      "Box": "box",
      "Cylinder": "cylinder",
      "Sphere": "sphere",
    }).onChange(ctrl.refresh);
    gui.add(opts, "material", {
      "Basic": "basic",
      "Phong": "phong",
      "Lambert": "lambert",
      "Standard": "standard",
      "Toon": "toon",
      "Physical": "physical",
      "Depth": "depth",
    }).onChange(ctrl.refresh);

    return opts;
  }

  function levelOpts(gui) {
    var opts = {
      jitterShape: 0,
      jitterDirection: 0.01,
      jitterFreq: 0.1,
      thickness: 0.05,

      growth: 0.01,
      spacing: 5,
      upness: 0.0,
      trend: 0.0,

      leafDistance: 5,
      numberOfLeaves: 5,

      minJitterIndex: 3,
      maxBranchDepth: 2,
      minBranchIndex: 10,
      minBranchAge: 1,
      maxBranchAge: 100,
      branchChance: 0,
      geometry: "box",
      material: "lambert",
      color: "#3d523c",
    };
    gui.add(opts, "thickness", 0.01, 10).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "growth", 0, 1).step(0.001).onChange(ctrl.refresh);
    gui.add(opts, "spacing", 0, 50).step(1).onChange(ctrl.refresh);
    gui.add(opts, "upness", -Math.PI / 2, Math.PI / 2).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "trend", -0.1, 0.1).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "jitterShape", 0, 2).step(0.03).onChange(ctrl.refresh);
    gui.add(opts, "jitterFreq", 0, 1).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "jitterDirection", 0, 0.5).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "minJitterIndex", 0, 50).step(1).onChange(ctrl.refresh);
    gui.add(opts, "maxBranchDepth", 1, 20).step(1).onChange(ctrl.refresh);
    gui.add(opts, "minBranchIndex", 1, 200).step(1).onChange(ctrl.refresh);
    gui.add(opts, "maxBranchAge", 1, 20).step(1).onChange(ctrl.refresh);
    gui.add(opts, "minBranchAge", 1, 50).step(1).onChange(ctrl.refresh);
    gui.add(opts, "branchChance", 0, 0.7).step(0.01).onChange(ctrl.refresh);
    gui.add(opts, "leafDistance", 1, 20).onChange(ctrl.refresh);
    gui.add(opts, "numberOfLeaves", 0, 20).onChange(ctrl.refresh);
    gui.addColor(opts, "color").onChange(ctrl.refresh);
    gui.add(opts, "geometry", {
      "Box": "box",
      "Cylinder": "cylinder",
      "Sphere": "sphere",
    }).onChange(ctrl.refresh);
    gui.add(opts, "material", {
      "Basic": "basic",
      "Phong": "phong",
      "Lambert": "lambert",
      "Standard": "standard",
      "Toon": "toon",
      "Physical": "physical",
      "Depth": "depth",
    }).onChange(ctrl.refresh);
    return opts;
  }

  var root = new THREE.Group();

  var materials = {
    basic: THREE.MeshBasicMaterial,
    phong: THREE.MeshPhongMaterial,
    lambert: THREE.MeshLambertMaterial,
    standard: THREE.MeshStandardMaterial,
    toon: THREE.MeshToonMaterial,
    physical: THREE.MeshPhysicalMaterial,
    depth: THREE.MeshDepthMaterial,
  }
  var geometries = {
    cylinder: function(opts) {
      return new THREE.CylinderGeometry(
        opts.thickness, opts.thickness, 1, 15, 2, false);
    },
    sphere: function(opts) {
      return new THREE.SphereGeometry(opts.thickness, opts.thickness, opts.thickness)
    },
    box: function(opts) {
      return new THREE.BoxGeometry(
        opts.thickness, 1, opts.thickness,
        1, 1, 1
      );
    },
  }

  var treeGroup = new THREE.Group();
  //treeGroup.position.x = -60;
  root.add(treeGroup);

  setInterval(function() {
    if (opts.play) {
      treeGroup.rotation.y += 0.05;
    }
  }, 50);


  var ctrl = {
    refresh: function() {
      rand = new Random(opts.seed);
      // Everything starts here.
      // The result and return value is a THREE.js geometry, which is rendered by the calling code.
      var trunk = [Node(0, opts.levels[0])];
      var trunkOpts = opts.levels[0];

      // Grow tree.
      // Time is measured in "years".
      for (var year = 0; year < opts.years; year++) {
        GrowBranch(trunk, year, opts)
      }
      treeGroup.remove.apply(treeGroup, treeGroup.children);

      treeGroup.add(trunk[0].bone);
      showcase.render();
      showcase.fit();

      saveEl.value = btoa(JSON.stringify(opts));
    },
  };


  var opts = {
    years: 30,
    lightIntensity: 2.1,
    seed: Math.floor(Math.random() * 1000),
    play: false,
    wireframe: false,
    levels: [],
  }

  if (saveEl.value != "") {
    opts = JSON.parse(atob(saveEl.value));
  }

  var rand = new Random(opts.seed);
  var showcase = Showcase(root, opts, container);
  var gui = new dat.GUI();

  gui.add(opts, "play").onChange(function() {
    showcase.play();
  });

  treeGroup.rotation.y = 2;
  gui.add(treeGroup.rotation, "y", 0, Math.PI * 2).onChange(function() {
    showcase.render();
  });
  gui.add(opts, "lightIntensity", 0, 5).step(0.1).onChange(ctrl.refresh);
  gui.add(opts, "years", 1, 100).onChange(ctrl.refresh);
  gui.add(opts, "seed", 0, 1000).onFinishChange(ctrl.refresh);

  opts.levels = [
    trunkOpts(gui.addFolder("Trunk")),
    levelOpts(gui.addFolder("First")),
    levelOpts(gui.addFolder("Second")),
    levelOpts(gui.addFolder("Third")),
  ];
  opts.levels[1].branchChance = 0.06;

  ctrl.refresh();




function Node(depth, opts) {
  var geo = geometries[opts.geometry](opts);
  var mat = new materials[opts.material]({
    color: opts.color,
  });
  var mesh = new THREE.Mesh(geo, mat);
  return {
    index: 0,
    depth: depth,
    age: 1,
    // Each node may have a list of branches starting at this node.
    branches: [],
    // Each node may have a list of leaves attached to this node.
    leaves: [],
    bone: mesh,
    geo: geo,
  };
}


// This is the main controller of the model.
// A branch is an array of nodes.
function GrowBranch(branch, year, opts) {

  var root = branch[0];
  var lopts = opts.levels[root.depth];

  // Add a new node at the tip of the branch.
  var tipIndex = branch.length - 1;
  var tip = branch[tipIndex];
  var newNode = Node(tip.depth, lopts);
  branch.push(newNode);

  newNode.index = branch.length;

  // Currently hard-coded to match parameters given to geometry constructors.
  newNode.bone.position.y = 1;//lopts.spacing;
  tip.bone.add(newNode.bone);

  //newNode.bone.scale.set(1.0 - lopts.growth, 1.0, 1.0 - lopts.growth);

  if (rand.nextFloat() < lopts.jitterFreq && newNode.index > lopts.minJitterIndex) {
    newNode.bone.rotation.x = randomBetween(-lopts.jitterDirection, lopts.jitterDirection);
    newNode.bone.rotation.z = randomBetween(-lopts.jitterDirection, lopts.jitterDirection);
  }

  // Trend up/downwards
  newNode.bone.rotation.z += lopts.trend;


  // Generate leaves
  /*
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
  */

  for (var i = 0; i < branch.length; i++) {
    GrowNode(branch[i], year, opts)
  }
}

function GrowNode(n, year, opts) {
  var lopts = opts.levels[n.depth];
  var bopts = opts.levels[n.depth + 1];
  n.age += 1;

  n.geo.scale(1.0 + lopts.growth, 1.0, 1.0 + lopts.growth);//1.0 + opts.growth, 1.0, 1.0 + opts.growth);

  //newNode.bone.scale.set(1.0 - lopts.growth, 1.0, 1.0 - lopts.growth);

/*
  // Diminish the leaves with age
  if (n.leaves.length > 0) {
    if (n.age > 7) {
      n.leaves.length = 0;
    } else if (n.age > 3) {
      n.leaves.length -= Math.floor(rand.nextFloat() * 0.3 * n.leaves.length);
    }
  }

*/


  // Decide whether to create a new branch at this node.
  if (
    // Only if there are no existing branches.
    n.branches.length == 0
    // Only if not too deep in the tree.
    && n.depth < bopts.maxBranchDepth
    // Only if after a certain number of nodes in this branch
    && n.index > bopts.minBranchIndex
    // Only if this branch is greater than a given age.
    && n.age > bopts.minBranchAge
    // Only if this branch is less than a given age.
    && n.age < bopts.maxBranchAge
    // Random chance.
    && rand.nextFloat() < bopts.branchChance
  ) {

    var newNode = Node(n.depth + 1, bopts);
    n.bone.add(newNode.bone);
    //newNode.bone.scale.set(bopts.thickness, bopts.thickness);
    //newNode.bone.scale.set(0, 0, 0);
    newNode.bone.rotation.y = randomBetween(0, Math.PI * 2)
    newNode.bone.rotation.z = (Math.PI / 2) + randomBetween(bopts.upness - 0.2, bopts.upness + 0.2);

    n.branches.push([newNode]);
  }

  for (var j = 0; j < n.branches.length; j++) {
    GrowBranch(n.branches[j], year, opts)
  }
}




// Utilities
/****************************************************************************/



function randomVector() {
  return new THREE.Vector3(
    rand.nextFloat() * 2 - 1,
    rand.nextFloat() * 2 - 1,
    rand.nextFloat() * 2 - 1);
}

function randomAngle() {
  return rand.nextFloat() * Math.PI * 2;
}

function randomBetween(min, max) {
  var range = max - min;
  var r = rand.nextFloat();
  return min + (range * r);
}

function jitterDirection(x, y, z) {
    return [
      (rand.nextFloat() - 0.5),
      0,
      (rand.nextFloat() - 0.5),
    ];
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

function visitNodes(branch, f) {
  for (var i = 0; i < branch.length; i++) {
    f(branch[i]);
  }
  for (var i = 0; i < branch.length; i++) {
    for (var j = 0; j < branch[i].branches.length; j++) {
      visitNodes(branch[i].branches[j], f);
    }
  }
}

function collectBones(branch, bones) {
  for (var i = 0; i < branch.length; i++) {
    bones.push(branch[i].bone);
  }
  for (var i = 0; i < branch.length; i++) {
    for (var j = 0; j < branch[i].branches.length; j++) {
      collectBones(branch[i].branches[j], bones);
    }
  }
}

function collectSkeletons(branch, branches, allBones) {
  var bones = [];
  for (var i = 0; i < branch.length; i++) {
    bones.push(branch[i].bone);
    allBones.push(branch[i].bone);
  }
  branches.push(bones);

  for (var i = 0; i < branch.length; i++) {
    for (var j = 0; j < branch[i].branches.length; j++) {
      collectSkeletons(branch[i].branches[j], branches, allBones)
    }
  }
}



function createSkeletonMesh(count, opts, material) {
  var segmentHeight = 8;
  var segmentCount = count - 1;
  var height = segmentHeight * segmentCount;
  var halfHeight = height * 0.5;

  var sizing = {
    segmentHeight : segmentHeight,
    segmentCount : segmentCount,
    height : height,
    halfHeight : halfHeight
  };

  var geometry = new THREE.CylinderGeometry(
    0.2,                       // radiusTop
    opts.initialRadius,                       // radiusBottom
    sizing.height,           // height
    opts.shapeDivisions,                       // radiusSegments
    sizing.segmentCount, // heightSegments
    false                     // openEnded
  );

  for ( var i = 0; i < geometry.vertices.length; i ++ ) {
    var vertex = geometry.vertices[ i ];
    var y = ( vertex.y + sizing.halfHeight );

    var skinIndex = Math.floor( y / sizing.segmentHeight );
    var skinWeight = ( y % sizing.segmentHeight ) / sizing.segmentHeight;

    geometry.skinIndices.push( new THREE.Vector4( skinIndex, skinIndex + 1, 0, 0 ) );
    geometry.skinWeights.push( new THREE.Vector4( 1 - skinWeight, skinWeight, 0, 0 ) );
  }

  return new THREE.SkinnedMesh( geometry, material );
}


// End  module
}

/*
  if (opts.wireframe) {
    var wireframeMaterial = new THREE.MeshBasicMaterial({
      color: opts.wireframeColor,
    });
    wireframeMaterial.wireframe = true;
    var wireframe = new THREE.Mesh(geometries.branches, wireframeMaterial);
    group.add(wireframe);
  }


  if (opts.drawLeaves) {
    var leavesMaterial = new THREE.PointsMaterial({
      size: 0.5,
      color: opts.leafColor,
      //vertexColors: THREE.VertexColors,
    });
    var leaves = new THREE.Points(geometries.leaves, leavesMaterial);
    group.add(leaves);
  }
  */


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

// Clean up if reloading saved page.
function cleanup() {
  var gui = document.querySelector(".dg")
  if (gui) {
    gui.remove();
  }
  container.innerHTML = "";
}

document.addEventListener("DOMContentLoaded", function() {
  cleanup();
  Version10();
});
