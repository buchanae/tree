/*

About the data structures being used below:

- Node: an object describing a point in the tree, describing size, position, rotation,
        and metadata such as age, index, depth, and more.

*/

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
  years: 500,
}

function Group(length) {
  this.geometry = Geometries.default
  this.material = Materials.default
  this.length = length
  this.thickness = 15
  this.depth = 0

  this.local = new Float32Array(length * 16)
  this.transform = new Float32Array(length * 16)
  identity(this.transform, 0)
  this.color = new Float32Array(length * 3)
}

Main()
function Main() {
  console.log("Main")

  var renderer = new Renderer()
  var branches = []

  console.time("gen")
  for (var j = 0; j < 2; j++) {
    var trunk = new Group(Options.years)
    branches.push(trunk)
    var seed = 123 + j

    translate(trunk.transform, 0, 0, j * 400, 0, j * -150 )

    sub = grow(seed, trunk)

    for (var i = 0; i < sub.length; i++) {
      grow(seed, sub[i])
      branches.push(sub[i])
      var l = leaves(seed, sub[i])
      if (l) {
        branches.push(l)
      }
    }
  }
  console.timeEnd("gen")

  var total = 0
  for (var i = 0; i < branches.length; i++) {
    total += branches[i].length
  }
  console.log("total", total)

  console.time("render")
  renderer.Render(branches)
  console.timeEnd("render")
}

function grow(seed, branch) {
  var sub = []
  var rand = new Random(seed)

  for (var i = 0; i < branch.length; i++) {
    var cj = i * 3

    //branch.color[cj] = 0.9
    //branch.color[cj + 1] = rand.Range(0.5, 0.7)
    //branch.color[cj + 2] = rand.Range(0.35, 0.4)

    branch.color[cj] = 0.9
    branch.color[cj + 1] = 0.6
    branch.color[cj + 2] = 0.35

    var j = i * 16
    var age = i
    var b = branch

    identity(b.local, j)

    var perc = age / branch.length
    var thickness = branch.thickness * (1 - perc)
    var height = 1
    var minBranchAge = 80

    scale(b.local, j, j, thickness, height, thickness)
    //rotateY(b.local, j, j, rand.Float())

    // There's no parent of the first node, so there's nothing to project below.
    if (i == 0) {
      continue
    }

    var pj = (i - 1) * 16
    clone(b.transform, b.transform, pj, j)

    // Trend branches up/downward
    if (branch.depth == 1) {
      rotateX(b.transform, j, j, -0.002)
    }

    // Jitter branch direction
    if (age > 10 && b.depth == 1) {
      rotateX(b.transform, j, j, rand.Range(-0.01, 0.01))
      //rotateY(b.transform, j, j, rand.Range(-0.08, 0.08))
      rotateZ(b.transform, j, j, rand.Range(-0.08, 0.08))
    }

    // Node height
    translate(b.transform, j, j, 0, height, 0)

    // Jitter node position
    if (rand.Chance(0)) {
      var jamt = 0.5
      translate(b.transform, j, j, rand.Range(-jamt, jamt), 0, rand.Range(-jamt, jamt))
    }

    var branchChance = 0.7

    if (age > minBranchAge && 
        rand.Chance(perc) && 
        rand.Chance(branchChance) &&
        branch.depth == 0) {

      var curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3( 450, 0, 0 ),
        new THREE.Vector3( 190, 200, 0 ),
        new THREE.Vector3( 80, 800, 0 ),
        new THREE.Vector3( 1,  1000, 0 )
      ])

      var z = curve.getPointAt(perc)
      var length = Math.floor(Math.max(0, z.x + rand.Range(-10, 10)))

      var g = new Group(length)
      var upness = 0.2

      g.depth = branch.depth + 1
      g.thickness = thickness / 2
      clone(b.transform, g.transform, j, 0)
      rotateY(g.transform, 0, 0, rand.Angle())
      rotateX(g.transform, 0, 0, Math.PI / 2 - upness)
      sub.push(g)
    }
  }

  return sub
}


function leaves(seed, branch) {
  var rand = new Random(seed)
  var count = Math.floor(branch.length / 2)
  var g = new Group(count)
  g.geometry = Geometries.sphere

  for (var i = 0; i < count; i++) {
    var cj = i * 3
    var j = i * 16
    identity(g.local, j)

    var jamt = 15
    translate(g.local, j, j,
      rand.Range(-jamt, jamt), rand.Range(-jamt, jamt), rand.Range(-jamt, jamt))
    
    var size = 3
    scale(g.local, j, j, 4, 4, 4)

    g.color[cj] = 0
    g.color[cj + 1] = 1
    g.color[cj + 2] = 0

    var k = Math.floor(rand.Range(Math.max(2, branch.length - 120), branch.length))
    var bk = k * 16
    clone(branch.transform, g.transform, bk, j)
  }
  return g
}
