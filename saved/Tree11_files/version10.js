/*
Ideas / Wants / TODOs

per-leaf size

have a fixed amount of energy which can be distributed
throughout the system on each iteration. This might have the effect of modulating
trunk/branch growth as the tree gets bigger.

****************************************************************************/

var saveEl = document.getElementById("saved");
var container = document.getElementById("container");

function Version10() {
  console.log("Tree version 10");

  var info = {
    msg: "",
  };

  var levelOpts = {
    jitterShape: 0,
    jitterDirection: 0.01,
    jitterFreq: 0.1,
    thickness: 1,
    decay: 0.01,
    spacing: 5,
    upness: 0.01,

    leafDistance: 5,
    numberOfLeaves: 5,

    minJitterIndex: 3,
    maxBranchDepth: 2,
    minBranchIndex: 10,
    minBranchAge: 1,
    maxBranchAge: 100,
    branchChance: 0,
  };

  var opts = {
    years: 25,
    seed: Math.floor(Math.random() * 1000),
    //shapeDivisions: 10,
    //initialRadius: 10,
    play: false,
    //wireframe: false,
    color: "#af1a1a",
    //leafColor: "#00ff00",
    //wireframeColor: "#00ff00",
    levels: [
      Object.assign({}, levelOpts),
      Object.assign({}, levelOpts),
      Object.assign({}, levelOpts),
      Object.assign({}, levelOpts),
    ],
    drawLeaves: false,
  }

  if (saveEl.value != "") {
    opts = JSON.parse(atob(saveEl.value));
  }

  var gui = new dat.GUI();
  var bmaterial = new THREE.MeshLambertMaterial({
    color: opts.color,
    skinning: true,
  });
  var cmaterial = new THREE.MeshLambertMaterial({
    color: "green",
    skinning: true,
  });
  var root = new THREE.Group();

	//function SphereGeometry( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength ) {
  var bx = new THREE.SphereGeometry(10, 10, 10);
  //var bx = new THREE.BoxGeometry(30, 30, 30, 1, 1, 1);
  var box = new THREE.BoxGeometry(2, 2, 2, 1, 1, 1);
  var boxMesh = new THREE.Mesh( box, cmaterial );
  root.add(boxMesh);
  var treeGroup = new THREE.Group();
  root.add(treeGroup);

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
      treeGroup.remove.apply(treeGroup, treeGroup.children);

      /*
      visitNodes(trunk, function(n) {
        n.bone.add(m)
      });
      */

      treeGroup.add(trunk[0].bone);
      showcase.fit();
      showcase.render();

      saveEl.value = btoa(JSON.stringify(opts));
    },
  };

  var showcase = Showcase(root, opts, container);
  gui.add(ctrl, "refresh");
  gui.add(showcase, "fit");
  gui.add(info, "msg").listen();
  gui.add(opts, "play").onChange(function() {
    showcase.play();
  });
  gui.add(root.rotation, "y", 0, Math.PI * 2).onChange(function() {
    showcase.render();
  });

  var ctrlGui = gui.addFolder("Control")
  ctrlGui.add(opts, "years", 1, 100).onChange(ctrl.refresh);
  ctrlGui.add(opts, "seed", 0, 1000).onFinishChange(ctrl.refresh);
  //ctrlGui.add(opts, "shapeDivisions", 3, 20).step(1).onChange(ctrl.refresh);
  ctrlGui.addColor(opts, "color").onChange(function() {
    bmaterial.color.setStyle(opts.color);
    showcase.render();
  });
  ctrlGui.add(opts, "drawLeaves").onChange(ctrl.refresh);

  var levelNames = ["Trunk", "First", "Second", "Third"]
  for (var i = 0; i < opts.levels.length; i++) {
    var name = levelNames[i];
    var o = opts.levels[i];
    var g = gui.addFolder(name)

    g.add(o, "thickness", 0, 2).step(0.01).onChange(ctrl.refresh);
    g.add(o, "decay", 0, 0.5).step(0.001).onChange(ctrl.refresh);
    g.add(o, "spacing", 0, 50).step(1).onChange(ctrl.refresh);
    g.add(o, "upness", -1, 1).step(0.01).onChange(ctrl.refresh);
    g.add(o, "jitterShape", 0, 2).step(0.03).onChange(ctrl.refresh);
    g.add(o, "jitterFreq", 0, 1).step(0.01).onChange(ctrl.refresh);
    g.add(o, "jitterDirection", 0, 0.5).step(0.01).onChange(ctrl.refresh);
    g.add(o, "minJitterIndex", 0, 50).step(1).onChange(ctrl.refresh);
    g.add(o, "maxBranchDepth", 1, 20).step(1).onChange(ctrl.refresh);
    g.add(o, "minBranchIndex", 1, 20).step(1).onChange(ctrl.refresh);
    g.add(o, "maxBranchAge", 1, 20).step(1).onChange(ctrl.refresh);
    g.add(o, "minBranchAge", 1, 50).step(1).onChange(ctrl.refresh);
    g.add(o, "branchChance", 0, 1).onChange(ctrl.refresh);
    g.add(o, "leafDistance", 1, 20).onChange(ctrl.refresh);
    g.add(o, "numberOfLeaves", 0, 20).onChange(ctrl.refresh);
  }

  ctrl.refresh();
  showcase.fit();




function Node(initial) {
  return Object.assign({
    index: 0,
    depth: 0,
    age: 1,
    // Each node may have a list of branches starting at this node.
    branches: [],
    // Each node may have a list of leaves attached to this node.
    leaves: [],
    bone: new THREE.Mesh(bx, bmaterial),
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
  });
  newNode.bone.position.y = lopts.spacing;
  tip.bone.add(newNode.bone);
  newNode.bone.scale.set(1.0 - lopts.decay, 1.0 - lopts.decay, 1.0 - lopts.decay);

  if (rand.nextFloat() < lopts.jitterFreq && newNode.index > lopts.minJitterIndex) {
    newNode.bone.rotation.x = randomBetween(-lopts.jitterDirection, lopts.jitterDirection);
    newNode.bone.rotation.z = randomBetween(-lopts.jitterDirection, lopts.jitterDirection);
  }

  // Trend upwards
  /*
  if (newNode.depth > 0 && newNode.depth < 3) {
    newNode.direction.y += lopts.upness;
  }

  if (newNode.index > lopts.minJitterIndex) {
  }

  jitterShape(newNode.shape, lopts.jitterShape);
  */

  branch.push(newNode);

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
    for (var j = 0; j < branch[i].branches.length; j++) {
      GrowBranch(branch[i].branches[j], year, opts)
    }
  }
}

function GrowNode(n, year, opts) {
  var lopts = opts.levels[n.depth];
  n.age += 1;

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
  //if (n.depth == 0 && n.index == 1 && n.branches.length == 0) {
    var bopts = opts.levels[n.depth + 1];
    //var direction = perpendicularToBranchDirection(n);
    //direction.y += bopts.upness;

    // Jitter direction
    //jitterDirection(direction, bopts.jitterDirection, 0.0, bopts.jitterDirection)

    // Rotate around the trunk
    //direction.applyAxisAngle(n.direction, randomAngle());

    var newNode = Node({
      depth: n.depth + 1,
    });
    n.bone.add(newNode.bone);
    //newNode.bone.rotation.x = 0.5;//randomBetween(-0.5, 0.5);
    newNode.bone.rotation.y = randomBetween(0, Math.PI * 2)//Math.PI;//opts.rotation;//year;//randomBetween(-15, 15);
    newNode.bone.rotation.z = randomBetween(0.5, 1.5);
    //newNode.bone.scale.z = 30;

    n.branches.push([newNode]);
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
