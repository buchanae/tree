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

function Trunk(seed, length) {
  this.geometry = Geometries.cylinder
  this.material = Materials.default
  this.length = length
  var rand = new Random(seed)

  this.local = new Float32Array(length * 16)
  this.transform = new Float32Array(length * 16)
  this.color = new Float32Array(length * 3)

  this.path = new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0, 0, 0 ),
    new THREE.Vector3( 0, 10, 0 ),
    new THREE.Vector3( -50, 290, 30 ),
    new THREE.Vector3( 50, 600, 0 ),
    new THREE.Vector3( 0, 700, 0 ),
  ])
  this.path.tension = 0.1

  this.thickness = new THREE.SplineCurve([
    new THREE.Vector2( 45, 0),
    new THREE.Vector2( 22, 100 ),
    new THREE.Vector2( 20, 300 ),
    new THREE.Vector2( 1, 700 ),
  ])

  //var frames = this.path.computeFrenetFrames(length, false)
  //console.log(frames)

  var p = new THREE.Vector3()
  var q = new THREE.Quaternion()
  var up = new THREE.Vector3(0, 1, 0)
  var baseThickness = 25

  for (var i = 0; i < length; i++) {
    var j = i * 16
    var thickness = this.thickness.getPointAt(i / length).x

    var cj = i * 3
    this.color[cj] = 0.9
    this.color[cj + 1] = 0.6
    this.color[cj + 2] = 0.35

    identity(this.transform, j)
    identity(this.local, j)

    var tan = this.path.getTangentAt(i / length)
    q.setFromUnitVectors(tan, up)
    var rot = quatrot(q.x, q.y, q.z, q.w)

    multiply2(this.local, rot, 0, j)
    scale(this.local, j, j, thickness, 5, thickness)

    this.path.getPointAt(i / length, p)
    translate(this.transform, j, j, p.x, p.y, p.z)

    if (i / length > .5 && rand.Chance(0.05)) {
      console.log("branch")
    }
  }

  this.curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.6, 0, 0 ),
    new THREE.Vector3( 0.5, 50, 0 ),
    new THREE.Vector3( 0.2, 90, 0 ),
    new THREE.Vector3( 0.01,  100, 0 )
  ])

  Object.assign(this, {
    thickness: 25,
    height: 5,
    offset: 0,
    minBranchAge: 55,
    //branchChance: 1.9,
    branchChance: 0,
    upness: 0.3,
    jitChance: 0.3,
    jamt: 1.7,
    djamt: 0.03,
  })
}

Main()
function Main() {
  var renderer = new Renderer()
  var branches = []
  var genLeaves = false //true

  var loc = [
    0, 0,
    400, -150,
    -400, -150,
    410, -150,
    -410, -150,
  ]

  // For performance profiling in Chrome devtools
  console.time("gen")

  // Generate multiple trees
  for (let j = 0; j < 1; j++) {
    var trunk = new Trunk(j, Options.years)
    branches.push(trunk)

    // Set the position of the tree
    translate(trunk.transform, 0, 0, loc[j * 2], 0, loc[j * 2+ 1] )
  }

  // For performance profiling in Chrome devtools
  console.timeEnd("gen")

  var total = 0
  for (let i = 0; i < branches.length; i++) {
    total += branches[i].length
  }
  console.log("total", total)

  console.time("render")
  renderer.Render(branches)
  console.timeEnd("render")
}

function grow(branch) {
  var sub = []
  var rand = new Random(branch.seed)

  for (var i = 0; i < branch.length; i++) {

    var cj = i * 3
    branch.color[cj] = 0.9
    branch.color[cj + 1] = 0.6
    branch.color[cj + 2] = 0.35

    var j = i * 16
    var pj = (i - 1) * 16
    var age = i
    var b = branch
    var perc = age / branch.length
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
    //clone(b.transform, b.transform, pj, j)

    // Trend branches up/downward
    if (branch.trend) {
      //rotateX(b.transform, j, j, branch.trend)
    }

    // Jitter branch direction
    if (age > 10 && rand.Chance(branch.jitChance)) {
      //rotateX(b.transform, j, j, rand.Range(-branch.djamt, branch.djamt))
      //rotateY(b.transform, j, j, rand.Range(-0.08, 0.08))
      //rotateZ(b.transform, j, j, rand.Range(-branch.djamt, branch.djamt))
    }

    // Node height
    //translate(b.transform, j, j, 0, branch.height + branch.offset, 0)

    // Jitter node position
    if (rand.Chance(branch.jitChance)) {
      //translate(b.transform, j, j,
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
        Math.max(0, branch.length * z.x + rand.Range(-10, 10)))

      var g = new Branch(length)
      g.thickness = g.thickness * (1 - perc)
      //clone(b.transform, g.transform, j, 0)
      //rotateY(g.transform, 0, 0, rand.Angle())
      //rotateX(g.transform, 0, 0, Math.PI / 2 - branch.upness)
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
          2, branch.length * 0.25),
        branch.length))

    var bk = k * 16
    clone(branch.transform, g.transform, bk, j)
  }
  return g
}
