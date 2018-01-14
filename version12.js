// The shape (aka geometry) of a node.
var Geometries = {
  default: "cylinder",
  box: "box",
  cylinder: "cylinder",
  sphere: "sphere",
}

// Materials determine how a node looks: renderer algorithm, color, texture, etc.
var Materials = {
  default: "lambert",
}

// Global options controlling the simulation.
var Options = {
  // Total years to simulate growth.
  years: 150,
}

function Trunk(segments) {
  this.geometry = Geometries.cylinder
  this.material = Materials.default
  this.segments = segments
  this.height = 700
  this.baseThickness = 25

  this.local = new Float32Array(segments * 16)
  this.global = new Float32Array(segments * 16)
  this.color = new Float32Array(segments * 3)

  var rand = new Random(Date.now())
  var factor = 0.04
  var points = [
    new THREE.Vector3( 0, 0, 0 ),
  ]
  for (var i = 2; i < 5; i++) {
    points.push(
      new THREE.Vector3( rand.Range(-factor, factor), 0.2 * i, rand.Range(-factor, factor))
    )
  }
  points.push(new THREE.Vector3( 0, 1, 0 ))
  this.path = new THREE.CatmullRomCurve3(points)

  this._thickness = [
    1.1,
    1.5,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.6,
    0.4,
    0.3,
    0.01,
  ]
  this._thickness = [
    1.1,
    0.1,
  ]

  this.scale = 600
  //this.direction = new THREE.Vector3(0, 1, 0)
  this.root = new Float32Array(16)
  identity(this.root, 0)
}

Trunk.prototype.getThicknessAt = function(per) {
  var x = 1 / (this._thickness.length - 1)
  var y = per / x
  var f = Math.floor(y)

  if (f >= this._thickness.length - 1) {
    return (this._thickness[this._thickness.length - 1]) * this.baseThickness
  }

  var r = y - f
  var b = this._thickness[f]
  var c = this._thickness[f + 1]
  var d = (c - b) * r
  return (b + d) * this.baseThickness
}




Main()
function Main() {
  var renderer = new Renderer()
  var branches = []

  var gui = new dat.GUI();
  var opts = {
    refresh: function() {
      branches.length = 0
      var trunk = new Trunk(Options.years)
      grow2(trunk)
      branches.push(trunk)
      AddBranches(trunk, branches)
      renderer.Render(branches)
    },
  }
  gui.add(opts, "refresh")
  opts.refresh()

}




function grow2(br) {
  var p = new THREE.Vector3()
  var q = new THREE.Quaternion()
  var up = new THREE.Vector3(0, 1, 0)

  // Create global branch rotation matrix
  /*
  var q2 = new THREE.Quaternion()
  var d = br.direction.clone().normalize()
  q2.setFromUnitVectors(d, up)
  var brrot = quatrot(q2.x, q2.y, q2.z, q2.w)
  */

  // Divide the total length of the branch by the number of segments
  // in order to get the length of each segment.
  var segmentLength = br.scale / br.segments

  for (var i = 0; i < br.segments; i++) {
    var j = i * 16
    var per = i / br.segments

    var cj = i * 3
    br.color[cj] = 0.9

    identity(br.local, j)

    var tan = br.path.getTangentAt(per)
    q.setFromUnitVectors(tan, up)
    var rot = quatrot(q.x, q.y, q.z, q.w)

    multiply2(br.local, rot, 0, j)

    var thickness = br.getThicknessAt(per)
    scale(br.local, j, j, thickness, segmentLength, thickness)

    br.path.getPointAt(per, p)
    p.multiplyScalar(br.scale)

    clone(br.root, br.global, 0, j)
    //multiply2(br.global, brrot, 0, j)
    translate(br.global, j, j, p.x, p.y, p.z)
  }
}


function AddBranches(trunk, branches) {
  var branchCount = 50
  var rand = new Random(Date.now())

  for (var i = 0; i < branchCount; i++) {
    var b = new Trunk(50)

    // Pick a random spot to branch from
    var r = rand.Range(0.1, 0.85)
    // try to bias branches towards the top
    // need a more robust way to approach this
    var r = 1 - (r * r)
    //var r = 0.35
    var j = Math.floor(r * trunk.segments)

    clone(trunk.global, b.root, j * 16, 0)
    rotateY(b.root, 0, 0, rand.Angle())
    rotateX(b.root, 0, 0, 1 + rand.Range(-0.1, 0.6))

    //trunk.path.getPointAt(r, b.root)
    //b.root = b.root.multiplyScalar(trunk.scale)

    var p = (1 - j / trunk.segments) + rand.Range(-0.1, 0.1)
    b.scale = 350 * p + 10
    var t = trunk.getThicknessAt(j / trunk.segments)
    b.baseThickness = (t * p) + 1
    //b.direction.x = -1

    grow2(b)
    branches.push(b)
  }
}

function grow(branch) {
  var sub = []
  var rand = new Random(branch.seed)

  for (var i = 0; i < branch.segments; i++) {

    var cj = i * 3
    branch.color[cj] = 0.9
    branch.color[cj + 1] = 0.6
    branch.color[cj + 2] = 0.35

    var j = i * 16
    var pj = (i - 1) * 16
    var age = i
    var b = branch
    var perc = age / branch.segments
    var thickness = branch.thickness * (1 - perc)

    // Initialize local transform to identity matrix
    //identity(b.local, j)

    // Scale the local mesh size
    //scale(b.local, j, j, thickness, 1, thickness)

    // There's no parent of the first node, so there's nothing to project below.
    if (i == 0) {
      continue
    }

    // Clone parent transform
    //clone(b.global, b.global, pj, j)

    // Trend branches up/downward
    if (branch.trend) {
      //rotateX(b.global, j, j, branch.trend)
    }

    // Jitter branch direction
    if (age > 10 && rand.Chance(branch.jitChance)) {
      //rotateX(b.global, j, j, rand.Range(-branch.djamt, branch.djamt))
      //rotateY(b.global, j, j, rand.Range(-0.08, 0.08))
      //rotateZ(b.global, j, j, rand.Range(-branch.djamt, branch.djamt))
    }

    // Node height
    //translate(b.global, j, j, 0, branch.height + branch.offset, 0)

    // Jitter node position
    if (rand.Chance(branch.jitChance)) {
      //translate(b.global, j, j,
        //rand.Range(-branch.jamt, branch.jamt),
        //0,
        //rand.Range(-branch.jamt, branch.jamt)
      //)
    }

    // Generate branches
    if (age > branch.minBranchAge && 
        rand.Chance(perc) && 
        rand.Chance(branch.branchChance)) {

      var z = branch.curve.getPointAt(perc)
      var length = Math.floor(
        Math.max(0, branch.segments * z.x + rand.Range(-10, 10)))

      var g = new Branch(segments)
      g.thickness = g.thickness * (1 - perc)
      //clone(b.global, g.global, j, 0)
      //rotateY(g.global, 0, 0, rand.Angle())
      //rotateX(g.global, 0, 0, Math.PI / 2 - branch.upness)
      sub.push(g)
    }
  }

  return sub
}

function leaves(branch, opts) {
  var rand = new Random(opts.seed)
  var g = new Group(opts.count)
  g.geometry = opts.geo

  for (var i = 0; i < opts.count; i++) {
    var cj = i * 3
    var j = i * 16
    identity(g.local, j)

    translate(g.local, j, j,
      rand.Range(-opts.jamt.x, opts.jamt.x),
      rand.Range(-opts.jamt.y, opts.jamt.y),
      rand.Range(-opts.jamt.z, opts.jamt.z))
    
    if (rand.Chance(0.003)) {
      scale(g.local, j, j, 7, 7, 7)
      g.geometry = Geometries.sphere

      g.color[cj] = 0.9
      g.color[cj + 1] = 0
      g.color[cj + 2] = 0
    } else {
      scale(g.local, j, j, 4, 4, 4)

      g.color[cj] = 0
      g.color[cj + 1] = rand.Range(0.8, 1)
      g.color[cj + 2] = 0
    }

    var k = Math.floor(
      rand.Range(
        Math.max(
          2, branch.segments * 0.25),
        branch.segments))

    var bk = k * 16
    clone(branch.global, g.global, bk, j)
  }
  return g
}
