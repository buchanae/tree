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

module.exports = function Version11() {
  console.log("Tree version 11");




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


  function randomVector() {
    return new Vec(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
  }

    function iterateLeaf(n, timestep) {
      var lastAge = n.age;
      n.age += timestep;
      var isNewAge = Math.floor(n.age) > Math.floor(lastAge);

      if (isNewAge) {
        n.dead = n.age > 7 || (n.age > 3 && Math.random() < 0.3);
      }
    }

    /****************************************************************************/

    function newNode(n, emitNode) {
      // TODO node direction does not respect changes to its parent's direction
        //      i.e. direction is absolute, not relative
        var newNode = Node({
          index: n.index + 1,
          depth: n.depth,
          direction: n.direction.clone(),
        });

        // **************************
        // Trend upwards
        if (newNode.depth < 2) {
          newNode.direction.y += 0.05;
        }

        // **************************
        // Generate leaves
        if (n.depth > 0) {
          var numberOfLeaves = Math.floor(Math.random() * 5);
        } else {
          var numberOfLeaves = 0;
        }

        var leafDistance = 2;
        for (var i = 0; i < numberOfLeaves; i++) {
          var color = new THREE.Color();
          color.setHSL(0, Math.random(), Math.random() + 0.2);

          emitNode({
            age: 1,
            type: 'leaf',
            position: randomVector().setLength(leafDistance),
            color: color,
          });
        }

        // **************************
        // Jitter direction
        if (newNode.index > 2) {
          jitterDirection(newNode.direction, 0.05, 0.2, 0.05);
        }

        // **************************
        // Jitter shape
        jitterShape(newNode.shape);
        emitNode(newNode);
    }

    function newBranch(n, emitNode) {
      n.branchCount += 1;
      var direction = perpendicularToBranchDirection(n);
      direction.y += 0.1;

      // Jitter direction
      // var maxAngle = 1 / 5;
      // jitterDirection(direction, maxAngle, maxAngle, maxAngle);

      // Rotate around the trunk
      direction.applyAxisAngle(n.direction, randomAngle());

      var newNode = Node({
        direction: direction,
        depth: n.depth + 1,
      });

      emitNode(newNode);
    }

    function randomRate(timestep, rate) {
      return Math.random() < (rate * timestep);
    }

    // TODO I have mixed feelings about this style. Writing it all out makes the flow clearer
    //      and reduces the overhead of all the little functions existing, but it's not composable.
    //      I guess I'm shooting for something in between: composable yet concise and clear.
    //      In the meantime, having one big function is easier to comprehend and organize.
    function iterateNode(n, timestep, emitNode) {
      var lastAge = n.age;
      n.age += timestep;
      var isNewAge = Math.floor(n.age) > Math.floor(lastAge);

      // **************************
      // Extend tip
      if (n.isTip && isNewAge) {
        n.isTip = false;
        newNode(n, emitNode);
      }

      // **************************
      // Scale shape
      if (n.age > 10) {
        n.scale += 2 * timestep;
      } else {
        n.scale += 1 * timestep;
      }

      // **************************
      // Increment length
      // TODO replace length with position vector in local coordinate system
      //      or just use a scale vector
      if (n.depth == 0) {
        n.length += 0.05 * timestep;
      } else if (n.depth == 1) {
        n.length += 0.02 * timestep;
      } else {
        n.length += 0.001 * timestep;
      }

      // **************************
      // Attempt to create a branch
      var maxBranchDepth = 10;
      var minBranchIndex = 2;
      var minBranchAge = 1;
      var maxBranchAge = 5;
      var branchChance = 0.1;

      if (n.branchCount == 0
        && isNewAge
        && n.depth < maxBranchDepth
        && n.index > minBranchIndex
        && n.age > minBranchAge
        && n.age < maxBranchAge
        && Math.random() < branchChance
      ) {
        newBranch(n, emitNode);
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
        branchCount: 0,
        branchRotation: 0,
        shape: circle(0.01),
        parent: null,
        // TODO these aren't meant to be modified by the system function
        //      so is there a better way to store them?
        shapeVertexIds: [],
        globalPosition: new Vec(0, 0, 0),
      }, initial);
    }


    // Modifies a shape's vertices to be positions and oriented to the node's position and direction.
    // Converts points from 2D to 3D.
    // Converts from shape to path.
    function getShape(node, divisions) {
      var vertices = [];
      var q = new THREE.Quaternion();
      q.setFromUnitVectors(Y_AXIS, node.direction);

      for (var i = 0; i < node.shape.length; i++) {
        var point = node.shape[i];
        var vec = new Vec(point.x, 0, point.y);
        vec.multiplyScalar(node.scale);
        vec.applyQuaternion(q);
        vec.add(node.globalPosition);
        vertices.push(vec);
      }
      return new THREE.CatmullRomCurve3(vertices).getPoints(divisions);
    }


    function addVertices(geometry, vertices) {

    }

    function Geometries() {
      this.shapeDivisions = 5;
      this.maxBranchVertices = 20000;
      this.maxLeafVertices = 5000;

      this.branches = new THREE.BufferGeometry();
      this.leaves = new THREE.BufferGeometry();

      this.branchVertices = new Float32Array(this.maxBranchVertices * 3);
      // this.branchNormals = new Float32Array(this.maxBranchVertices * 3);
      this.branchFaces = new Uint32Array(this.maxBranchVertices);

      this.leafVertices = new Float32Array(this.maxLeafVertices * 3);
      this.leafColors = new Float32Array(this.maxLeafVertices * 3);

      this.branches.addAttribute("position", new THREE.BufferAttribute(this.branchVertices, 3));
      // this.branches.addAttribute("normal", new THREE.BufferAttribute(this.branchNormals, 3));

      this.branches.setIndex(new THREE.BufferAttribute(this.branchFaces, 1));

      this.leaves.addAttribute("position", new THREE.BufferAttribute(this.leafVertices, 3));
      this.leaves.addAttribute("color", new THREE.BufferAttribute(this.leafColors, 3));

      this.resetIds();
    }

    Geometries.prototype.resetIds = function() {
      this.branchVertexId = 0;
      this.branchFaceId = 0;
      this.leafVertexId = 0;
      this.leafColorId = 0;
    };

    Geometries.prototype.finalize = function() {
      this.branches.setDrawRange(0, this.branchVertexId);
      this.leaves.setDrawRange(0, this.leafVertexId);
    };

    // Geometries.prototype._addFace = function(ai, bi, ci) {
    //   var pA = new THREE.Vector3();
    //   var pB = new THREE.Vector3();
    //   var pC = new THREE.Vector3();
    //
    //   var cb = new THREE.Vector3();
    //   var ab = new THREE.Vector3();
    //
    //   var ax = this.branchVertices[ai];
    //   var ay = this.branchVertices[ai + 1];
    //   var az = this.branchVertices[ai + 2];
    //
    //   var bx = this.branchVertices[bi];
    //   var by = this.branchVertices[bi + 1];
    //   var bz = this.branchVertices[bi + 2];
    //
    //   var cx = this.branchVertices[ci];
    //   var cy = this.branchVertices[ci + 1];
    //   var cz = this.branchVertices[ci + 2];
    //
    //   // flat face normals
    //   pA.set( ax, ay, az );
    //   pB.set( bx, by, bz );
    //   pC.set( cx, cy, cz );
    //   cb.subVectors( pC, pB );
    //   ab.subVectors( pA, pB );
    //   cb.cross( ab );
    //   cb.normalize();
    //   var nx = cb.x;
    //   var ny = cb.y;
    //   var nz = cb.z;
    //
    //   this.branchNormals[ai] = nx;
    //   this.branchNormals[ai + 1] = ny;
    //   this.branchNormals[ai + 2] = nz;
    //
    //   this.branchNormals[bi] = nx;
    //   this.branchNormals[bi + 1] = ny;
    //   this.branchNormals[bi + 2] = nz;
    //
    //   this.branchNormals[ci] = nx;
    //   this.branchNormals[ci + 1] = ny;
    //   this.branchNormals[ci + 2] = nz;
    // };

    // Builds faces between two slices.
    // A and B are arrays of vertex IDs.
    //
    // Currently, A and B are expected to be the same length.
    Geometries.prototype.connectSlices = function(A, B) {
      for (var i = 0; i < A.length; i++) {
        var A_index = A[i];
        var B_index = B[i];

        // Connect layers into faces
        // The last vertex is a special case because it must connect back to the first vertex.
        if (i == A.length - 1) {
          var A_next = A[0];
          var B_next = B[0];
        } else {
          var A_next = A[i + 1];
          var B_next = B[i + 1];
        }

        this.branchFaces[this.branchFaceId++] = B_index;
        this.branchFaces[this.branchFaceId++] = A_index;
        this.branchFaces[this.branchFaceId++] = A_next;
        this.branchFaces[this.branchFaceId++] = B_index;
        this.branchFaces[this.branchFaceId++] = A_next;
        this.branchFaces[this.branchFaceId++] = B_next;
      }
    }

    Geometries.prototype.addNode = function(node) {
      var vertices = getShape(node, this.shapeDivisions);

      var ids = [];
      for (var i = 0; i < vertices.length; i++) {
        ids.push(this.branchVertexId / 3);
        this.branchVertices[this.branchVertexId++] = vertices[i].x;
        this.branchVertices[this.branchVertexId++] = vertices[i].y;
        this.branchVertices[this.branchVertexId++] = vertices[i].z;
      }
      node.shapeVertexIds = ids;

      if (node.parent) {
        this.connectSlices(node.parent.shapeVertexIds, node.shapeVertexIds);
      }


      // TODO at some point, need to close the last node faces
      this.branches.index.needsUpdate = true;
      this.branches.attributes.position.needsUpdate = true;
      // this.branches.attributes.normal.needsUpdate = true;
    };

    Geometries.prototype.addLeaf = function(leaf) {
      this.leafVertices[this.leafVertexId++] = leaf.globalPosition.x;
      this.leafVertices[this.leafVertexId++] = leaf.globalPosition.y;
      this.leafVertices[this.leafVertexId++] = leaf.globalPosition.z;
      this.leafColors[this.leafColorId++] = leaf.color.r;
      this.leafColors[this.leafColorId++] = leaf.color.g;
      this.leafColors[this.leafColorId++] = leaf.color.b;

      this.leaves.attributes.position.needsUpdate = true;
      this.leaves.attributes.color.needsUpdate = true;
    };


    // TODO an interesting idea is to have a fixed amount of energy which can be distributed
    //      throughout the system on each iteration. This might have the effect of modulating
    //      trunk/branch growth as the tree gets bigger.

    var timestep = 0.125;
    var group = new THREE.Group();
    var geometries = new Geometries();
    var nodes = [Node()];


    // Grow over time
    var iterationTimeout = 25; // milliseconds
    var currentIteration = 0;
    var maxIterations = 300;
    var interval = setInterval(function() {
      if (currentIteration >= maxIterations) {
        clearInterval(interval);
        return;
      }
      currentIteration += 1;
    }, iterationTimeout);


    // for (var i = 0; i < maxIterations; i++) {
    //   doIteration();
    // }

    // var treeMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
    var treeMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    // TODO Do I want per-leaf size?
    var leavesMaterial = new THREE.PointsMaterial({
      // Default color gets overridden by the vertex color
      color: 0xff0000,
      size: 0.5,
      vertexColors: THREE.VertexColors,
    });

    return group;


    function doIteration() {
      geometries.resetIds();

      // Iterate nodes
      var start = Date.now();
      var newNodes = [];
      nodes.forEach(function(node) {

        if (node.type == 'leaf') {
          if (!node.dead) {
            iterateLeaf(node, timestep);
          }

          if (node.dead) {
            // TODO remove dead leaves
          }

        } else {
          iterateNode(node, timestep, function(newNode) {
            newNodes.push(newNode);
            newNode.parent = node;
          });
        }

        // TODO move this position calculation into the system in a nice way
        if (node.parent) {
          if (node.type == 'leaf') {
            node.globalPosition = node.position.clone().add(node.parent.globalPosition);
          } else {
            var delta = node.direction.clone().setLength(node.length);
            node.globalPosition = delta.add(node.parent.globalPosition);
          }
        }

        if (node.type == 'leaf') {
          geometries.addLeaf(node);
        } else {
          geometries.addNode(node);
        }
      });
      console.log("iteration time", Date.now() - start);

      Array.prototype.push.apply(nodes, newNodes);

      console.log("Node count", nodes.length);
      console.log("Branches vertex count", geometries.branchVertexId);
      console.log("Leaves vertex count", geometries.leafVertexId);

      geometries.finalize();
      geometries.branches.computeBoundingSphere();
      // Face normals are needed when rendering Lambert/Phong or other materials affected by light
      geometries.branches.computeFaceNormals();
      // Vertex normals are used to render a smoothed mesh
      // geometries.branches.computeVertexNormals();

      var treeMesh = new THREE.Mesh(geometries.branches, treeMaterial);
      var leavesMesh = new THREE.Points(geometries.leaves, leavesMaterial);

      // Reset group?
      // TODO if you leave this out, you get a trippy bulid-up effect
      group.remove.apply(group, group.children);

      group.add(treeMesh);
      group.add(leavesMesh);
    }
  }
